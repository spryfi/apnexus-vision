import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Camera, FileImage, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface UploadedFile {
  file: File;
  preview: string;
  id: string;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  error?: string;
  ocrResult?: any;
}

interface ReceiptUploadProps {
  onProcessComplete?: (results: any[]) => void;
  maxFiles?: number;
  className?: string;
}

export const ReceiptUpload: React.FC<ReceiptUploadProps> = ({
  onProcessComplete,
  maxFiles = 10,
  className,
}) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not a valid image or PDF`,
          variant: 'destructive',
        });
        return false;
      }

      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds 10MB limit`,
          variant: 'destructive',
        });
        return false;
      }

      return true;
    });

    if (files.length + validFiles.length > maxFiles) {
      toast({
        title: 'Too many files',
        description: `Maximum ${maxFiles} files allowed`,
        variant: 'destructive',
      });
      return;
    }

    const uploadedFiles: UploadedFile[] = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36),
      status: 'pending',
      progress: 0,
    }));

    setFiles(prev => [...prev, ...uploadedFiles]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) URL.revokeObjectURL(file.preview);
      return prev.filter(f => f.id !== id);
    });
  };

  const processAllFiles = async () => {
    const filesToProcess = files.filter(f => f.status === 'pending');
    
    for (const fileData of filesToProcess) {
      await processFile(fileData);
    }

    const results = files
      .filter(f => f.status === 'complete' && f.ocrResult)
      .map(f => f.ocrResult);

    if (onProcessComplete && results.length > 0) {
      onProcessComplete(results);
    }
  };

  const processFile = async (fileData: UploadedFile) => {
    try {
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === fileData.id ? { ...f, status: 'uploading' as const, progress: 20 } : f
      ));

      // Upload to Supabase Storage
      const fileExt = fileData.file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('receipt-images')
        .upload(filePath, fileData.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('receipt-images')
        .getPublicUrl(filePath);

      setFiles(prev => prev.map(f => 
        f.id === fileData.id ? { ...f, progress: 40 } : f
      ));

      // Process with OCR
      setFiles(prev => prev.map(f => 
        f.id === fileData.id ? { ...f, status: 'processing' as const, progress: 60 } : f
      ));

      const { data: ocrData, error: ocrError } = await supabase.functions.invoke(
        'process-receipt-ocr',
        { body: { imageUrl: publicUrl } }
      );

      if (ocrError) throw ocrError;

      setFiles(prev => prev.map(f => 
        f.id === fileData.id ? { 
          ...f, 
          status: 'complete' as const, 
          progress: 100,
          ocrResult: { ...ocrData, imageUrl: publicUrl }
        } : f
      ));

      toast({
        title: 'Receipt processed',
        description: `Quality: ${ocrData.qualityBadge}`,
      });

    } catch (error) {
      console.error('Error processing file:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileData.id ? {
          ...f,
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Processing failed'
        } : f
      ));

      toast({
        title: 'Processing failed',
        description: error instanceof Error ? error.message : 'Failed to process receipt',
        variant: 'destructive',
      });
    }
  };

  const clearAll = () => {
    files.forEach(f => URL.revokeObjectURL(f.preview));
    setFiles([]);
  };

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'uploading': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Zone */}
      <Card
        className={cn(
          'border-2 border-dashed transition-colors cursor-pointer',
          isDragging && 'border-primary bg-primary/5'
        )}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
      >
        <CardContent className="p-8">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            multiple
            accept="image/jpeg,image/png,image/jpg,application/pdf"
            onChange={handleFileInput}
          />
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center cursor-pointer"
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {window.matchMedia('(max-width: 768px)').matches
                ? 'Tap to take photo or upload'
                : 'Drag & drop receipts here, or click to browse'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Supports JPG, PNG, PDF up to 10MB
            </p>
            {files.length > 0 && (
              <Badge variant="secondary" className="mt-2">
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </Badge>
            )}
          </label>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file) => (
                <div key={file.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    {file.file.type.startsWith('image/') ? (
                      <img
                        src={file.preview}
                        alt="Receipt preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileImage className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate flex-1">
                        {file.file.name}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(file.file.size / 1024).toFixed(1)} KB
                    </p>
                    <Badge className={getStatusColor(file.status)}>
                      {file.status}
                    </Badge>
                    {file.status === 'uploading' || file.status === 'processing' ? (
                      <Progress value={file.progress} className="h-1" />
                    ) : null}
                    {file.error && (
                      <div className="flex items-start gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3 mt-0.5" />
                        <span>{file.error}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                onClick={processAllFiles}
                disabled={!files.some(f => f.status === 'pending')}
                className="flex-1"
              >
                Process All
              </Button>
              <Button
                onClick={clearAll}
                variant="outline"
              >
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};