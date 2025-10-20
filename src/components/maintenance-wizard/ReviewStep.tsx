import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileCheck, FileX, Calendar, DollarSign, Truck, Wrench, FileText } from "lucide-react";
import { format } from "date-fns";
import { MaintenanceFormData } from "../AddMaintenanceWizard";

interface ReviewStepProps {
  formData: MaintenanceFormData;
  setFormData: (data: MaintenanceFormData) => void;
}

export const ReviewStep = ({ formData, setFormData }: ReviewStepProps) => {
  const { data: vehicle } = useQuery({
    queryKey: ['vehicle', formData.vehicle_id],
    queryFn: async () => {
      if (!formData.vehicle_id) return null;
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', formData.vehicle_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!formData.vehicle_id
  });

  const { data: vendor } = useQuery({
    queryKey: ['vendor', formData.service_provider_vendor_id],
    queryFn: async () => {
      if (!formData.service_provider_vendor_id) return null;
      const { data, error } = await supabase
        .from('vendors')
        .select('vendor_name')
        .eq('id', formData.service_provider_vendor_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!formData.service_provider_vendor_id
  });

  const lineItemsTotal = formData.line_items.reduce((sum, item) => sum + item.total_price, 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Review & Submit</h3>
        <p className="text-sm text-muted-foreground">
          Please review all information before submitting
        </p>
      </div>

      {/* Vehicle Information */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <Truck className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold mb-1">Vehicle</h4>
            {vehicle && (
              <>
                <p className="font-medium">{vehicle.vehicle_name}</p>
                <p className="text-sm text-muted-foreground">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </p>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Service Details */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <Wrench className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1 space-y-3">
            <h4 className="font-semibold">Service Details</h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Service Date</p>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(formData.service_date), 'MMM dd, yyyy')}
                </p>
              </div>

              {formData.odometer_at_service && (
                <div>
                  <p className="text-muted-foreground">Odometer</p>
                  <p className="font-medium">{formData.odometer_at_service.toLocaleString()} miles</p>
                </div>
              )}

              {vendor && (
                <div>
                  <p className="text-muted-foreground">Service Provider</p>
                  <p className="font-medium">{vendor.vendor_name}</p>
                </div>
              )}

              <div>
                <p className="text-muted-foreground">Total Cost</p>
                <p className="font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  ${formData.cost.toFixed(2)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground text-sm mb-1">Description</p>
              <p className="text-sm bg-muted p-2 rounded">{formData.service_description}</p>
            </div>

            {formData.notes && (
              <div>
                <p className="text-muted-foreground text-sm mb-1">Notes</p>
                <p className="text-sm bg-muted p-2 rounded">{formData.notes}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Line Items */}
      {formData.line_items.length > 0 && (
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1 space-y-3">
              <h4 className="font-semibold">Line Items ({formData.line_items.length})</h4>
              
              <div className="space-y-2">
                {formData.line_items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm p-2 bg-muted rounded">
                    <div>
                      <p className="font-medium">{item.description}</p>
                      {item.part_number && (
                        <p className="text-xs text-muted-foreground">Part: {item.part_number}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${item.total_price.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × ${item.unit_price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2 border-t font-semibold">
                <span>Total:</span>
                <span>${lineItemsTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Receipt Status */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          {formData.receipt_file || formData.receipt_url ? (
            <FileCheck className="h-5 w-5 text-green-600 mt-0.5" />
          ) : (
            <FileX className="h-5 w-5 text-red-600 mt-0.5" />
          )}
          <div className="flex-1">
            <h4 className="font-semibold mb-1">Receipt</h4>
            {formData.receipt_file ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  ✓ Uploaded
                </Badge>
                <p className="text-sm text-muted-foreground">{formData.receipt_file.name}</p>
              </div>
            ) : formData.receipt_url ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  ✓ URL Provided
                </Badge>
                <p className="text-sm text-muted-foreground truncate max-w-md">{formData.receipt_url}</p>
              </div>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                ⚠ Missing
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Summary */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Ready to submit:</strong> All required information has been provided. 
          Click "Create Record" to save this maintenance record.
        </p>
      </div>
    </div>
  );
};
