import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Stipend {
  id: string;
  description: string;
  amount: number;
  frequency: string;
  is_active: boolean;
}

interface AddStipendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStipendAdded: () => void;
  employeeId: string;
  stipend?: Stipend | null;
}

const AddStipendDialog: React.FC<AddStipendDialogProps> = ({
  open,
  onOpenChange,
  onStipendAdded,
  employeeId,
  stipend
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    frequency: 'Monthly'
  });

  useEffect(() => {
    if (stipend) {
      setFormData({
        description: stipend.description || '',
        amount: stipend.amount?.toString() || '',
        frequency: stipend.frequency || 'Monthly'
      });
    } else {
      setFormData({
        description: '',
        amount: '',
        frequency: 'Monthly'
      });
    }
  }, [stipend, open]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount) {
      toast({
        title: "Validation Error",
        description: "Description and amount are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const stipendData = {
        employee_id: employeeId,
        description: formData.description,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
        is_active: true
      };

      if (stipend) {
        // Updating existing stipend
        const { error } = await supabase
          .from('stipends')
          .update(stipendData)
          .eq('id', stipend.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Stipend updated successfully",
        });
      } else {
        // Adding new stipend
        const { error } = await supabase
          .from('stipends')
          .insert([stipendData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Stipend added successfully",
        });
      }

      onOpenChange(false);
      onStipendAdded();
    } catch (error) {
      console.error('Error saving stipend:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${stipend ? 'update' : 'add'} stipend`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{stipend ? 'Edit Stipend' : 'Add New Stipend'}</DialogTitle>
          <DialogDescription>
            {stipend ? 'Update stipend information.' : 'Add a recurring payment stipend for this employee.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="e.g., Monthly Phone Stipend"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="100.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select 
              value={formData.frequency} 
              onValueChange={(value) => handleInputChange('frequency', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Weekly">Weekly</SelectItem>
                <SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem>
                <SelectItem value="Monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {stipend ? 'Update Stipend' : 'Add Stipend'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddStipendDialog;