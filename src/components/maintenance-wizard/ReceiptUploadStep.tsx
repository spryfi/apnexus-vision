import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileCheck, AlertCircle } from "lucide-react";

interface ReceiptUploadStepProps {
  formData: any;
  setFormData: (data: any) => void;
}

export const ReceiptUploadStep = ({ formData, setFormData }: ReceiptUploadStepProps) => {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, receipt_file: file });
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Upload Receipt</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Receipt upload is required for audit compliance and expense tracking
        </p>
      </div>

      <div className="border-2 border-dashed rounded-lg p-8 text-center bg-gray-50">
        {formData.receipt_file ? (
          <div className="space-y-4">
            <FileCheck className="h-12 w-12 text-green-600 mx-auto" />
            <div>
              <p className="font-semibold text-green-900">{formData.receipt_file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(formData.receipt_file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            {preview && (
              <img
                src={preview}
                alt="Receipt preview"
                className="max-w-md mx-auto rounded-lg shadow-md"
              />
            )}
            <Label htmlFor="receipt" className="cursor-pointer text-primary hover:underline">
              Change file
            </Label>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <Label htmlFor="receipt" className="cursor-pointer text-primary hover:underline text-lg">
                Click to upload receipt
              </Label>
              <p className="text-sm text-muted-foreground mt-2">
                PDF, JPG, or PNG (max 10MB)
              </p>
            </div>
          </div>
        )}
        <Input
          id="receipt"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900">Receipt Requirements</p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Must be legible and include service provider name</li>
              <li>• Should show date of service and total amount</li>
              <li>• Can be a photo, scan, or digital receipt</li>
              <li>• Required for all maintenance records</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
