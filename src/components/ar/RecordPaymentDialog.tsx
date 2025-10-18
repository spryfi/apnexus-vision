import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface RecordPaymentDialogProps {
  invoiceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const RecordPaymentDialog = ({
  invoiceId,
  open,
  onOpenChange,
  onSuccess,
}: RecordPaymentDialogProps) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      payment_date: new Date().toISOString().split("T")[0],
      amount: "",
      payment_method: "",
      reference_number: "",
      notes: "",
    },
  });

  const { data: invoice } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices_receivable")
        .select("*")
        .eq("id", invoiceId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!invoiceId,
  });

  const balanceDue = invoice ? Number(invoice.amount) - Number(invoice.amount_paid || 0) : 0;

  const recordPaymentMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      const paymentAmount = parseFloat(formData.amount);

      // Create payment record
      const { error: paymentError } = await supabase
        .from("ar_payments")
        .insert({
          invoice_id: invoiceId,
          payment_date: formData.payment_date,
          amount: paymentAmount,
          payment_method: formData.payment_method,
          reference_number: formData.reference_number || null,
          notes: formData.notes || null,
          created_by: user?.id,
        });

      if (paymentError) throw paymentError;

      // Update invoice
      const newAmountPaid = Number(invoice?.amount_paid || 0) + paymentAmount;
      const newStatus =
        newAmountPaid >= Number(invoice?.amount)
          ? "Paid"
          : newAmountPaid > 0
          ? "Partial"
          : "Pending";

      const { error: updateError } = await supabase
        .from("invoices_receivable")
        .update({
          amount_paid: newAmountPaid,
          status: newStatus,
        })
        .eq("id", invoiceId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["ar-payments", invoiceId] });
      toast.success("Payment recorded successfully");
      reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Failed to record payment");
      console.error(error);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => recordPaymentMutation.mutate(data))} className="space-y-4">
          <div className="space-y-2">
            <Label>Invoice Number</Label>
            <Input value={invoice?.invoice_number || ""} disabled />
          </div>

          <div className="space-y-2">
            <Label>Balance Due</Label>
            <Input value={`$${balanceDue.toFixed(2)}`} disabled />
          </div>

          <div className="space-y-2">
            <Label>Payment Date *</Label>
            <Input type="date" {...register("payment_date", { required: true })} />
          </div>

          <div className="space-y-2">
            <Label>Payment Amount *</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={balanceDue}
              {...register("amount", { required: true, max: balanceDue })}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label>Payment Method *</Label>
            <Select onValueChange={(value) => setValue("payment_method", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Check">Check</SelectItem>
                <SelectItem value="ACH">ACH</SelectItem>
                <SelectItem value="Wire Transfer">Wire Transfer</SelectItem>
                <SelectItem value="Credit Card">Credit Card</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Reference Number</Label>
            <Input {...register("reference_number")} placeholder="Check #, Transaction ID, etc." />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea {...register("notes")} rows={3} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={recordPaymentMutation.isPending}>
              {recordPaymentMutation.isPending ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
