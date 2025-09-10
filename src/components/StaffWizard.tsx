import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, ArrowRight, ArrowLeft, Plus, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StaffWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStaffAdded: () => void;
}

interface EmployeeData {
  employee_name: string;
  role: string;
  phone?: string;
  email?: string;
  department?: string;
  notes?: string;
}

const roles = [
  "Manager",
  "Supervisor", 
  "Staff",
  "Driver",
  "Technician",
  "Administrative",
  "Sales",
  "Customer Service"
];

const departments = [
  "Operations",
  "Administration", 
  "Sales",
  "Customer Service",
  "Technical",
  "Management"
];

export default function StaffWizard({ open, onOpenChange, onStaffAdded }: StaffWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [employeeData, setEmployeeData] = useState<EmployeeData>({
    employee_name: '',
    role: '',
    phone: '',
    email: '',
    department: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedEmployees, setCompletedEmployees] = useState<string[]>([]);
  const { toast } = useToast();

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const resetForm = () => {
    setEmployeeData({
      employee_name: '',
      role: '',
      phone: '',
      email: '',
      department: '',
      notes: ''
    });
    setCurrentStep(1);
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return employeeData.employee_name.trim().length > 0;
      case 2:
        return employeeData.role.length > 0;
      case 3:
        return true; // Optional fields
      case 4:
        return true; // Review step
      default:
        return false;
    }
  };

  const handleSaveEmployee = async () => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('employees')
        .insert([{
          employee_name: employeeData.employee_name,
          role: employeeData.role
        }]);

      if (error) throw error;

      setCompletedEmployees(prev => [...prev, employeeData.employee_name]);
      
      toast({
        title: "Employee added successfully!",
        description: `${employeeData.employee_name} has been added to your staff.`,
      });

      onStaffAdded();
      
    } catch (error) {
      toast({
        title: "Error adding employee",
        description: "Could not save employee information",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    setCompletedEmployees([]);
    onOpenChange(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <p className="text-sm text-muted-foreground">Let's start with the employee's basic details</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="employee_name">Employee Name *</Label>
              <Input
                id="employee_name"
                value={employeeData.employee_name}
                onChange={(e) => setEmployeeData({...employeeData, employee_name: e.target.value})}
                placeholder="Enter full name"
                className="text-lg"
              />
              <p className="text-xs text-muted-foreground">Enter the employee's first and last name</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                value={employeeData.phone}
                onChange={(e) => setEmployeeData({...employeeData, phone: e.target.value})}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={employeeData.email}
                onChange={(e) => setEmployeeData({...employeeData, email: e.target.value})}
                placeholder="employee@company.com"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Badge className="h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4 text-lg">
                Role
              </Badge>
              <h3 className="text-lg font-semibold">Role & Department</h3>
              <p className="text-sm text-muted-foreground">What position will {employeeData.employee_name} have?</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Job Role *</Label>
              <Select value={employeeData.role} onValueChange={(value) => setEmployeeData({...employeeData, role: value})}>
                <SelectTrigger className="text-lg">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Choose the employee's primary job role</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department (Optional)</Label>
              <Select value={employeeData.department} onValueChange={(value) => setEmployeeData({...employeeData, department: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Additional Details</h3>
              <p className="text-sm text-muted-foreground">Any additional information about {employeeData.employee_name}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={employeeData.notes}
                onChange={(e) => setEmployeeData({...employeeData, notes: e.target.value})}
                placeholder="Any additional notes about the employee, special skills, certifications, etc."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">Include any relevant information like certifications, special skills, or notes</p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Review & Confirm</h3>
              <p className="text-sm text-muted-foreground">Please review the information before saving</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Employee Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Name</Label>
                    <p className="font-medium">{employeeData.employee_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Role</Label>
                    <Badge variant="secondary">{employeeData.role}</Badge>
                  </div>
                  {employeeData.phone && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Phone</Label>
                      <p>{employeeData.phone}</p>
                    </div>
                  )}
                  {employeeData.email && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Email</Label>
                      <p>{employeeData.email}</p>
                    </div>
                  )}
                  {employeeData.department && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Department</Label>
                      <p>{employeeData.department}</p>
                    </div>
                  )}
                </div>
                {employeeData.notes && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Notes</Label>
                    <p className="text-sm">{employeeData.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Member Wizard
          </DialogTitle>
          <DialogDescription>
            Step-by-step guide to add new employees to your team
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            {currentStep === totalSteps ? (
              <>
                <Button
                  onClick={handleSaveEmployee}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? "Saving..." : "Save Employee"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAddAnother}
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another
                </Button>
              </>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!validateCurrentStep()}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Completed Employees */}
        {completedEmployees.length > 0 && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-800 mb-2">✅ Recently Added:</h4>
            <div className="flex flex-wrap gap-2">
              {completedEmployees.map((name, index) => (
                <Badge key={index} variant="outline" className="bg-green-100 text-green-800">
                  {name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-center pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Finish & Close Wizard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}