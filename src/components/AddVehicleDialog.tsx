import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Vehicle {
  id: string;
  current_odometer: number;
  vehicle_name: string;
  asset_id: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  license_plate?: string;
  registration_expiry_date?: string;
  insurance_policy_number?: string;
  insurance_expiry_date?: string;
  status: string;
}

interface AddVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVehicleAdded: () => void;
  vehicle?: Vehicle | null; // For editing existing vehicle
}

const AddVehicleDialog: React.FC<AddVehicleDialogProps> = ({
  open,
  onOpenChange,
  onVehicleAdded,
  vehicle
}) => {
  const [loading, setLoading] = useState(false);
  const [odometerError, setOdometerError] = useState<string>('');
  const [formData, setFormData] = useState({
    vehicle_name: vehicle?.vehicle_name || '',
    asset_id: vehicle?.asset_id || '',
    make: vehicle?.make || '',
    model: vehicle?.model || '',
    year: vehicle?.year?.toString() || '',
    vin: vehicle?.vin || '',
    license_plate: vehicle?.license_plate || '',
    current_odometer: vehicle?.current_odometer?.toString() || '',
    registration_expiry_date: vehicle?.registration_expiry_date || '',
    insurance_policy_number: vehicle?.insurance_policy_number || '',
    insurance_expiry_date: vehicle?.insurance_expiry_date || '',
    status: vehicle?.status || 'Active'
  });

  // Update form data when vehicle prop changes
  React.useEffect(() => {
    if (vehicle) {
      setFormData({
        vehicle_name: vehicle.vehicle_name || '',
        asset_id: vehicle.asset_id || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year?.toString() || '',
        vin: vehicle.vin || '',
        license_plate: vehicle.license_plate || '',
        current_odometer: vehicle.current_odometer?.toString() || '',
        registration_expiry_date: vehicle.registration_expiry_date || '',
        insurance_policy_number: vehicle.insurance_policy_number || '',
        insurance_expiry_date: vehicle.insurance_expiry_date || '',
        status: vehicle.status || 'Active'
      });
    } else {
      setFormData({
        vehicle_name: '',
        asset_id: '',
        make: '',
        model: '',
        year: '',
        vin: '',
        license_plate: '',
        current_odometer: '',
        registration_expiry_date: '',
        insurance_policy_number: '',
        insurance_expiry_date: '',
        status: 'Active'
      });
    }
    setOdometerError('');
  }, [vehicle, open]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear odometer error when user changes the value
    if (field === 'current_odometer') {
      setOdometerError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.vehicle_name || !formData.asset_id || !formData.current_odometer) {
      toast({
        title: "Validation Error",
        description: "Vehicle name, Asset ID, and Current Odometer Reading are required",
        variant: "destructive",
      });
      return;
    }

    const newOdometerValue = parseInt(formData.current_odometer);
    
    // Validation for editing: new odometer cannot be lower than current
    if (vehicle && newOdometerValue < vehicle.current_odometer) {
      setOdometerError(`⚠️ Error: The new odometer reading cannot be lower than the current recorded value of ${vehicle.current_odometer.toLocaleString()}.`);
      return;
    }

    setLoading(true);

    try {
      const vehicleData = {
        vehicle_name: formData.vehicle_name,
        asset_id: formData.asset_id,
        make: formData.make || null,
        model: formData.model || null,
        year: formData.year ? parseInt(formData.year) : null,
        vin: formData.vin || null,
        license_plate: formData.license_plate || null,
        current_odometer: newOdometerValue,
        registration_expiry_date: formData.registration_expiry_date || null,
        insurance_policy_number: formData.insurance_policy_number || null,
        insurance_expiry_date: formData.insurance_expiry_date || null,
        status: formData.status
      };

      if (vehicle) {
        // Updating existing vehicle
        const { error } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', vehicle.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Vehicle updated successfully",
        });
      } else {
        // Adding new vehicle
        const { error } = await supabase
          .from('vehicles')
          .insert([vehicleData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Vehicle added successfully",
        });
      }

      onOpenChange(false);
      onVehicleAdded();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${vehicle ? 'update' : 'add'} vehicle`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
          <DialogDescription>
            {vehicle ? 'Update vehicle information. All fields marked with * are required.' : 'Add a new vehicle to your fleet. All fields marked with * are required.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Required Fields */}
            <div className="space-y-2">
              <Label htmlFor="vehicle_name">Vehicle Name *</Label>
              <Input
                id="vehicle_name"
                value={formData.vehicle_name}
                onChange={(e) => handleInputChange('vehicle_name', e.target.value)}
                placeholder="e.g., F-150 Truck #3"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="asset_id">Asset ID *</Label>
              <Input
                id="asset_id"
                value={formData.asset_id}
                onChange={(e) => handleInputChange('asset_id', e.target.value)}
                placeholder="e.g., 2021Ram"
                required
              />
            </div>

            {/* Vehicle Details */}
            <div className="space-y-2">
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                value={formData.make}
                onChange={(e) => handleInputChange('make', e.target.value)}
                placeholder="e.g., Ford"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                placeholder="e.g., F-150"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select onValueChange={(value) => handleInputChange('year', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vin">VIN</Label>
              <Input
                id="vin"
                value={formData.vin}
                onChange={(e) => handleInputChange('vin', e.target.value)}
                placeholder="Vehicle Identification Number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_plate">License Plate</Label>
              <Input
                id="license_plate"
                value={formData.license_plate}
                onChange={(e) => handleInputChange('license_plate', e.target.value)}
                placeholder="License plate number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_odometer">Current Odometer Reading *</Label>
              <Input
                id="current_odometer"
                type="number"
                value={formData.current_odometer}
                onChange={(e) => handleInputChange('current_odometer', e.target.value)}
                placeholder="Current mileage"
                required
                className={odometerError ? "border-destructive" : ""}
              />
              {odometerError && (
                <p className="text-sm text-destructive mt-1">{odometerError}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Enter the current mileage from the vehicle's dashboard. This is the baseline for all tracking.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration_expiry_date">Registration Expiry Date</Label>
              <Input
                id="registration_expiry_date"
                type="date"
                value={formData.registration_expiry_date}
                onChange={(e) => handleInputChange('registration_expiry_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insurance_policy_number">Insurance Policy Number</Label>
              <Input
                id="insurance_policy_number"
                value={formData.insurance_policy_number}
                onChange={(e) => handleInputChange('insurance_policy_number', e.target.value)}
                placeholder="Insurance policy number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insurance_expiry_date">Insurance Expiry Date</Label>
              <Input
                id="insurance_expiry_date"
                type="date"
                value={formData.insurance_expiry_date}
                onChange={(e) => handleInputChange('insurance_expiry_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="In Shop">In Shop</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Sold">Sold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !!odometerError}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {vehicle ? 'Update Vehicle' : 'Add Vehicle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddVehicleDialog;