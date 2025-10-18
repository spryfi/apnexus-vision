import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fuel, TrendingUp, DollarSign, Gauge } from "lucide-react";

interface FuelStats {
  totalSpentAllTime: number;
  totalSpentThisMonth: number;
  totalGallons: number;
  averageMPG: number;
  costPerMile: number;
  lastFillupDays: number;
  fillupCount: number;
}

interface VehicleFuelStatsProps {
  stats: FuelStats;
}

export function VehicleFuelStats({ stats }: VehicleFuelStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fuel className="h-5 w-5" />
          This Vehicle's Fuel Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Spent (All Time)</p>
            <p className="text-2xl font-bold">${stats.totalSpentAllTime.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Spent (This Month)</p>
            <p className="text-2xl font-bold text-blue-600">${stats.totalSpentThisMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Gallons</p>
            <p className="text-2xl font-bold">{stats.totalGallons.toFixed(1)} gal</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Average MPG</p>
            <p className="text-2xl font-bold flex items-center gap-1">
              <Gauge className="h-5 w-5 text-green-600" />
              {stats.averageMPG > 0 ? stats.averageMPG.toFixed(1) : 'N/A'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Cost Per Mile</p>
            <p className="text-2xl font-bold flex items-center gap-1">
              <DollarSign className="h-5 w-5" />
              {stats.costPerMile > 0 ? stats.costPerMile.toFixed(2) : 'N/A'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Last Fill-up</p>
            <p className="text-2xl font-bold">
              {stats.lastFillupDays >= 0 ? `${stats.lastFillupDays} days ago` : 'Never'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Number of Fill-ups</p>
            <p className="text-2xl font-bold">{stats.fillupCount}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Avg Price/Gallon</p>
            <p className="text-2xl font-bold flex items-center gap-1">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              ${stats.totalGallons > 0 ? (stats.totalSpentAllTime / stats.totalGallons).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
