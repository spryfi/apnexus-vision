import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VehicleSelectionStep } from "./maintenance-wizard/VehicleSelectionStep";
import { ServiceDetailsStep } from "./maintenance-wizard/ServiceDetailsStep";
import { LineItemsStep } from "./maintenance-wizard/LineItemsStep";
import { ReceiptUploadStep } from "./maintenance-wizard/ReceiptUploadStep";
import { ReviewStep } from "./maintenance-wizard/ReviewStep";

interface AddMaintenanceWizardProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedVehicleId?: string;
}

interface LineItem {
  description: string;
  part_number?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface MaintenanceFormData {
  vehicle_id: string;
  service_date: string;
  odometer: number | null;
  provider: string;
  description: string;
  cost: number;
  notes: string;
  line_items: LineItem[];
  receipt_file: File | null;
  receipt_url: string;
  totals_mismatch_acknowledged: boolean;
}

export const AddMaintenanceWizard = ({ isOpen, onClose, preselectedVehicleId }: AddMaintenanceWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<MaintenanceFormData>({
    vehicle_id: preselectedVehicleId || '',
    service_date: new Date().toISOString().split('T')[0],
    odometer: null,
    provider: '',
    description: '',
    cost: 0,
    notes: '',
    line_items: [],
    receipt_file: null,
    receipt_url: '',
    totals_mismatch_acknowledged: false
  });

  const queryClient = useQueryClient();

  const steps = [
    { number: 1, title: 'Select Vehicle', component: VehicleSelectionStep },
    { number: 2, title: 'Service Details', component: ServiceDetailsStep },
    { number: 3, title: 'Line Items', component: LineItemsStep },
    { number: 4, title: 'Upload Receipt', component: ReceiptUploadStep },
    { number: 5, title: 'Review & Submit', component: ReviewStep }
  ];

  const progress = (currentStep / steps.length) * 100;

  const createMaintenanceMutation = useMutation({
    mutationFn: async (data: MaintenanceFormData) => {
      // Upload receipt first if provided
      let receiptUrl = data.receipt_url;
      
      if (data.receipt_file) {
        const fileExt = data.receipt_file.name.split('.').pop();
        const fileName = `${data.vehicle_id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('vehicle-documents')
          .upload(filePath, data.receipt_file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('vehicle-documents')
          .getPublicUrl(filePath);

        receiptUrl = publicUrl;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Check if line items total mismatches service cost
      const lineItemsTotal = data.line_items.reduce(
        (sum, item) => sum + (item.quantity * item.unit_price), 
        0
      );
      const hasTotalsMismatch = data.line_items.length > 0 && Math.abs(lineItemsTotal - data.cost) > 0.01;

      // Create maintenance record with flag if totals don't match
      const { data: maintenanceRecord, error: maintenanceError } = await supabase
        .from('maintenance_records')
        .insert({
          vehicle_id: data.vehicle_id,
          service_date: data.service_date,
          odometer_at_service: data.odometer,
          service_provider_vendor_id: null, // Using text provider field instead
          service_description: data.description,
          service_summary: `${data.provider}: ${data.description}`,
          cost: data.cost,
          receipt_scan_url: receiptUrl,
          status: 'Completed',
          flagged_for_review: hasTotalsMismatch,
          flag_reason: hasTotalsMismatch ? `Line items total ($${lineItemsTotal.toFixed(2)}) differs from service cost ($${data.cost.toFixed(2)})` : null
        })
        .select()
        .single();

      if (maintenanceError) throw maintenanceError;

      // Create line items if any
      if (data.line_items.length > 0) {
        const lineItemsToInsert = data.line_items.map(item => ({
          maintenance_record_id: maintenanceRecord.id,
          description: item.description,
          part_number: item.part_number,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }));

        const { error: lineItemsError } = await supabase
          .from('maintenance_line_items')
          .insert(lineItemsToInsert);

        if (lineItemsError) throw lineItemsError;
      }

      return maintenanceRecord;
    },
    onSuccess: () => {
      toast.success('Maintenance record created successfully!');
      queryClient.invalidateQueries({ queryKey: ['maintenance-records'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-all'] });
      handleClose();
    },
    onError: (error) => {
      console.error('Error creating maintenance record:', error);
      toast.error('Failed to create maintenance record. Please try again.');
    }
  });

  const handleClose = () => {
    setCurrentStep(1);
    setFormData({
      vehicle_id: preselectedVehicleId || '',
      service_date: new Date().toISOString().split('T')[0],
      odometer: null,
      provider: '',
      description: '',
      cost: 0,
      notes: '',
      line_items: [],
      receipt_file: null,
      receipt_url: '',
      totals_mismatch_acknowledged: false
    });
    onClose();
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    if (validateCurrentStep()) {
      createMaintenanceMutation.mutate(formData);
    }
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        // Step 1: Vehicle Selection
        if (!formData.vehicle_id) {
          toast.error('Please select a vehicle');
          return false;
        }
        return true;
      
      case 2:
        // Step 2: Service Details - All fields required
        if (!formData.service_date) {
          toast.error('Service date is required');
          return false;
        }
        if (!formData.provider || formData.provider.trim() === '') {
          toast.error('Service provider is required');
          return false;
        }
        if (!formData.description || formData.description.trim() === '') {
          toast.error('Service description is required');
          return false;
        }
        if (!formData.cost || formData.cost <= 0) {
          toast.error('Cost must be greater than zero');
          return false;
        }
        return true;
      
      case 3:
        // Step 3: Line items are optional - no blocking validation for totals mismatch
        // The record will be flagged for review if totals don't match
        return true;
      
      case 4:
        // Step 4: Receipt upload is REQUIRED
        if (!formData.receipt_file && !formData.receipt_url) {
          toast.error('Receipt upload is required for audit compliance');
          return false;
        }
        return true;
      
      case 5:
        // Step 5: Final validation before submission
        if (!formData.vehicle_id) {
          toast.error('Vehicle selection is missing');
          return false;
        }
        if (!formData.provider || !formData.description || formData.cost <= 0) {
          toast.error('Please complete all required service details');
          return false;
        }
        if (!formData.receipt_file && !formData.receipt_url) {
          toast.error('Receipt is required');
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add Maintenance Record</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
          </p>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            {steps.map(step => (
              <div
                key={step.number}
                className={`flex items-center gap-1 ${
                  step.number === currentStep ? 'text-primary font-semibold' :
                  step.number < currentStep ? 'text-green-600' : ''
                }`}
              >
                {step.number < currentStep ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <span>{step.number}</span>
                )}
                <span className="hidden md:inline">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="py-6">
          <CurrentStepComponent
            formData={formData}
            setFormData={setFormData}
          />
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? handleClose : handleBack}
          >
            {currentStep === 1 ? (
              'Cancel'
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </>
            )}
          </Button>

          {currentStep < steps.length ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createMaintenanceMutation.isPending}
            >
              {createMaintenanceMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Create Record
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
