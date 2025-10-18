import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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

    return Array.from(stats.entries())
      .map(([vehicleId, data]) => ({
        vehicleId,
        ...data,
        avgMPG: 0 // TODO: Calculate from distance data
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
          <CardTitle>Fuel Usage by Vehicle</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle ID</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
                <TableHead className="text-right">Total Gallons</TableHead>
                <TableHead className="text-right">Avg Price/Gal</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead>Last Fill-Up</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicleStats.map((vehicle) => (
                <TableRow key={vehicle.vehicleId}>
                  <TableCell className="font-medium">{vehicle.vehicleId}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(vehicle.totalCost)}
                  </TableCell>
                  <TableCell className="text-right">
                    {vehicle.totalGallons.toFixed(2)} gal
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(vehicle.avgPricePerGallon)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{vehicle.transactionCount}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(vehicle.lastFillDate)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => navigate(`/fleet?vehicle=${vehicle.vehicleId}`)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
