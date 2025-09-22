import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Edit, Trash2, DollarSign, Calendar, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import AddEmployeeDialog from "@/components/AddEmployeeDialog";
import AddStipendDialog from "@/components/AddStipendDialog";
import LogTimeOffDialog from "@/components/LogTimeOffDialog";

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

interface Stipend {
  id: string;
  description: string;
  amount: number;
  frequency: string;
  is_active: boolean;
  created_at: string;
}

interface TimeOffRecord {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  hours_used: number;
  notes?: string;
  created_at: string;
}

interface PTOBalance {
  vacation_remaining: number;
  sick_remaining: number;
}

const EmployeeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [stipends, setStipends] = useState<Stipend[]>([]);
  const [timeOffRecords, setTimeOffRecords] = useState<TimeOffRecord[]>([]);
  const [ptoBalances, setPtoBalances] = useState<PTOBalance>({ vacation_remaining: 0, sick_remaining: 0 });
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showStipendDialog, setShowStipendDialog] = useState(false);
  const [showTimeOffDialog, setShowTimeOffDialog] = useState(false);
  const [editingStipend, setEditingStipend] = useState<Stipend | null>(null);

  useEffect(() => {
    if (id) {
      fetchEmployeeData();
    }
  }, [id]);

  const fetchEmployeeData = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // Fetch employee details
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees_enhanced')
        .select('*')
        .eq('id', id)
        .single();

      if (employeeError) throw employeeError;
      setEmployee(employeeData);

      // Fetch stipends
      const { data: stipendsData, error: stipendsError } = await supabase
        .from('stipends')
        .select('*')
        .eq('employee_id', id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (stipendsError) throw stipendsError;
      setStipends(stipendsData || []);

      // Fetch time off records
      const { data: timeOffData, error: timeOffError } = await supabase
        .from('time_off_records')
        .select('*')
        .eq('employee_id', id)
        .order('start_date', { ascending: false });

      if (timeOffError) throw timeOffError;
      setTimeOffRecords(timeOffData || []);

      // Calculate PTO balances
      await calculatePTOBalances(id);

    } catch (error) {
      console.error('Error fetching employee data:', error);
      toast({
        title: "Error",
        description: "Failed to load employee data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePTOBalances = async (employeeId: string) => {
    try {
      // Call the database function to calculate balances
      const { data: vacationData, error: vacationError } = await supabase
        .rpc('calculate_pto_balance', {
          p_employee_id: employeeId,
          p_leave_type: 'Vacation'
        });

      const { data: sickData, error: sickError } = await supabase
        .rpc('calculate_pto_balance', {
          p_employee_id: employeeId,
          p_leave_type: 'Sick'
        });

      if (vacationError || sickError) {
        throw vacationError || sickError;
      }

      setPtoBalances({
        vacation_remaining: vacationData || 0,
        sick_remaining: sickData || 0
      });
    } catch (error) {
      console.error('Error calculating PTO balances:', error);
    }
  };

  const handleDeleteStipend = async (stipendId: string) => {
    try {
      const { error } = await supabase
        .from('stipends')
        .update({ is_active: false })
        .eq('id', stipendId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Stipend removed successfully",
      });

      fetchEmployeeData();
    } catch (error) {
      console.error('Error removing stipend:', error);
      toast({
        title: "Error",
        description: "Failed to remove stipend",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getProgressPercentage = (remaining: number, total: number) => {
    return ((total - remaining) / total) * 100;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-medium text-muted-foreground">Employee Not Found</h2>
          <p className="text-muted-foreground mt-2">The employee you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/staff')} className="mt-4">
            Back to Staff
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/staff')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Staff
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{employee.full_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground">{employee.job_title || 'No title set'}</p>
              <Badge className={employee.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {employee.status}
              </Badge>
            </div>
          </div>
        </div>
        <Button onClick={() => setShowEditDialog(true)} className="flex items-center gap-2">
          <Edit className="h-4 w-4" />
          Edit Employee
        </Button>
      </div>

      {/* At a Glance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pay Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(employee.pay_rate)}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                {employee.pay_type === 'Hourly' ? '/hour' : '/year'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{employee.pay_type} employee</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hire Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : 'Not set'}
            </div>
            {employee.hire_date && (
              <p className="text-xs text-muted-foreground mt-1">
                {Math.floor((Date.now() - new Date(employee.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 365))} years with company
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Stipends</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stipends.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total: {formatCurrency(stipends.reduce((sum, stipend) => sum + stipend.amount, 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="compensation" className="space-y-6">
        <TabsList>
          <TabsTrigger value="compensation">Compensation</TabsTrigger>
          <TabsTrigger value="pto">Time Off (PTO)</TabsTrigger>
        </TabsList>

        <TabsContent value="compensation" className="space-y-6">
          {/* Stipends Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Stipends</CardTitle>
                <CardDescription>Recurring payments and allowances</CardDescription>
              </div>
              <Button 
                onClick={() => setShowStipendDialog(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Stipend
              </Button>
            </CardHeader>
            <CardContent>
              {stipends.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No stipends configured</p>
                  <Button 
                    onClick={() => setShowStipendDialog(true)}
                    variant="outline"
                    className="mt-4"
                  >
                    Add First Stipend
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stipends.map((stipend) => (
                      <TableRow key={stipend.id}>
                        <TableCell className="font-medium">{stipend.description}</TableCell>
                        <TableCell>{formatCurrency(stipend.amount)}</TableCell>
                        <TableCell>{stipend.frequency}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingStipend(stipend);
                                setShowStipendDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteStipend(stipend.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pto" className="space-y-6">
          {/* PTO Balances */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Vacation Hours Remaining
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {ptoBalances.vacation_remaining} / {employee.pto_vacation_hours_accrued_annually}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.max(0, 100 - getProgressPercentage(ptoBalances.vacation_remaining, employee.pto_vacation_hours_accrued_annually))}%` 
                    }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {employee.pto_vacation_hours_accrued_annually - ptoBalances.vacation_remaining} hours used this year
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Sick Hours Remaining
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {ptoBalances.sick_remaining} / {employee.pto_sick_hours_accrued_annually}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.max(0, 100 - getProgressPercentage(ptoBalances.sick_remaining, employee.pto_sick_hours_accrued_annually))}%` 
                    }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {employee.pto_sick_hours_accrued_annually - ptoBalances.sick_remaining} hours used this year
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Time Off Log */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Time Off Log</CardTitle>
                <CardDescription>Record of all time off taken this year</CardDescription>
              </div>
              <Button 
                onClick={() => setShowTimeOffDialog(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Log Time Off
              </Button>
            </CardHeader>
            <CardContent>
              {timeOffRecords.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No time off logged this year</p>
                  <Button 
                    onClick={() => setShowTimeOffDialog(true)}
                    variant="outline"
                    className="mt-4"
                  >
                    Log First Time Off
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Hours Used</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeOffRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <Badge variant={record.leave_type === 'Vacation' ? 'default' : 'secondary'}>
                            {record.leave_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(record.start_date).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(record.end_date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{record.hours_used} hrs</TableCell>
                        <TableCell>{record.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddEmployeeDialog 
        open={showEditDialog}
        onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open) {
            fetchEmployeeData();
          }
        }}
        onEmployeeAdded={fetchEmployeeData}
        employee={employee}
      />

      <AddStipendDialog 
        open={showStipendDialog}
        onOpenChange={(open) => {
          setShowStipendDialog(open);
          if (!open) {
            setEditingStipend(null);
          }
        }}
        onStipendAdded={fetchEmployeeData}
        employeeId={employee.id}
        stipend={editingStipend}
      />

      <LogTimeOffDialog 
        open={showTimeOffDialog}
        onOpenChange={setShowTimeOffDialog}
        onTimeOffLogged={fetchEmployeeData}
        employeeId={employee.id}
        employeeName={employee.full_name}
      />
    </div>
  );
};

export default EmployeeDetail;