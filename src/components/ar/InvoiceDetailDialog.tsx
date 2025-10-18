import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Download, Send, Edit } from "lucide-react";

interface InvoiceDetailDialogProps {
  invoiceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InvoiceDetailDialog = ({ invoiceId, open, onOpenChange }: InvoiceDetailDialogProps) => {
  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices_receivable")
        .select(`
          *,
          customers (
            first_name,
            last_name,
            address,
            email,
            phone
          )
        `)
        .eq("id", invoiceId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!invoiceId,
  });

  const { data: lineItems } = useQuery({
    queryKey: ["invoice-line-items", invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_line_items")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("created_at");

      if (error) throw error;
      return data;
    },
    enabled: !!invoiceId,
  });

  const { data: payments } = useQuery({
    queryKey: ["ar-payments", invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ar_payments")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("payment_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!invoiceId,
  });

  if (isLoading || !invoice) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <Skeleton className="h-96" />
        </DialogContent>
      </Dialog>
    );
  }

  const subtotal = lineItems?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
  const balanceDue = Number(invoice.amount) - Number(invoice.amount_paid || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice Details</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <Send className="h-4 w-4 mr-2" />
                Send Reminder
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Header */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-lg mb-2">Bill To:</h3>
              {invoice.customers && (
                <div className="text-sm space-y-1">
                  <p className="font-medium">
                    {invoice.customers.first_name} {invoice.customers.last_name}
                  </p>
                  <p>{invoice.customers.address}</p>
                  <p>{invoice.customers.email}</p>
                  <p>{invoice.customers.phone}</p>
                </div>
              )}
            </div>

            <div className="text-right">
              <h3 className="font-semibold text-2xl mb-2">Invoice {invoice.invoice_number}</h3>
              <div className="text-sm space-y-1">
                <div className="flex justify-end gap-2">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="outline">{invoice.status}</Badge>
                </div>
                <div className="flex justify-end gap-2">
                  <span className="text-muted-foreground">Invoice Date:</span>
                  <span>{format(new Date(invoice.invoice_date), "MMM d, yyyy")}</span>
                </div>
                <div className="flex justify-end gap-2">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span>{format(new Date(invoice.due_date), "MMM d, yyyy")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {invoice.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">{invoice.description}</p>
            </div>
          )}

          {/* Line Items */}
          <div>
            <h3 className="font-semibold mb-2">Items</h3>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{Number(item.quantity).toFixed(2)}</TableCell>
                      <TableCell className="text-right">${Number(item.unit_price).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${Number(item.amount).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>${Number(invoice.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Amount Paid:</span>
                <span className="font-medium">${Number(invoice.amount_paid || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-red-600 border-t pt-2">
                <span>Balance Due:</span>
                <span>${balanceDue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment History */}
          {payments && payments.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Payment History</h3>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{format(new Date(payment.payment_date), "MMM d, yyyy")}</TableCell>
                        <TableCell className="font-medium">${Number(payment.amount).toFixed(2)}</TableCell>
                        <TableCell>{payment.payment_method}</TableCell>
                        <TableCell>{payment.reference_number || "-"}</TableCell>
                        <TableCell>{payment.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
