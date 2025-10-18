import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, RefreshCw } from "lucide-react";
import { format } from "date-fns";

const APAgingReport = () => {
  const [asOfDate] = useState(new Date());

  // Mock data for demonstration
  const totals = {
    total: 125000,
    current: 45000,
    days0to30: 30000,
    days31to60: 25000,
    days61to90: 15000,
    days90plus: 10000,
  };

  const vendors = [
    { name: "Acme Corp", total: 45000, current: 20000, days0to30: 15000, days31to60: 5000, days61to90: 3000, days90plus: 2000 },
    { name: "Tech Solutions", total: 35000, current: 15000, days0to30: 10000, days31to60: 8000, days61to90: 1000, days90plus: 1000 },
    { name: "Office Supplies Inc", total: 25000, current: 5000, days0to30: 3000, days31to60: 7000, days61to90: 6000, days90plus: 4000 },
    { name: "Fleet Services", total: 20000, current: 5000, days0to30: 2000, days31to60: 5000, days61to90: 5000, days90plus: 3000 },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">AP Aging Report</h2>
          <p className="text-sm text-muted-foreground">
            As of {format(asOfDate, "MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <Card className="p-4 bg-blue-50 dark:bg-blue-950">
          <p className="text-xs text-muted-foreground mb-1">Total Outstanding</p>
          <p className="text-xl font-bold">{formatCurrency(totals.total)}</p>
        </Card>
        <Card className="p-4 bg-green-50 dark:bg-green-950">
          <p className="text-xs text-muted-foreground mb-1">Current</p>
          <p className="text-xl font-bold">{formatCurrency(totals.current)}</p>
        </Card>
        <Card className="p-4 bg-yellow-50 dark:bg-yellow-950">
          <p className="text-xs text-muted-foreground mb-1">0-30 Days</p>
          <p className="text-xl font-bold">{formatCurrency(totals.days0to30)}</p>
        </Card>
        <Card className="p-4 bg-orange-50 dark:bg-orange-950">
          <p className="text-xs text-muted-foreground mb-1">31-60 Days</p>
          <p className="text-xl font-bold">{formatCurrency(totals.days31to60)}</p>
        </Card>
        <Card className="p-4 bg-red-50 dark:bg-red-950">
          <p className="text-xs text-muted-foreground mb-1">61-90 Days</p>
          <p className="text-xl font-bold">{formatCurrency(totals.days61to90)}</p>
        </Card>
        <Card className="p-4 bg-red-100 dark:bg-red-900">
          <p className="text-xs text-muted-foreground mb-1">90+ Days</p>
          <p className="text-xl font-bold">{formatCurrency(totals.days90plus)}</p>
        </Card>
      </div>

      {/* Aging Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Current</TableHead>
              <TableHead className="text-right">0-30</TableHead>
              <TableHead className="text-right">31-60</TableHead>
              <TableHead className="text-right">61-90</TableHead>
              <TableHead className="text-right">90+</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((vendor) => (
              <TableRow key={vendor.name}>
                <TableCell className="font-medium">{vendor.name}</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(vendor.total)}
                </TableCell>
                <TableCell className="text-right">{formatCurrency(vendor.current)}</TableCell>
                <TableCell className="text-right">{formatCurrency(vendor.days0to30)}</TableCell>
                <TableCell className="text-right">{formatCurrency(vendor.days31to60)}</TableCell>
                <TableCell className="text-right">{formatCurrency(vendor.days61to90)}</TableCell>
                <TableCell className="text-right">{formatCurrency(vendor.days90plus)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold bg-muted">
              <TableCell>TOTAL</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.total)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.current)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.days0to30)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.days31to60)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.days61to90)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.days90plus)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default APAgingReport;
