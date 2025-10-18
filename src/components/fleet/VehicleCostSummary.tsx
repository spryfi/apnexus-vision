import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface VehicleCostSummaryProps {
  fuelCost: number;
  maintenanceCost: number;
  monthlyTrend: Array<{ month: string; fuel: number; maintenance: number }>;
  totalMiles: number;
  fleetAvgCostPerMile: number;
}

export const VehicleCostSummary = ({ 
  fuelCost, 
  maintenanceCost, 
  monthlyTrend,
  totalMiles,
  fleetAvgCostPerMile 
}: VehicleCostSummaryProps) => {
  const totalCost = fuelCost + maintenanceCost;
  const costPerMile = totalMiles > 0 ? totalCost / totalMiles : 0;
  const comparisonToFleet = fleetAvgCostPerMile > 0 
    ? ((costPerMile - fleetAvgCostPerMile) / fleetAvgCostPerMile * 100).toFixed(1)
    : "0";

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleExportReport = () => {
    // TODO: Implement PDF export
    console.log("Exporting vehicle cost report...");
  };

  return (
    <div className="space-y-6">
      {/* Cost Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Fuel Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(fuelCost)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((fuelCost / totalCost) * 100).toFixed(0)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Maintenance Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(maintenanceCost)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((maintenanceCost / totalCost) * 100).toFixed(0)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Operating Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
            <p className="text-xs text-muted-foreground mt-1">Fuel + Maintenance</p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Per Mile */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Efficiency</CardTitle>
          <CardDescription>Cost per mile compared to fleet average</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Vehicle</p>
                <p className="text-3xl font-bold">{formatCurrency(costPerMile)}/mile</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">Fleet Average</p>
                <p className="text-3xl font-bold">{formatCurrency(fleetAvgCostPerMile)}/mile</p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                This vehicle is{" "}
                <span className={`font-bold ${parseFloat(comparisonToFleet) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {Math.abs(parseFloat(comparisonToFleet))}%{" "}
                  {parseFloat(comparisonToFleet) > 0 ? 'above' : 'below'}
                </span>{" "}
                the fleet average
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Cost Trend */}
      <Card>
        <CardHeader>
          <CardTitle>6-Month Cost Trend</CardTitle>
          <CardDescription>Monthly breakdown of fuel and maintenance costs</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="fuel" 
                stroke="hsl(var(--chart-1))" 
                name="Fuel" 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="maintenance" 
                stroke="hsl(var(--chart-2))" 
                name="Maintenance" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={handleExportReport}>
          <Download className="h-4 w-4 mr-2" />
          Export Vehicle Cost Report
        </Button>
      </div>
    </div>
  );
};
