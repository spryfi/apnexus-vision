import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

interface FuelMatrixViewProps {
  transactions: FuelTransaction[];
}

export function FuelMatrixView({ transactions }: FuelMatrixViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const matrixData = useMemo(() => {
    // Get unique drivers and vehicles
    const drivers = [...new Set(transactions.map(t => t.employee_name))];
    const vehicles = [...new Set(transactions.filter(t => t.vehicle_id).map(t => t.vehicle_id as string))];

    // Filter by search
    const filteredDrivers = drivers.filter(d => 
      d.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredVehicles = vehicles.filter(v => 
      v.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Build matrix
    const matrix = new Map<string, Map<string, number>>();
    
    transactions.forEach(t => {
      if (!t.vehicle_id) return;
      
      if (!matrix.has(t.vehicle_id)) {
        matrix.set(t.vehicle_id, new Map());
      }
      
      const vehicleRow = matrix.get(t.vehicle_id)!;
      const currentAmount = vehicleRow.get(t.employee_name) || 0;
      vehicleRow.set(t.employee_name, currentAmount + t.total_cost);
    });

    // Find max value for color scale
    let maxValue = 0;
    matrix.forEach(row => {
      row.forEach(value => {
        if (value > maxValue) maxValue = value;
      });
    });

    return {
      drivers: filteredDrivers.sort(),
      vehicles: filteredVehicles.sort(),
      matrix,
      maxValue
    };
  }, [transactions, searchQuery]);

  const getHeatColor = (value: number | undefined) => {
    if (!value) return 'transparent';
    const intensity = (value / matrixData.maxValue) * 100;
    return `hsl(var(--primary) / ${Math.max(10, intensity)}%)`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="Search vehicles or drivers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle-Driver Spending Matrix</CardTitle>
          <p className="text-sm text-muted-foreground">
            Click any cell to view transactions. Darker cells indicate higher spending.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold sticky left-0 bg-background z-10">Vehicle</TableHead>
                  {matrixData.drivers.map((driver) => (
                    <TableHead key={driver} className="text-center min-w-[120px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-medium truncate max-w-[100px]">
                          {driver}
                        </span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {matrixData.vehicles.map((vehicle) => {
                  const vehicleRow = matrixData.matrix.get(vehicle);
                  return (
                    <TableRow key={vehicle}>
                      <TableCell className="font-medium sticky left-0 bg-background z-10">
                        {vehicle}
                      </TableCell>
                      {matrixData.drivers.map((driver) => {
                        const value = vehicleRow?.get(driver);
                        return (
                          <TableCell
                            key={`${vehicle}-${driver}`}
                            className="text-center p-1 cursor-pointer transition-all hover:ring-2 hover:ring-primary"
                            style={{
                              backgroundColor: getHeatColor(value)
                            }}
                            onClick={() => {
                              if (value) {
                                console.log(`Show transactions for ${driver} on ${vehicle}`);
                              }
                            }}
                          >
                            {value ? (
                              <div className="p-2">
                                <div className="text-sm font-semibold">
                                  {formatCurrency(value)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {transactions.filter(
                                    t => t.vehicle_id === vehicle && t.employee_name === driver
                                  ).length} txns
                                </div>
                              </div>
                            ) : (
                              <div className="text-muted-foreground text-xs p-2">-</div>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {matrixData.vehicles.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Spending Scale</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-4 rounded" style={{ backgroundColor: 'hsl(var(--primary) / 10%)' }} />
                <span className="text-xs">Low</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-4 rounded" style={{ backgroundColor: 'hsl(var(--primary) / 50%)' }} />
                <span className="text-xs">Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-4 rounded" style={{ backgroundColor: 'hsl(var(--primary) / 100%)' }} />
                <span className="text-xs">High</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
