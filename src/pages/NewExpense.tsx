import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Sparkles, AlertTriangle, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Tables } from '@/integrations/supabase/types';

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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  
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

  const handleSaveTransaction = async () => {
    if (!documentUrl) {
      toast({
        title: "Error",
        description: "Please upload a receipt first.",
        variant: "destructive"
      });
      return;
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
      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          vendor_id: formData.vendor_id,
          employee_id: formData.employee_id,
          expense_category_id: formData.expense_category_id,
          invoice_date: formData.invoice_date,
          amount: parseFloat(formData.amount),
          payment_method: formData.payment_method as "Credit Card" | "ACH" | "Check" | "Fleet Fuel Card" | "Debit Card",
          transaction_memo: formData.transaction_memo,
          invoice_receipt_url: documentUrl,
          status: 'Entry Required'
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Create line items
      const lineItemsToInsert = lineItems.map(item => ({
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

      toast({
        title: "Success",
        description: "Transaction saved successfully!"
      });

      // Reset form
      setFormData({
        vendor_id: '',
        employee_id: '',
        expense_category_id: '',
        invoice_date: '',
        amount: '',
        payment_method: '',
        transaction_memo: ''
      });
      setLineItems([{ id: '1', description: '', quantity: 1, unit_price: 0, total_price: 0 }]);
      setUploadedFile(null);
      setDocumentUrl('');
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast({
        title: "Error",
        description: "Failed to save transaction.",
        variant: "destructive"
      });
    }
  };

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
                <div className="h-full border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center p-8">
                  <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Upload your invoice or receipt to get started</h3>
                  <p className="text-muted-foreground mb-4">Supports PDF and image files</p>
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
                <Select value={formData.vendor_id} onValueChange={(value) => setFormData(prev => ({ ...prev, vendor_id: value }))}>
                  <SelectTrigger>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoice_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Total Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee">Employee</Label>
                <Select value={formData.employee_id} onValueChange={(value) => setFormData(prev => ({ ...prev, employee_id: value }))}>
                  <SelectTrigger>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Expense Category</Label>
                <Select value={formData.expense_category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, expense_category_id: value }))}>
                  <SelectTrigger>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select value={formData.payment_method} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Check">Check</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="ACH">ACH</SelectItem>
                  </SelectContent>
                </Select>
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
                disabled={!documentUrl || totalsMatch === false}
                className="w-full"
              >
                Save Transaction
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}