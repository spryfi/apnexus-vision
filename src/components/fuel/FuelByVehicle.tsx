import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Truck, TrendingUp, Gauge, DollarSign, Fuel, Calendar } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

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

interface FuelByVehicleProps {
  transactions: FuelTransaction[];
}

export function FuelByVehicle({ transactions }: FuelByVehicleProps) {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<'cost' | 'gallons' | 'mpg' | 'date'>('cost');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const vehicleStats = useMemo(() => {
    const stats = new Map<string, {
      totalCost: number;
      totalGallons: number;
      transactionCount: number;
      avgPricePerGallon: number;
      lastFillDate: string;
      totalMiles: number;
    }>();

    transactions.forEach(t => {
      if (!t.vehicle_id) return;
      
      const existing = stats.get(t.vehicle_id) || {
        totalCost: 0,
        totalGallons: 0,
        transactionCount: 0,
        avgPricePerGallon: 0,
        lastFillDate: t.transaction_date,
        totalMiles: 0
      };

      stats.set(t.vehicle_id, {
        totalCost: existing.totalCost + t.total_cost,
        totalGallons: existing.totalGallons + t.gallons,
        transactionCount: existing.transactionCount + 1,
        avgPricePerGallon: (existing.totalCost + t.total_cost) / (existing.totalGallons + t.gallons),
        lastFillDate: t.transaction_date > existing.lastFillDate ? t.transaction_date : existing.lastFillDate,
        totalMiles: existing.totalMiles
      });
    });

    const allStats = Array.from(stats.entries()).map(([vehicleId, data]) => {
      // Calculate spending trend data for mini chart
      const vehicleTransactions = transactions
        .filter(t => t.vehicle_id === vehicleId)
        .sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());
      
      const trendData = vehicleTransactions.map(t => ({
        date: t.transaction_date,
        cost: t.total_cost
      }));

      // Calculate MPG if distance data available
      const totalDistance = vehicleTransactions.reduce((sum, t) => {
        const tx = t as any;
        return sum + (tx.distance_driven || 0);
      }, 0);
      const avgMPG = data.totalGallons > 0 && totalDistance > 0 
        ? totalDistance / data.totalGallons 
        : 0;

      const costPerMile = totalDistance > 0 ? data.totalCost / totalDistance : 0;

      return {
        vehicleId,
        ...data,
        avgMPG,
        costPerMile,
        trendData
      };
    });

    // Filter by search
    const filtered = allStats.filter(v => 
      v.vehicleId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort
    const sorted = filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'cost':
          comparison = a.totalCost - b.totalCost;
          break;
        case 'gallons':
          comparison = a.totalGallons - b.totalGallons;
          break;
        case 'mpg':
          comparison = a.avgMPG - b.avgMPG;
          break;
        case 'date':
          comparison = new Date(a.lastFillDate).getTime() - new Date(b.lastFillDate).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [transactions, sortBy, sortOrder, searchQuery]);

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
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search vehicles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cost">Total Spent</SelectItem>
                <SelectItem value="gallons">Gallons</SelectItem>
                <SelectItem value="mpg">MPG</SelectItem>
                <SelectItem value="date">Last Fill-up</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Highest to Lowest</SelectItem>
                <SelectItem value="asc">Lowest to Highest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicleStats.map((vehicle) => (
          <Card key={vehicle.vehicleId} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{vehicle.vehicleId}</CardTitle>
                    <p className="text-sm text-muted-foreground">Fleet Vehicle</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    Total Spent
                  </div>
                  <p className="text-lg font-semibold">{formatCurrency(vehicle.totalCost)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Fuel className="h-3 w-3" />
                    Gallons
                  </div>
                  <p className="text-lg font-semibold">{vehicle.totalGallons.toFixed(1)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    Fill-ups
                  </div>
                  <p className="text-lg font-semibold">{vehicle.transactionCount}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Gauge className="h-3 w-3" />
                    Avg MPG
                  </div>
                  <p className="text-lg font-semibold">
                    {vehicle.avgMPG > 0 ? vehicle.avgMPG.toFixed(1) : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="pt-3 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Price/Gal</span>
                  <span className="font-medium">{formatCurrency(vehicle.avgPricePerGallon)}</span>
                </div>
                {vehicle.costPerMile > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cost Per Mile</span>
                    <span className="font-medium">{formatCurrency(vehicle.costPerMile)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Last Fill-up
                  </div>
                  <span className="font-medium">{formatDate(vehicle.lastFillDate)}</span>
                </div>
              </div>

              {/* Mini Trend Chart */}
              {vehicle.trendData.length > 1 && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Spending Trend</p>
                  <ResponsiveContainer width="100%" height={60}>
                    <LineChart data={vehicle.trendData}>
                      <Line 
                        type="monotone" 
                        dataKey="cost" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={false}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover border rounded-lg p-2 shadow-lg">
                                <p className="text-xs font-medium">
                                  {formatCurrency(payload[0].value as number)}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate(`/fleet?vehicle=${vehicle.vehicleId}`)}
                >
                  View Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    // TODO: Export vehicle data
                    console.log('Export data for', vehicle.vehicleId);
                  }}
                >
                  Export Data
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {vehicleStats.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No vehicle data found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
