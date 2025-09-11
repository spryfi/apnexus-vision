import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Gauge, TrendingUp, Truck } from "lucide-react";
import { useMemo } from "react";

interface FuelTransaction {
  id: string;
  transaction_date: string;
  vehicle_id: string;
  total_cost: number;
  gallons: number;
  odometer?: number;
}

interface FuelKPIDashboardProps {
  transactions: FuelTransaction[];
}

export function FuelKPIDashboard({ transactions }: FuelKPIDashboardProps) {
  const kpis = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthTransactions = transactions.filter(t => 
      t.transaction_date.slice(0, 7) === currentMonth
    );

    const totalCostThisMonth = currentMonthTransactions.reduce(
      (sum, t) => sum + Number(t.total_cost), 0
    );

    const totalGallonsThisMonth = currentMonthTransactions.reduce(
      (sum, t) => sum + Number(t.gallons), 0
    );

    // Calculate average fuel economy for vehicles with odometer data
    const vehicleGroups = new Map<string, FuelTransaction[]>();
    transactions.forEach(t => {
      if (!vehicleGroups.has(t.vehicle_id)) {
        vehicleGroups.set(t.vehicle_id, []);
      }
      vehicleGroups.get(t.vehicle_id)?.push(t);
    });

    let totalMPG = 0;
    let vehiclesWithMPG = 0;

    vehicleGroups.forEach((vehicleTransactions, vehicleId) => {
      const sortedTransactions = vehicleTransactions
        .filter(t => t.odometer && t.odometer > 0)
        .sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());

      if (sortedTransactions.length >= 2) {
        let vehicleTotalMiles = 0;
        let vehicleTotalGallons = 0;

        for (let i = 1; i < sortedTransactions.length; i++) {
          const prev = sortedTransactions[i - 1];
          const curr = sortedTransactions[i];
          const miles = (curr.odometer || 0) - (prev.odometer || 0);
          
          if (miles > 0 && miles < 1000) { // Reasonable miles between fill-ups
            vehicleTotalMiles += miles;
            vehicleTotalGallons += Number(curr.gallons);
          }
        }

        if (vehicleTotalGallons > 0) {
          totalMPG += vehicleTotalMiles / vehicleTotalGallons;
          vehiclesWithMPG++;
        }
      }
    });

    const avgMPG = vehiclesWithMPG > 0 ? totalMPG / vehiclesWithMPG : 0;

    // Find highest spending vehicle this month
    const vehicleSpending = new Map<string, number>();
    currentMonthTransactions.forEach(t => {
      const current = vehicleSpending.get(t.vehicle_id) || 0;
      vehicleSpending.set(t.vehicle_id, current + Number(t.total_cost));
    });

    const highestSpendingVehicle = Array.from(vehicleSpending.entries())
      .sort((a, b) => b[1] - a[1])[0];

    return {
      totalCostThisMonth,
      avgMPG,
      highestSpendingVehicle: highestSpendingVehicle ? {
        vehicle: highestSpendingVehicle[0],
        amount: highestSpendingVehicle[1]
      } : null,
      totalGallonsThisMonth
    };
  }, [transactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Fuel Cost (This Month)</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(kpis.totalCostThisMonth)}</div>
          <p className="text-xs text-muted-foreground">
            {kpis.totalGallonsThisMonth.toFixed(1)} gallons total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Fuel Economy</CardTitle>
          <Gauge className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {kpis.avgMPG > 0 ? `${kpis.avgMPG.toFixed(1)} MPG` : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">
            Fleet average across all vehicles
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Highest Spending Vehicle</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {kpis.highestSpendingVehicle?.vehicle || 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">
            {kpis.highestSpendingVehicle ? 
              formatCurrency(kpis.highestSpendingVehicle.amount) : 
              'No data this month'
            }
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Trend</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">↗️ Tracking</div>
          <p className="text-xs text-muted-foreground">
            Data updated automatically
          </p>
        </CardContent>
      </Card>
    </div>
  );
}