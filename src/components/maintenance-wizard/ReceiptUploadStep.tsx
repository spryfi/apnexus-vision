import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { MaintenanceFormData } from "../AddMaintenanceWizard";

interface ReceiptUploadStepProps {
  formData: MaintenanceFormData;
  setFormData: (data: MaintenanceFormData) => void;
}

export const ReceiptUploadStep = ({ formData, setFormData }: ReceiptUploadStepProps) => {
  const [preview, setPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPG, PNG, and PDF files are allowed');
      return;
    }

    setFormData({ ...formData, receipt_file: file, receipt_url: '' });

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview('');
    }
  };

  const removeFile = () => {
    setFormData({ ...formData, receipt_file: null, receipt_url: '' });
    setPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Upload Receipt</h3>
        <p className="text-sm text-muted-foreground">
          Receipts are required for audit compliance and record keeping
        </p>
      </div>

      <div className="space-y-4">
        {/* File Upload Area */}
        {!formData.receipt_file && !formData.receipt_url ? (
          <Card
            className="p-8 border-2 border-dashed cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center space-y-3">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <p className="font-medium">Click to upload receipt</p>
                <p className="text-sm text-muted-foreground">
                  JPG, PNG, or PDF (max 10MB)
                </p>
              </div>
              <Button variant="outline" onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}>
                Choose File
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </Card>
        ) : (
          <Card className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <FileText className="h-8 w-8 text-primary mt-1" />
                <div className="flex-1">
                  <p className="font-medium">{formData.receipt_file?.name || 'Uploaded Receipt'}</p>
                  {formData.receipt_file && (
                    <p className="text-sm text-muted-foreground">
                      {(formData.receipt_file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                  {preview && (
                    <img 
                      src={preview} 
                      alt="Receipt preview" 
                      className="mt-3 max-w-full h-auto max-h-64 rounded border"
                    />
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* URL Input Alternative */}
        <div className="space-y-2">
          <Label htmlFor="receipt_url">Or paste receipt URL</Label>
          <Input
            id="receipt_url"
            type="url"
            value={formData.receipt_url}
            onChange={(e) => setFormData({ ...formData, receipt_url: e.target.value, receipt_file: null })}
            placeholder="https://..."
            disabled={!!formData.receipt_file}
          />
          <p className="text-xs text-muted-foreground">
            If you've already uploaded the receipt elsewhere, paste the link here
          </p>
        </div>
      </div>

      {/* Required Notice */}
      <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
        <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-orange-800">Receipt Required</p>
          <p className="text-xs text-orange-700">
            All maintenance records must include a receipt for audit and compliance purposes.
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};
