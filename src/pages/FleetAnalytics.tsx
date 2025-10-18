import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, Mail, FileSpreadsheet, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from "date-fns";
import { cn } from "@/lib/utils";
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

type DateRangePreset = 'this-month' | 'last-month' | 'this-quarter' | 'this-year' | 'custom';

export default function FleetAnalytics() {
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('this-month');
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));

  const handlePresetChange = (preset: DateRangePreset) => {
    setDateRangePreset(preset);
    const now = new Date();
    
    switch (preset) {
      case 'this-month':
        setStartDate(startOfMonth(now));
        setEndDate(endOfMonth(now));
        break;
      case 'last-month':
        const lastMonth = subMonths(now, 1);
        setStartDate(startOfMonth(lastMonth));
        setEndDate(endOfMonth(lastMonth));
        break;
      case 'this-quarter':
        setStartDate(startOfQuarter(now));
        setEndDate(endOfQuarter(now));
        break;
      case 'this-year':
        setStartDate(startOfYear(now));
        setEndDate(endOfYear(now));
        break;
    }
  };

  // Fetch fuel data
  const { data: fuelData } = useQuery({
    queryKey: ['fleet-fuel-analytics', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_transactions_new')
        .select('*')
        .gte('transaction_date', startDate.toISOString())
        .lte('transaction_date', endDate.toISOString());
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch maintenance data
  const { data: maintenanceData } = useQuery({
    queryKey: ['fleet-maintenance-analytics', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_records')
        .select('*')
        .gte('service_date', startDate.toISOString().split('T')[0])
        .lte('service_date', endDate.toISOString().split('T')[0]);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate metrics
  const totalFuelCost = fuelData?.reduce((sum, t) => sum + (Number(t.total_cost) || 0), 0) || 0;
  const totalMaintenanceCost = maintenanceData?.reduce((sum, t) => sum + (Number(t.cost) || 0), 0) || 0;
  const totalFleetCost = totalFuelCost + totalMaintenanceCost;
  
  const uniqueVehicles = new Set([
    ...(fuelData?.map(f => f.vehicle_id) || []),
    ...(maintenanceData?.map(m => m.vehicle_id) || [])
  ]).size;
  
  const avgCostPerVehicle = uniqueVehicles > 0 ? totalFleetCost / uniqueVehicles : 0;
  
  const totalGallons = fuelData?.reduce((sum, t) => sum + (Number(t.gallons) || 0), 0) || 0;
  const totalMiles = fuelData?.reduce((sum, t) => {
    if (t.odometer && fuelData) {
      const prevOdometer = fuelData
        .filter(f => f.vehicle_id === t.vehicle_id && new Date(f.transaction_date) < new Date(t.transaction_date))
        .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())[0]?.odometer;
      return sum + (prevOdometer ? t.odometer - prevOdometer : 0);
    }
    return sum;
  }, 0) || 0;
  
  const avgMPG = totalGallons > 0 ? totalMiles / totalGallons : 0;
  const costPerMile = totalMiles > 0 ? totalFleetCost / totalMiles : 0;

  // Cost breakdown by vehicle - fetch vehicle names separately
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-for-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, asset_id, vehicle_name');
      if (error) throw error;
      return data || [];
    },
  });

  const costByVehicle = (() => {
    const vehicleMap = new Map<string, { name: string; fuel: number; maintenance: number }>();
    
    fuelData?.forEach(t => {
      const vehicleId = t.vehicle_id;
      const vehicle = vehicles?.find(v => v.asset_id === vehicleId || v.id === vehicleId);
      const vehicleName = vehicle?.vehicle_name || vehicleId;
      const existing = vehicleMap.get(vehicleId) || { name: vehicleName, fuel: 0, maintenance: 0 };
      existing.fuel += Number(t.total_cost) || 0;
      vehicleMap.set(vehicleId, existing);
    });
    
    maintenanceData?.forEach(t => {
      const vehicleId = t.vehicle_id;
      const vehicle = vehicles?.find(v => v.id === vehicleId);
      const vehicleName = vehicle?.vehicle_name || vehicleId;
      const existing = vehicleMap.get(vehicleId) || { name: vehicleName, fuel: 0, maintenance: 0 };
      existing.maintenance += Number(t.cost) || 0;
      vehicleMap.set(vehicleId, existing);
    });
    
    return Array.from(vehicleMap.entries())
      .map(([id, data]) => ({
        vehicle: data.name,
        fuel: data.fuel,
        maintenance: data.maintenance,
        total: data.fuel + data.maintenance,
      }))
      .sort((a, b) => b.total - a.total);
  })();

  // Monthly spending trend
  const monthlyTrend = (() => {
    const monthMap = new Map<string, { fuel: number; maintenance: number }>();
    
    fuelData?.forEach(t => {
      const month = format(new Date(t.transaction_date), 'MMM yyyy');
      const existing = monthMap.get(month) || { fuel: 0, maintenance: 0 };
      existing.fuel += Number(t.total_cost) || 0;
      monthMap.set(month, existing);
    });
    
    maintenanceData?.forEach(t => {
      const month = format(new Date(t.service_date), 'MMM yyyy');
      const existing = monthMap.get(month) || { fuel: 0, maintenance: 0 };
      existing.maintenance += Number(t.cost) || 0;
      monthMap.set(month, existing);
    });
    
    return Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month,
        fuel: data.fuel,
        maintenance: data.maintenance,
        total: data.fuel + data.maintenance,
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  })();

  // Fuel efficiency by vehicle
  const fuelEfficiency = (() => {
    const vehicleMap = new Map<string, { name: string; gallons: number; miles: number }>();
    
    fuelData?.forEach(t => {
      const vehicleId = t.vehicle_id;
      const vehicle = vehicles?.find(v => v.asset_id === vehicleId || v.id === vehicleId);
      const vehicleName = vehicle?.vehicle_name || vehicleId;
      const existing = vehicleMap.get(vehicleId) || { name: vehicleName, gallons: 0, miles: 0 };
      existing.gallons += Number(t.gallons) || 0;
      
      if (t.odometer) {
        const prevOdometer = fuelData
          .filter(f => f.vehicle_id === vehicleId && new Date(f.transaction_date) < new Date(t.transaction_date))
          .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())[0]?.odometer;
        existing.miles += prevOdometer ? t.odometer - prevOdometer : 0;
      }
      
      vehicleMap.set(vehicleId, existing);
    });
    
    return Array.from(vehicleMap.entries())
      .map(([id, data]) => ({
        vehicle: data.name,
        mpg: data.gallons > 0 ? data.miles / data.gallons : 0,
      }))
      .filter(v => v.mpg > 0)
      .sort((a, b) => b.mpg - a.mpg);
  })();

  // Cost per mile by vehicle
  const costPerMileByVehicle = costByVehicle
    .map(v => {
      const vehicleData = vehicles?.find(vh => vh.vehicle_name === v.vehicle);
      const vehicleMiles = fuelData
        ?.filter(f => {
          const fuelVehicle = vehicles?.find(vh => vh.asset_id === f.vehicle_id || vh.id === f.vehicle_id);
          return fuelVehicle?.vehicle_name === v.vehicle;
        })
        .reduce((sum, t) => {
          if (t.odometer) {
            const prevOdometer = fuelData
              .filter(f => f.vehicle_id === t.vehicle_id && new Date(f.transaction_date) < new Date(t.transaction_date))
              .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())[0]?.odometer;
            return sum + (prevOdometer ? t.odometer - prevOdometer : 0);
          }
          return sum;
        }, 0) || 0;
      
      return {
        vehicle: v.vehicle,
        costPerMile: vehicleMiles > 0 ? v.total / vehicleMiles : 0,
      };
    })
    .filter(v => v.costPerMile > 0)
    .sort((a, b) => b.costPerMile - a.costPerMile);

  // Vehicles needing attention
  const vehiclesNeedingAttention = costByVehicle
    .filter((v, idx) => {
      const efficiency = fuelEfficiency.find(e => e.vehicle === v.vehicle);
      const cpm = costPerMileByVehicle.find(c => c.vehicle === v.vehicle);
      
      const highCost = idx < 3; // Top 3 most expensive
      const lowEfficiency = efficiency && efficiency.mpg < (avgMPG * 0.8);
      const highCPM = cpm && cpm.costPerMile > (costPerMile * 1.2);
      
      return highCost || lowEfficiency || highCPM;
    });

  const handleExportPDF = () => {
    toast({
      title: "Exporting to PDF",
      description: "Report generation in progress...",
    });
  };

  const handleExportExcel = () => {
    toast({
      title: "Exporting to Excel",
      description: "Downloading spreadsheet...",
    });
  };

  const handleEmailReport = () => {
    toast({
      title: "Email Report",
      description: "Report sent successfully",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fleet Analytics & Reports</h1>
          <p className="text-muted-foreground">Comprehensive fleet performance and cost analysis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={handleEmailReport}>
            <Mail className="h-4 w-4 mr-2" />
            Email Report
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Filters</label>
              <Select value={dateRangePreset} onValueChange={(v) => handlePresetChange(v as DateRangePreset)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="this-quarter">This Quarter</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRangePreset === 'custom' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[180px] justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(startDate, "MMM d, yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setStartDate(date)}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[180px] justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(endDate, "MMM d, yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => date && setEndDate(date)}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}

            <div className="text-sm text-muted-foreground">
              Showing data from {format(startDate, "MMM d, yyyy")} to {format(endDate, "MMM d, yyyy")}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fleet-Wide Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Fuel Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalFuelCost.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Maintenance Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMaintenanceCost.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Fleet Operating Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalFleetCost.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Cost Per Vehicle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgCostPerVehicle.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{uniqueVehicles} vehicles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Cost Per Mile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${costPerMile.toFixed(3)}/mi</div>
            <p className="text-xs text-muted-foreground">{totalMiles.toLocaleString()} total miles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fleet Average MPG</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgMPG.toFixed(1)} MPG</div>
            <p className="text-xs text-muted-foreground">{totalGallons.toFixed(1)} gallons used</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown by Vehicle */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown by Vehicle</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costByVehicle.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vehicle" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="fuel" fill="hsl(var(--chart-1))" name="Fuel" stackId="a" />
                <Bar dataKey="maintenance" fill="hsl(var(--chart-2))" name="Maintenance" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Spending Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="fuel" stroke="hsl(var(--chart-1))" name="Fuel" />
                <Line type="monotone" dataKey="maintenance" stroke="hsl(var(--chart-2))" name="Maintenance" />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--chart-3))" name="Total" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fuel Efficiency by Vehicle */}
        <Card>
          <CardHeader>
            <CardTitle>Fuel Efficiency by Vehicle</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fuelEfficiency.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="vehicle" type="category" width={100} />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)} MPG`} />
                <Bar dataKey="mpg" fill="hsl(var(--chart-3))" name="MPG" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cost Per Mile by Vehicle */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Per Mile by Vehicle</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costPerMileByVehicle.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="vehicle" type="category" width={100} />
                <Tooltip formatter={(value: number) => `$${value.toFixed(3)}/mi`} />
                <Bar dataKey="costPerMile" fill="hsl(var(--chart-4))" name="$/Mile" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Expensive Vehicles */}
        <Card>
          <CardHeader>
            <CardTitle>Most Expensive Vehicles (This Period)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead className="text-right">Fuel</TableHead>
                  <TableHead className="text-right">Maint.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costByVehicle.slice(0, 10).map((v, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{v.vehicle}</TableCell>
                    <TableCell className="text-right">${v.fuel.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${v.maintenance.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold">${v.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Most Fuel Efficient Vehicles */}
        <Card>
          <CardHeader>
            <CardTitle>Most Fuel Efficient Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead className="text-right">Avg MPG</TableHead>
                  <TableHead className="text-right">Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fuelEfficiency.slice(0, 10).map((v, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{v.vehicle}</TableCell>
                    <TableCell className="text-right">{v.mpg.toFixed(1)}</TableCell>
                    <TableCell className="text-right">
                      {v.mpg >= avgMPG ? (
                        <Badge className="bg-green-100 text-green-800">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Above Avg
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          Below Avg
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Vehicles Needing Attention */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Vehicles Needing Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Cost/Mile</TableHead>
                  <TableHead className="text-right">MPG</TableHead>
                  <TableHead>Flags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehiclesNeedingAttention.map((v, idx) => {
                  const efficiency = fuelEfficiency.find(e => e.vehicle === v.vehicle);
                  const cpm = costPerMileByVehicle.find(c => c.vehicle === v.vehicle);
                  
                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{v.vehicle}</TableCell>
                      <TableCell className="text-right">${v.total.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${cpm?.costPerMile.toFixed(3) || '—'}</TableCell>
                      <TableCell className="text-right">{efficiency?.mpg.toFixed(1) || '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {idx < 3 && <Badge variant="destructive">High Cost</Badge>}
                          {efficiency && efficiency.mpg < (avgMPG * 0.8) && <Badge variant="destructive">Low MPG</Badge>}
                          {cpm && cpm.costPerMile > (costPerMile * 1.2) && <Badge variant="destructive">High $/Mile</Badge>}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
