import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Tables } from '@/integrations/supabase/types';

type Vendor = Tables<'vendors'>;
type Employee = Tables<'employees'>;
type ExpenseCategory = Tables<'expense_categories'>;

export default function NewExpense() {
  const { toast } = useToast();
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [companyCards, setCompanyCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    vendor_id: '',
    employee_id: '',
    expense_category_id: '',
    invoice_date: '',
    due_date: '',
    amount: '',
        payment_method: '',
    transaction_memo: ''
  });

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const [vendorsRes, employeesRes, categoriesRes, paymentMethodsRes] = await Promise.all([
        supabase.from('vendors').select('*').order('vendor_name'),
        supabase.from('employees').select('*').order('employee_name'),
        supabase.from('expense_categories').select('*').order('category_name'),
        supabase.from('payment_methods').select('*').eq('is_active', true).order('method_name')
      ]);

      if (vendorsRes.data) setVendors(vendorsRes.data);
      if (employeesRes.data) setEmployees(employeesRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (paymentMethodsRes.data) setCompanyCards(paymentMethodsRes.data);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      toast({
        title: "Error",
        description: "Failed to load form options",
        variant: "destructive",
      });
    }
  };

  const isFormValid = () => {
    return (
      formData.vendor_id &&
      formData.employee_id &&
      formData.expense_category_id &&
      parseFloat(formData.amount) > 0 &&
      formData.invoice_date &&
      formData.transaction_memo && formData.transaction_memo.length >= 20 &&
      formData.payment_method &&
      documentUrl
    );
  };

  const handleSave = async () => {
    if (!isFormValid()) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('transactions')
        .insert({
          vendor_id: formData.vendor_id,
          employee_id: formData.employee_id,
          expense_category_id: formData.expense_category_id,
          amount: parseFloat(formData.amount),
          invoice_date: formData.invoice_date,
          due_date: formData.due_date || formData.invoice_date,
          transaction_memo: formData.transaction_memo,
          payment_method: "Credit Card",
          payment_source_detail: formData.payment_method,
          invoice_receipt_url: documentUrl,
          status: 'Pending Approval'
        });

      if (error) throw error;

      toast({
        title: "Transaction Saved",
        description: "Transaction has been submitted for approval",
      });

      // Reset form
      setFormData({
        vendor_id: '',
        employee_id: '',
        expense_category_id: '',
        invoice_date: '',
        due_date: '',
        amount: '',
        payment_method: '',
        transaction_memo: ''
      });
      setDocumentUrl('');

      // Navigate to transactions page
      window.location.href = '/transactions';
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast({
        title: "Error saving transaction",
        description: "Failed to save transaction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
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

      setDocumentUrl(publicUrl.publicUrl);

      toast({
        title: "Receipt uploaded",
        description: "Receipt has been uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload receipt",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              New Expense Entry
            </CardTitle>
            <p className="text-center text-muted-foreground">
              All fields marked with * are required before this transaction can be submitted
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Guardrail Alert */}
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-orange-800">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">AP-Fortress Guardrails Active</span>
                </div>
                <ul className="mt-2 text-sm text-orange-700 space-y-1">
                  <li>• Receipt upload is mandatory - cannot proceed without it</li>
                  <li>• Description must be at least 20 characters</li>
                  <li>• All fields must be completed before saving</li>
                </ul>
              </CardContent>
            </Card>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vendor */}
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor *</Label>
                <Select value={formData.vendor_id} onValueChange={(value) => setFormData({...formData, vendor_id: value})}>
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

              {/* Employee */}
              <div className="space-y-2">
                <Label htmlFor="employee">Employee *</Label>
                <Select value={formData.employee_id} onValueChange={(value) => setFormData({...formData, employee_id: value})}>
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

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>

              {/* Invoice Date */}
              <div className="space-y-2">
                <Label htmlFor="invoice_date">Invoice Date *</Label>
                <Input
                  id="invoice_date"
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => setFormData({...formData, invoice_date: e.target.value})}
                />
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                />
              </div>

              {/* Expense Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Expense Category *</Label>
                <Select value={formData.expense_category_id} onValueChange={(value) => setFormData({...formData, expense_category_id: value})}>
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

              {/* Payment Method */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="payment_method">Payment Method *</Label>
                {companyCards.length === 0 ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      ⚠️ No active payment methods found. Please add one under Settings &gt; Payment Methods.
                    </p>
                  </div>
                ) : (
                  <Select value={formData.payment_method} onValueChange={(value) => {
                    setFormData({ ...formData, payment_method: value });
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {companyCards.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          {method.method_name} ({method.method_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Purchase Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Purchase Description * (minimum 20 characters)</Label>
              <Textarea
                id="description"
                value={formData.transaction_memo}
                onChange={(e) => setFormData({...formData, transaction_memo: e.target.value})}
                placeholder="Detailed description of what this purchase was for..."
                rows={3}
              />
              <div className="text-sm text-muted-foreground">
                Characters: {formData.transaction_memo?.length || 0}/20 minimum
              </div>
            </div>

            {/* Receipt Upload */}
            <div className="space-y-2">
              <Label>Invoice/Receipt Upload *</Label>
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="p-6">
                  {documentUrl ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span>Receipt uploaded successfully</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload invoice or receipt image
                      </p>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                        className="hidden"
                        id="receipt-upload"
                      />
                      <label htmlFor="receipt-upload">
                        <Button type="button" variant="outline" asChild>
                          <span>Choose File</span>
                        </Button>
                      </label>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-6">
              <Button variant="outline" onClick={() => window.location.href = '/transactions'}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!isFormValid() || loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? "Saving..." : "Save & Submit for Approval"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}