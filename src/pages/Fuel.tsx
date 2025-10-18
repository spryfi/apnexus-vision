import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertTriangle, DollarSign, Droplet, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FuelUploadWizard } from "@/components/FuelUploadWizard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";

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

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('fuel_transactions_new')
        .select('*')
        .order('transaction_date', { ascending: false });

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

      {/* Recent Transactions Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Fuel Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            Showing the most recent fuel transactions. Click "View All Transactions" to see the complete list with advanced filtering.
          </div>
          <div className="space-y-2">
            {transactions.slice(0, 10).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{transaction.employee_name}</span>
                    {transaction.vehicle_id && (
                      <Badge variant="outline" className="text-xs">{transaction.vehicle_id}</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(transaction.transaction_date)} • {transaction.merchant_name || 'Unknown Merchant'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(transaction.total_cost)}</div>
                  <div className="text-sm text-muted-foreground">{formatNumber(transaction.gallons)} gal</div>
                </div>
              </div>
            ))}
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
  );
}