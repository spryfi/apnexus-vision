import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Sparkles, AlertTriangle, CheckCircle, Plus, Trash2, FileText, ArrowRight, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Tables } from '@/integrations/supabase/types';

type WorkflowStep = 'upload' | 'extraction' | 'verification';

type Vendor = Tables<'vendors'>;
type Employee = Tables<'employees'>;
type ExpenseCategory = Tables<'expense_categories'>;

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface ExtractedData {
  vendor_name?: string;
  transaction_date?: string;
  total_amount?: number;
  line_items?: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

export default function NewExpense() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionComplete, setExtractionComplete] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  
  // Form validation errors
  const [formErrors, setFormErrors] = useState({
    vendor_id: false,
    employee_id: false,
    expense_category_id: false,
    invoice_date: false,
    amount: false,
    payment_method: false,
    document_required: false
  });

  // Form state
  const [formData, setFormData] = useState({
    vendor_id: '',
    employee_id: '',
    expense_category_id: '',
    invoice_date: '',
    amount: '',
    payment_method: '',
    transaction_memo: ''
  });

  // Recurring expense state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringData, setRecurringData] = useState({
    frequency: 'Monthly',
    day_of_month: 1,
    end_type: 'never',
    end_date: ''
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unit_price: 0, total_price: 0 }
  ]);

  const [totalsMatch, setTotalsMatch] = useState<boolean | null>(null);

  React.useEffect(() => {
    fetchDropdownData();
  }, []);

  React.useEffect(() => {
    validateTotals();
  }, [lineItems, formData.amount]);

  const fetchDropdownData = async () => {
    try {
      const [vendorsRes, employeesRes, categoriesRes] = await Promise.all([
        supabase.from('vendors').select('*').order('vendor_name'),
        supabase.from('employees').select('*').order('employee_name'),
        supabase.from('expense_categories').select('*').order('category_name')
      ]);

      if (vendorsRes.data) setVendors(vendorsRes.data);
      if (employeesRes.data) setEmployees(employeesRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const validateTotals = () => {
    const lineItemsTotal = lineItems.reduce((sum, item) => sum + item.total_price, 0);
    const enteredAmount = parseFloat(formData.amount) || 0;
    
    if (enteredAmount === 0) {
      setTotalsMatch(null);
      return;
    }

    setTotalsMatch(Math.abs(lineItemsTotal - enteredAmount) < 0.01);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('invoice-receipts')
        .upload(fileName, file);

      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from('invoice-receipts')
        .getPublicUrl(data.path);

      setUploadedFile(file);
      setDocumentUrl(publicUrl.publicUrl);
      setCurrentStep('extraction');
      
      toast({
        title: "Success",
        description: "Document uploaded successfully!"
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload document.",
        variant: "destructive"
      });
    }
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('invoice-receipts')
        .upload(fileName, file);

      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from('invoice-receipts')
        .getPublicUrl(data.path);

      setUploadedFile(file);
      setDocumentUrl(publicUrl.publicUrl);
      setCurrentStep('extraction');
      
      toast({
        title: "Success",
        description: "Document uploaded successfully!"
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload document.",
        variant: "destructive"
      });
    }
  };

  const handleAIExtraction = async () => {
    if (!documentUrl) {
      toast({
        title: "Error",
        description: "Please upload a document first.",
        variant: "destructive"
      });
      return;
    }

    setIsExtracting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('extract-receipt-data', {
        body: { document_url: documentUrl }
      });

      if (error) throw error;

      const extractedData = data as ExtractedData;
      
      // Populate form fields
      if (extractedData.transaction_date) {
        setFormData(prev => ({ ...prev, invoice_date: extractedData.transaction_date! }));
      }
      if (extractedData.total_amount) {
        setFormData(prev => ({ ...prev, amount: extractedData.total_amount!.toString() }));
      }

      // Populate line items
      if (extractedData.line_items && extractedData.line_items.length > 0) {
        const newLineItems = extractedData.line_items.map((item, index) => ({
          id: (index + 1).toString(),
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }));
        setLineItems(newLineItems);
      }

      setExtractionComplete(true);
      setCurrentStep('verification');
      
      toast({
        title: "Success",
        description: "Document details extracted successfully!"
      });
    } catch (error) {
      console.error('Error extracting data:', error);
      toast({
        title: "Error",
        description: "Failed to extract document details.",
        variant: "destructive"
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const addLineItem = () => {
    const newId = (lineItems.length + 1).toString();
    setLineItems([...lineItems, {
      id: newId,
      description: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    }]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        
        // Auto-calculate total_price when quantity or unit_price changes
        if (field === 'quantity' || field === 'unit_price') {
          updated.total_price = updated.quantity * updated.unit_price;
        }
        
        return updated;
      }
      return item;
    }));
  };

  // Real-time validation function
  const validateField = (fieldName: string, value: any) => {
    const newErrors = { ...formErrors };
    
    switch (fieldName) {
      case 'vendor_id':
        newErrors.vendor_id = !value;
        break;
      case 'employee_id':
        newErrors.employee_id = !value;
        break;
      case 'expense_category_id':
        newErrors.expense_category_id = !value;
        break;
      case 'invoice_date':
        newErrors.invoice_date = !value;
        break;
      case 'amount':
        newErrors.amount = !value || parseFloat(value) <= 0;
        break;
      case 'payment_method':
        newErrors.payment_method = !value;
        break;
      case 'document':
        newErrors.document_required = !documentUrl;
        break;
    }
    
    setFormErrors(newErrors);
  };

  const handleSaveTransaction = async () => {
    // Validation checks with visual feedback
    const validationChecks = [
      { field: 'document', condition: !documentUrl, message: "Please upload a receipt first." },
      { field: 'vendor_id', condition: !formData.vendor_id, message: "Please select a vendor." },
      { field: 'employee_id', condition: !formData.employee_id, message: "Please select an employee." },
      { field: 'expense_category_id', condition: !formData.expense_category_id, message: "Please select an expense category." },
      { field: 'invoice_date', condition: !formData.invoice_date, message: "Please enter the transaction date." },
      { field: 'amount', condition: !formData.amount || parseFloat(formData.amount) <= 0, message: "Please enter a valid total amount." },
      { field: 'payment_method', condition: !formData.payment_method, message: "Please select a payment method." }
    ];

    for (const check of validationChecks) {
      if (check.condition) {
        validateField(check.field, null);
        toast({
          title: "Error",
          description: check.message,
          variant: "destructive"
        });
        return;
      }
    }

    if (totalsMatch === false) {
      toast({
        title: "Error",
        description: "Line items do not add up to the total amount. Please review.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Show saving state
      const saveButton = document.querySelector('[data-save-button]') as HTMLButtonElement;
      if (saveButton) {
        saveButton.textContent = 'Saving...';
        saveButton.disabled = true;
      }

      // Create transaction with proper schema mapping
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          vendor_id: formData.vendor_id,
          employee_id: formData.employee_id,
          expense_category_id: formData.expense_category_id,
          invoice_date: formData.invoice_date,
          due_date: formData.invoice_date, // Set due_date same as invoice_date if not specified
          amount: parseFloat(formData.amount),
          payment_method: formData.payment_method as "Credit Card" | "ACH" | "Check" | "Fleet Fuel Card" | "Debit Card",
          transaction_memo: formData.transaction_memo || null,
          invoice_receipt_url: documentUrl,
          status: 'Entry Required'
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Transaction save error:', transactionError);
        console.error('Full error details:', transactionError);
        throw new Error(`Failed to save transaction: ${transactionError.message}. Details: ${transactionError.details || 'No additional details'}`);
      }

      // Create line items only if they have descriptions
      const validLineItems = lineItems.filter(item => item.description.trim() !== '');
      if (validLineItems.length > 0) {
        const lineItemsToInsert = validLineItems.map(item => ({
          transaction_id: transaction.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }));

        const { error: lineItemsError } = await supabase
          .from('transaction_line_items')
          .insert(lineItemsToInsert);

        if (lineItemsError) throw lineItemsError;
      }

      // Create recurring expense rule if enabled
      if (isRecurring) {
        const nextDate = new Date();
        nextDate.setDate(recurringData.day_of_month);
        
        // If the day has already passed this month, set for next month
        if (nextDate.getDate() < new Date().getDate() || 
            (nextDate.getDate() === new Date().getDate() && nextDate.getTime() < new Date().getTime())) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }

        const recurringExpense = {
          template_transaction_id: transaction.id,
          frequency: recurringData.frequency,
          day_of_month_to_generate: recurringData.day_of_month,
          next_generation_date: nextDate.toISOString().split('T')[0],
          end_date: recurringData.end_type === 'ends_on' ? recurringData.end_date : null,
          is_active: true
        };

        const { error: recurringError } = await supabase
          .from('recurring_expenses')
          .insert(recurringExpense);

        if (recurringError) throw recurringError;
      }

      // Show success state
      if (saveButton) {
        saveButton.textContent = 'Saved! ✅';
        saveButton.className = saveButton.className.replace(/bg-\S+/g, '') + ' bg-green-600';
      }

      toast({
        title: "Success",
        description: "Transaction saved successfully!"
      });

      // Navigate away after 1.5 seconds
      setTimeout(() => {
        window.location.href = '/transactions';
      }, 1500);

    } catch (error) {
      console.error('Error saving transaction:', error);
      
      // Reset button state on error
      const saveButton = document.querySelector('[data-save-button]') as HTMLButtonElement;
      if (saveButton) {
        saveButton.textContent = 'Submit for Approval';
        saveButton.disabled = false;
      }

      // Show specific error message from Supabase
      const errorMessage = error instanceof Error ? error.message : 'Failed to save transaction. Please try again.';
      
      toast({
        title: "Transaction Save Failed",
        description: `Error: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  const canSubmit = () => {
    return (
      documentUrl &&
      formData.vendor_id &&
      formData.employee_id &&
      formData.expense_category_id &&
      formData.invoice_date &&
      formData.amount &&
      parseFloat(formData.amount) > 0 &&
      formData.payment_method &&
      (totalsMatch === true || totalsMatch === null)
    );
  };

  const renderUploadStep = () => (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardContent className="p-12">
          <div className="text-center space-y-8">
            <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <Upload className="h-12 w-12 text-primary" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-foreground">Start by uploading your invoice or receipt</h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Drag and drop a PDF or image file here, or click to browse. Our AI will extract all the details automatically.
              </p>
            </div>

            <div 
              className="border-2 border-dashed border-primary/30 rounded-xl p-12 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 cursor-pointer group"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <div className="space-y-6">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium text-foreground mb-2">Drop your document here</p>
                  <p className="text-muted-foreground">or click to browse files</p>
                  <p className="text-sm text-muted-foreground mt-2">Supports PDF, JPG, PNG up to 10MB</p>
                </div>
              </div>
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderExtractionStep = () => (
    <div className="flex h-screen bg-background">
      {/* Left Panel - Document Viewer */}
      <div className="flex-1 p-6">
        <Card className="h-full shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              Document Uploaded
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full pb-6">
            <div className="h-full bg-muted/30 rounded-lg overflow-hidden">
              {documentUrl && (
                <iframe
                  src={documentUrl}
                  className="w-full h-full border-0"
                  title="Uploaded Document"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - AI Extraction */}
      <div className="w-96 p-6 bg-muted/20">
        <Card className="h-full shadow-lg">
          <CardHeader>
            <CardTitle>Extract Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-full text-center space-y-8">
            <div className="space-y-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Ready for AI Magic!</h3>
                <p className="text-muted-foreground">
                  Our AI will automatically extract vendor details, amounts, dates, and line items from your document.
                </p>
              </div>

              <Button
                onClick={handleAIExtraction}
                disabled={isExtracting}
                size="lg"
                className="w-full relative overflow-hidden group bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                <div className={`flex items-center gap-3 ${isExtracting ? 'animate-pulse' : ''}`}>
                  <Sparkles className="h-5 w-5" />
                  {isExtracting ? 'Extracting Details...' : '✨ Auto-Extract Details with AI'}
                </div>
                {!isExtracting && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 group-hover:animate-pulse"></div>
                )}
              </Button>

              <p className="text-xs text-muted-foreground">
                This usually takes 5-10 seconds
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="flex h-[calc(100vh-4rem)] gap-6">
        {/* Left Panel - Document Viewer */}
        <div className="flex-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Document</CardTitle>
            </CardHeader>
            <CardContent className="h-full">
              {!uploadedFile ? (
                <div className={`h-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-8 ${
                  formErrors.document_required 
                    ? 'border-destructive/50 bg-destructive/5' 
                    : 'border-muted-foreground/25'
                }`}>
                  <Upload className={`h-12 w-12 mb-4 ${formErrors.document_required ? 'text-destructive' : 'text-muted-foreground'}`} />
                  <h3 className="text-lg font-medium mb-2">Upload your invoice or receipt to get started</h3>
                  <p className="text-muted-foreground mb-4">Supports PDF and image files</p>
                  {formErrors.document_required && (
                    <p className="text-sm text-destructive flex items-center gap-1 mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      Receipt upload is required
                    </p>
                  )}
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="max-w-xs"
                  />
                </div>
              ) : (
                <div className="h-full">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {uploadedFile.name}
                    </p>
                    <Button
                      onClick={handleAIExtraction}
                      disabled={isExtracting}
                      className="flex items-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      {isExtracting ? 'Reading document...' : '✨ Auto-Extract Details with AI'}
                    </Button>
                  </div>
                  <div className="h-full bg-muted/50 rounded-lg p-4 overflow-auto">
                    {documentUrl && (
                      <iframe
                        src={documentUrl}
                        className="w-full h-full border-0"
                        title="Uploaded Document"
                      />
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Data Entry Form */}
        <div className="w-96">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 overflow-auto">
              {/* Basic Fields */}
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor</Label>
                <Select 
                  value={formData.vendor_id} 
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, vendor_id: value }));
                    validateField('vendor_id', value);
                  }}
                >
                  <SelectTrigger className={formErrors.vendor_id ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.vendor_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.vendor_id && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Please select a vendor
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, invoice_date: e.target.value }));
                    validateField('invoice_date', e.target.value);
                  }}
                  className={formErrors.invoice_date ? "border-destructive" : ""}
                />
                {formErrors.invoice_date && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Date is required
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Total Amount *</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow only numbers and a single decimal point
                    if (/^[0-9]*\.?[0-9]*$/.test(value)) {
                      setFormData(prev => ({ ...prev, amount: value }));
                      validateField('amount', value);
                    }
                  }}
                  className={formErrors.amount ? "border-destructive" : ""}
                />
                {formErrors.amount && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Amount must be greater than $0
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee">Employee *</Label>
                <Select 
                  value={formData.employee_id} 
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, employee_id: value }));
                    validateField('employee_id', value);
                  }}
                >
                  <SelectTrigger className={formErrors.employee_id ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.employee_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.employee_id && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Please select an employee
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Expense Category *</Label>
                <Select 
                  value={formData.expense_category_id} 
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, expense_category_id: value }));
                    validateField('expense_category_id', value);
                  }}
                >
                  <SelectTrigger className={formErrors.expense_category_id ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.category_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.expense_category_id && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Please select an expense category
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method *</Label>
                <Select 
                  value={formData.payment_method} 
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, payment_method: value }));
                    validateField('payment_method', value);
                  }}
                >
                  <SelectTrigger className={formErrors.payment_method ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Check">Check</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="ACH">ACH</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.payment_method && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Please select a payment method
                  </p>
                )}
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Line Items</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLineItem}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {lineItems.map((item, index) => (
                    <Card key={item.id} className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Item {index + 1}</span>
                          {lineItems.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeLineItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        />
                        
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            value={item.unit_price}
                            onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Total"
                            value={item.total_price}
                            readOnly
                            className="bg-muted"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Totals Validation */}
                {totalsMatch !== null && (
                  <div className={`flex items-center gap-2 p-2 rounded-md ${
                    totalsMatch ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {totalsMatch ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Totals match!</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">Line items do not add up to the total amount. Please review.</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Recurring Expense Section */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded border-input"
                  />
                  <Label htmlFor="recurring" className="text-sm font-medium">
                    Make this a recurring expense
                  </Label>
                </div>

                {isRecurring && (
                  <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium text-sm">Recurrence Schedule</h4>
                    
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select 
                        value={recurringData.frequency} 
                        onValueChange={(value) => setRecurringData(prev => ({ ...prev, frequency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                          <SelectItem value="Quarterly">Quarterly</SelectItem>
                          <SelectItem value="Annually">Annually</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Generate reminder on day of month</Label>
                      <Select 
                        value={recurringData.day_of_month.toString()} 
                        onValueChange={(value) => setRecurringData(prev => ({ ...prev, day_of_month: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                            <SelectItem key={day} value={day.toString()}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>End Date</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="never"
                            name="end_type"
                            value="never"
                            checked={recurringData.end_type === 'never'}
                            onChange={(e) => setRecurringData(prev => ({ ...prev, end_type: e.target.value }))}
                          />
                          <Label htmlFor="never" className="text-sm">Never Ends</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="ends_on"
                            name="end_type"
                            value="ends_on"
                            checked={recurringData.end_type === 'ends_on'}
                            onChange={(e) => setRecurringData(prev => ({ ...prev, end_type: e.target.value }))}
                          />
                          <Label htmlFor="ends_on" className="text-sm">Ends on</Label>
                        </div>
                        {recurringData.end_type === 'ends_on' && (
                          <Input
                            type="date"
                            value={recurringData.end_date}
                            onChange={(e) => setRecurringData(prev => ({ ...prev, end_date: e.target.value }))}
                            className="ml-6"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="memo">Transaction Memo</Label>
                <Textarea
                  placeholder="Optional notes about this transaction..."
                  value={formData.transaction_memo}
                  onChange={(e) => setFormData(prev => ({ ...prev, transaction_memo: e.target.value }))}
                />
              </div>

              <Button
                onClick={handleSaveTransaction}
                disabled={!canSubmit()}
                className="w-full"
                data-save-button
              >
                Submit for Approval
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}