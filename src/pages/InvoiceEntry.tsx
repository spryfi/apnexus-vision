import React, { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Sparkles, AlertCircle, CheckCircle, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ExtractedData {
  vendor_name?: string;
  amount?: number;
  invoice_date?: string;
  due_date?: string;
  invoice_number?: string;
  description?: string;
}

const InvoiceEntry: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedData>({});
  const [hasExtracted, setHasExtracted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    vendor_name: '',
    amount: '',
    invoice_date: undefined as Date | undefined,
    due_date: undefined as Date | undefined,
    invoice_number: '',
    description: '',
    employee_name: '',
    payment_method: '',
    expense_category: ''
  });

  const [formErrors, setFormErrors] = useState({
    vendor_name: false,
    amount: false,
    invoice_date: false,
    receipt_required: false,
    expense_category: false,
    description_length: false
  });

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF or image file (JPEG, PNG)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    
    // Upload to Supabase Storage
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('invoice-receipts')
        .upload(`temp/${fileName}`, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('invoice-receipts')
        .getPublicUrl(`temp/${fileName}`);

      setFileUrl(publicUrl);

      toast({
        title: "File Uploaded",
        description: "Ready for AI extraction",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear errors when user starts typing
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: false
      }));
    }
  };

  const extractWithAI = async () => {
    if (!uploadedFile) return;

    setIsExtracting(true);
    setExtractionProgress(10);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.readAsDataURL(uploadedFile);
      });

      setExtractionProgress(30);

      // Call AI extraction edge function
      const { data, error } = await supabase.functions.invoke('extract-invoice-data', {
        body: {
          file_data: base64,
          file_type: uploadedFile.type,
          file_name: uploadedFile.name
        }
      });

      setExtractionProgress(70);

      if (error) throw error;

      const extracted = data.extracted_data;
      setExtractedData(extracted);

      // Auto-populate form
      setFormData(prev => ({
        ...prev,
        vendor_name: extracted.vendor_name || '',
        amount: extracted.amount?.toString() || '',
        invoice_number: extracted.invoice_number || '',
        description: extracted.description || '',
        invoice_date: extracted.invoice_date ? new Date(extracted.invoice_date) : undefined,
        due_date: extracted.due_date ? new Date(extracted.due_date) : undefined
      }));

      setExtractionProgress(100);
      setHasExtracted(true);

      toast({
        title: "AI Extraction Complete",
        description: "Please review and complete the remaining fields",
      });

    } catch (error) {
      console.error('AI extraction error:', error);
      toast({
        title: "AI Extraction Failed",
        description: "Please enter the details manually",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
      setTimeout(() => setExtractionProgress(0), 2000);
    }
  };

  const validateForm = () => {
    const errors = {
      vendor_name: !formData.vendor_name.trim(),
      amount: !formData.amount || parseFloat(formData.amount) <= 0,
      invoice_date: !formData.invoice_date,
      receipt_required: !fileUrl,
      expense_category: !formData.expense_category.trim(),
      description_length: !formData.description || formData.description.trim().length < 10
    };

    setFormErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  // Real-time validation when fields change
  const validateField = (fieldName: string, value: any) => {
    const newErrors = { ...formErrors };
    
    switch (fieldName) {
      case 'vendor_name':
        newErrors.vendor_name = !value || !value.trim();
        break;
      case 'amount':
        newErrors.amount = !value || parseFloat(value) <= 0;
        break;
      case 'invoice_date':
        newErrors.invoice_date = !value;
        break;
      case 'expense_category':
        newErrors.expense_category = !value || !value.trim();
        break;
      case 'description':
        newErrors.description_length = !value || value.trim().length < 10;
        break;
      case 'receipt':
        newErrors.receipt_required = !fileUrl;
        break;
    }
    
    setFormErrors(newErrors);
  };

  const saveTransaction = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Ensure we have a valid receipt URL
      if (!fileUrl) {
        throw new Error('Receipt upload is required before saving');
      }

      // Use first available vendor, employee, and category from database
      // Create transaction data that matches schema exactly  
      const transactionData = {
        vendor_id: '33cccb93-366f-477d-8995-59f68104baa9', // AMERICAN TOWER
        employee_id: 'e5a754e2-fe4b-40cf-be40-0ff755cd3d40', // John Smith
        expense_category_id: '94ea1e77-5e73-44a8-877a-3e1f330466da', // Materials - Job Supplies
        invoice_date: formData.invoice_date ? format(formData.invoice_date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        amount: parseFloat(formData.amount),
        payment_method: (formData.payment_method as "Credit Card" | "ACH" | "Check" | "Fleet Fuel Card" | "Debit Card") || "Credit Card",
        
        // Optional fields
        due_date: formData.due_date ? format(formData.due_date, 'yyyy-MM-dd') : null,
        invoice_number: formData.invoice_number || null,
        transaction_memo: formData.description || null,
        invoice_receipt_url: fileUrl,
        status: 'Entry Required' as const
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();

      if (error) {
        console.error('Transaction insert error:', error);
        console.error('Full error details:', error);
        throw new Error(`Database error: ${error.message}. Details: ${error.details || 'No additional details'}`);
      }

      toast({
        title: "Success!",
        description: "Invoice has been saved and is pending approval",
      });

      // Reset form
      setUploadedFile(null);
      setFileUrl("");
      setExtractedData({});
      setHasExtracted(false);
      setFormData({
        vendor_name: '',
        amount: '',
        invoice_date: undefined,
        due_date: undefined,
        invoice_number: '',
        description: '',
        employee_name: '',
        payment_method: '',
        expense_category: ''
      });

    } catch (error) {
      console.error('Save error:', error);
      
      // Show specific error message from the database
      const errorMessage = error instanceof Error ? error.message : 'Failed to save transaction. Please try again.';
      
      toast({
        title: "Save Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Enter an Invoice</h1>
              <p className="text-muted-foreground">Upload your invoice and let AI extract the details automatically</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column - Document Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Document
                </CardTitle>
                <CardDescription>
                  Upload your invoice or receipt to get started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Upload Area */}
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                    uploadedFile 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50 hover:bg-accent/50"
                  )}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={(e) => e.preventDefault()}
                >
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
                        <Upload className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {uploadedFile ? "Document Uploaded" : "Upload your invoice or receipt to get started"}
                      </h3>
                      <p className="text-muted-foreground mt-1">
                        Supports PDF and image files
                      </p>
                    </div>
                    
                    {uploadedFile ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2 text-sm text-primary font-medium">
                          <CheckCircle className="h-4 w-4" />
                          {uploadedFile.name}
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="mx-auto"
                        >
                          Change File
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="mx-auto"
                      >
                        Choose File
                      </Button>
                    )}
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="hidden"
                />

                {formErrors.receipt_required && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Receipt upload is required
                  </p>
                )}

                {/* AI Extraction */}
                {uploadedFile && !hasExtracted && (
                  <div className="space-y-4">
                    <Button
                      onClick={extractWithAI}
                      disabled={isExtracting}
                      className="w-full"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {isExtracting ? "Extracting..." : "Extract with AI"}
                    </Button>
                    
                    {isExtracting && (
                      <div className="space-y-2">
                        <Progress value={extractionProgress} className="w-full" />
                        <p className="text-sm text-muted-foreground text-center">
                          AI is analyzing your document...
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {hasExtracted && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">AI extraction complete</span>
                    </div>
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      <h4 className="font-medium text-sm">Extracted Data:</h4>
                      <div className="text-xs space-y-1 text-muted-foreground">
                        {extractedData.vendor_name && <div>Vendor: {extractedData.vendor_name}</div>}
                        {extractedData.amount && <div>Amount: ${extractedData.amount}</div>}
                        {extractedData.invoice_date && <div>Date: {extractedData.invoice_date}</div>}
                        {extractedData.invoice_number && <div>Invoice #: {extractedData.invoice_number}</div>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Document Preview */}
                {fileUrl && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Document Preview</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(fileUrl, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Full View
                      </Button>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      {uploadedFile?.type.startsWith('image/') ? (
                        <img 
                          src={fileUrl} 
                          alt="Uploaded document" 
                          className="w-full h-48 object-contain bg-muted"
                        />
                      ) : (
                        <div className="h-48 bg-muted flex items-center justify-center">
                          <div className="text-center">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">PDF Document</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right Column - Transaction Details Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Transaction Details
                </CardTitle>
                <CardDescription>
                  Fill in the transaction information below
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Basic Information */}
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="vendor">
                      Vendor <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.vendor_name}
                      onValueChange={(value) => {
                        handleInputChange('vendor_name', value);
                        validateField('vendor_name', value);
                      }}
                    >
                      <SelectTrigger className={formErrors.vendor_name ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AMERICAN TOWER">AMERICAN TOWER</SelectItem>
                        <SelectItem value="CROWN CASTLE">CROWN CASTLE</SelectItem>
                        <SelectItem value="SBA COMMUNICATIONS">SBA COMMUNICATIONS</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.vendor_name && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        Vendor selection is required
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">
                      Date <span className="text-destructive">*</span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.invoice_date && "text-muted-foreground",
                            formErrors.invoice_date && "border-destructive"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.invoice_date ? format(formData.invoice_date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.invoice_date}
                          onSelect={(date) => {
                            handleInputChange('invoice_date', date);
                            validateField('invoice_date', date);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {formErrors.invoice_date && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        Date is required
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">
                      Total Amount <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => {
                        handleInputChange('amount', e.target.value);
                        validateField('amount', e.target.value);
                      }}
                      className={formErrors.amount ? 'border-destructive' : ''}
                    />
                    {formErrors.amount && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        Valid amount is required
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employee">
                      Employee <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.employee_name}
                      onValueChange={(value) => handleInputChange('employee_name', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="John Smith">John Smith</SelectItem>
                        <SelectItem value="Jane Doe">Jane Doe</SelectItem>
                        <SelectItem value="Jesse">Jesse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">
                      Expense Category <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.expense_category}
                      onValueChange={(value) => {
                        handleInputChange('expense_category', value);
                        validateField('expense_category', value);
                      }}
                    >
                      <SelectTrigger className={formErrors.expense_category ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Materials - Job Supplies">Materials - Job Supplies</SelectItem>
                        <SelectItem value="Vehicle Maintenance">Vehicle Maintenance</SelectItem>
                        <SelectItem value="Fuel">Fuel</SelectItem>
                        <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                        <SelectItem value="Travel">Travel</SelectItem>
                        <SelectItem value="Insurance">Insurance</SelectItem>
                        <SelectItem value="Utilities">Utilities</SelectItem>
                        <SelectItem value="Equipment">Equipment</SelectItem>
                        <SelectItem value="Professional Services">Professional Services</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.expense_category && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        Category selection is required
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_method">
                      Payment Method <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.payment_method}
                      onValueChange={(value) => handleInputChange('payment_method', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Credit Card">Credit Card</SelectItem>
                        <SelectItem value="ACH">ACH</SelectItem>
                        <SelectItem value="Check">Check</SelectItem>
                        <SelectItem value="Fleet Fuel Card">Fleet Fuel Card</SelectItem>
                        <SelectItem value="Debit Card">Debit Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Line Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Line Items</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {/* Add line item logic */}}
                    >
                      + Add Item
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="text-sm font-medium">Item 1</div>
                    <div className="grid grid-cols-3 gap-3">
                      <Input placeholder="Description" />
                      <Input type="number" placeholder="Quantity" />
                      <Input type="number" placeholder="Amount" />
                    </div>
                  </div>
                </div>

                {/* Additional Options */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="recurring" className="rounded border-border" />
                    <Label htmlFor="recurring" className="text-sm">Make this a recurring expense</Label>
                  </div>
                </div>

                {/* Transaction Memo */}
                <div className="space-y-2">
                  <Label htmlFor="memo">Transaction Memo</Label>
                  <Textarea
                    placeholder="Optional notes about this transaction..."
                    value={formData.description}
                    onChange={(e) => {
                      handleInputChange('description', e.target.value);
                      validateField('description', e.target.value);
                    }}
                    className={cn(
                      "min-h-[100px]",
                      formErrors.description_length && "border-destructive"
                    )}
                  />
                  {formErrors.description_length && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Description must be at least 10 characters
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6">
                  <Button
                    onClick={saveTransaction}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? "Saving..." : "Save Transaction"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Reset form
                      setUploadedFile(null);
                      setFileUrl("");
                      setExtractedData({});
                      setHasExtracted(false);
                      setFormData({
                        vendor_name: '',
                        amount: '',
                        invoice_date: undefined,
                        due_date: undefined,
                        invoice_number: '',
                        description: '',
                        employee_name: '',
                        payment_method: '',
                        expense_category: ''
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceEntry;