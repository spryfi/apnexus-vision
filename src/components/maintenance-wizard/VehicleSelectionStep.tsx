import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { Truck, Loader2 } from "lucide-react";
import { MaintenanceFormData } from "../AddMaintenanceWizard";

interface VehicleSelectionStepProps {
  formData: MaintenanceFormData;
  setFormData: (data: MaintenanceFormData) => void;
}

export const VehicleSelectionStep = ({ formData, setFormData }: VehicleSelectionStepProps) => {
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['vehicles-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'Active')
        .order('vehicle_name');
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading vehicles...</span>
      </div>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="text-center py-12">
        <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-semibold text-lg mb-1">No vehicles found</h3>
        <p className="text-muted-foreground">Please add a vehicle before creating maintenance records.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Vehicle</h3>
        <p className="text-sm text-muted-foreground">Choose which vehicle this maintenance record is for</p>
      </div>

      <RadioGroup
        value={formData.vehicle_id}
        onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {vehicles.map((vehicle) => (
            <Card
              key={vehicle.id}
              className={`p-4 cursor-pointer transition-all ${
                formData.vehicle_id === vehicle.id
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-primary/50'
              }`}
              onClick={() => setFormData({ ...formData, vehicle_id: vehicle.id })}
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem value={vehicle.id} id={vehicle.id} className="mt-1" />
                <Label htmlFor={vehicle.id} className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <Truck className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{vehicle.vehicle_name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    VIN: {vehicle.vin || 'N/A'} • {vehicle.current_odometer?.toLocaleString() || '0'} miles
                  </p>
                </Label>
              </div>
            </Card>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
};
