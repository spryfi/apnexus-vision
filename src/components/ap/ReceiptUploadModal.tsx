import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileCheck, Loader2, Upload, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ReceiptUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseId: string;
  onSuccess: () => void;
}

export function ReceiptUploadModal({ open, onOpenChange, expenseId, onSuccess }: ReceiptUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const fileType = selectedFile.type;
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    
    if (!validTypes.includes(fileType)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, JPG, JPEG, or PNG file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    
    setUploading(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${expenseId}-${Date.now()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('receipt-images')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('receipt-images')
        .getPublicUrl(filePath);
      
      // Update expense transaction
      const { error: updateError } = await supabase
        .from('expense_transactions')
        .update({
          receipt_url: publicUrl,
          has_receipt: true,
          receipt_uploaded_at: new Date().toISOString(),
          receipt_uploaded_by: user?.id,
          flagged_for_review: false,
          flag_reason: null,
          // Auto-approve if receipt was the only issue
          approval_status: 'auto_approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id
        })
        .eq('id', expenseId);
      
      if (updateError) throw updateError;
      
      toast({
        title: "Receipt uploaded successfully",
        description: "The expense has been auto-approved",
      });
      
      setFile(null);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Failed to upload receipt",
        description: error.message,
        variant: "destructive",
      });
      console.error('Receipt upload error:', error);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) setFile(null);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Receipt</DialogTitle>
          <DialogDescription>
            Upload a receipt or proof of payment for this expense
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="receipt-file">Select File</Label>
            <Input
              id="receipt-file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground mt-1">
              PDF, JPG, or PNG (max 10MB)
            </p>
          </div>
          
          {file && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded p-3">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">{file.name}</p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {!file && (
            <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Uploading a receipt will automatically approve this expense
                </p>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Receipt
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
