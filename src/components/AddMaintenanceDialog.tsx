import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AddMaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  onMaintenanceAdded: () => void;
}

interface Vendor {
  id: string;
  vendor_name: string;
}

const AddMaintenanceDialog: React.FC<AddMaintenanceDialogProps> = ({
  open,
  onOpenChange,
  vehicleId,
  onMaintenanceAdded
}) => {
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [formData, setFormData] = useState({
    service_date: '',
    service_provider_vendor_id: '',
    service_description: '',
    cost: '',
    odometer_at_service: '',
    receipt_scan_url: ''
  });

  useEffect(() => {
    if (open) {
      fetchVendors();
      // Set default date to today
      setFormData(prev => ({
        ...prev,
        service_date: new Date().toISOString().split('T')[0]
      }));
    }
  }, [open]);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, vendor_name')
        .order('vendor_name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.service_date || !formData.service_description || !formData.cost || !formData.odometer_at_service) {
      toast({
        title: "Validation Error",
        description: "Service date, description, cost, and odometer reading are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const maintenanceData = {
        vehicle_id: vehicleId,
        service_date: formData.service_date,
        service_provider_vendor_id: formData.service_provider_vendor_id || null,
        service_description: formData.service_description,
        cost: parseFloat(formData.cost),
        odometer_at_service: parseInt(formData.odometer_at_service),
        receipt_scan_url: formData.receipt_scan_url || null
      };

      const { error } = await supabase
        .from('maintenance_records')
        .insert([maintenanceData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Maintenance record added successfully",
      });

      // Reset form
      setFormData({
        service_date: new Date().toISOString().split('T')[0],
        service_provider_vendor_id: '',
        service_description: '',
        cost: '',
        odometer_at_service: '',
        receipt_scan_url: ''
      });

      onOpenChange(false);
      onMaintenanceAdded();
    } catch (error) {
      console.error('Error adding maintenance record:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add maintenance record",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Maintenance Record</DialogTitle>
          <DialogDescription>
            Record a new maintenance or service event for this vehicle.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service_date">Service Date *</Label>
              <Input
                id="service_date"
                type="date"
                value={formData.service_date}
                onChange={(e) => handleInputChange('service_date', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_provider">Service Provider</Label>
              <Select onValueChange={(value) => handleInputChange('service_provider_vendor_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map(vendor => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.vendor_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Cost *</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => handleInputChange('cost', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="odometer_at_service">Odometer Reading *</Label>
              <Input
                id="odometer_at_service"
                type="number"
                value={formData.odometer_at_service}
                onChange={(e) => handleInputChange('odometer_at_service', e.target.value)}
                placeholder="Current mileage"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_description">Service Description *</Label>
            <Textarea
              id="service_description"
              value={formData.service_description}
              onChange={(e) => handleInputChange('service_description', e.target.value)}
              placeholder="Describe the maintenance or repair work performed..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receipt_scan_url">Receipt URL</Label>
            <Input
              id="receipt_scan_url"
              type="url"
              value={formData.receipt_scan_url}
              onChange={(e) => handleInputChange('receipt_scan_url', e.target.value)}
              placeholder="Link to receipt scan or image"
            />
            <p className="text-xs text-muted-foreground">
              Upload your receipt to a cloud service and paste the link here
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Maintenance Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMaintenanceDialog;