import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, DollarSign, Gauge, Wrench } from "lucide-react";

interface ServiceDetailsStepProps {
  formData: any;
  setFormData: (data: any) => void;
}

export const ServiceDetailsStep = ({ formData, setFormData }: ServiceDetailsStepProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Service Details</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Enter the basic information about the maintenance service
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Service Date */}
        <div>
          <Label htmlFor="service_date" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Service Date <span className="text-red-500">*</span>
          </Label>
          <Input
            id="service_date"
            type="date"
            value={formData.service_date}
            onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
            max={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        {/* Odometer */}
        <div>
          <Label htmlFor="odometer" className="flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Odometer Reading
          </Label>
          <Input
            id="odometer"
            type="number"
            placeholder="156932"
            value={formData.odometer || ''}
            onChange={(e) => setFormData({ ...formData, odometer: e.target.value ? parseInt(e.target.value) : null })}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Miles at time of service
          </p>
        </div>
      </div>

      {/* Provider */}
      <div>
        <Label htmlFor="provider" className="flex items-center gap-2">
          <Wrench className="h-4 w-4" />
          Service Provider / Shop <span className="text-red-500">*</span>
        </Label>
        <Input
          id="provider"
          placeholder="e.g., Mavericks Auto Shop, South Point Dealership"
          value={formData.provider}
          onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
          required
        />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">
          Service Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="e.g., Oil change, tire rotation, brake pad replacement..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Brief description of work performed
        </p>
      </div>

      {/* Total Cost */}
      <div>
        <Label htmlFor="cost" className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Total Cost <span className="text-red-500">*</span>
        </Label>
        <Input
          id="cost"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={formData.cost || ''}
          onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Total amount paid for service
        </p>
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Additional Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any additional information, warranty details, or special notes..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  );
};
