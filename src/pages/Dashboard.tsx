import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, DollarSign, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import QuickStartActionHub from "@/components/QuickStartActionHub";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";

interface Transaction {
  id: string;
  status: string;
  amount: number;
  due_date: string;
  invoice_date: string;
  vendors: { vendor_name: string };
  employees: { employee_name: string };
}

interface DashboardStats {
  totalOverdue: number;
  dueThisWeek: number;
  unreconciled: number;
  pendingApproval: number;
  entryRequired: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOverdue: 0,
    dueThisWeek: 0,
    unreconciled: 0,
    pendingApproval: 0,
    entryRequired: 0
  });
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<Transaction[]>([]);
  const [entryRequiredTransactions, setEntryRequiredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const { toast } = useToast();
  const { userProfile } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all transactions with vendor and employee data
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          *,
          vendors(vendor_name),
          employees(employee_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate stats
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const overdue = transactions?.filter(t => 
        t.due_date && new Date(t.due_date) < now && t.status !== 'Paid' && t.status !== 'Reconciled'
      ) || [];

      const dueThisWeek = transactions?.filter(t => 
        t.due_date && 
        new Date(t.due_date) >= now && 
        new Date(t.due_date) <= weekFromNow &&
        t.status === 'Approved for Payment'
      ) || [];

      const unreconciled = transactions?.filter(t => t.status === 'Paid') || [];
      const pending = transactions?.filter(t => t.status === 'Pending Approval') || [];
      const entryRequired = transactions?.filter(t => t.status === 'Entry Required') || [];

      setStats({
        totalOverdue: overdue.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
        dueThisWeek: dueThisWeek.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
        unreconciled: unreconciled.length,
        pendingApproval: pending.length,
        entryRequired: entryRequired.length
      });

      setPendingTransactions(pending.slice(0, 5));
      setUpcomingPayments(dueThisWeek.slice(0, 5));
      setEntryRequiredTransactions(entryRequired.slice(0, 5));
    } catch (error) {
      toast({
        title: "Error fetching dashboard data",
        description: "Failed to load dashboard information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const approveTransaction = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'Approved for Payment' })
        .eq('id', transactionId);

      if (error) throw error;

      toast({
        title: "Transaction approved",
        description: "The transaction has been approved for payment",
      });

      fetchDashboardData(); // Refresh data
    } catch (error) {
      toast({
        title: "Error approving transaction",
        description: "Failed to approve the transaction",
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending Approval':
        return 'bg-warning text-warning-foreground';
      case 'Approved for Payment':
        return 'bg-info text-info-foreground';
      case 'Paid':
        return 'bg-success text-success-foreground';
      case 'Reconciled':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your accounts payable activities
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(stats.totalOverdue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {formatCurrency(stats.dueThisWeek)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unreconciled</CardTitle>
            <DollarSign className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">
              {stats.unreconciled}
            </div>
            <p className="text-xs text-muted-foreground">transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {stats.pendingApproval}
            </div>
            <p className="text-xs text-muted-foreground">transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Conditional Main Content */}
      {stats.entryRequired > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Transactions Requiring Action Queue */}
          <Card>
            <CardHeader>
              <CardTitle>Transactions Requiring Action</CardTitle>
              <CardDescription>
                Transactions that need entry or completion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {entryRequiredTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{transaction.vendors?.vendor_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(transaction.amount)} • Due {formatDate(transaction.due_date)}
                      </p>
                      <Badge className="bg-warning text-warning-foreground text-xs">
                        Entry Required
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {/* Navigate to transaction details */}}
                    >
                      Complete
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Payments</CardTitle>
              <CardDescription>
                Approved transactions due this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingPayments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No payments due this week
                  </p>
                ) : (
                  upcomingPayments.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{transaction.vendors?.vendor_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(transaction.amount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(transaction.due_date)}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <QuickStartActionHub onEnterExpense={() => setShowAddTransaction(true)} />
      )}

      <AddTransactionDialog 
        open={showAddTransaction}
        onOpenChange={setShowAddTransaction}
        onSuccess={() => {
          setShowAddTransaction(false);
          fetchDashboardData();
        }}
      />
    </div>
  );
}