import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Save, FileText } from "lucide-react";

interface Transaction {
  id: string;
  status: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  transaction_memo?: string;
  payment_method: string;
  payment_source: string;
  check_number: string;
  paid_date: string;
  invoice_receipt_url: string;
  audit_trail: string;
  vendors: { vendor_name: string };
  employees: { employee_name: string };
  expense_categories: { category_name: string };
}

interface TransactionDetailDialogProps {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function TransactionDetailDialog({ 
  transaction, 
  open, 
  onOpenChange, 
  onUpdate 
}: TransactionDetailDialogProps) {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const { userProfile } = useAuth();

  const [formData, setFormData] = useState({
    status: transaction.status,
    paid_date: transaction.paid_date || '',
    check_number: transaction.check_number || '',
    payment_source: transaction.payment_source || '',
  });

  const canApprove = userProfile?.role === 'Admin' || userProfile?.role === 'Approver';
  const canEdit = userProfile?.role === 'Admin' || userProfile?.role === 'User';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'Not set';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending Approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved for Payment':
        return 'bg-blue-100 text-blue-800';
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Reconciled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    // Validation rules
    if (newStatus === 'Paid') {
      if (!transaction.invoice_receipt_url) {
        toast({
          title: "Cannot mark as paid",
          description: "Invoice/receipt scan is required before marking as paid",
          variant: "destructive",
        });
        return;
      }
      if (!transaction.transaction_memo) {
        toast({
          title: "Cannot mark as paid",
          description: "Purchase description is required before marking as paid",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'Paid' && !transaction.paid_date) {
        updateData.paid_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transaction.id);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Transaction status changed to ${newStatus}`,
      });

      onUpdate();
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          status: formData.status as any,
          paid_date: formData.paid_date || null,
          check_number: formData.check_number || null,
          payment_source: formData.payment_source || null,
        })
        .eq('id', transaction.id);

      if (error) throw error;

      toast({
        title: "Transaction updated",
        description: "Changes have been saved successfully",
      });

      onUpdate();
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Error saving changes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const approveTransaction = () => handleStatusChange('Approved for Payment');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Transaction Details</span>
            <Badge className={getStatusColor(transaction.status)}>
              {transaction.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Vendor: {transaction.vendors?.vendor_name} • Amount: {formatCurrency(transaction.amount)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Invoice Number</Label>
              <p className="text-sm">{transaction.invoice_number || 'Not provided'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
              <p className="text-sm font-semibold">{formatCurrency(transaction.amount)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Invoice Date</Label>
              <p className="text-sm">{formatDate(transaction.invoice_date)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Due Date</Label>
              <p className="text-sm">{formatDate(transaction.due_date)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Employee</Label>
              <p className="text-sm">{transaction.employees?.employee_name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Category</Label>
              <p className="text-sm">{transaction.expense_categories?.category_name}</p>
            </div>
          </div>

          <Separator />

          {/* Payment Information */}
          <div>
            <h3 className="text-lg font-medium mb-4">Payment Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Payment Method</Label>
                <p className="text-sm">{transaction.payment_method}</p>
              </div>
              {isEditing ? (
                <>
                  <div>
                    <Label htmlFor="payment_source">Payment Source</Label>
                    <Input
                      id="payment_source"
                      value={formData.payment_source}
                      onChange={(e) => setFormData({ ...formData, payment_source: e.target.value })}
                      placeholder="e.g., Amex Gold x1005"
                    />
                  </div>
                  {transaction.payment_method === 'Check' && (
                    <div>
                      <Label htmlFor="check_number">Check Number</Label>
                      <Input
                        id="check_number"
                        value={formData.check_number}
                        onChange={(e) => setFormData({ ...formData, check_number: e.target.value })}
                        placeholder="Check number"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="paid_date">Paid Date</Label>
                    <Input
                      id="paid_date"
                      type="date"
                      value={formData.paid_date}
                      onChange={(e) => setFormData({ ...formData, paid_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                        <SelectItem value="Approved for Payment">Approved for Payment</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Reconciled">Reconciled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Payment Source</Label>
                    <p className="text-sm">{transaction.payment_source || 'Not specified'}</p>
                  </div>
                  {transaction.check_number && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Check Number</Label>
                      <p className="text-sm">{transaction.check_number}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Paid Date</Label>
                    <p className="text-sm">{formatDate(transaction.paid_date)}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Purchase Description */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Purchase Description</Label>
            <p className="text-sm mt-1 p-3 bg-muted rounded-md">{transaction.transaction_memo}</p>
          </div>

          {/* Receipt */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Invoice/Receipt</Label>
            <div className="mt-1">
              {transaction.invoice_receipt_url ? (
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  View Receipt
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">No receipt uploaded</p>
              )}
            </div>
          </div>

          {/* Audit Trail */}
          {transaction.audit_trail && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Audit Trail</Label>
              <div className="mt-1 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                {transaction.audit_trail}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveChanges} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {canEdit && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              )}
              {canApprove && transaction.status === 'Pending Approval' && (
                <Button onClick={approveTransaction} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Approve
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}