import { useState } from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DateRangeSelector } from "@/components/dashboard/DateRangeSelector";
import { TopVendorsChart } from "@/components/dashboard/TopVendorsChart";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { SpendingTrend } from "@/components/dashboard/SpendingTrend";
import { AlertsList } from "@/components/dashboard/AlertsList";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { useDashboardData, getDateRange, type DateRangeOption, type DateRange } from "@/hooks/useDashboardData";
import { DollarSign, CreditCard, Fuel, FileText } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>("this_month");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();

  const dateRange = customRange || getDateRange(dateRangeOption);
  const { data, isLoading } = useDashboardData(dateRange);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDateRange = () => {
    return `${format(dateRange.start, 'MMM d, yyyy')} - ${format(dateRange.end, 'MMM d, yyyy')}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-muted rounded w-64 mb-2"></div>
            <div className="h-4 bg-muted rounded w-96"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your accounts payable activities
          </p>
        </div>
      </div>

      {/* Date Range Selector */}
      <DateRangeSelector
        value={dateRangeOption}
        onChange={setDateRangeOption}
        customRange={customRange}
        onCustomRangeChange={setCustomRange}
      />

      <div className="text-sm text-muted-foreground">
        Showing data for: <span className="font-medium">{formatDateRange()}</span>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Spending"
          value={formatCurrency(data?.metrics.totalSpending || 0)}
          subtitle={`${data?.recentTransactions.length || 0} transactions`}
          icon={DollarSign}
          change={data?.metrics.spendingChange}
        />
        <MetricCard
          title="Outstanding AP"
          value={formatCurrency(data?.metrics.outstandingAP || 0)}
          subtitle={`${data?.metrics.invoiceCount || 0} invoices pending`}
          icon={FileText}
        />
        <MetricCard
          title="Credit Card Spending"
          value={formatCurrency(data?.metrics.ccSpending || 0)}
          subtitle={`${data?.metrics.ccCount || 0} transactions`}
          icon={CreditCard}
        />
        <MetricCard
          title="Fleet Fuel Cost"
          value={formatCurrency(data?.metrics.fuelCost || 0)}
          subtitle={`${data?.metrics.totalGallons?.toFixed(1) || 0} gallons`}
          icon={Fuel}
        />
      </div>

      {/* Top Vendors Chart */}
      <TopVendorsChart
        data={data?.topVendors || []}
      />

      {/* Category Breakdown & Spending Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryBreakdown
          data={data?.categories || []}
        />
        <SpendingTrend
          data={data?.spendingTrend || []}
        />
      </div>

      {/* Alerts & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertsList alerts={data?.alerts || { overdueInvoices: 0, missingReceipts: 0, expiringInsurance: 0 }} />
        <RecentTransactions transactions={data?.recentTransactions || []} />
      </div>
    </div>
  );
}
