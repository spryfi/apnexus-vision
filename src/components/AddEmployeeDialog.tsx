import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  department?: string;
  employment_status?: string;
  hire_date?: string;
  pay_type?: string;
  pay_rate: number;
  pto_sick_hours_accrued_annually: number;
  pto_vacation_hours_accrued_annually: number;
  vacation_days_allocated?: number;
  sick_days_allocated?: number;
  personal_days_allocated?: number;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  address?: string;
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
    department: '',
    employment_status: 'Full-Time',
    pay_type: 'Hourly',
    pay_rate: '',
    pto_sick_hours_accrued_annually: '40',
    pto_vacation_hours_accrued_annually: '80',
    vacation_days_allocated: '10',
    sick_days_allocated: '5',
    personal_days_allocated: '3',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    address: '',
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
        department: employee.department || '',
        employment_status: employee.employment_status || 'Full-Time',
        pay_type: employee.pay_type || 'Hourly',
        pay_rate: employee.pay_rate?.toString() || '',
        pto_sick_hours_accrued_annually: employee.pto_sick_hours_accrued_annually?.toString() || '40',
        pto_vacation_hours_accrued_annually: employee.pto_vacation_hours_accrued_annually?.toString() || '80',
        vacation_days_allocated: employee.vacation_days_allocated?.toString() || '10',
        sick_days_allocated: employee.sick_days_allocated?.toString() || '5',
        personal_days_allocated: employee.personal_days_allocated?.toString() || '3',
        emergency_contact_name: employee.emergency_contact_name || '',
        emergency_contact_phone: employee.emergency_contact_phone || '',
        address: employee.address || '',
        status: employee.status || 'Active'
      });
      setHireDate(employee.hire_date ? new Date(employee.hire_date) : undefined);
    } else {
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        job_title: '',
        department: '',
        employment_status: 'Full-Time',
        pay_type: 'Hourly',
        pay_rate: '',
        pto_sick_hours_accrued_annually: '40',
        pto_vacation_hours_accrued_annually: '80',
        vacation_days_allocated: '10',
        sick_days_allocated: '5',
        personal_days_allocated: '3',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        address: '',
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
        department: formData.department || null,
        employment_status: formData.employment_status,
        hire_date: hireDate ? format(hireDate, 'yyyy-MM-dd') : null,
        pay_type: formData.pay_type,
        pay_rate: parseFloat(formData.pay_rate),
        pto_sick_hours_accrued_annually: parseInt(formData.pto_sick_hours_accrued_annually),
        pto_vacation_hours_accrued_annually: parseInt(formData.pto_vacation_hours_accrued_annually),
        vacation_days_allocated: parseInt(formData.vacation_days_allocated),
        sick_days_allocated: parseInt(formData.sick_days_allocated),
        personal_days_allocated: parseInt(formData.personal_days_allocated),
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        address: formData.address || null,
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
          <DialogDescription>
            {employee ? 'Update employee information and payroll settings.' : 'Add a new employee to your staff with complete information.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="department">Department</Label>
                <Select 
                  value={formData.department} 
                  onValueChange={(value) => handleInputChange('department', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employment_status">Employment Status</Label>
                <Select 
                  value={formData.employment_status} 
                  onValueChange={(value) => handleInputChange('employment_status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-Time">Full-Time</SelectItem>
                    <SelectItem value="Part-Time">Part-Time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Intern">Intern</SelectItem>
                  </SelectContent>
                </Select>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Street address, city, state, zip"
                rows={2}
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">Contact Name</Label>
                <Input
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                  placeholder="Emergency contact name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                  placeholder="Emergency contact phone"
                />
              </div>
            </div>
          </div>

          {/* Payroll Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Payroll Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </div>

          {/* PTO Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Time Off Allocation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vacation_days_allocated">Vacation Days/Year</Label>
                <Input
                  id="vacation_days_allocated"
                  type="number"
                  value={formData.vacation_days_allocated}
                  onChange={(e) => handleInputChange('vacation_days_allocated', e.target.value)}
                  placeholder="10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sick_days_allocated">Sick Days/Year</Label>
                <Input
                  id="sick_days_allocated"
                  type="number"
                  value={formData.sick_days_allocated}
                  onChange={(e) => handleInputChange('sick_days_allocated', e.target.value)}
                  placeholder="5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="personal_days_allocated">Personal Days/Year</Label>
                <Input
                  id="personal_days_allocated"
                  type="number"
                  value={formData.personal_days_allocated}
                  onChange={(e) => handleInputChange('personal_days_allocated', e.target.value)}
                  placeholder="3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pto_vacation_hours_accrued_annually">Annual Vacation Hours</Label>
                <Input
                  id="pto_vacation_hours_accrued_annually"
                  type="number"
                  value={formData.pto_vacation_hours_accrued_annually}
                  onChange={(e) => handleInputChange('pto_vacation_hours_accrued_annually', e.target.value)}
                  placeholder="80"
                />
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
              </div>
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