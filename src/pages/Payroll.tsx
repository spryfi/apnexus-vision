import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, DollarSign, Clock, Users } from "lucide-react";
import TaskDashboard from "@/components/TaskDashboard";
import CardManagement from "@/components/CardManagement";
import { useToast } from "@/hooks/use-toast";

interface PayrollRecord {
  id: string;
  employee_id: string;
  week_number: number;
  year: number;
  regular_hours: number;
  overtime_hours: number;
  hourly_rate: number;
  is_salary: boolean;
  gross_pay: number;
  overtime_pay: number;
  total_gross_pay: number;
  deductions: number;
  net_pay: number;
  week_start_date: string;
  week_end_date: string;
  notes: string;
  employees: { employee_name: string };
}

interface Employee {
  id: string;
  employee_name: string;
}

interface WeekOption {
  week: number;
  year: number;
  startDate: Date;
  endDate: Date;
  label: string;
}

export default function Payroll() {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<WeekOption | null>(null);
  const [weekOptions, setWeekOptions] = useState<WeekOption[]>([]);
  const [formData, setFormData] = useState({
    employee_id: '',
    regular_hours: '',
    overtime_hours: '',
    hourly_rate: '',
    is_salary: false,
    gross_pay: '',
    deductions: '',
    notes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    generateWeekOptions();
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedWeek) {
      fetchPayrollForWeek();
    }
  }, [selectedWeek]);

  const generateWeekOptions = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const weeks: WeekOption[] = [];
    
    // Generate all 52 weeks for current year
    for (let week = 1; week <= 52; week++) {
      const startDate = getDateOfWeek(week, currentYear);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      
      weeks.push({
        week,
        year: currentYear,
        startDate,
        endDate,
        label: `Week ${week} (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`
      });
    }
    
    setWeekOptions(weeks);
    
    // Set previous week as default (for payroll processing)
    const currentWeek = getCurrentWeekNumber(now);
    const previousWeek = currentWeek > 1 ? currentWeek - 1 : 52; // Handle year transition
    const defaultWeek = weeks.find(w => w.week === previousWeek);
    if (defaultWeek) {
      setSelectedWeek(defaultWeek);
    }
  };

  const getDateOfWeek = (week: number, year: number) => {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4) {
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    }
    return ISOweekStart;
  };

  const getCurrentWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, employee_name')
        .order('employee_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      toast({
        title: "Error loading employees",
        description: "Could not load employee list",
        variant: "destructive",
      });
    }
  };

  const fetchPayrollForWeek = async () => {
    if (!selectedWeek) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payroll')
        .select(`
          *,
          employees(employee_name)
        `)
        .eq('week_number', selectedWeek.week)
        .eq('year', selectedWeek.year)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayrollRecords(data || []);
    } catch (error) {
      toast({
        title: "Error loading payroll data",
        description: "Could not load payroll records for selected week",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePay = () => {
    if (formData.is_salary) {
      return; // Salary calculation would be handled differently
    }

    const regularHours = parseFloat(formData.regular_hours) || 0;
    const overtimeHours = parseFloat(formData.overtime_hours) || 0;
    const hourlyRate = parseFloat(formData.hourly_rate) || 0;

    const regularPay = regularHours * hourlyRate;
    const overtimePay = overtimeHours * (hourlyRate * 1.5); // 1.5x for overtime
    const totalGross = regularPay + overtimePay;
    const deductions = parseFloat(formData.deductions) || 0;
    const netPay = totalGross - deductions;

    setFormData(prev => ({
      ...prev,
      gross_pay: regularPay.toFixed(2),
      overtime_pay: overtimePay.toFixed(2),
      total_gross_pay: totalGross.toFixed(2),
      net_pay: netPay.toFixed(2)
    }));
  };

  useEffect(() => {
    if (!formData.is_salary) {
      calculatePay();
    }
  }, [formData.regular_hours, formData.overtime_hours, formData.hourly_rate, formData.deductions, formData.is_salary]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employee_id || !selectedWeek) {
      toast({
        title: "Required fields missing",
        description: "Please select an employee and ensure a week is selected",
        variant: "destructive",
      });
      return;
    }

    // Validate salary vs hourly
    if (!formData.is_salary && (!formData.hourly_rate || !formData.regular_hours)) {
      toast({
        title: "Hourly information required",
        description: "Please provide hourly rate and regular hours for non-salary employees",
        variant: "destructive",
      });
      return;
    }

    if (formData.is_salary && !formData.gross_pay) {
      toast({
        title: "Salary amount required",
        description: "Please provide gross pay amount for salary employees",
        variant: "destructive",
      });
      return;
    }

    try {
      const regularHours = parseFloat(formData.regular_hours) || 0;
      const overtimeHours = parseFloat(formData.overtime_hours) || 0;
      const hourlyRate = formData.is_salary ? null : parseFloat(formData.hourly_rate);
      const grossPay = parseFloat(formData.gross_pay) || 0;
      const deductions = parseFloat(formData.deductions) || 0;
      
      // Calculate totals
      let overtimePay = 0;
      let totalGrossPay = grossPay;
      
      if (!formData.is_salary && hourlyRate) {
        overtimePay = overtimeHours * (hourlyRate * 1.5);
        totalGrossPay = grossPay + overtimePay;
      }
      
      const netPay = totalGrossPay - deductions;

      const { error } = await supabase
        .from('payroll')
        .insert([{
          employee_id: formData.employee_id,
          week_number: selectedWeek.week,
          year: selectedWeek.year,
          week_start_date: selectedWeek.startDate.toISOString().split('T')[0],
          week_end_date: selectedWeek.endDate.toISOString().split('T')[0],
          pay_period_start: selectedWeek.startDate.toISOString().split('T')[0],
          pay_period_end: selectedWeek.endDate.toISOString().split('T')[0],
          regular_hours: regularHours,
          overtime_hours: overtimeHours,
          hours_worked: regularHours + overtimeHours,
          hourly_rate: hourlyRate,
          is_salary: formData.is_salary,
          gross_pay: grossPay,
          overtime_pay: overtimePay,
          total_gross_pay: totalGrossPay,
          deductions: deductions,
          net_pay: netPay,
          notes: formData.notes || null
        }]);

      if (error) throw error;

      toast({
        title: "Payroll record added",
        description: "Weekly pay record has been saved successfully",
      });

      setFormData({
        employee_id: '',
        regular_hours: '',
        overtime_hours: '',
        hourly_rate: '',
        is_salary: false,
        gross_pay: '',
        deductions: '',
        notes: ''
      });
      setShowAddDialog(false);
      fetchPayrollForWeek();
    } catch (error) {
      toast({
        title: "Error adding payroll record",
        description: "Could not save payroll record",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="h-8 w-8" />
            Weekly Payroll Management
          </h1>
          <p className="text-muted-foreground">
            Track weekly hours and pay for all employees
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} disabled={!selectedWeek}>
          <Plus className="h-4 w-4 mr-2" />
          Add Pay Record
        </Button>
      </div>

      <div className="space-y-6">

      {/* Week Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Pay Week
          </CardTitle>
          <CardDescription>
            Choose which week you want to view or manage payroll for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <Select 
              value={selectedWeek ? `${selectedWeek.week}-${selectedWeek.year}` : ''} 
              onValueChange={(value) => {
                const [week, year] = value.split('-').map(Number);
                const option = weekOptions.find(w => w.week === week && w.year === year);
                setSelectedWeek(option || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a week" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {weekOptions.map((week) => (
                  <SelectItem key={`${week.week}-${week.year}`} value={`${week.week}-${week.year}`}>
                    {week.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedWeek && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Selected Week</h4>
              <div className="text-sm text-blue-800">
                <p>Week {selectedWeek.week} of {selectedWeek.year}</p>
                <p>{selectedWeek.startDate.toLocaleDateString()} - {selectedWeek.endDate.toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Summary */}
      {selectedWeek && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium">Total Employees</p>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{payrollRecords.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium">Total Hours</p>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {payrollRecords.reduce((sum, record) => sum + (record.regular_hours || 0) + (record.overtime_hours || 0), 0).toFixed(1)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium">Total Gross Pay</p>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(payrollRecords.reduce((sum, record) => sum + (record.total_gross_pay || 0), 0))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium">Total Net Pay</p>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(payrollRecords.reduce((sum, record) => sum + (record.net_pay || 0), 0))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payroll Records Table */}
      {selectedWeek && (
        <Card>
          <CardHeader>
            <CardTitle>
              Payroll Records for Week {selectedWeek.week}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded"></div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Regular Hours</TableHead>
                      <TableHead>Overtime Hours</TableHead>
                      <TableHead>Hourly Rate</TableHead>
                      <TableHead>Gross Pay</TableHead>
                      <TableHead>Overtime Pay</TableHead>
                      <TableHead>Total Gross</TableHead>
                      <TableHead>Net Pay</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No payroll records for this week
                        </TableCell>
                      </TableRow>
                    ) : (
                      payrollRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.employees?.employee_name}</TableCell>
                          <TableCell>
                            <Badge variant={record.is_salary ? "default" : "secondary"}>
                              {record.is_salary ? 'Salary' : 'Hourly'}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.regular_hours?.toFixed(1) || 'N/A'}</TableCell>
                          <TableCell>{record.overtime_hours?.toFixed(1) || '0.0'}</TableCell>
                          <TableCell>
                            {record.is_salary ? 'N/A' : formatCurrency(record.hourly_rate || 0)}
                          </TableCell>
                          <TableCell>{formatCurrency(record.gross_pay)}</TableCell>
                          <TableCell>{formatCurrency(record.overtime_pay || 0)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(record.total_gross_pay)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(record.net_pay || 0)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Payroll Record Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Weekly Pay Record</DialogTitle>
            <DialogDescription>
              {selectedWeek && `Enter pay information for week ${selectedWeek.week} (${selectedWeek.startDate.toLocaleDateString()} - ${selectedWeek.endDate.toLocaleDateString()})`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee *</Label>
                <Select value={formData.employee_id} onValueChange={(value) => setFormData({...formData, employee_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.employee_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="is_salary" 
                    checked={formData.is_salary}
                    onCheckedChange={(checked) => setFormData({...formData, is_salary: checked as boolean})}
                  />
                  <Label htmlFor="is_salary">Salary Employee</Label>
                </div>
              </div>

              {!formData.is_salary && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="regular_hours">Regular Hours *</Label>
                    <Input
                      id="regular_hours"
                      type="number"
                      step="0.1"
                      value={formData.regular_hours}
                      onChange={(e) => setFormData({...formData, regular_hours: e.target.value})}
                      placeholder="40.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overtime_hours">Overtime Hours</Label>
                    <Input
                      id="overtime_hours"
                      type="number"
                      step="0.1"
                      value={formData.overtime_hours}
                      onChange={(e) => setFormData({...formData, overtime_hours: e.target.value})}
                      placeholder="0.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate">Hourly Rate *</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      step="0.01"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})}
                      placeholder="25.00"
                    />
                  </div>
                </>
              )}

              {formData.is_salary && (
                <div className="space-y-2">
                  <Label htmlFor="gross_pay">Weekly Salary Amount *</Label>
                  <Input
                    id="gross_pay"
                    type="number"
                    step="0.01"
                    value={formData.gross_pay}
                    onChange={(e) => setFormData({...formData, gross_pay: e.target.value})}
                    placeholder="1000.00"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="deductions">Deductions</Label>
                <Input
                  id="deductions"
                  type="number"
                  step="0.01"
                  value={formData.deductions}
                  onChange={(e) => setFormData({...formData, deductions: e.target.value})}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Pay Summary */}
            {(formData.regular_hours || formData.gross_pay) && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-medium">Pay Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {!formData.is_salary && (
                    <>
                      <div>Regular Pay: {formatCurrency((parseFloat(formData.regular_hours) || 0) * (parseFloat(formData.hourly_rate) || 0))}</div>
                      <div>Overtime Pay: {formatCurrency((parseFloat(formData.overtime_hours) || 0) * ((parseFloat(formData.hourly_rate) || 0) * 1.5))}</div>
                    </>
                  )}
                  <div>Gross Pay: {formatCurrency(parseFloat(formData.gross_pay) || 0)}</div>
                  <div>Deductions: {formatCurrency(parseFloat(formData.deductions) || 0)}</div>
                  <div className="font-medium col-span-2">
                    Net Pay: {formatCurrency(
                      (formData.is_salary ? 
                        (parseFloat(formData.gross_pay) || 0) : 
                        ((parseFloat(formData.regular_hours) || 0) * (parseFloat(formData.hourly_rate) || 0)) + 
                        ((parseFloat(formData.overtime_hours) || 0) * ((parseFloat(formData.hourly_rate) || 0) * 1.5))
                      ) - (parseFloat(formData.deductions) || 0)
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add Pay Record
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}