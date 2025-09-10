import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Filter, DollarSign, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PayrollRecord {
  id: string;
  employee_id: string;
  pay_period_start: string;
  pay_period_end: string;
  hours_worked: number;
  overtime_hours: number;
  gross_pay: number;
  overtime_pay: number;
  total_gross_pay: number;
  deductions: number;
  net_pay: number;
  pay_date: string;
  notes: string;
  employees: { employee_name: string };
}

interface Employee {
  id: string;
  employee_name: string;
}

export default function Payroll() {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filters, setFilters] = useState({
    employee: '',
    month: '',
    search: ''
  });
  const [formData, setFormData] = useState({
    employee_id: '',
    pay_period_start: '',
    pay_period_end: '',
    hours_worked: '',
    overtime_hours: '',
    gross_pay: '',
    overtime_pay: '',
    deductions: '',
    pay_date: '',
    notes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [payrollRecords, filters]);

  useEffect(() => {
    calculateTotals();
  }, [formData.gross_pay, formData.overtime_pay, formData.deductions]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [payrollRes, employeesRes] = await Promise.all([
        supabase
          .from('payroll')
          .select(`
            *,
            employees(employee_name)
          `)
          .order('pay_period_end', { ascending: false }),
        supabase
          .from('employees')
          .select('id, employee_name')
          .order('employee_name')
      ]);

      if (payrollRes.error) throw payrollRes.error;
      if (employeesRes.error) throw employeesRes.error;

      setPayrollRecords(payrollRes.data || []);
      setEmployees(employeesRes.data || []);
    } catch (error) {
      toast({
        title: "Error loading payroll data",
        description: "Could not load payroll records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const grossPay = parseFloat(formData.gross_pay) || 0;
    const overtimePay = parseFloat(formData.overtime_pay) || 0;
    const deductions = parseFloat(formData.deductions) || 0;
    
    const totalGrossPay = grossPay + overtimePay;
    const netPay = totalGrossPay - deductions;
    
    setFormData(prev => ({
      ...prev,
      total_gross_pay: totalGrossPay.toString(),
      net_pay: netPay.toString()
    }));
  };

  const applyFilters = () => {
    let filtered = payrollRecords;

    if (filters.employee) {
      filtered = filtered.filter(record => 
        record.employees?.employee_name.toLowerCase().includes(filters.employee.toLowerCase())
      );
    }
    if (filters.month) {
      filtered = filtered.filter(record => {
        const payPeriodMonth = new Date(record.pay_period_end).toISOString().slice(0, 7);
        return payPeriodMonth === filters.month;
      });
    }
    if (filters.search) {
      filtered = filtered.filter(record => 
        record.employees?.employee_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        record.notes?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredRecords(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employee_id || !formData.pay_period_start || !formData.pay_period_end || !formData.gross_pay) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const grossPay = parseFloat(formData.gross_pay);
      const overtimePay = parseFloat(formData.overtime_pay) || 0;
      const deductions = parseFloat(formData.deductions) || 0;
      const totalGrossPay = grossPay + overtimePay;
      const netPay = totalGrossPay - deductions;

      const { error } = await supabase
        .from('payroll')
        .insert([{
          employee_id: formData.employee_id,
          pay_period_start: formData.pay_period_start,
          pay_period_end: formData.pay_period_end,
          hours_worked: parseFloat(formData.hours_worked) || null,
          overtime_hours: parseFloat(formData.overtime_hours) || 0,
          gross_pay: grossPay,
          overtime_pay: overtimePay,
          total_gross_pay: totalGrossPay,
          deductions: deductions,
          net_pay: netPay,
          pay_date: formData.pay_date || null,
          notes: formData.notes || null
        }]);

      if (error) throw error;

      toast({
        title: "Payroll record added",
        description: "Employee pay record has been saved successfully",
      });

      setFormData({
        employee_id: '',
        pay_period_start: '',
        pay_period_end: '',
        hours_worked: '',
        overtime_hours: '',
        gross_pay: '',
        overtime_pay: '',
        deductions: '',
        pay_date: '',
        notes: ''
      });
      setShowAddDialog(false);
      fetchData();
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-muted rounded w-48 mb-2"></div>
            <div className="h-4 bg-muted rounded w-64"></div>
          </div>
          <div className="h-10 bg-muted rounded w-32"></div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="h-8 w-8" />
            Payroll Management
          </h1>
          <p className="text-muted-foreground">
            Track employee gross pay and payroll records
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Pay Record
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Search records..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Employee</Label>
              <Input
                placeholder="Employee name..."
                value={filters.employee}
                onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Month</Label>
              <Input
                type="month"
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Payroll Records ({filteredRecords.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Pay Period</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Gross Pay</TableHead>
                  <TableHead>Overtime</TableHead>
                  <TableHead>Total Gross</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Pay Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No payroll records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.employees?.employee_name}</TableCell>
                      <TableCell>
                        {formatDate(record.pay_period_start)} - {formatDate(record.pay_period_end)}
                      </TableCell>
                      <TableCell>{record.hours_worked?.toFixed(1) || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(record.gross_pay)}</TableCell>
                      <TableCell>{formatCurrency(record.overtime_pay)}</TableCell>
                      <TableCell>{formatCurrency(record.total_gross_pay)}</TableCell>
                      <TableCell>{formatCurrency(record.deductions)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(record.net_pay || 0)}</TableCell>
                      <TableCell>{record.pay_date ? formatDate(record.pay_date) : 'Not set'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Payroll Record Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Payroll Record</DialogTitle>
            <DialogDescription>
              Enter employee pay information for the pay period
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
                <Label htmlFor="gross_pay">Gross Pay *</Label>
                <Input
                  id="gross_pay"
                  type="number"
                  step="0.01"
                  required
                  value={formData.gross_pay}
                  onChange={(e) => setFormData({...formData, gross_pay: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pay_period_start">Pay Period Start *</Label>
                <Input
                  id="pay_period_start"
                  type="date"
                  required
                  value={formData.pay_period_start}
                  onChange={(e) => setFormData({...formData, pay_period_start: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pay_period_end">Pay Period End *</Label>
                <Input
                  id="pay_period_end"
                  type="date"
                  required
                  value={formData.pay_period_end}
                  onChange={(e) => setFormData({...formData, pay_period_end: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours_worked">Hours Worked</Label>
                <Input
                  id="hours_worked"
                  type="number"
                  step="0.1"
                  value={formData.hours_worked}
                  onChange={(e) => setFormData({...formData, hours_worked: e.target.value})}
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
                <Label htmlFor="overtime_pay">Overtime Pay</Label>
                <Input
                  id="overtime_pay"
                  type="number"
                  step="0.01"
                  value={formData.overtime_pay}
                  onChange={(e) => setFormData({...formData, overtime_pay: e.target.value})}
                  placeholder="0.00"
                />
              </div>
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
              <div className="space-y-2">
                <Label htmlFor="pay_date">Pay Date</Label>
                <Input
                  id="pay_date"
                  type="date"
                  value={formData.pay_date}
                  onChange={(e) => setFormData({...formData, pay_date: e.target.value})}
                />
              </div>
            </div>
            
            {(formData.gross_pay || formData.overtime_pay || formData.deductions) && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-medium">Pay Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Gross Pay: {formatCurrency(parseFloat(formData.gross_pay) || 0)}</div>
                  <div>Overtime Pay: {formatCurrency(parseFloat(formData.overtime_pay) || 0)}</div>
                  <div>Total Gross: {formatCurrency((parseFloat(formData.gross_pay) || 0) + (parseFloat(formData.overtime_pay) || 0))}</div>
                  <div>Deductions: {formatCurrency(parseFloat(formData.deductions) || 0)}</div>
                  <div className="font-medium col-span-2">Net Pay: {formatCurrency(((parseFloat(formData.gross_pay) || 0) + (parseFloat(formData.overtime_pay) || 0)) - (parseFloat(formData.deductions) || 0))}</div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Pay Record
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}