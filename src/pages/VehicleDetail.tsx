import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, ArrowLeft, Plus, FileText, Fuel, Calendar, Settings, Eye, ExternalLink, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import AddMaintenanceDialog from "@/components/AddMaintenanceDialog";
import { toast } from "@/hooks/use-toast";
import { VehicleFuelStats } from "@/components/fleet/VehicleFuelStats";
import { VehicleFuelTrendChart } from "@/components/fleet/VehicleFuelTrendChart";
import { ReceiptViewerModal } from "@/components/ap/ReceiptViewerModal";
import { VehicleCostSummary } from "@/components/fleet/VehicleCostSummary";
import { MaintenanceDetailDialog } from "@/components/fleet/MaintenanceDetailDialog";

interface Vehicle {
  id: string;
  vehicle_name: string;
  asset_id: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  license_plate?: string;
  current_odometer: number;
  registration_expiry_date?: string;
  insurance_policy_number?: string;
  insurance_expiry_date?: string;
  status: string;
}

interface MaintenanceRecord {
  id: string;
  service_date: string;
  service_description: string;
  cost: number;
  odometer_at_service: number;
  receipt_scan_url?: string;
  vendors?: {
    vendor_name: string;
  };
}

interface FuelTransaction {
  id: string;
  transaction_date: string;
  driver_first_name?: string;
  driver_last_name?: string;
  gallons?: number;
  price_per_gallon?: number;
  total_fuel_cost?: number;
  current_odometer?: number;
  adjusted_odometer?: number;
  distance_driven?: number;
  fuel_economy?: number;
  merchant_name?: string;
  merchant_city?: string;
  merchant_state?: string;
  receipt_url?: string;
}

const VehicleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [fuelHistory, setFuelHistory] = useState<FuelTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMaintenanceDialog, setShowAddMaintenanceDialog] = useState(false);
  const [showReceiptViewer, setShowReceiptViewer] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<{ url: string; fileName: string } | null>(null);
  const [showMaintenanceDetail, setShowMaintenanceDetail] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<MaintenanceRecord | null>(null);

  useEffect(() => {
    if (id) {
      fetchVehicleData();
    }
  }, [id]);

  const fetchVehicleData = async () => {
    try {
      // Fetch vehicle details
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single();

      if (vehicleError) throw vehicleError;
      setVehicle(vehicleData);

      // Fetch maintenance records with line items
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('maintenance_records')
        .select(`
          *,
          vendors (
            vendor_name
          ),
          maintenance_line_items (
            id,
            description,
            part_number,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('vehicle_id', id)
        .order('service_date', { ascending: false });

      if (maintenanceError) throw maintenanceError;
      setMaintenanceRecords(maintenanceData || []);

      // Fetch fuel history
      const { data: fuelData, error: fuelError } = await supabase
        .from('fuel_transactions_new')
        .select('*')
        .eq('vehicle_id', vehicleData.asset_id)
        .order('transaction_date', { ascending: false });

      if (fuelError) throw fuelError;
      setFuelHistory(fuelData || []);

    } catch (error) {
      console.error('Error fetching vehicle data:', error);
      toast({
        title: "Error",
        description: "Failed to load vehicle data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getProactiveAlerts = () => {
    if (!vehicle) return [];
    
    const alerts = [];
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (vehicle.registration_expiry_date) {
      const regExpiry = new Date(vehicle.registration_expiry_date);
      if (regExpiry <= thirtyDaysFromNow && regExpiry >= now) {
        const daysUntil = Math.ceil((regExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
          type: 'warning',
          message: `Registration expires in ${daysUntil} days!`,
          date: regExpiry.toLocaleDateString()
        });
      }
    }

    if (vehicle.insurance_expiry_date) {
      const insExpiry = new Date(vehicle.insurance_expiry_date);
      if (insExpiry <= thirtyDaysFromNow && insExpiry >= now) {
        const daysUntil = Math.ceil((insExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
          type: 'warning',
          message: `Insurance expires in ${daysUntil} days!`,
          date: insExpiry.toLocaleDateString()
        });
      }
    }

    return alerts;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-32" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Vehicle Not Found</h1>
        <Button onClick={() => navigate('/fleet')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Fleet
        </Button>
      </div>
    );
  }

  const alerts = getProactiveAlerts();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/fleet')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{vehicle.vehicle_name}</h1>
          <p className="text-muted-foreground">
            {vehicle.make && vehicle.model && vehicle.year 
              ? `${vehicle.make} ${vehicle.model} ${vehicle.year}`
              : `Asset ID: ${vehicle.asset_id}`
            }
          </p>
        </div>
      </div>

      {/* At a Glance Section */}
      <Card>
        <CardHeader>
          <CardTitle>At a Glance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">VIN</p>
              <p className="text-lg">{vehicle.vin || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">License Plate</p>
              <p className="text-lg">{vehicle.license_plate || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Odometer</p>
              <p className="text-lg font-semibold">{vehicle.current_odometer.toLocaleString()} miles</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proactive Alerts */}
      {alerts.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-yellow-800">{alert.message}</span>
                  <span className="text-sm text-yellow-600">{alert.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabbed Interface */}
      <Tabs defaultValue="maintenance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Maintenance Log
          </TabsTrigger>
          <TabsTrigger value="fuel" className="flex items-center gap-2">
            <Fuel className="h-4 w-4" />
            Fuel History
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents & Details
          </TabsTrigger>
          <TabsTrigger value="cost-summary" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Cost Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Maintenance Records</CardTitle>
                <CardDescription>Service history and repair records for this vehicle</CardDescription>
              </div>
              <Button onClick={() => navigate(`/fleet/${id}/add-maintenance`)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Maintenance Record
              </Button>
            </CardHeader>
            <CardContent>
              {maintenanceRecords.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No maintenance records</h3>
                  <p className="text-sm text-muted-foreground mb-4">Start tracking maintenance for this vehicle</p>
                  <Button onClick={() => navigate(`/fleet/${id}/add-maintenance`)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Record
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Odometer</TableHead>
                      <TableHead>Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceRecords.map((record) => (
                      <TableRow 
                        key={record.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedMaintenance(record);
                          setShowMaintenanceDetail(true);
                        }}
                      >
                        <TableCell>{new Date(record.service_date).toLocaleDateString()}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={record.service_description}>
                            {record.service_description}
                          </div>
                        </TableCell>
                        <TableCell>{record.vendors?.vendor_name || 'Not specified'}</TableCell>
                        <TableCell>{formatCurrency(record.cost)}</TableCell>
                        <TableCell>{record.odometer_at_service.toLocaleString()}</TableCell>
                        <TableCell>
                          {record.receipt_scan_url ? (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReceipt({ 
                                  url: record.receipt_scan_url!, 
                                  fileName: `Maintenance-${record.id}.pdf` 
                                });
                                setShowReceiptViewer(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">No receipt</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fuel" className="space-y-4">
          {fuelHistory.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Fuel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No fuel records for this vehicle yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Fuel transactions will appear here when uploaded</p>
                  <Button onClick={() => navigate('/fuel')}>
                    Go to Fuel Tracking
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <VehicleFuelStats stats={{
                totalSpentAllTime: fuelHistory.reduce((sum, f) => sum + (f.total_fuel_cost || 0), 0),
                totalSpentThisMonth: fuelHistory
                  .filter(f => {
                    const transDate = new Date(f.transaction_date);
                    const now = new Date();
                    return transDate.getMonth() === now.getMonth() && transDate.getFullYear() === now.getFullYear();
                  })
                  .reduce((sum, f) => sum + (f.total_fuel_cost || 0), 0),
                totalGallons: fuelHistory.reduce((sum, f) => sum + (f.gallons || 0), 0),
                averageMPG: fuelHistory.filter(f => f.fuel_economy && f.fuel_economy > 0).length > 0
                  ? fuelHistory.filter(f => f.fuel_economy && f.fuel_economy > 0).reduce((sum, f) => sum + (f.fuel_economy || 0), 0) / fuelHistory.filter(f => f.fuel_economy && f.fuel_economy > 0).length
                  : 0,
                costPerMile: fuelHistory.filter(f => f.distance_driven && f.distance_driven > 0).length > 0
                  ? fuelHistory.reduce((sum, f) => sum + (f.total_fuel_cost || 0), 0) / fuelHistory.reduce((sum, f) => sum + (f.distance_driven || 0), 0)
                  : 0,
                lastFillupDays: fuelHistory.length > 0 
                  ? Math.floor((new Date().getTime() - new Date(fuelHistory[0].transaction_date).getTime()) / (1000 * 60 * 60 * 24))
                  : -1,
                fillupCount: fuelHistory.length,
              }} />

              <VehicleFuelTrendChart data={(() => {
                const last6Months = Array.from({ length: 6 }, (_, i) => {
                  const d = new Date();
                  d.setMonth(d.getMonth() - i);
                  return { month: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), monthKey: `${d.getFullYear()}-${d.getMonth()}` };
                }).reverse();

                return last6Months.map(({ month, monthKey }) => {
                  const monthTransactions = fuelHistory.filter(f => {
                    const transDate = new Date(f.transaction_date);
                    return `${transDate.getFullYear()}-${transDate.getMonth()}` === monthKey;
                  });
                  
                  return {
                    month,
                    amount: monthTransactions.reduce((sum, f) => sum + (f.total_fuel_cost || 0), 0),
                    gallons: monthTransactions.reduce((sum, f) => sum + (f.gallons || 0), 0),
                  };
                });
              })()} />

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Fuel Transaction History</CardTitle>
                    <CardDescription>Complete record of all fill-ups for this vehicle</CardDescription>
                  </div>
  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => navigate(`/fuel?vehicle=${vehicle?.asset_id}`)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View All Fuel Transactions
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate(`/fleet/maintenance?vehicle=${vehicle?.id}`)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      View All Maintenance
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Gallons</TableHead>
                        <TableHead>Price/Gal</TableHead>
                        <TableHead>Total Cost</TableHead>
                        <TableHead>Odometer</TableHead>
                        <TableHead>MPG</TableHead>
                        <TableHead>Receipt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fuelHistory.map((fuel) => (
                        <TableRow key={fuel.id}>
                          <TableCell>{new Date(fuel.transaction_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {fuel.driver_first_name || fuel.driver_last_name
                              ? `${fuel.driver_first_name || ''} ${fuel.driver_last_name || ''}`.trim()
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {fuel.merchant_name
                              ? `${fuel.merchant_name}${fuel.merchant_city ? `, ${fuel.merchant_city}` : ''}${fuel.merchant_state ? `, ${fuel.merchant_state}` : ''}`
                              : '-'}
                          </TableCell>
                          <TableCell>{fuel.gallons ? fuel.gallons.toFixed(2) : '-'}</TableCell>
                          <TableCell>${fuel.price_per_gallon ? fuel.price_per_gallon.toFixed(2) : '0.00'}</TableCell>
                          <TableCell>${fuel.total_fuel_cost ? fuel.total_fuel_cost.toFixed(2) : '0.00'}</TableCell>
                          <TableCell>{(fuel.adjusted_odometer || fuel.current_odometer || 0).toLocaleString()}</TableCell>
                          <TableCell>{fuel.fuel_economy ? fuel.fuel_economy.toFixed(1) : '-'}</TableCell>
                          <TableCell>
                            {fuel.receipt_url ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedReceipt({ url: fuel.receipt_url!, fileName: `Receipt_${fuel.id}` });
                                  setShowReceiptViewer(true);
                                }}
                              >
                                <FileText className="h-4 w-4 text-blue-600" />
                              </Button>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Details</CardTitle>
              <CardDescription>Complete vehicle information and document storage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Vehicle Name</p>
                    <p className="text-lg">{vehicle.vehicle_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Asset ID</p>
                    <p className="text-lg">{vehicle.asset_id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Make</p>
                    <p className="text-lg">{vehicle.make || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Model</p>
                    <p className="text-lg">{vehicle.model || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Year</p>
                    <p className="text-lg">{vehicle.year || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge className="mt-1">{vehicle.status}</Badge>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Registration Expiry</p>
                    <p className="text-lg">
                      {vehicle.registration_expiry_date 
                        ? new Date(vehicle.registration_expiry_date).toLocaleDateString()
                        : 'Not set'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Insurance Policy Number</p>
                    <p className="text-lg">{vehicle.insurance_policy_number || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Insurance Expiry</p>
                    <p className="text-lg">
                      {vehicle.insurance_expiry_date 
                        ? new Date(vehicle.insurance_expiry_date).toLocaleDateString()
                        : 'Not set'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Current Odometer</p>
                    <p className="text-lg font-semibold">{vehicle.current_odometer.toLocaleString()} miles</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cost-summary">
          <VehicleCostSummary
            fuelCost={fuelHistory.reduce((sum, f) => sum + (f.total_fuel_cost || 0), 0)}
            maintenanceCost={maintenanceRecords.reduce((sum, m) => sum + m.cost, 0)}
            monthlyTrend={(() => {
              const last6Months = Array.from({ length: 6 }, (_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                return { 
                  month: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), 
                  monthKey: `${d.getFullYear()}-${d.getMonth()}` 
                };
              }).reverse();

              return last6Months.map(({ month, monthKey }) => {
                const fuelForMonth = fuelHistory
                  .filter(f => {
                    const transDate = new Date(f.transaction_date);
                    return `${transDate.getFullYear()}-${transDate.getMonth()}` === monthKey;
                  })
                  .reduce((sum, f) => sum + (f.total_fuel_cost || 0), 0);

                const maintForMonth = maintenanceRecords
                  .filter(m => {
                    const serviceDate = new Date(m.service_date);
                    return `${serviceDate.getFullYear()}-${serviceDate.getMonth()}` === monthKey;
                  })
                  .reduce((sum, m) => sum + m.cost, 0);
                
                return {
                  month,
                  fuel: fuelForMonth,
                  maintenance: maintForMonth,
                };
              });
            })()}
            totalMiles={fuelHistory.reduce((sum, f) => sum + (f.distance_driven || 0), 0)}
            fleetAvgCostPerMile={0.45}
          />
        </TabsContent>
      </Tabs>

      {/* Add Maintenance Dialog */}
      <AddMaintenanceDialog 
        open={showAddMaintenanceDialog}
        onOpenChange={setShowAddMaintenanceDialog}
        vehicleId={vehicle.id}
        onMaintenanceAdded={fetchVehicleData}
      />

      {/* Receipt Viewer Modal */}
      {selectedReceipt && (
        <ReceiptViewerModal
          open={showReceiptViewer}
          onOpenChange={setShowReceiptViewer}
          receiptUrl={selectedReceipt.url}
          receiptFileName={selectedReceipt.fileName}
        />
      )}

      {/* Maintenance Detail Modal */}
      {selectedMaintenance && (
        <MaintenanceDetailDialog
          open={showMaintenanceDetail}
          onOpenChange={setShowMaintenanceDetail}
          maintenanceId={selectedMaintenance.id}
          maintenanceData={selectedMaintenance}
        />
      )}
    </div>
  );
};

export default VehicleDetail;