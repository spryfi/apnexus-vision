import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Plus, Filter, Fuel as FuelIcon, Flag } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { FuelSmartReminder } from "@/components/FuelSmartReminder";
import { FuelUploadWizard } from "@/components/FuelUploadWizard";
import { FuelKPIDashboard } from "@/components/FuelKPIDashboard";

interface FuelTransaction {
  id: string;
  source_transaction_id?: string;
  transaction_date: string;
  vehicle_id: string;
  employee_name: string;
  gallons: number;
  cost_per_gallon: number;
  total_cost: number;
  odometer: number;
  merchant_name?: string;
  status: string;
  flag_reason?: string;
  created_at: string;
}

export default function Fuel() {
  const [fuelTransactions, setFuelTransactions] = useState<FuelTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<FuelTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadWizard, setShowUploadWizard] = useState(false);
  const [filters, setFilters] = useState({
    employee: '',
    vehicle: '',
    month: '',
    search: '',
    status: ''
  });
  const { toast } = useToast();

  // Check if we need to show the smart reminder
  const lastMonth = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, []);

  const lastMonthKey = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().slice(0, 7);
  }, []);

  const hasLastMonthData = useMemo(() => {
    return fuelTransactions.some(t => 
      t.transaction_date.slice(0, 7) === lastMonthKey
    );
  }, [fuelTransactions, lastMonthKey]);

  useEffect(() => {
    fetchFuelTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [fuelTransactions, filters]);

  const fetchFuelTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fuel_transactions_new')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setFuelTransactions(data || []);
    } catch (error) {
      toast({
        title: "Error loading fuel records",
        description: "Could not load fuel transaction data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = fuelTransactions;

    if (filters.employee) {
      filtered = filtered.filter(t => 
        t.employee_name.toLowerCase().includes(filters.employee.toLowerCase())
      );
    }
    if (filters.vehicle) {
      filtered = filtered.filter(t => 
        t.vehicle_id.toLowerCase().includes(filters.vehicle.toLowerCase())
      );
    }
    if (filters.month) {
      filtered = filtered.filter(t => {
        const transactionMonth = new Date(t.transaction_date).toISOString().slice(0, 7);
        return transactionMonth === filters.month;
      });
    }
    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }
    if (filters.search) {
      filtered = filtered.filter(t => 
        t.employee_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.vehicle_id.toLowerCase().includes(filters.search.toLowerCase()) ||
        (t.merchant_name && t.merchant_name.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    setFilteredTransactions(filtered);
  };

  const handleUploadSuccess = () => {
    fetchFuelTransactions();
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
    <TooltipProvider>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FuelIcon className="h-8 w-8" />
            Intelligent Fuel Tracking
          </h1>
          <p className="text-muted-foreground">
            Semi-automated fleet fuel reconciliation with smart import and validation
          </p>
        </div>
        <Button onClick={() => setShowUploadWizard(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Upload Statement
        </Button>
      </div>

      {/* Smart Reminder or KPI Dashboard */}
      {!loading && !hasLastMonthData ? (
        <FuelSmartReminder 
          lastMonth={lastMonth}
          onUploadClick={() => setShowUploadWizard(true)}
        />
      ) : (
        <FuelKPIDashboard transactions={fuelTransactions} />
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
              <Label>Vehicle</Label>
              <Input
                placeholder="Vehicle ID..."
                value={filters.vehicle}
                onChange={(e) => setFilters({ ...filters, vehicle: e.target.value })}
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
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All</option>
                <option value="Verified">Verified</option>
                <option value="Flagged for Review">Flagged for Review</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fuel Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Fuel Records ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Gallons</TableHead>
                  <TableHead>Price/Gallon</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Odometer</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No fuel records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                      <TableCell className="font-medium">{transaction.employee_name}</TableCell>
                      <TableCell>{transaction.vehicle_id}</TableCell>
                      <TableCell>{transaction.merchant_name || 'N/A'}</TableCell>
                      <TableCell>{transaction.gallons.toFixed(2)}</TableCell>
                      <TableCell>{formatCurrency(transaction.cost_per_gallon)}</TableCell>
                      <TableCell>{formatCurrency(transaction.total_cost)}</TableCell>
                      <TableCell>{transaction.odometer?.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {transaction.status === 'Flagged for Review' && transaction.flag_reason ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button className="text-red-600 hover:text-red-800 transition-colors">
                                    <Flag className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <div>
                                    <p className="font-medium mb-1">Reason for Flag</p>
                                    <p className="text-sm">{transaction.flag_reason}</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : null}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.status === 'Verified' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Upload Wizard */}
      <FuelUploadWizard
        isOpen={showUploadWizard}
        onClose={() => setShowUploadWizard(false)}
        onSuccess={handleUploadSuccess}
      />
      </div>
    </TooltipProvider>
  );
}