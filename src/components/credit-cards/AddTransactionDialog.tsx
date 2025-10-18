import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Upload, X } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { validateFile } from "@/utils/fileValidation";

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddTransactionDialog = ({ open, onOpenChange }: AddTransactionDialogProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    card_id: "",
    transaction_date: new Date().toISOString().split('T')[0],
    merchant: "",
    amount: "",
    category_id: "",
    description: "",
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch cards
  const { data: cards } = useQuery({
    queryKey: ["company-cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_cards")
        .select("*")
        .eq("is_active", true)
        .order("cardholder_name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .order("category_name");
      if (error) throw error;
      return data;
    },
  });

  const createTransaction = useMutation({
    mutationFn: async (data: typeof formData & { receipt_url: string; receipt_file_name: string }) => {
      const { error } = await supabase
        .from("credit_card_transactions")
        .insert({
          card_id: data.card_id,
          transaction_date: data.transaction_date,
          merchant: data.merchant,
          amount: parseFloat(data.amount),
          category_id: data.category_id || null,
          description: data.description,
          receipt_url: data.receipt_url,
          receipt_uploaded: true,
          status: "Approved",
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-card-transactions"] });
      toast({
        title: "Success",
        description: "Transaction added successfully",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    });

    if (!validation.valid) {
      toast({
        title: "Invalid File",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setReceiptFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all required fields
    if (!formData.card_id || !formData.merchant || !formData.amount || !formData.description || !receiptFile) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including receipt upload",
        variant: "destructive",
      });
      return;
    }

    if (formData.description.length < 10) {
      toast({
        title: "Description Too Short",
        description: "Description must be at least 10 characters",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload receipt to Supabase Storage
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `credit-card-receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('receipt-images')
        .upload(filePath, receiptFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('receipt-images')
        .getPublicUrl(filePath);

      // Create transaction with receipt
      await createTransaction.mutateAsync({
        ...formData,
        receipt_url: publicUrl,
        receipt_file_name: receiptFile.name,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload receipt",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      card_id: "",
      transaction_date: new Date().toISOString().split('T')[0],
      merchant: "",
      amount: "",
      category_id: "",
      description: "",
    });
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const isSaveDisabled = !formData.card_id || !formData.merchant || !formData.amount || !formData.description || !receiptFile || uploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Credit Card Transaction</DialogTitle>
        </DialogHeader>

        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            <strong>EMPLOYEE CREDIT CARD POLICY:</strong> Every purchase must have a receipt. 
            Transactions without receipts will be flagged and may be deducted from payroll.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="card">Card *</Label>
            <Select value={formData.card_id} onValueChange={(value) => setFormData({ ...formData, card_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select card" />
              </SelectTrigger>
              <SelectContent>
                {cards?.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    {card.cardholder_name} - *{card.last_four}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Transaction Date *</Label>
            <Input
              type="date"
              value={formData.transaction_date}
              onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="merchant">Merchant *</Label>
            <Input
              value={formData.merchant}
              onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              placeholder="e.g., Home Depot"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category (optional)" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description * (min 10 characters)</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the purchase..."
              rows={3}
              required
              minLength={10}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receipt" className="flex items-center gap-2">
              Receipt Upload *
              <span className="text-destructive text-sm">(Required)</span>
            </Label>
            
            {!receiptFile ? (
              <div className={`border-2 border-dashed rounded-lg p-6 text-center ${!receiptFile ? 'border-destructive bg-destructive/5' : 'border-border'}`}>
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                  id="receipt-upload"
                />
                <Label htmlFor="receipt-upload" className="cursor-pointer">
                  <div className="text-sm text-muted-foreground mb-1">
                    Click to upload receipt
                  </div>
                  <div className="text-xs text-muted-foreground">
                    PDF, JPG, PNG (Max 10MB)
                  </div>
                </Label>
                <p className="text-sm text-destructive mt-2">
                  ⚠️ Receipt is required. Please upload a photo or scan of the receipt.
                </p>
              </div>
            ) : (
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{receiptFile.name}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={removeReceipt}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {receiptPreview && (
                  <img src={receiptPreview} alt="Receipt preview" className="max-h-40 mx-auto rounded" />
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaveDisabled}>
              {uploading ? "Uploading..." : "Save Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
