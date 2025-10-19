import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MarkAsPaidModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    invoice_number: string;
    amount: number;
  };
  onSuccess: () => void;
}

export function MarkAsPaidModal({ open, onOpenChange, invoice, onSuccess }: MarkAsPaidModalProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    payment_amount: invoice.amount.toString(),
    payment_method: '',
    check_number: '',
    notes: '',
  });

  const resetForm = () => {
    setPaymentForm({
      payment_date: new Date().toISOString().split('T')[0],
      payment_amount: invoice.amount.toString(),
      payment_method: '',
      check_number: '',
      notes: '',
    });
    setPaymentReceipt(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileType = file.type;
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      
      if (!validTypes.includes(fileType)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, JPG, JPEG, or PNG file",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "File must be less than 10MB",
          variant: "destructive",
        });
        return;
      }

      setPaymentReceipt(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentReceipt) {
      toast({
        title: "Payment receipt required",
        description: "⚠️ You must upload a payment confirmation or check image before marking this invoice as paid.",
        variant: "destructive",
      });
      return;
    }

    if (!paymentForm.payment_method) {
      toast({
        title: "Payment method required",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    if (paymentForm.payment_method === 'Check' && !paymentForm.check_number) {
      toast({
        title: "Check number required",
        description: "Please enter the check number",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      // Upload payment receipt to Supabase Storage
      const fileExt = paymentReceipt.name.split('.').pop();
      const fileName = `payment_${invoice.id}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('invoice-receipts')
        .upload(filePath, paymentReceipt);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('invoice-receipts')
        .getPublicUrl(filePath);

      // Get current user for approval tracking
      const { data: { user } } = await supabase.auth.getUser();

      // Update transaction status and payment info
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'Paid' as const,
          paid_date: paymentForm.payment_date,
          payment_method: paymentForm.payment_method as "Credit Card" | "ACH" | "Check" | "Fleet Fuel Card" | "Debit Card",
          check_number: paymentForm.check_number || null,
          payment_receipt_url: publicUrl,
          payment_receipt_file_name: paymentReceipt.name,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', invoice.id);

      if (updateError) throw updateError;

      toast({
        title: "Invoice marked as paid",
        description: "Payment has been recorded successfully",
      });

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error processing payment",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Invoice as Paid</DialogTitle>
          <DialogDescription>
            Invoice #{invoice.invoice_number} - ${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="payment_date">Payment Date *</Label>
            <Input
              id="payment_date"
              type="date"
              value={paymentForm.payment_date}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="payment_amount">Payment Amount *</Label>
            <Input
              id="payment_amount"
              type="number"
              step="0.01"
              value={paymentForm.payment_amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_amount: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="payment_method">Payment Method *</Label>
            <Select
              value={paymentForm.payment_method}
              onValueChange={(value) => setPaymentForm({ ...paymentForm, payment_method: value })}
            >
              <SelectTrigger id="payment_method">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Check">Check</SelectItem>
                <SelectItem value="ACH">ACH Transfer</SelectItem>
                <SelectItem value="Credit Card">Credit Card</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Wire Transfer">Wire Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentForm.payment_method === 'Check' && (
            <div>
              <Label htmlFor="check_number">Check Number *</Label>
              <Input
                id="check_number"
                value={paymentForm.check_number}
                onChange={(e) => setPaymentForm({ ...paymentForm, check_number: e.target.value })}
                placeholder="Enter check number"
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              placeholder="Optional payment notes"
            />
          </div>

          <div>
            <Label htmlFor="payment_receipt">Payment Confirmation/Receipt *</Label>
            <div className="mt-2 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('payment_receipt')?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {paymentReceipt ? paymentReceipt.name : 'Upload Receipt (Required)'}
              </Button>
              <input
                id="payment_receipt"
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
            </div>
            {!paymentReceipt && (
              <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>⚠️ Payment receipt is mandatory</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              PDF, JPG, JPEG, or PNG (max 10MB)
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading || !paymentReceipt}>
              {uploading ? 'Processing...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
