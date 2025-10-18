import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, User } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

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
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

    const allStats = Array.from(stats.entries()).map(([driver, data]) => {
      // Get card numbers used by this driver
      const cardNumbers = new Set(
        transactions
          .filter(t => t.employee_name === driver && (t as any).card_number)
          .map(t => (t as any).card_number)
      );

      // Get trend data for this driver
      const driverTransactions = transactions
        .filter(t => t.employee_name === driver)
        .sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());

      const trendData = driverTransactions.map(t => ({
        date: new Date(t.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        cost: t.total_cost
      }));

      // Get vehicle breakdown
      const vehicleBreakdown = new Map<string, { cost: number; gallons: number; count: number }>();
      driverTransactions.forEach(t => {
        if (t.vehicle_id) {
          const existing = vehicleBreakdown.get(t.vehicle_id) || { cost: 0, gallons: 0, count: 0 };
          vehicleBreakdown.set(t.vehicle_id, {
            cost: existing.cost + t.total_cost,
            gallons: existing.gallons + t.gallons,
            count: existing.count + 1
          });
        }
      });

      return {
        driver,
        totalCost: data.totalCost,
        totalGallons: data.totalGallons,
        transactionCount: data.transactionCount,
        avgPricePerGallon: data.avgPricePerGallon,
        vehicleCount: data.vehiclesUsed.size,
        lastFillDate: data.lastFillDate,
        cardNumbers: Array.from(cardNumbers),
        trendData,
        vehicleBreakdown: Array.from(vehicleBreakdown.entries()).map(([vehicle, stats]) => ({
          vehicle,
          ...stats
        }))
      };
    });

    // Filter by search
    const filtered = allStats.filter(d => 
      d.driver.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.sort((a, b) => b.totalCost - a.totalCost);
  }, [transactions, searchQuery]);

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
      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="Search drivers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Driver Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fuel Usage by Driver</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Driver Name</TableHead>
                <TableHead>Card Number</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Gallons</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
                <TableHead className="text-right">Avg $/Gal</TableHead>
                <TableHead className="text-right">Vehicles Used</TableHead>
                <TableHead>Last Transaction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {driverStats.map((driver) => (
                <>
                  <TableRow 
                    key={driver.driver}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setExpandedDriver(expandedDriver === driver.driver ? null : driver.driver)}
                  >
                    <TableCell>
                      {expandedDriver === driver.driver ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-primary/10 rounded">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{driver.driver}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {driver.cardNumbers.length > 0 ? (
                        <Badge variant="outline">{driver.cardNumbers[0]}</Badge>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{driver.transactionCount}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {driver.totalGallons.toFixed(1)} gal
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(driver.totalCost)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(driver.avgPricePerGallon)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{driver.vehicleCount}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(driver.lastFillDate)}</TableCell>
                  </TableRow>
                  
                  {/* Expanded Row */}
                  {expandedDriver === driver.driver && (
                    <TableRow>
                      <TableCell colSpan={9} className="bg-muted/30">
                        <div className="p-6 space-y-6">
                          {/* Vehicle Breakdown */}
                          <div>
                            <h4 className="font-semibold mb-3">Vehicles Driven</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {driver.vehicleBreakdown.map((vb) => (
                                <Card key={vb.vehicle}>
                                  <CardContent className="pt-4">
                                    <div className="space-y-2">
                                      <div className="font-medium">{vb.vehicle}</div>
                                      <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Cost</span>
                                          <span className="font-semibold">{formatCurrency(vb.cost)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Gallons</span>
                                          <span>{vb.gallons.toFixed(1)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Fill-ups</span>
                                          <span>{vb.count}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>

                          {/* Spending Trend */}
                          {driver.trendData.length > 1 && (
                            <div>
                              <h4 className="font-semibold mb-3">Spending Trend</h4>
                              <div className="bg-card rounded-lg p-4">
                                <ResponsiveContainer width="100%" height={200}>
                                  <LineChart data={driver.trendData}>
                                    <XAxis 
                                      dataKey="date" 
                                      stroke="hsl(var(--muted-foreground))"
                                      fontSize={12}
                                    />
                                    <YAxis 
                                      stroke="hsl(var(--muted-foreground))"
                                      fontSize={12}
                                    />
                                    <Tooltip 
                                      content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                          return (
                                            <div className="bg-popover border rounded-lg p-3 shadow-lg">
                                              <p className="text-sm font-medium">
                                                {formatCurrency(payload[0].value as number)}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                {payload[0].payload.date}
                                              </p>
                                            </div>
                                          );
                                        }
                                        return null;
                                      }}
                                    />
                                    <Line 
                                      type="monotone" 
                                      dataKey="cost" 
                                      stroke="hsl(var(--primary))" 
                                      strokeWidth={2}
                                      dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-3 pt-2">
                            <Button variant="outline" size="sm">
                              View All Transactions
                            </Button>
                            <Button variant="outline" size="sm">
                              Export Driver Data
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>

          {driverStats.length === 0 && (
            <div className="py-12 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No driver data found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
