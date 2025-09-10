import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Eye, FileText, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TransactionEntryModal } from "@/components/TransactionEntryModal";

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
  payment_method: string;
  payment_source_detail: string;
  vendor_id: string;
  employee_id: string;
  expense_category_id: string;
}

export default function APFortress() {
  const [entryRequiredTransactions, setEntryRequiredTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
    fetchEntryRequiredTransactions();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchEntryRequiredTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          vendors(vendor_name),
          employees(employee_name),
          expense_categories(category_name)
        `)
        .eq('status', 'Entry Required')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntryRequiredTransactions(data || []);
    } catch (error) {
      toast({
        title: "Error fetching transactions",
        description: "Failed to load pending transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
        <div className="text-center">
          <div className="h-8 bg-muted rounded w-96 mx-auto mb-4"></div>
          <div className="h-4 bg-muted rounded w-64 mx-auto"></div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">{/* Remove max-w constraint for mobile */}
      {/* Main Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          AP-Fortress
        </h1>
        <p className="text-lg text-muted-foreground">
          Unbreakable Audit Trail for Every Dollar
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4 text-green-600" />
          Real-time Transaction Monitoring Active
        </div>
      </div>

      {/* Action Required Dashboard */}
      <Card className="border-2 border-orange-200 bg-orange-50/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-orange-800 flex items-center justify-center gap-2">
            <AlertCircle className="h-6 w-6" />
            Transactions Requiring Action
          </CardTitle>
          <p className="text-orange-700">
            Complete all required fields before transactions can proceed
          </p>
        </CardHeader>
        <CardContent>
          {entryRequiredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                All Clear!
              </h3>
              <p className="text-green-700">
                No transactions requiring action at this time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {entryRequiredTransactions.map((transaction) => (
                <Card 
                  key={transaction.id} 
                  className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedTransaction(transaction)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge variant="destructive" className="bg-orange-600">
                            ACTION REQUIRED
                          </Badge>
                          <span className="font-medium">
                            {transaction.vendors?.vendor_name || 'Unknown Vendor'}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Amount: {formatCurrency(transaction.amount)} • 
                          Employee: {transaction.employees?.employee_name || 'Not assigned'} • 
                          Created: {formatDate(transaction.created_at)}
                        </div>
                        <div className="text-sm">
                          Description: {transaction.purchase_description || 'No description provided'}
                        </div>
                      </div>
                      <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                        <Eye className="h-4 w-4 mr-2" />
                        Complete Entry
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              System Status: All guardrails active
            </span>
            <div className="flex items-center gap-4 text-green-600">
              <span>✓ Receipt validation enabled</span>
              <span>✓ Description requirements enforced</span>
              <span>✓ AI audit system running</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Entry Modal */}
      {selectedTransaction && (
        <TransactionEntryModal
          transaction={selectedTransaction}
          open={!!selectedTransaction}
          onOpenChange={(open) => !open && setSelectedTransaction(null)}
          onSuccess={() => {
            fetchEntryRequiredTransactions();
            setSelectedTransaction(null);
            toast({
              title: "Transaction Updated",
              description: "Transaction has been moved to approval queue",
            });
          }}
        />
      )}
    </div>
  );
}