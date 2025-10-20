import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MaintenanceFormData } from "../AddMaintenanceWizard";

interface ServiceDetailsStepProps {
  formData: MaintenanceFormData;
  setFormData: (data: MaintenanceFormData) => void;
}

export const ServiceDetailsStep = ({ formData, setFormData }: ServiceDetailsStepProps) => {
  const { data: vendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, vendor_name')
        .order('vendor_name');
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Service Details</h3>
        <p className="text-sm text-muted-foreground">Enter the maintenance service information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="service_date">Service Date *</Label>
          <Input
            id="service_date"
            type="date"
            value={formData.service_date}
            onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
            max={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="odometer">Odometer Reading</Label>
          <Input
            id="odometer"
            type="number"
            value={formData.odometer_at_service || ''}
            onChange={(e) => setFormData({ ...formData, odometer_at_service: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="Current mileage"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="provider">Service Provider</Label>
          <Select
            value={formData.service_provider_vendor_id}
            onValueChange={(value) => setFormData({ ...formData, service_provider_vendor_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select vendor" />
            </SelectTrigger>
            <SelectContent>
              {vendors?.map((vendor) => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  {vendor.vendor_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Optional - Select from existing vendors</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost">Total Cost *</Label>
          <Input
            id="cost"
            type="number"
            step="0.01"
            min="0"
            value={formData.cost || ''}
            onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Service Description *</Label>
        <Textarea
          id="description"
          value={formData.service_description}
          onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
          placeholder="Describe the maintenance work performed (e.g., Oil change, tire rotation, brake pad replacement)"
          rows={4}
          required
        />
        <p className="text-xs text-muted-foreground">Be specific about what work was done</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Any additional information, warranty details, or follow-up items..."
          rows={3}
        />
      </div>
    </div>
  );
};
