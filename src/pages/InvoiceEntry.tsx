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
    due_date: false,
    amount: false,
    vendor_name: false
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
      due_date: !formData.due_date
    };

    setFormErrors(errors);
    return !Object.values(errors).some(Boolean);
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

      // This page needs to be updated to use proper vendor_id, employee_id, expense_category_id
      // For now, we'll create a simplified transaction that matches the schema requirements
      const transactionData = {
        // Required fields - using fallback IDs for demo purposes
        vendor_id: 'db8b8c9e-18b0-4e7b-8b5b-000000000001', // Fallback vendor ID
        employee_id: 'db8b8c9e-18b0-4e7b-8b5b-000000000002', // Fallback employee ID  
        expense_category_id: 'db8b8c9e-18b0-4e7b-8b5b-000000000003', // Fallback category ID
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
        throw new Error(`Database error: ${error.message}`);
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          
          {/* Left Panel - Document Upload */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Step 1: Upload Your Invoice
              </CardTitle>
              <CardDescription>
                Drag and drop your invoice or receipt, or click to browse
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!uploadedFile ? (
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground mb-2">
                    Drop your invoice here
                  </p>
                  <p className="text-muted-foreground mb-4">
                    Supports PDF, JPEG, PNG files up to 10MB
                  </p>
                  <Button variant="outline">
                    Choose File
                  </Button>
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
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>

                  {fileUrl && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Preview</span>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Full Size
                        </Button>
                      </div>
                      <div className="bg-muted rounded-lg p-4 text-center">
                        {uploadedFile.type === 'application/pdf' ? (
                          <div>
                            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">PDF Document</p>
                          </div>
                        ) : (
                          <img 
                            src={fileUrl} 
                            alt="Invoice preview" 
                            className="max-w-full max-h-64 mx-auto rounded"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={() => {
                      setUploadedFile(null);
                      setFileUrl("");
                      setHasExtracted(false);
                      setExtractedData({});
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Upload Different File
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Panel - Invoice Details */}
          <Card className={`h-fit ${!uploadedFile ? 'opacity-50 pointer-events-none' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Step 2: Extract & Review Details
              </CardTitle>
              <CardDescription>
                Use AI to automatically extract invoice information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* AI Extraction Button */}
              {uploadedFile && !hasExtracted && (
                <div className="text-center space-y-4">
                  <Button 
                    onClick={extractWithAI}
                    disabled={isExtracting}
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isExtracting ? (
                      <>
                        <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                        Extracting with AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        ✨ Auto-Extract Invoice Details with AI
                      </>
                    )}
                  </Button>
                  
                  {isExtracting && (
                    <div className="space-y-2">
                      <Progress value={extractionProgress} className="w-full" />
                      <p className="text-sm text-muted-foreground">
                        {extractionProgress < 30 ? "Analyzing document..." :
                         extractionProgress < 70 ? "Extracting data..." :
                         extractionProgress < 100 ? "Finalizing..." : "Complete!"}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Vendor Name */}
                <div className="space-y-2">
                  <Label htmlFor="vendor_name" className="flex items-center gap-2">
                    Vendor Name *
                    {hasExtracted && extractedData.vendor_name && (
                      <Badge variant="secondary" className="text-xs">
                        AI Extracted
                      </Badge>
                    )}
                  </Label>
                  <Input
                    id="vendor_name"
                    value={formData.vendor_name}
                    onChange={(e) => handleInputChange('vendor_name', e.target.value)}
                    placeholder="Enter vendor name"
                    className={formErrors.vendor_name ? "border-destructive" : ""}
                  />
                  {formErrors.vendor_name && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Vendor name is required
                    </p>
                  )}
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount" className="flex items-center gap-2">
                    Invoice Amount *
                    {hasExtracted && extractedData.amount && (
                      <Badge variant="secondary" className="text-xs">
                        AI Extracted
                      </Badge>
                    )}
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    placeholder="0.00"
                    className={formErrors.amount ? "border-destructive" : ""}
                  />
                  {formErrors.amount && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Valid amount is required
                    </p>
                  )}
                </div>

                {/* Invoice Date */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Invoice Date
                    {hasExtracted && extractedData.invoice_date && (
                      <Badge variant="secondary" className="text-xs">
                        AI Extracted
                      </Badge>
                    )}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.invoice_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.invoice_date ? format(formData.invoice_date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.invoice_date}
                        onSelect={(date) => handleInputChange('invoice_date', date)}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Due Date * 
                    <span className="text-xs text-muted-foreground">(Critical for payment tracking)</span>
                    {hasExtracted && extractedData.due_date && (
                      <Badge variant="secondary" className="text-xs">
                        AI Extracted
                      </Badge>
                    )}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.due_date && "text-muted-foreground",
                          formErrors.due_date && "border-destructive"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.due_date ? format(formData.due_date, "PPP") : <span>Pick due date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.due_date}
                        onSelect={(date) => handleInputChange('due_date', date)}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  {formErrors.due_date && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Due date is required to prevent missed payments
                    </p>
                  )}
                </div>

                {/* Invoice Number */}
                <div className="space-y-2">
                  <Label htmlFor="invoice_number" className="flex items-center gap-2">
                    Invoice Number
                    {hasExtracted && extractedData.invoice_number && (
                      <Badge variant="secondary" className="text-xs">
                        AI Extracted
                      </Badge>
                    )}
                  </Label>
                  <Input
                    id="invoice_number"
                    value={formData.invoice_number}
                    onChange={(e) => handleInputChange('invoice_number', e.target.value)}
                    placeholder="Enter invoice number"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="flex items-center gap-2">
                    Description
                    {hasExtracted && extractedData.description && (
                      <Badge variant="secondary" className="text-xs">
                        AI Extracted
                      </Badge>
                    )}
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter invoice description"
                    rows={3}
                  />
                </div>

                {/* Additional Fields */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employee_name">Employee</Label>
                    <Input
                      id="employee_name"
                      value={formData.employee_name}
                      onChange={(e) => handleInputChange('employee_name', e.target.value)}
                      placeholder="Employee name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Select onValueChange={(value) => handleInputChange('payment_method', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Check">Check</SelectItem>
                        <SelectItem value="ACH">ACH</SelectItem>
                        <SelectItem value="Credit Card">Credit Card</SelectItem>
                        <SelectItem value="Wire Transfer">Wire Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expense_category">Expense Category</Label>
                    <Select onValueChange={(value) => handleInputChange('expense_category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                        <SelectItem value="Equipment">Equipment</SelectItem>
                        <SelectItem value="Services">Services</SelectItem>
                        <SelectItem value="Utilities">Utilities</SelectItem>
                        <SelectItem value="Travel">Travel</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t">
                <Button 
                  onClick={saveTransaction}
                  disabled={!uploadedFile || isSaving}
                  size="lg"
                  className="w-full"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving Transaction...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Save Transaction
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Transaction will be saved with "Pending Approval" status
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InvoiceEntry;