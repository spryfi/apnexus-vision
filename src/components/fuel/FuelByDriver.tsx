import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface FuelTransaction {
  id: string;
  transaction_date: string;
  employee_name: string;
  vehicle_id: string | null;
  gallons: number;
  cost_per_gallon: number;
  total_cost: number;
  odometer: number;
  merchant_name: string | null;
}

interface FuelByDriverProps {
  transactions: FuelTransaction[];
}

export function FuelByDriver({ transactions }: FuelByDriverProps) {
  const driverStats = useMemo(() => {
    const stats = new Map<string, {
      totalCost: number;
      totalGallons: number;
      transactionCount: number;
      avgPricePerGallon: number;
      vehiclesUsed: Set<string>;
      lastFillDate: string;
    }>();

    transactions.forEach(t => {
      const existing = stats.get(t.employee_name) || {
        totalCost: 0,
        totalGallons: 0,
        transactionCount: 0,
        avgPricePerGallon: 0,
        vehiclesUsed: new Set<string>(),
        lastFillDate: t.transaction_date
      };

      if (t.vehicle_id) {
        existing.vehiclesUsed.add(t.vehicle_id);
      }

      stats.set(t.employee_name, {
        totalCost: existing.totalCost + t.total_cost,
        totalGallons: existing.totalGallons + t.gallons,
        transactionCount: existing.transactionCount + 1,
        avgPricePerGallon: (existing.totalCost + t.total_cost) / (existing.totalGallons + t.gallons),
        vehiclesUsed: existing.vehiclesUsed,
        lastFillDate: t.transaction_date > existing.lastFillDate ? t.transaction_date : existing.lastFillDate
      });
    });

    return Array.from(stats.entries())
      .map(([driver, data]) => ({
        driver,
        totalCost: data.totalCost,
        totalGallons: data.totalGallons,
        transactionCount: data.transactionCount,
        avgPricePerGallon: data.avgPricePerGallon,
        vehicleCount: data.vehiclesUsed.size,
        lastFillDate: data.lastFillDate
      }))
      .sort((a, b) => b.totalCost - a.totalCost);
  }, [transactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fuel Usage by Driver</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver Name</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
                <TableHead className="text-right">Total Gallons</TableHead>
                <TableHead className="text-right">Avg Price/Gal</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Vehicles Used</TableHead>
                <TableHead>Last Fill-Up</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {driverStats.map((driver) => (
                <TableRow key={driver.driver}>
                  <TableCell className="font-medium">{driver.driver}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(driver.totalCost)}
                  </TableCell>
                  <TableCell className="text-right">
                    {driver.totalGallons.toFixed(2)} gal
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(driver.avgPricePerGallon)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{driver.transactionCount}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{driver.vehicleCount}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(driver.lastFillDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
