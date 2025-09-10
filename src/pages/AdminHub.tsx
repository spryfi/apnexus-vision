import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, AlertTriangle, BarChart3, Settings, Eye, ThumbsUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TransactionDetailDialog } from "@/components/TransactionDetailDialog";

interface Transaction {
  id: string;
  status: string;
  amount: number;
  vendors: { vendor_name: string };
  employees: { employee_name: string };
  expense_categories: { category_name: string };
  invoice_date: string;
  due_date: string;
  purchase_description: string;
  invoice_receipt_url: string;
  ai_flagged_status: boolean;
  ai_flag_reason: string;
  created_at: string;
  invoice_number: string;
  payment_method: string;
  payment_source: string;
  check_number: string;
  paid_date: string;
  audit_trail: string;
}

interface FlaggedTransaction {
  id: string;
  original_transaction_id: string;
  flag_reason: string;
  flagged_at: string;
  reviewed: boolean;
  transaction_data: any;
}

export default function AdminHub() {
  const [pendingApproval, setPendingApproval] = useState<Transaction[]>([]);
  const [flaggedTransactions, setFlaggedTransactions] = useState<FlaggedTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
    fetchPendingApproval();
    fetchFlaggedTransactions();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== 'paul@spryfi.net') {
      toast({
        title: "Access Denied",
        description: "Admin access required",
        variant: "destructive",
      });
      return;
    }
    setCurrentUser(user);
  };

  const fetchPendingApproval = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          vendors(vendor_name),
          employees(employee_name),
          expense_categories(category_name)
        `)
        .eq('status', 'Pending Approval')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingApproval(data || []);
    } catch (error) {
      toast({
        title: "Error fetching pending approvals",
        description: "Failed to load pending transactions",
        variant: "destructive",
      });
    }
  };

  const fetchFlaggedTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('flagged_transactions')
        .select('*')
        .eq('reviewed', false)
        .order('flagged_at', { ascending: false });

      if (error) throw error;
      setFlaggedTransactions(data || []);
    } catch (error) {
      console.error('Error fetching flagged transactions:', error);
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
        title: "Transaction Approved",
        description: "Transaction has been approved for payment",
      });

      fetchPendingApproval();
    } catch (error) {
      toast({
        title: "Error approving transaction",
        description: "Failed to approve transaction",
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
        <div className="h-8 bg-muted rounded w-48 mb-4"></div>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.email !== 'paul@spryfi.net') {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-red-800 mb-2">Access Denied</h2>
        <p className="text-red-600">Admin access required for this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Hub</h1>
        <p className="text-muted-foreground">
          Complete oversight and control of all transactions
        </p>
      </div>

      {/* Admin Tabs */}
      <Tabs defaultValue="approval" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="approval" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approval Queue ({pendingApproval.length})
          </TabsTrigger>
          <TabsTrigger value="ai-review" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            AI Review ({flaggedTransactions.length})
          </TabsTrigger>
          <TabsTrigger value="reporting" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Reporting
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Management
          </TabsTrigger>
        </TabsList>

        {/* Approval Queue Tab */}
        <TabsContent value="approval">
          <Card>
            <CardHeader>
              <CardTitle>Transactions Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingApproval.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">No transactions pending approval</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingApproval.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {transaction.vendors?.vendor_name}
                        </TableCell>
                        <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                        <TableCell>{transaction.employees?.employee_name}</TableCell>
                        <TableCell>{transaction.expense_categories?.category_name}</TableCell>
                        <TableCell>{formatDate(transaction.invoice_date)}</TableCell>
                        <TableCell>
                          {transaction.invoice_receipt_url ? (
                            <Badge variant="secondary">✓ Uploaded</Badge>
                          ) : (
                            <Badge variant="destructive">Missing</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedTransaction(transaction)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => approveTransaction(transaction.id)}
                              disabled={!transaction.invoice_receipt_url}
                            >
                              <ThumbsUp className="h-4 w-4 mr-2" />
                              Approve
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

        {/* AI Review Tab */}
        <TabsContent value="ai-review">
          <Card>
            <CardHeader>
              <CardTitle>AI Flagged Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {flaggedTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">No flagged transactions requiring review</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {flaggedTransactions.map((flagged) => (
                    <Card key={flagged.id} className="border-l-4 border-l-red-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive">AI FLAGGED</Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(flagged.flagged_at)}
                              </span>
                            </div>
                            <div className="font-medium text-red-800">
                              Reason: {flagged.flag_reason}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Transaction ID: {flagged.original_transaction_id}
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            Review Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reporting Tab */}
        <TabsContent value="reporting">
          <Card>
            <CardHeader>
              <CardTitle>Reporting Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Comprehensive reporting interface coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Management Tab */}
        <TabsContent value="management">
          <Card>
            <CardHeader>
              <CardTitle>System Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Vendor, employee, and category management coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction Detail Dialog */}
      {selectedTransaction && (
        <TransactionDetailDialog
          transaction={selectedTransaction}
          open={!!selectedTransaction}
          onOpenChange={(open) => !open && setSelectedTransaction(null)}
          onUpdate={fetchPendingApproval}
        />
      )}
    </div>
  );
}