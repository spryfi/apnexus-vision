import { useState } from "react";
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
import { Plus, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateInvoiceDialog = ({ open, onOpenChange }: CreateInvoiceDialogProps) => {
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unit_price: 0 },
  ]);
  const [taxPercent, setTaxPercent] = useState(0);
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      customer_id: "",
      invoice_number: `INV-${Date.now()}`,
      invoice_date: new Date().toISOString().split("T")[0],
      due_date: "",
      description: "",
    },
  });

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, first_name, last_name")
        .order("last_name");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const taxAmount = (subtotal * taxPercent) / 100;
      const total = subtotal + taxAmount;

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices_receivable")
        .insert({
          customer_id: formData.customer_id,
          invoice_number: formData.invoice_number,
          invoice_date: formData.invoice_date,
          due_date: formData.due_date,
          amount: total,
          amount_paid: 0,
          status: "Pending",
          description: formData.description,
          created_by: user?.id,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create line items
      const lineItemsData = lineItems
        .filter(item => item.description && item.quantity > 0)
        .map(item => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }));

      if (lineItemsData.length > 0) {
        const { error: lineItemsError } = await supabase
          .from("invoice_line_items")
          .insert(lineItemsData);

        if (lineItemsError) throw lineItemsError;
      }

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice created successfully");
      reset();
      setLineItems([{ description: "", quantity: 1, unit_price: 0 }]);
      setTaxPercent(0);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to create invoice");
      console.error(error);
    },
  });

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, unit_price: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const taxAmount = (subtotal * taxPercent) / 100;
  const total = subtotal + taxAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select onValueChange={(value) => setValue("customer_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.first_name} {customer.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Invoice Number *</Label>
              <Input {...register("invoice_number", { required: true })} />
            </div>

            <div className="space-y-2">
              <Label>Invoice Date *</Label>
              <Input type="date" {...register("invoice_date", { required: true })} />
            </div>

            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Input type="date" {...register("due_date", { required: true })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...register("description")} rows={3} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Line Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Line Item
              </Button>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description *</TableHead>
                    <TableHead className="w-[120px]">Quantity *</TableHead>
                    <TableHead className="w-[140px]">Unit Price *</TableHead>
                    <TableHead className="w-[140px]">Amount</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          value={item.description}
                          onChange={(e) => updateLineItem(index, "description", e.target.value)}
                          placeholder="Item description"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, "quantity", parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateLineItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        ${(item.quantity * item.unit_price).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {lineItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="flex justify-end items-center gap-4">
              <Label className="w-32 text-right">Subtotal:</Label>
              <div className="w-40 text-right font-medium">${subtotal.toFixed(2)}</div>
            </div>

            <div className="flex justify-end items-center gap-4">
              <Label className="w-32 text-right">Tax %:</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxPercent}
                onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                className="w-40"
              />
            </div>

            <div className="flex justify-end items-center gap-4">
              <Label className="w-32 text-right">Tax Amount:</Label>
              <div className="w-40 text-right font-medium">${taxAmount.toFixed(2)}</div>
            </div>

            <div className="flex justify-end items-center gap-4 text-lg">
              <Label className="w-32 text-right font-bold">Total:</Label>
              <div className="w-40 text-right font-bold">${total.toFixed(2)}</div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
