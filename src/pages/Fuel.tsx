import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertTriangle, DollarSign, Droplet, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FuelUploadWizard } from "@/components/FuelUploadWizard";
import { FuelTransactionsTable } from "@/components/FuelTransactionsTable";
import { FuelAnalytics } from "@/components/fuel/FuelAnalytics";
import { FuelByVehicle } from "@/components/fuel/FuelByVehicle";
import { FuelByDriver } from "@/components/fuel/FuelByDriver";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Type based on actual fuel_statements table schema
interface FuelStatement {
  id: string;
  file_name: string;
  statement_start_date: string;
  statement_end_date: string;
  total_transactions: number;
  total_amount: number;
  total_gallons: number;
  status: string;
  upload_date: string;
  ai_processing_notes?: string;
}

interface FuelTransaction {
  id: string;
  transaction_date: string;
  employee_name: string;
  vehicle_id: string | null;
  gallons: number;
  cost_per_gallon: number;
  total_cost: number;
  odometer: number;
  merchant_name: string | null;
  status: string;
  flag_reason: string | null;
}

export default function Fuel() {
  const [statements, setStatements] = useState<FuelStatement[]>([]);
  const [selectedStatementId, setSelectedStatementId] = useState<string>("");
  const [transactions, setTransactions] = useState<FuelTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadWizard, setShowUploadWizard] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FuelTransaction | null>(null);
  const [reviewingTransaction, setReviewingTransaction] = useState<FuelTransaction | null>(null);
  const [activeTab, setActiveTab] = useState('transactions');
  const { toast } = useToast();

  // Metrics from current month transactions
  const currentMonthMetrics = useMemo(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const currentMonthTransactions = transactions.filter(t => {
      const transDate = new Date(t.transaction_date);
      return transDate >= firstDay;
    });

    const totalSpend = currentMonthTransactions.reduce((sum, t) => sum + t.total_cost, 0);
    const totalGallons = currentMonthTransactions.reduce((sum, t) => sum + t.gallons, 0);
    const pendingReview = currentMonthTransactions.filter(t => 
      t.status === 'Flagged for Review' || !t.vehicle_id
    ).length;

    return {
      totalSpend,
      totalGallons,
      avgPricePerGallon: totalGallons > 0 ? (totalSpend / totalGallons) : 0,
      pendingReview
    };
  }, [transactions]);

  const selectedStatement = useMemo(() => {
    return statements.find(s => s.id === selectedStatementId);
  }, [statements, selectedStatementId]);

  useEffect(() => {
    fetchStatements();
    fetchTransactions();
    
    // Set up real-time subscriptions
    const statementsChannel = supabase
      .channel('fuel_statements_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'fuel_statements' },
        () => {
          fetchStatements();
        }
      )
      .subscribe();

    const transactionsChannel = supabase
      .channel('fuel_transactions_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'fuel_transactions_new' },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statementsChannel);
      supabase.removeChannel(transactionsChannel);
    };
  }, []);

  const fetchStatements = async () => {
    try {
      // Using 'as any' to bypass TypeScript until types are refreshed
      const { data, error } = await supabase
        .from('fuel_statements' as any)
        .select('*') as any;

      if (error) throw error;
      
      const typedData = (data || []) as unknown as FuelStatement[];
      setStatements(typedData);
      
      // Auto-select most recent statement
      if (typedData.length > 0 && !selectedStatementId) {
        setSelectedStatementId(typedData[0].id);
      }
    } catch (error: any) {
      console.error('Error loading statements:', error);
      toast({
        title: "Error loading statements",
        description: error.message || "Could not load fuel statement data",
        variant: "destructive",
      });
    }
  };

  const fetchTransactions = async (statementId?: string) => {
    try {
      let query = supabase
        .from('fuel_transactions_new')
        .select('*')
        .order('transaction_date', { ascending: false });

      // If a statement is selected, filter by statement period
      if (statementId) {
        const statement = statements.find(s => s.id === statementId);
        if (statement) {
          query = query
            .gte('transaction_date', statement.statement_start_date)
            .lte('transaction_date', statement.statement_end_date);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setTransactions(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading fuel data",
        description: error.message || "Could not load fuel transaction data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch transactions when selected statement changes
  useEffect(() => {
    if (selectedStatementId) {
      fetchTransactions(selectedStatementId);
    }
  }, [selectedStatementId]);

  const handleUploadSuccess = () => {
    fetchStatements();
    fetchTransactions();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Empty state when no statements exist
  if (statements.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Intelligent Fuel Management</h1>
            <p className="text-muted-foreground">
              AI-powered fuel tracking with automatic vehicle matching
            </p>
          </div>
          <Button onClick={() => setShowUploadWizard(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload WEX Statement (CSV)
          </Button>
        </div>

        <EmptyState
          icon={Droplet}
          title="No fuel statements uploaded yet"
          description="Upload your first WEX fleet card statement to start tracking fuel expenses with AI-powered vehicle matching"
          actionLabel="Upload First Statement"
          onAction={() => setShowUploadWizard(true)}
        />

        <FuelUploadWizard
          isOpen={showUploadWizard}
          onClose={() => setShowUploadWizard(false)}
          onSuccess={handleUploadSuccess}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Intelligent Fuel Management</h1>
          <p className="text-muted-foreground">
            AI-powered fuel tracking with automatic vehicle matching
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowUploadWizard(true)}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload WEX Statement (CSV)
          </Button>
          <Button 
            variant="secondary"
            onClick={() => window.location.href = '/fuel-tracking'}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            View All Transactions
          </Button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fuel Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMonthMetrics.totalSpend)}</div>
            <p className="text-xs text-muted-foreground">This Month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gallons</CardTitle>
            <Droplet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(currentMonthMetrics.totalGallons)}</div>
            <p className="text-xs text-muted-foreground">This Month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price/Gallon</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMonthMetrics.avgPricePerGallon)}</div>
            <p className="text-xs text-muted-foreground">This Month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonthMetrics.pendingReview}</div>
            <p className="text-xs text-muted-foreground">
              {currentMonthMetrics.pendingReview > 0 ? (
                <Badge variant="destructive" className="text-xs">Needs Attention</Badge>
              ) : (
                "All Clear"
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="by-vehicle">By Vehicle</TabsTrigger>
          <TabsTrigger value="by-driver">By Driver</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          {/* Statement History Section */}
          <Card>
            <CardHeader>
              <CardTitle>Statement History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Statement Period</label>
                <Select value={selectedStatementId} onValueChange={setSelectedStatementId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a statement" />
                  </SelectTrigger>
                  <SelectContent>
                    {statements.map((statement) => (
                      <SelectItem key={statement.id} value={statement.id}>
                        Statement Ending: {formatDate(statement.statement_end_date)} 
                        ({statement.total_transactions} transactions, {formatCurrency(statement.total_amount)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Statement Summary Card */}
              {selectedStatement && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Statement Period</p>
                        <p className="text-lg font-semibold">
                          {formatDate(selectedStatement.statement_start_date)} - {formatDate(selectedStatement.statement_end_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                        <p className="text-lg font-semibold">{selectedStatement.total_transactions}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                        <p className="text-lg font-semibold">{formatCurrency(selectedStatement.total_amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Gallons</p>
                        <p className="text-lg font-semibold">{formatNumber(selectedStatement.total_gallons)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Upload Date</p>
                        <p className="text-lg font-semibold">{formatDate(selectedStatement.upload_date)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                        <div className="mt-1">{getStatusBadge(selectedStatement.status)}</div>
                      </div>
                    </div>

                    {selectedStatement.ai_processing_notes && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-2">AI Processing Notes</p>
                        <p className="text-sm">{selectedStatement.ai_processing_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Transactions Table */}
          {selectedStatementId && (
            <Card>
              <CardHeader>
                <CardTitle>Statement Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <FuelTransactionsTable
                  transactions={transactions}
                  loading={loading}
                  onEditTransaction={setEditingTransaction}
                  onReviewTransaction={setReviewingTransaction}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <FuelAnalytics transactions={transactions} />
        </TabsContent>

        <TabsContent value="by-vehicle">
          <FuelByVehicle transactions={transactions} />
        </TabsContent>

        <TabsContent value="by-driver">
          <FuelByDriver transactions={transactions} />
        </TabsContent>
      </Tabs>

      {/* Edit Transaction Dialog */}
      <Dialog open={!!editingTransaction} onOpenChange={() => setEditingTransaction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Transaction editing interface coming soon...
            </p>
            {editingTransaction && (
              <div className="text-sm">
                <p><strong>Driver:</strong> {editingTransaction.employee_name}</p>
                <p><strong>Date:</strong> {formatDate(editingTransaction.transaction_date)}</p>
                <p><strong>Total:</strong> {formatCurrency(editingTransaction.total_cost)}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Transaction Dialog */}
      <Dialog open={!!reviewingTransaction} onOpenChange={() => setReviewingTransaction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Transaction review interface coming soon...
            </p>
            {reviewingTransaction && (
              <div className="space-y-2 text-sm">
                <p><strong>Driver:</strong> {reviewingTransaction.employee_name}</p>
                <p><strong>Date:</strong> {formatDate(reviewingTransaction.transaction_date)}</p>
                <p><strong>Total:</strong> {formatCurrency(reviewingTransaction.total_cost)}</p>
                {reviewingTransaction.flag_reason && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-800 font-medium">Flag Reason:</p>
                    <p className="text-red-700">{reviewingTransaction.flag_reason}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Wizard */}
      <FuelUploadWizard
        isOpen={showUploadWizard}
        onClose={() => setShowUploadWizard(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}