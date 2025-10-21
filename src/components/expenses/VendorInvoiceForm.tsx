import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const vendorInvoiceSchema = z.object({
  vendor_id: z.string().min(1, "Please select a vendor"),
  invoice_number: z.string().min(1, "Invoice number is required"),
  invoice_date: z.string().min(1, "Invoice date is required"),
  due_date: z.string().min(1, "Due date is required"),
  amount: z.string().min(1, "Amount is required"),
  description: z.string().min(1, "Description is required"),
  notes: z.string().optional(),
});

type VendorInvoiceFormData = z.infer<typeof vendorInvoiceSchema>;

interface VendorInvoiceFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function VendorInvoiceForm({ onSuccess, onCancel }: VendorInvoiceFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<VendorInvoiceFormData>({
    resolver: zodResolver(vendorInvoiceSchema),
  });

  useEffect(() => {
    loadVendors();
  }, []);

  async function loadVendors() {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, vendor_name')
        .order('vendor_name');
      
      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error loading vendors:', error);
      toast({
        title: "Error",
        description: "Failed to load vendors",
        variant: "destructive",
      });
    } finally {
      setLoadingVendors(false);
    }
  }

  function handleReceiptChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, or PDF file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setReceiptFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  }

  function removeReceipt() {
    setReceiptFile(null);
    setReceiptPreview(null);
  }

  async function uploadReceipt(invoiceId: string): Promise<string | null> {
    if (!receiptFile) return null;

    try {
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${invoiceId}_${Date.now()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('receipt-images')
        .upload(filePath, receiptFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('receipt-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading receipt:', error);
      throw error;
    }
  }

  async function onSubmit(data: VendorInvoiceFormData) {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: invoice, error: insertError } = await supabase
        .from('expense_transactions')
        .insert({
          vendor_id: data.vendor_id,
          invoice_number: data.invoice_number,
          transaction_date: data.invoice_date,
          due_date: data.due_date,
          amount: parseFloat(data.amount),
          description: data.description,
          notes: data.notes || null,
          expense_type: 'vendor_invoice',
          payment_method: 'invoice',
          payment_status: 'pending',
          approval_status: parseFloat(data.amount) < 2500 ? 'auto_approved' : 'pending_review',
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (receiptFile && invoice) {
        const receiptUrl = await uploadReceipt(invoice.id);
        
        if (receiptUrl) {
          const { error: updateError } = await supabase
            .from('expense_transactions')
            .update({ receipt_url: receiptUrl })
            .eq('id', invoice.id);

          if (updateError) throw updateError;
        }
      }

      toast({
        title: "Success",
        description: "Vendor invoice added successfully",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save invoice",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="vendor_id">
            Vendor <span className="text-destructive">*</span>
          </Label>
          {loadingVendors ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading vendors...
            </div>
          ) : (
            <Select onValueChange={(value) => setValue('vendor_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.vendor_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {errors.vendor_id && (
            <p className="text-sm text-destructive">{errors.vendor_id.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="invoice_number">
            Invoice Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="invoice_number"
            placeholder="INV-12345"
            {...register('invoice_number')}
          />
          {errors.invoice_number && (
            <p className="text-sm text-destructive">{errors.invoice_number.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="invoice_date">
              Invoice Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="invoice_date"
              type="date"
              {...register('invoice_date')}
            />
            {errors.invoice_date && (
              <p className="text-sm text-destructive">{errors.invoice_date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">
              Due Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="due_date"
              type="date"
              {...register('due_date')}
            />
            {errors.due_date && (
              <p className="text-sm text-destructive">{errors.due_date.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">
            Amount <span className="text-destructive">*</span>
          </Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register('amount')}
          />
          {errors.amount && (
            <p className="text-sm text-destructive">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Brief description of the invoice"
            rows={3}
            {...register('description')}
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Additional notes or comments"
            rows={2}
            {...register('notes')}
          />
        </div>

        <div className="space-y-2">
          <Label>Receipt (Optional)</Label>
          <div className="border-2 border-dashed rounded-lg p-4">
            {receiptFile ? (
              <div className="space-y-2">
                {receiptPreview && (
                  <img
                    src={receiptPreview}
                    alt="Receipt preview"
                    className="max-h-48 rounded"
                  />
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {receiptFile.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeReceipt}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-2 cursor-pointer">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to upload receipt (JPG, PNG, or PDF)
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={handleReceiptChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Invoice
        </Button>
      </div>
    </form>
  );
}
