import { format } from "date-fns";
import { Car, Calendar, DollarSign, Wrench, FileText, Gauge } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ReviewStepProps {
  formData: any;
  setFormData: (data: any) => void;
}

export const ReviewStep = ({ formData }: ReviewStepProps) => {
  const { data: vehicle } = useQuery({
    queryKey: ['vehicle', formData.vehicle_id],
    queryFn: async () => {
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Review & Submit</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Please review all information before creating the maintenance record
        </p>
      </div>

      {/* Vehicle */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Car className="h-5 w-5 text-primary" />
          <h4 className="font-semibold">Vehicle</h4>
        </div>
        <p className="text-lg">{vehicle?.vehicle_name}</p>
        <p className="text-sm text-muted-foreground">
          {vehicle?.make} {vehicle?.model} {vehicle?.year}
        </p>
      </div>

      {/* Service Details */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Wrench className="h-5 w-5 text-primary" />
          <h4 className="font-semibold">Service Details</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Service Date</p>
            <p className="font-medium">{format(new Date(formData.service_date), 'MMM dd, yyyy')}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Provider</p>
            <p className="font-medium">{formData.provider}</p>
          </div>
          {formData.odometer && (
            <div>
              <p className="text-sm text-muted-foreground">Odometer</p>
              <p className="font-medium">{formData.odometer.toLocaleString()} miles</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Total Cost</p>
            <p className="font-medium text-lg">${formData.cost.toFixed(2)}</p>
          </div>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground mb-1">Description</p>
          <p className="text-sm bg-gray-50 p-2 rounded">{formData.description}</p>
        </div>
        
        {formData.notes && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Notes</p>
            <p className="text-sm bg-gray-50 p-2 rounded">{formData.notes}</p>
          </div>
        )}
      </div>

      {/* Line Items */}
      {formData.line_items.length > 0 && (
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold mb-3">Line Items ({formData.line_items.length})</h4>
          <div className="space-y-2">
            {formData.line_items.map((item: any, index: number) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.description} (x{item.quantity})</span>
                <span className="font-medium">${(item.quantity * item.unit_price).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Receipt */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-5 w-5 text-primary" />
          <h4 className="font-semibold">Receipt</h4>
        </div>
        {formData.receipt_file ? (
          <div className="flex items-center gap-2 text-green-600">
            <FileText className="h-5 w-5" />
            <span>{formData.receipt_file.name}</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No receipt uploaded</p>
        )}
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          ✓ All required information has been provided. Click "Create Record" to save this maintenance entry.
        </p>
      </div>
    </div>
  );
};
