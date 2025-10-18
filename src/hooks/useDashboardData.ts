import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { addDays, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, subQuarters, subYears } from "date-fns";

export type DateRangeOption = "this_month" | "last_month" | "this_quarter" | "last_quarter" | "this_year" | "last_year" | "custom";

export interface DateRange {
  start: Date;
  end: Date;
}

export function getDateRange(option: DateRangeOption, customStart?: Date, customEnd?: Date): DateRange {
  const today = new Date();

  switch (option) {
    case "this_month":
      return {
        start: startOfMonth(today),
        end: endOfMonth(today),
      };
    case "last_month":
      const lastMonth = subMonths(today, 1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth),
      };
    case "this_quarter":
      return {
        start: startOfQuarter(today),
        end: endOfQuarter(today),
      };
    case "last_quarter":
      const lastQuarter = subQuarters(today, 1);
      return {
        start: startOfQuarter(lastQuarter),
        end: endOfQuarter(lastQuarter),
      };
    case "this_year":
      return {
        start: startOfYear(today),
        end: endOfYear(today),
      };
    case "last_year":
      const lastYear = subYears(today, 1);
      return {
        start: startOfYear(lastYear),
        end: endOfYear(lastYear),
      };
    case "custom":
      return {
        start: customStart || startOfMonth(today),
        end: customEnd || endOfMonth(today),
      };
    default:
      return {
        start: startOfMonth(today),
        end: endOfMonth(today),
      };
  }
}

export function getComparisonPeriod(startDate: Date, endDate: Date): DateRange {
  const duration = endDate.getTime() - startDate.getTime();
  return {
    start: new Date(startDate.getTime() - duration),
    end: new Date(startDate.getTime() - 1),
  };
}

export function useDashboardData(dateRange: DateRange) {
  const startDate = dateRange.start.toISOString().split("T")[0];
  const endDate = dateRange.end.toISOString().split("T")[0];

  const comparisonPeriod = getComparisonPeriod(dateRange.start, dateRange.end);
  const prevStartDate = comparisonPeriod.start.toISOString().split("T")[0];
  const prevEndDate = comparisonPeriod.end.toISOString().split("T")[0];

  return useQuery({
    queryKey: ["dashboard", startDate, endDate],
    queryFn: async () => {
      // Fetch all data in parallel
      const [
        transactionsRes,
        prevTransactionsRes,
        ccTransactionsRes,
        fuelTransactionsRes,
        overdueInvoicesRes,
        missingReceiptsRes,
        expiringInsuranceRes,
        recentTransactionsRes,
      ] = await Promise.all([
        // Current period transactions
        supabase
          .from("transactions")
          .select("amount, vendor_id, vendors(vendor_name), expense_category_id, expense_categories(category_name), invoice_date")
          .gte("invoice_date", startDate)
          .lte("invoice_date", endDate),

        // Previous period transactions
        supabase
          .from("transactions")
          .select("amount")
          .gte("invoice_date", prevStartDate)
          .lte("invoice_date", prevEndDate),

        // Credit card transactions
        supabase
          .from("credit_card_transactions")
          .select("amount")
          .gte("transaction_date", startDate)
          .lte("transaction_date", endDate),

        // Fuel transactions
        supabase
          .from("fuel_transactions_new")
          .select("total_cost, gallons")
          .gte("transaction_date", startDate)
          .lte("transaction_date", endDate),

        // Overdue invoices
        supabase
          .from("transactions")
          .select("*")
          .lt("due_date", new Date().toISOString().split("T")[0])
          .in("status", ["Pending Approval", "Approved for Payment"]),

        // Missing receipts
        supabase
          .from("credit_card_transactions")
          .select("*")
          .eq("receipt_uploaded", false)
          .gte("transaction_date", addDays(new Date(), -30).toISOString().split("T")[0]),

        // Expiring insurance
        supabase
          .from("vehicle_insurance")
          .select("*, vehicles(*)")
          .lte("expiry_date", addDays(new Date(), 30).toISOString().split("T")[0])
          .gte("expiry_date", new Date().toISOString().split("T")[0]),

        // Recent transactions
        supabase
          .from("transactions")
          .select("*, vendors(vendor_name), expense_categories(category_name)")
          .order("invoice_date", { ascending: false })
          .limit(5),
      ]);

      // Calculate total spending
      const transactions = transactionsRes.data || [];
      const totalSpending = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

      // Calculate previous period spending
      const prevTransactions = prevTransactionsRes.data || [];
      const prevSpending = prevTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const spendingChange = prevSpending > 0 ? ((totalSpending - prevSpending) / prevSpending) * 100 : 0;

      // Calculate outstanding AP (sum of pending/approved transactions)
      const overdueInvoices = overdueInvoicesRes.data || [];
      const outstandingAP = overdueInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);
      const invoiceCount = overdueInvoices.length;

      // Calculate credit card spending
      const ccTransactions = ccTransactionsRes.data || [];
      const ccSpending = ccTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const ccCount = ccTransactions.length;

      // Calculate fuel costs
      const fuelTransactions = fuelTransactionsRes.data || [];
      const fuelCost = fuelTransactions.reduce((sum, t) => sum + (t.total_cost || 0), 0);
      const totalGallons = fuelTransactions.reduce((sum, t) => sum + (t.gallons || 0), 0);

      // Top 10 vendors
      const vendorMap = new Map<string, { name: string; total: number }>();
      transactions.forEach((t) => {
        if (t.vendor_id && t.vendors) {
          const existing = vendorMap.get(t.vendor_id);
          if (existing) {
            existing.total += t.amount || 0;
          } else {
            vendorMap.set(t.vendor_id, {
              name: t.vendors.vendor_name || "Unknown",
              total: t.amount || 0,
            });
          }
        }
      });
      const topVendors = Array.from(vendorMap.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      // Category breakdown
      const categoryMap = new Map<string, { name: string; total: number }>();
      transactions.forEach((t) => {
        if (t.expense_category_id && t.expense_categories) {
          const existing = categoryMap.get(t.expense_category_id);
          if (existing) {
            existing.total += t.amount || 0;
          } else {
            categoryMap.set(t.expense_category_id, {
              name: t.expense_categories.category_name || "Uncategorized",
              total: t.amount || 0,
            });
          }
        }
      });
      const categoryTotal = Array.from(categoryMap.values()).reduce((sum, c) => sum + c.total, 0);
      const categories = Array.from(categoryMap.values())
        .map((c) => ({
          ...c,
          percentage: categoryTotal > 0 ? ((c.total / categoryTotal) * 100).toFixed(1) : "0",
        }))
        .sort((a, b) => b.total - a.total);

      // Spending trend (group by week)
      const trendMap = new Map<string, number>();
      transactions.forEach((t) => {
        if (t.invoice_date) {
          const date = new Date(t.invoice_date);
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          const weekKey = weekStart.toISOString().split("T")[0];
          trendMap.set(weekKey, (trendMap.get(weekKey) || 0) + (t.amount || 0));
        }
      });
      const spendingTrend = Array.from(trendMap.entries())
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Alerts
      const missingReceipts = missingReceiptsRes.data || [];
      const expiringInsurance = expiringInsuranceRes.data || [];

      return {
        metrics: {
          totalSpending,
          spendingChange,
          outstandingAP,
          invoiceCount,
          ccSpending,
          ccCount,
          fuelCost,
          totalGallons,
        },
        topVendors,
        categories,
        spendingTrend,
        alerts: {
          overdueInvoices: overdueInvoices.length,
          missingReceipts: missingReceipts.length,
          expiringInsurance: expiringInsurance.length,
        },
        recentTransactions: recentTransactionsRes.data || [],
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
