import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, XCircle, Eye, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface PendingExpense {
  id: string;
  expense_type: string;
  transaction_date: string;
  amount: number;
  description: string;
  vendor_id?: string;
  vendors?: { vendor_name: string };
  employee_id?: string;
  employees_enhanced?: { full_name: string };
  category_id?: string;
  expense_categories?: { category_name: string };
  payment_status: string;
  approval_status: string;
  has_receipt: boolean;
  receipt_required: boolean;
  flag_reason?: string;
  notes?: string;
}

interface PendingReviewTabProps {
  onViewDetails?: (id: string) => void;
  onUploadReceipt?: (id: string) => void;
}

export function PendingReviewTab({ onViewDetails, onUploadReceipt }: PendingReviewTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<PendingExpense | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: pendingExpenses, isLoading } = useQuery({
    queryKey: ['expenses', 'pending-review'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_transactions')
        .select(`
          *,
          vendors(vendor_name),
          expense_categories(category_name)
        `)
        .eq('approval_status', 'pending_review')
        .order('transaction_date', { ascending: false });
      
      if (error) throw error;
      return data as PendingExpense[];
    }
  });

  const approveExpense = async (id: string, notes = '') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('expense_transactions')
        .update({
          approval_status: 'admin_approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          approval_notes: notes,
          flagged_for_review: false,
          flag_reason: null
        })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Expense approved",
        description: "Expense has been approved successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    } catch (error: any) {
      toast({
        title: "Error approving expense",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const rejectExpense = async () => {
    if (!selectedExpense || !rejectReason.trim()) {
      toast({
        title: "Rejection reason required",
        description: "Please provide a reason for rejecting this expense",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('expense_transactions')
        .update({
          approval_status: 'rejected',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          approval_notes: rejectReason
        })
        .eq('id', selectedExpense.id);
      
      if (error) throw error;
      
      toast({
        title: "Expense rejected",
        description: "Expense has been rejected",
      });
      
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setShowRejectDialog(false);
      setSelectedExpense(null);
      setRejectReason("");
    } catch (error: any) {
      toast({
        title: "Error rejecting expense",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getExpenseTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      vendor_invoice: 'Vendor Invoice',
      credit_card_purchase: 'Credit Card',
      fuel_purchase: 'Fuel',
      check_payment: 'Check',
      employee_reimbursement: 'Reimbursement',
      recurring_bill: 'Recurring',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading pending expenses...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                {pendingExpenses?.length || 0} expenses require your review
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                These expenses are missing required information or need admin approval.
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          {pendingExpenses?.map(expense => (
            <div key={expense.id} className="border rounded-lg p-4 bg-card">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{expense.description}</h4>
                    <Badge variant="outline">{getExpenseTypeLabel(expense.expense_type)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {expense.vendors?.vendor_name || 'No vendor'} • {format(new Date(expense.transaction_date), 'MMM dd, yyyy')}
                  </p>
                </div>
                <span className="text-lg font-bold">{formatCurrency(expense.amount)}</span>
              </div>
              
              {expense.flag_reason && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded p-3 mb-3">
                  <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                    ⚠️ {expense.flag_reason}
                  </p>
                </div>
              )}
              
              {expense.notes && (
                <div className="bg-muted rounded p-3 mb-3">
                  <p className="text-sm">
                    <strong>Notes:</strong> {expense.notes}
                  </p>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  onClick={() => approveExpense(expense.id)}
                  variant="default"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => {
                    setSelectedExpense(expense);
                    setShowRejectDialog(true);
                  }}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                {onViewDetails && (
                  <Button
                    onClick={() => onViewDetails(expense.id)}
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                )}
                {!expense.has_receipt && expense.receipt_required && onUploadReceipt && (
                  <Button
                    onClick={() => onUploadReceipt(expense.id)}
                    variant="outline"
                    size="sm"
                    className="text-orange-600 border-orange-300"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Receipt
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          {pendingExpenses?.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-1">All Clear!</h3>
              <p className="text-muted-foreground">
                No expenses require review at this time.
              </p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Expense</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this expense. This will be recorded in the approval notes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Rejection Reason *</Label>
              <Textarea
                id="reject-reason"
                placeholder="e.g., Missing documentation, invalid vendor, duplicate entry..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setSelectedExpense(null);
                setRejectReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={rejectExpense}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Reject Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
