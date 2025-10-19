import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, FileImage, AlertCircle, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface RequiredDocumentUploadProps {
  onFileUploaded: (url: string, file: File) => void;
  onFileRemoved: () => void;
  value?: string | null;
  bucket?: string;
  className?: string;
  label?: string;
  required?: boolean;
  showWarning?: boolean;
}

export const RequiredDocumentUpload: React.FC<RequiredDocumentUploadProps> = ({
  onFileUploaded,
  onFileRemoved,
  value,
  bucket = 'receipt-images',
  className,
  label = 'Document Upload',
  required = true,
  showWarning = true,
}) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFile(droppedFiles[0]);
    }
  }, []);

  const handleFile = async (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF, JPG, or PNG file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'File must be less than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setPreview(URL.createObjectURL(file));
      setUploadedFile(file);
      onFileUploaded(publicUrl, file);

      toast({
        title: 'Document uploaded',
        description: 'Document uploaded successfully',
      });

    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setUploadedFile(null);
    onFileRemoved();
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>

      {showWarning && !preview && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
            ⚠️ AUDIT REQUIREMENT: All transactions must have supporting documentation. 
            Transactions without receipts cannot be saved and will not be processed.
          </AlertDescription>
        </Alert>
      )}

      {!preview ? (
        <Card
          className={cn(
            'border-2 border-dashed transition-colors cursor-pointer',
            isDragging && 'border-primary bg-primary/5',
            required && !preview && 'border-red-300 bg-red-50/50 dark:bg-red-950/20'
          )}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
        >
          <CardContent className="p-6">
            <input
              type="file"
              id="document-upload"
              className="hidden"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={handleFileInput}
              disabled={uploading}
            />
            <label
              htmlFor="document-upload"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <div className={cn(
                "flex items-center justify-center w-12 h-12 rounded-full mb-3",
                required && !preview ? "bg-red-100 dark:bg-red-950" : "bg-primary/10"
              )}>
                <Upload className={cn(
                  "w-6 h-6",
                  required && !preview ? "text-red-600" : "text-primary"
                )} />
              </div>
              <h3 className="text-sm font-semibold mb-1">
                {uploading ? 'Uploading...' : 'Drag & drop or click to upload'}
              </h3>
              <p className="text-xs text-muted-foreground">
                PDF, JPG, PNG • Max 10MB
              </p>
              {required && !preview && (
                <p className="text-xs text-red-600 mt-2 font-medium">
                  Required before saving
                </p>
              )}
            </label>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex-shrink-0">
                  {uploadedFile?.type.startsWith('image/') ? (
                    <div className="w-16 h-16 rounded overflow-hidden bg-muted">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded bg-muted flex items-center justify-center">
                      <FileImage className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <p className="text-sm font-medium truncate">
                      {uploadedFile?.name || 'Document uploaded'}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {uploadedFile ? `${(uploadedFile.size / 1024).toFixed(1)} KB` : 'Ready'}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-red-600 hover:text-red-700 hover:bg-red-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {required && !preview && (
        <p className="text-xs text-red-600 font-medium">
          Receipt/document upload is required to save this transaction
        </p>
      )}
    </div>
  );
};
