import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface LogTimeOffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTimeOffLogged: () => void;
  employeeId: string;
  employeeName: string;
}

const LogTimeOffDialog: React.FC<LogTimeOffDialogProps> = ({
  open,
  onOpenChange,
  onTimeOffLogged,
  employeeId,
  employeeName
}) => {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [formData, setFormData] = useState({
    leave_type: 'Vacation',
    hours_used: '',
    notes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateBusinessDays = (start: Date, end: Date): number => {
    let count = 0;
    let current = new Date(start);
    
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return count;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate || !formData.hours_used) {
      toast({
        title: "Validation Error",
        description: "Start date, end date, and hours used are required",
        variant: "destructive",
      });
      return;
    }

    if (startDate > endDate) {
      toast({
        title: "Validation Error",
        description: "Start date cannot be after end date",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const timeOffData = {
        employee_id: employeeId,
        leave_type: formData.leave_type,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        hours_used: parseFloat(formData.hours_used),
        notes: formData.notes || null
      };

      const { error } = await supabase
        .from('time_off_records')
        .insert([timeOffData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Time off logged successfully",
      });

      // Reset form
      setStartDate(undefined);
      setEndDate(undefined);
      setFormData({
        leave_type: 'Vacation',
        hours_used: '',
        notes: ''
      });

      onOpenChange(false);
      onTimeOffLogged();
    } catch (error) {
      console.error('Error logging time off:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to log time off",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-calculate hours based on business days
  React.useEffect(() => {
    if (startDate && endDate && !formData.hours_used) {
      const businessDays = calculateBusinessDays(startDate, endDate);
      const suggestedHours = businessDays * 8; // Assuming 8-hour workdays
      setFormData(prev => ({
        ...prev,
        hours_used: suggestedHours.toString()
      }));
    }
  }, [startDate, endDate, formData.hours_used]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log Time Off</DialogTitle>
          <DialogDescription>
            Log time off for {employeeName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Leave Type</Label>
            <Select 
              value={formData.leave_type} 
              onValueChange={(value) => handleInputChange('leave_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Vacation">Vacation</SelectItem>
                <SelectItem value="Sick">Sick</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Start Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pick start date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>End Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>Pick end date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours_used">Total Hours Used *</Label>
            <Input
              id="hours_used"
              type="number"
              step="0.5"
              value={formData.hours_used}
              onChange={(e) => handleInputChange('hours_used', e.target.value)}
              placeholder="8"
              required
            />
            {startDate && endDate && (
              <p className="text-xs text-muted-foreground">
                Suggested: {calculateBusinessDays(startDate, endDate) * 8} hours 
                ({calculateBusinessDays(startDate, endDate)} business days × 8 hours)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about this time off..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log Time Off
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LogTimeOffDialog;