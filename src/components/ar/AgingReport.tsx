import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState } from "react";

interface AgingBucket {
  current: number;
  days_0_30: number;
  days_31_60: number;
  days_61_90: number;
  days_90_plus: number;
  total: number;
}

interface CustomerAging {
  customer_id: string;
  customer_name: string;
  invoices: any[];
  aging: AgingBucket;
}

export const AgingReport = () => {
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["aging-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices_receivable")
        .select(`
          *,
          customers (
            id,
            first_name,
            last_name
          )
        `)
        .in("status", ["Pending", "Partial", "Overdue"]);

      if (error) throw error;
      return data;
    },
  });

  const calculateAging = (invoices: any[]): CustomerAging[] => {
    const today = new Date();
    const customerMap = new Map<string, CustomerAging>();

    invoices?.forEach((invoice) => {
      if (!invoice.customers) return;

      const customerId = invoice.customers.id;
      const customerName = `${invoice.customers.first_name} ${invoice.customers.last_name}`;
      const balanceDue = Number(invoice.amount) - Number(invoice.amount_paid || 0);
      const dueDate = new Date(invoice.due_date);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          customer_id: customerId,
          customer_name: customerName,
          invoices: [],
          aging: {
            current: 0,
            days_0_30: 0,
            days_31_60: 0,
            days_61_90: 0,
            days_90_plus: 0,
            total: 0,
          },
        });
      }

      const customerData = customerMap.get(customerId)!;
      customerData.invoices.push({ ...invoice, daysOverdue, balanceDue });
      customerData.aging.total += balanceDue;

      if (daysOverdue < 0) {
        customerData.aging.current += balanceDue;
      } else if (daysOverdue <= 30) {
        customerData.aging.days_0_30 += balanceDue;
      } else if (daysOverdue <= 60) {
        customerData.aging.days_31_60 += balanceDue;
      } else if (daysOverdue <= 90) {
        customerData.aging.days_61_90 += balanceDue;
      } else {
        customerData.aging.days_90_plus += balanceDue;
      }
    });

    return Array.from(customerMap.values());
  };

  const customerAging = invoices ? calculateAging(invoices) : [];

  const totals: AgingBucket = customerAging.reduce(
    (acc, customer) => ({
      current: acc.current + customer.aging.current,
      days_0_30: acc.days_0_30 + customer.aging.days_0_30,
      days_31_60: acc.days_31_60 + customer.aging.days_31_60,
      days_61_90: acc.days_61_90 + customer.aging.days_61_90,
      days_90_plus: acc.days_90_plus + customer.aging.days_90_plus,
      total: acc.total + customer.aging.total,
    }),
    { current: 0, days_0_30: 0, days_31_60: 0, days_61_90: 0, days_90_plus: 0, total: 0 }
  );

  const toggleCustomer = (customerId: string) => {
    const newExpanded = new Set(expandedCustomers);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
    }
    setExpandedCustomers(newExpanded);
  };

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totals.total.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {customerAging.length} customers
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Current</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">${totals.current.toFixed(2)}</div>
            <p className="text-xs text-green-600 mt-1">
              {((totals.current / totals.total) * 100 || 0).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">0-30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">${totals.days_0_30.toFixed(2)}</div>
            <p className="text-xs text-yellow-600 mt-1">
              {((totals.days_0_30 / totals.total) * 100 || 0).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">31-60 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">${totals.days_31_60.toFixed(2)}</div>
            <p className="text-xs text-orange-600 mt-1">
              {((totals.days_31_60 / totals.total) * 100 || 0).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">61-90 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">${totals.days_61_90.toFixed(2)}</div>
            <p className="text-xs text-red-600 mt-1">
              {((totals.days_61_90 / totals.total) * 100 || 0).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-300 bg-red-100/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800">90+ Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">${totals.days_90_plus.toFixed(2)}</div>
            <p className="text-xs text-red-700 mt-1">
              {((totals.days_90_plus / totals.total) * 100 || 0).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export to PDF
        </Button>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      {/* Aging Detail Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right bg-green-50">Current</TableHead>
              <TableHead className="text-right bg-yellow-50">0-30 Days</TableHead>
              <TableHead className="text-right bg-orange-50">31-60 Days</TableHead>
              <TableHead className="text-right bg-red-50">61-90 Days</TableHead>
              <TableHead className="text-right bg-red-100">90+ Days</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customerAging.map((customer) => (
              <>
                <TableRow
                  key={customer.customer_id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleCustomer(customer.customer_id)}
                >
                  <TableCell className="font-medium">{customer.customer_name}</TableCell>
                  <TableCell className="text-right font-bold">
                    ${customer.aging.total.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-green-700">
                    ${customer.aging.current.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-yellow-700">
                    ${customer.aging.days_0_30.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-orange-700">
                    ${customer.aging.days_31_60.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-red-700">
                    ${customer.aging.days_61_90.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-red-800">
                    ${customer.aging.days_90_plus.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      View Invoices
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedCustomers.has(customer.customer_id) &&
                  customer.invoices.map((invoice: any) => (
                    <TableRow key={invoice.id} className="bg-muted/30">
                      <TableCell className="pl-8 text-sm">{invoice.invoice_number}</TableCell>
                      <TableCell className="text-right text-sm">
                        ${invoice.balanceDue.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground" colSpan={5}>
                        {invoice.daysOverdue >= 0
                          ? `${invoice.daysOverdue} days overdue`
                          : "Not yet due"}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  ))}
              </>
            ))}
            <TableRow className="bg-muted font-bold">
              <TableCell>Total</TableCell>
              <TableCell className="text-right">${totals.total.toFixed(2)}</TableCell>
              <TableCell className="text-right text-green-700">${totals.current.toFixed(2)}</TableCell>
              <TableCell className="text-right text-yellow-700">${totals.days_0_30.toFixed(2)}</TableCell>
              <TableCell className="text-right text-orange-700">${totals.days_31_60.toFixed(2)}</TableCell>
              <TableCell className="text-right text-red-700">${totals.days_61_90.toFixed(2)}</TableCell>
              <TableCell className="text-right text-red-800">${totals.days_90_plus.toFixed(2)}</TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
