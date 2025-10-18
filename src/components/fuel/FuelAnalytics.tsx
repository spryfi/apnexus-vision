import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

interface FuelAnalyticsProps {
  transactions: FuelTransaction[];
}

type DateRange = 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'custom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function FuelAnalytics({ transactions }: FuelAnalyticsProps) {
  const [dateRange, setDateRange] = useState<DateRange>('this_month');
  const [compareEnabled, setCompareEnabled] = useState(false);

  // Calculate date ranges
  const { currentPeriod, previousPeriod } = useMemo(() => {
    const now = new Date();
    let currentStart: Date, currentEnd: Date, prevStart: Date, prevEnd: Date;

    switch (dateRange) {
      case 'this_month':
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        currentEnd = now;
        prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'last_month':
        currentStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        currentEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);
        break;
      case 'this_quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        currentStart = new Date(now.getFullYear(), quarter * 3, 1);
        currentEnd = now;
        prevStart = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
        prevEnd = new Date(now.getFullYear(), quarter * 3, 0);
        break;
      case 'this_year':
        currentStart = new Date(now.getFullYear(), 0, 1);
        currentEnd = now;
        prevStart = new Date(now.getFullYear() - 1, 0, 1);
        prevEnd = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        currentEnd = now;
        prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    return {
      currentPeriod: { start: currentStart, end: currentEnd },
      previousPeriod: { start: prevStart, end: prevEnd }
    };
  }, [dateRange]);

  // Filter transactions by period
  const currentTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = new Date(t.transaction_date);
      return date >= currentPeriod.start && date <= currentPeriod.end;
    });
  }, [transactions, currentPeriod]);

  const previousTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = new Date(t.transaction_date);
      return date >= previousPeriod.start && date <= previousPeriod.end;
    });
  }, [transactions, previousPeriod]);

  // Calculate metrics
  const currentMetrics = useMemo(() => {
    const totalSpend = currentTransactions.reduce((sum, t) => sum + t.total_cost, 0);
    const totalGallons = currentTransactions.reduce((sum, t) => sum + t.gallons, 0);
    const avgPricePerGallon = totalGallons > 0 ? totalSpend / totalGallons : 0;
    
    return {
      totalSpend,
      totalGallons,
      avgPricePerGallon,
      transactionCount: currentTransactions.length,
      avgFuelEconomy: 0, // TODO: Calculate from distance_driven
      avgCostPerMile: 0  // TODO: Calculate from distance_driven
    };
  }, [currentTransactions]);

  const previousMetrics = useMemo(() => {
    const totalSpend = previousTransactions.reduce((sum, t) => sum + t.total_cost, 0);
    const totalGallons = previousTransactions.reduce((sum, t) => sum + t.gallons, 0);
    return {
      totalSpend,
      totalGallons,
      avgPricePerGallon: totalGallons > 0 ? totalSpend / totalGallons : 0,
      transactionCount: previousTransactions.length
    };
  }, [previousTransactions]);

  // Calculate percentage changes
  const changes = useMemo(() => {
    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      spendChange: calcChange(currentMetrics.totalSpend, previousMetrics.totalSpend),
      gallonsChange: calcChange(currentMetrics.totalGallons, previousMetrics.totalGallons),
      priceChange: calcChange(currentMetrics.avgPricePerGallon, previousMetrics.avgPricePerGallon),
      countChange: calcChange(currentMetrics.transactionCount, previousMetrics.transactionCount)
    };
  }, [currentMetrics, previousMetrics]);

  // Spending trend data (grouped by week)
  const spendingTrendData = useMemo(() => {
    const grouped = new Map<string, { current: number; previous: number }>();
    
    currentTransactions.forEach(t => {
      const week = getWeekKey(new Date(t.transaction_date));
      const existing = grouped.get(week) || { current: 0, previous: 0 };
      grouped.set(week, { ...existing, current: existing.current + t.total_cost });
    });

    if (compareEnabled) {
      previousTransactions.forEach(t => {
        const week = getWeekKey(new Date(t.transaction_date));
        const existing = grouped.get(week) || { current: 0, previous: 0 };
        grouped.set(week, { ...existing, previous: existing.previous + t.total_cost });
      });
    }

    return Array.from(grouped.entries())
      .map(([week, values]) => ({
        week,
        current: values.current,
        previous: compareEnabled ? values.previous : undefined
      }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [currentTransactions, previousTransactions, compareEnabled]);

  // Top vehicles by fuel cost
  const topVehicles = useMemo(() => {
    const vehicleMap = new Map<string, { totalCost: number; gallons: number; count: number }>();
    
    currentTransactions.forEach(t => {
      if (!t.vehicle_id) return;
      const existing = vehicleMap.get(t.vehicle_id) || { totalCost: 0, gallons: 0, count: 0 };
      vehicleMap.set(t.vehicle_id, {
        totalCost: existing.totalCost + t.total_cost,
        gallons: existing.gallons + t.gallons,
        count: existing.count + 1
      });
    });

    return Array.from(vehicleMap.entries())
      .map(([vehicleId, data]) => ({
        vehicleId,
        totalCost: data.totalCost,
        gallons: data.gallons,
        avgMPG: 0, // TODO: Calculate
        transactionCount: data.count
      }))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 5);
  }, [currentTransactions]);

  // Top drivers by fuel cost
  const topDrivers = useMemo(() => {
    const driverMap = new Map<string, { totalCost: number; gallons: number; count: number; vehicles: Set<string> }>();
    
    currentTransactions.forEach(t => {
      const existing = driverMap.get(t.employee_name) || { totalCost: 0, gallons: 0, count: 0, vehicles: new Set() };
      if (t.vehicle_id) existing.vehicles.add(t.vehicle_id);
      driverMap.set(t.employee_name, {
        totalCost: existing.totalCost + t.total_cost,
        gallons: existing.gallons + t.gallons,
        count: existing.count + 1,
        vehicles: existing.vehicles
      });
    });

    return Array.from(driverMap.entries())
      .map(([driver, data]) => ({
        driver,
        totalCost: data.totalCost,
        gallons: data.gallons,
        transactionCount: data.count,
        vehicleCount: data.vehicles.size
      }))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 5);
  }, [currentTransactions]);

  // Top locations
  const topLocations = useMemo(() => {
    const locationMap = new Map<string, { totalCost: number; count: number }>();
    
    currentTransactions.forEach(t => {
      if (!t.merchant_name) return;
      const existing = locationMap.get(t.merchant_name) || { totalCost: 0, count: 0 };
      locationMap.set(t.merchant_name, {
        totalCost: existing.totalCost + t.total_cost,
        count: existing.count + 1
      });
    });

    return Array.from(locationMap.entries())
      .map(([location, data]) => ({
        location,
        totalCost: data.totalCost,
        visitCount: data.count
      }))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 10);
  }, [currentTransactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getWeekKey = (date: Date) => {
    const year = date.getFullYear();
    const week = Math.floor((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    return `${year}-W${week}`;
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    // TODO: Implement export functionality
    console.log('Exporting as:', format);
  };

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label>Period:</Label>
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="this_quarter">This Quarter</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="compare" 
            checked={compareEnabled}
            onCheckedChange={(checked) => setCompareEnabled(checked as boolean)}
          />
          <Label htmlFor="compare" className="cursor-pointer">
            Compare to Previous Period
          </Label>
        </div>

        <div className="ml-auto">
          <Select onValueChange={handleExport}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Export Analytics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF Report</SelectItem>
              <SelectItem value="excel">Excel Spreadsheet</SelectItem>
              <SelectItem value="csv">CSV Data</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total Fuel Spend"
          value={formatCurrency(currentMetrics.totalSpend)}
          change={changes.spendChange}
          compareEnabled={compareEnabled}
        />
        <MetricCard
          title="Total Gallons"
          value={currentMetrics.totalGallons.toFixed(2)}
          change={changes.gallonsChange}
          compareEnabled={compareEnabled}
        />
        <MetricCard
          title="Average Price/Gallon"
          value={formatCurrency(currentMetrics.avgPricePerGallon)}
          change={changes.priceChange}
          compareEnabled={compareEnabled}
        />
        <MetricCard
          title="Fuel Economy"
          value="N/A"
          subtitle="Fleet Average MPG"
        />
        <MetricCard
          title="Cost Per Mile"
          value="N/A"
          subtitle="Fleet Average"
        />
        <MetricCard
          title="Transactions"
          value={currentMetrics.transactionCount.toString()}
          change={changes.countChange}
          compareEnabled={compareEnabled}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Spending Trend */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={spendingTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Line type="monotone" dataKey="current" stroke="#0088FE" name="Current Period" />
                {compareEnabled && (
                  <Line type="monotone" dataKey="previous" stroke="#888" strokeDasharray="5 5" name="Previous Period" />
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Locations */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topLocations} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="location" type="category" width={100} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar dataKey="totalCost" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Lists */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Vehicles */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Vehicles by Fuel Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                  <TableHead className="text-right">Gallons</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topVehicles.map((vehicle, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{vehicle.vehicleId}</TableCell>
                    <TableCell className="text-right">{formatCurrency(vehicle.totalCost)}</TableCell>
                    <TableCell className="text-right">{vehicle.gallons.toFixed(1)}</TableCell>
                    <TableCell className="text-right">{vehicle.transactionCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Drivers */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Drivers by Fuel Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                  <TableHead className="text-right">Gallons</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topDrivers.map((driver, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{driver.driver}</TableCell>
                    <TableCell className="text-right">{formatCurrency(driver.totalCost)}</TableCell>
                    <TableCell className="text-right">{driver.gallons.toFixed(1)}</TableCell>
                    <TableCell className="text-right">{driver.transactionCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  subtitle,
  change, 
  compareEnabled 
}: { 
  title: string; 
  value: string; 
  subtitle?: string;
  change?: number; 
  compareEnabled?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {compareEnabled && change !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {change >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className={cn(
              "text-xs font-medium",
              change >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {formatPercent(change)}
            </span>
            <span className="text-xs text-muted-foreground">vs previous</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatPercent(value: number) {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
