import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Truck, AlertTriangle, Calendar, Shield, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import AddVehicleDialog from "@/components/AddVehicleDialog";
import { toast } from "@/hooks/use-toast";

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
  insurance_expiry_date?: string;
  status: string;
  created_at: string;
}

const Fleet: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast({
        title: "Error",
        description: "Failed to load vehicles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getUpcomingExpirations = () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const upcomingRegistrations = vehicles.filter(vehicle => {
      if (!vehicle.registration_expiry_date) return false;
      const expiryDate = new Date(vehicle.registration_expiry_date);
      return expiryDate <= thirtyDaysFromNow && expiryDate >= now;
    });

    const upcomingInsurance = vehicles.filter(vehicle => {
      if (!vehicle.insurance_expiry_date) return false;
      const expiryDate = new Date(vehicle.insurance_expiry_date);
      return expiryDate <= thirtyDaysFromNow && expiryDate >= now;
    });

    return { upcomingRegistrations, upcomingInsurance };
  };

  const getVehiclesNeedingAttention = () => {
    const { upcomingRegistrations, upcomingInsurance } = getUpcomingExpirations();
    const uniqueVehicles = new Set([
      ...upcomingRegistrations.map(v => v.id),
      ...upcomingInsurance.map(v => v.id)
    ]);
    return uniqueVehicles.size;
  };

  const handleVehicleClick = (vehicleId: string) => {
    navigate(`/fleet/${vehicleId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'In Shop':
        return 'bg-yellow-100 text-yellow-800';
      case 'Sold':
        return 'bg-gray-100 text-gray-800';
      case 'Inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const { upcomingRegistrations, upcomingInsurance } = getUpcomingExpirations();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fleet Management</h1>
          <p className="text-muted-foreground">Manage all company vehicles and maintenance records</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active Vehicles</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.filter(v => v.status === 'Active').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vehicles Needing Attention</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{getVehiclesNeedingAttention()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registration Due (30 Days)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{upcomingRegistrations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insurance Renewals (30 Days)</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{upcomingInsurance.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle List */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Inventory</CardTitle>
          <CardDescription>Click on any vehicle to view detailed information and maintenance history</CardDescription>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No vehicles added yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Get started by adding your first vehicle to the fleet</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle Name</TableHead>
                  <TableHead>Asset ID</TableHead>
                  <TableHead>Make/Model/Year</TableHead>
                  <TableHead>Current Odometer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registration Expiry</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((vehicle) => {
                  const regExpiring = vehicle.registration_expiry_date && 
                    new Date(vehicle.registration_expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                  const insExpiring = vehicle.insurance_expiry_date && 
                    new Date(vehicle.insurance_expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                  return (
                    <TableRow key={vehicle.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell 
                        className="font-medium"
                        onClick={() => handleVehicleClick(vehicle.id)}
                      >
                        <div className="flex items-center gap-2">
                          {vehicle.vehicle_name}
                          {(regExpiring || insExpiring) && (
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell onClick={() => handleVehicleClick(vehicle.id)}>
                        {vehicle.asset_id}
                      </TableCell>
                      <TableCell onClick={() => handleVehicleClick(vehicle.id)}>
                        {vehicle.make && vehicle.model && vehicle.year 
                          ? `${vehicle.make} ${vehicle.model} ${vehicle.year}`
                          : 'Not specified'
                        }
                      </TableCell>
                      <TableCell onClick={() => handleVehicleClick(vehicle.id)}>
                        {vehicle.current_odometer.toLocaleString()} miles
                      </TableCell>
                      <TableCell onClick={() => handleVehicleClick(vehicle.id)}>
                        <Badge className={getStatusColor(vehicle.status)}>
                          {vehicle.status}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={() => handleVehicleClick(vehicle.id)}>
                        {vehicle.registration_expiry_date ? (
                          <span className={regExpiring ? "text-yellow-600 font-medium" : ""}>
                            {new Date(vehicle.registration_expiry_date).toLocaleDateString()}
                          </span>
                        ) : (
                          'Not set'
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleVehicleClick(vehicle.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Vehicle Dialog */}
      <AddVehicleDialog 
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onVehicleAdded={fetchVehicles}
      />
    </div>
  );
};

export default Fleet;