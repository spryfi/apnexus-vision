import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Car, Loader2 } from "lucide-react";

interface VehicleSelectionStepProps {
  formData: any;
  setFormData: (data: any) => void;
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
      </div>
    );
  }


  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Vehicle</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose the vehicle that received maintenance service
        </p>
      </div>

      <RadioGroup
        value={formData.vehicle_id}
        onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {vehicles?.map(vehicle => (
            <div key={vehicle.id} className="relative">
              <RadioGroupItem
                value={vehicle.id}
                id={vehicle.id}
                className="peer sr-only"
              />
              <Label
                htmlFor={vehicle.id}
                className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-gray-50"
              >
                <Car className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-semibold">{vehicle.vehicle_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.make} {vehicle.model} {vehicle.year}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Current: {vehicle.current_odometer?.toLocaleString() || 'N/A'} miles
                  </p>
                </div>
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>

      {vehicles && vehicles.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No active vehicles found. Please add a vehicle first.</p>
        </div>
      )}
    </div>
  );
};
