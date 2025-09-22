import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  job_title?: string;
  hire_date?: string;
  pay_type?: string;
  pay_rate: number;
  pto_sick_hours_accrued_annually: number;
  pto_vacation_hours_accrued_annually: number;
  status: string;
}

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmployeeAdded: () => void;
  employee?: Employee | null;
}

const AddEmployeeDialog: React.FC<AddEmployeeDialogProps> = ({
  open,
  onOpenChange,
  onEmployeeAdded,
  employee
}) => {
  const [loading, setLoading] = useState(false);
  const [hireDate, setHireDate] = useState<Date>();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    job_title: '',
    pay_type: 'Hourly',
    pay_rate: '',
    pto_sick_hours_accrued_annually: '40',
    pto_vacation_hours_accrued_annually: '80',
    status: 'Active'
  });

  // Update form data when employee prop changes
  useEffect(() => {
    if (employee) {
      setFormData({
        full_name: employee.full_name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        job_title: employee.job_title || '',
        pay_type: employee.pay_type || 'Hourly',
        pay_rate: employee.pay_rate?.toString() || '',
        pto_sick_hours_accrued_annually: employee.pto_sick_hours_accrued_annually?.toString() || '40',
        pto_vacation_hours_accrued_annually: employee.pto_vacation_hours_accrued_annually?.toString() || '80',
        status: employee.status || 'Active'
      });
      setHireDate(employee.hire_date ? new Date(employee.hire_date) : undefined);
    } else {
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        job_title: '',
        pay_type: 'Hourly',
        pay_rate: '',
        pto_sick_hours_accrued_annually: '40',
        pto_vacation_hours_accrued_annually: '80',
        status: 'Active'
      });
      setHireDate(undefined);
    }
  }, [employee, open]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.email || !formData.pay_rate) {
      toast({
        title: "Validation Error",
        description: "Full name, email, and pay rate are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const employeeData = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || null,
        job_title: formData.job_title || null,
        hire_date: hireDate ? format(hireDate, 'yyyy-MM-dd') : null,
        pay_type: formData.pay_type,
        pay_rate: parseFloat(formData.pay_rate),
        pto_sick_hours_accrued_annually: parseInt(formData.pto_sick_hours_accrued_annually),
        pto_vacation_hours_accrued_annually: parseInt(formData.pto_vacation_hours_accrued_annually),
        status: formData.status
      };

      if (employee) {
        // Updating existing employee
        const { error } = await supabase
          .from('employees_enhanced')
          .update(employeeData)
          .eq('id', employee.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Employee updated successfully",
        });
      } else {
        // Adding new employee
        const { error } = await supabase
          .from('employees_enhanced')
          .insert([employeeData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Employee added successfully",
        });
      }

      onOpenChange(false);
      onEmployeeAdded();
    } catch (error) {
      console.error('Error saving employee:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${employee ? 'update' : 'add'} employee`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
          <DialogDescription>
            {employee ? 'Update employee information and payroll settings.' : 'Add a new employee to your staff with payroll information.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal Information */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="john@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                value={formData.job_title}
                onChange={(e) => handleInputChange('job_title', e.target.value)}
                placeholder="e.g., Software Engineer"
              />
            </div>

            <div className="space-y-2">
              <Label>Hire Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !hireDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {hireDate ? format(hireDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={hireDate}
                    onSelect={setHireDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payroll Information */}
            <div className="space-y-2">
              <Label htmlFor="pay_type">Pay Type *</Label>
              <Select 
                value={formData.pay_type} 
                onValueChange={(value) => handleInputChange('pay_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hourly">Hourly</SelectItem>
                  <SelectItem value="Salary">Salary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pay_rate">
                Pay Rate * ({formData.pay_type === 'Hourly' ? 'per hour' : 'annual salary'})
              </Label>
              <Input
                id="pay_rate"
                type="number"
                step="0.01"
                value={formData.pay_rate}
                onChange={(e) => handleInputChange('pay_rate', e.target.value)}
                placeholder={formData.pay_type === 'Hourly' ? "15.00" : "50000"}
                required
              />
            </div>

            {/* PTO Settings */}
            <div className="space-y-2">
              <Label htmlFor="pto_vacation_hours_accrued_annually">Annual Vacation Hours</Label>
              <Input
                id="pto_vacation_hours_accrued_annually"
                type="number"
                value={formData.pto_vacation_hours_accrued_annually}
                onChange={(e) => handleInputChange('pto_vacation_hours_accrued_annually', e.target.value)}
                placeholder="80"
              />
              <p className="text-xs text-muted-foreground">Total vacation hours accrued per year</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pto_sick_hours_accrued_annually">Annual Sick Hours</Label>
              <Input
                id="pto_sick_hours_accrued_annually"
                type="number"
                value={formData.pto_sick_hours_accrued_annually}
                onChange={(e) => handleInputChange('pto_sick_hours_accrued_annually', e.target.value)}
                placeholder="40"
              />
              <p className="text-xs text-muted-foreground">Total sick hours accrued per year</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {employee ? 'Update Employee' : 'Add Employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEmployeeDialog;