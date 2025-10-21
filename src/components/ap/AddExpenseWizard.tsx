import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, CreditCard, Fuel, FileCheck, UserCheck, RefreshCw, MoreHorizontal, ArrowLeft, CheckCircle, Loader2, Save, ChevronLeft, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VendorInvoiceForm } from "@/components/expenses/VendorInvoiceForm";

interface AddExpenseWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vendors: { id: string; vendor_name: string }[];
  categories: { id: string; category_name: string }[];
  employees: { id: string; full_name: string }[];
}

interface ExpenseType {
  id: string;
  label: string;
  description: string;
  icon: any;
  color: string;
  requiresInvoiceNumber: boolean;
  requiresReceipt: boolean;
  disabled?: boolean;
  disabledMessage?: string;
}

export function AddExpenseWizard({ isOpen, onClose, onSuccess, vendors, categories, employees }: AddExpenseWizardProps) {
  const [step, setStep] = useState(1);
  const [expenseType, setExpenseType] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    vendor_id: '',
    employee_id: '',
    category_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    amount: '',
    description: '',
    invoice_number: '',
    check_number: '',
    payment_method: '',
    due_date: '',
    notes: ''
  });

  const expenseTypes: ExpenseType[] = [
    {
      id: 'vendor_invoice',
      label: 'Vendor Invoice',
      description: 'Bill from a vendor or supplier',
      icon: FileText,
      color: 'blue',
      requiresInvoiceNumber: true,
      requiresReceipt: false
    },
    {
      id: 'credit_card_purchase',
      label: 'Credit Card Purchase',
      description: 'Purchase made on company credit card',
      icon: CreditCard,
      color: 'purple',
      requiresInvoiceNumber: false,
      requiresReceipt: true
    },
    {
      id: 'fuel_purchase',
      label: 'Fuel Purchase',
      description: 'Fuel from WEX statement (auto-imported)',
      icon: Fuel,
      color: 'orange',
      requiresInvoiceNumber: true,
      requiresReceipt: true,
      disabled: true,
      disabledMessage: 'Fuel purchases are automatically imported from WEX statements'
    },
    {
      id: 'check_payment',
      label: 'Check Payment',
      description: 'Payment made by company check',
      icon: FileCheck,
      color: 'green',
      requiresInvoiceNumber: false,
      requiresReceipt: true
    },
    {
      id: 'employee_reimbursement',
      label: 'Employee Reimbursement',
      description: 'Reimburse employee for out-of-pocket expense',
      icon: UserCheck,
      color: 'teal',
      requiresInvoiceNumber: false,
      requiresReceipt: true
    },
    {
      id: 'recurring_bill',
      label: 'Recurring Bill',
      description: 'Utility, subscription, or recurring service',
      icon: RefreshCw,
      color: 'indigo',
      requiresInvoiceNumber: false,
      requiresReceipt: false
    },
    {
      id: 'other',
      label: 'Other Expense',
      description: 'Any other type of company expense',
      icon: MoreHorizontal,
      color: 'gray',
      requiresInvoiceNumber: false,
      requiresReceipt: false
    }
  ];

  const selectedType = expenseTypes.find(t => t.id === expenseType);

  // Get required fields based on expense type
  const getRequiredFields = () => {
    const base = ['transaction_date', 'amount', 'description'];
    
    switch (expenseType) {
      case 'vendor_invoice':
        return [...base, 'invoice_number', 'due_date'];
      case 'credit_card_purchase':
        return [...base, 'employee_id'];
      case 'check_payment':
        return [...base, 'check_number'];
      case 'employee_reimbursement':
        return [...base, 'employee_id'];
      case 'recurring_bill':
        return [...base, 'due_date'];
      default:
        return base;
    }
  };

  const isReceiptRequired = selectedType?.requiresReceipt || parseFloat(formData.amount) >= 500;

  // Get missing fields for validation
  const getMissingFields = () => {
    const missing: string[] = [];
    
    if (!formData.transaction_date) missing.push('Transaction Date');
    if (!formData.amount) missing.push('Amount');
    if (!formData.description) missing.push('Description');
    
    if (expenseType === 'vendor_invoice' && !formData.invoice_number) missing.push('Invoice Number');
    if (expenseType === 'check_payment' && !formData.check_number) missing.push('Check Number');
    if (['credit_card_purchase', 'employee_reimbursement'].includes(expenseType) && !formData.employee_id) missing.push('Employee');
    if (['vendor_invoice', 'recurring_bill'].includes(expenseType) && !formData.due_date) missing.push('Due Date');
    if (isReceiptRequired && !receiptFile) missing.push('Receipt Upload');
    
    return missing;
  };

  const isFormValid = () => {
    return getMissingFields().length === 0;
  };

  const getDaysUntilDue = (dueDate: string) => {
    if (!dueDate) return '';
    const today = new Date();
    const due = new Date(dueDate);
    const days = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `${days}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileType = file.type;
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      
      if (!validTypes.includes(fileType)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, JPG, JPEG, or PNG file",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "File must be less than 10MB",
          variant: "destructive",
        });
        return;
      }

      setReceiptFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!isFormValid()) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      let receiptUrl = '';

      // Upload receipt if provided
      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `receipt_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('receipt-images')
          .upload(filePath, receiptFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('receipt-images')
          .getPublicUrl(filePath);

        receiptUrl = publicUrl;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Determine payment method
      let paymentMethod = formData.payment_method;
      if (!paymentMethod) {
        switch (expenseType) {
          case 'credit_card_purchase':
            paymentMethod = 'credit_card';
            break;
          case 'check_payment':
            paymentMethod = 'check';
            break;
          case 'employee_reimbursement':
            paymentMethod = 'reimbursement';
            break;
          default:
            paymentMethod = 'invoice';
        }
      }

      const amount = parseFloat(formData.amount);

      // Create expense transaction
      const expenseData = {
        expense_type: expenseType,
        transaction_date: formData.transaction_date,
        amount: amount,
        description: formData.description,
        vendor_id: formData.vendor_id || null,
        employee_id: formData.employee_id || null,
        category_id: formData.category_id || null,
        invoice_number: formData.invoice_number || null,
        check_number: formData.check_number || null,
        payment_method: paymentMethod,
        due_date: formData.due_date || null,
        notes: formData.notes || null,
        receipt_url: receiptUrl || null,
        created_by: user?.id,
        payment_status: 'pending',
        approval_status: amount < 2500 ? 'auto_approved' : 'pending_review',
        approved_at: amount < 2500 ? new Date().toISOString() : null,
        approved_by: amount < 2500 ? user?.id : null
      };

      const { error } = await supabase
        .from('expense_transactions')
        .insert([expenseData]);

      if (error) throw error;

      toast({
        title: "Expense added",
        description: amount < 2500 
          ? "Expense added and auto-approved (< $2,500)"
          : "Expense added and flagged for review (≥ $2,500)",
      });

      onSuccess();
      handleClose();
    } catch (error: any) {
      toast({
        title: "Error saving expense",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setExpenseType('');
    setReceiptFile(null);
    setFormData({
      vendor_id: '',
      employee_id: '',
      category_id: '',
      transaction_date: new Date().toISOString().split('T')[0],
      amount: '',
      description: '',
      invoice_number: '',
      check_number: '',
      payment_method: '',
      due_date: '',
      notes: ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? 'Add New Expense' : `Add ${selectedType?.label}`}
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? 'Select the type of expense you want to record'
              : 'Fill in the expense details'
            }
          </DialogDescription>
        </DialogHeader>
        
        {step === 1 && (
          <div className="grid grid-cols-2 gap-4 py-4">
            {expenseTypes.map(type => (
              <button
                key={type.id}
                disabled={type.disabled}
                onClick={() => {
                  setExpenseType(type.id);
                  setStep(2);
                }}
                className={`
                  p-6 border-2 rounded-lg text-left transition-all
                  ${type.disabled 
                    ? 'opacity-50 cursor-not-allowed border-border' 
                    : 'hover:border-primary hover:shadow-md cursor-pointer border-border hover:bg-accent'
                  }
                `}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-accent">
                    <type.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{type.label}</h3>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                    {type.disabled && (
                      <p className="text-xs text-yellow-600 mt-2">
                        ⚠️ {type.disabledMessage}
                      </p>
                    )}
                    <div className="flex gap-2 mt-3">
                      {type.requiresInvoiceNumber && (
                        <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded">
                          Invoice # Required
                        </span>
                      )}
                      {type.requiresReceipt && (
                        <span className="text-xs px-2 py-1 bg-red-500/10 text-red-700 dark:text-red-400 rounded">
                          Receipt Required
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {step === 2 && expenseType === 'vendor_invoice' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Vendor Invoice</h3>
            <p className="text-muted-foreground mb-4">Form loading...</p>
            <Button 
              onClick={() => setStep(1)}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        )}
        
        {step === 2 && expenseType !== 'vendor_invoice' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transaction_date">
                  Transaction Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="transaction_date"
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">
                  Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
                {formData.amount && parseFloat(formData.amount) >= 500 && (
                  <p className="text-xs text-yellow-600">
                    ⚠️ Expenses ≥ $500 require receipt upload
                  </p>
                )}
              </div>
            </div>

            {/* Conditional Fields Based on Expense Type */}

            {/* Vendor - for most types except employee reimbursement */}
            {expenseType !== 'employee_reimbursement' && (
              <div className="space-y-2">
                <Label htmlFor="vendor_id">Vendor</Label>
                <Select value={formData.vendor_id} onValueChange={(value) => setFormData({ ...formData, vendor_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {vendors.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.vendor_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Invoice Number - for vendor_invoice */}
            {expenseType === 'vendor_invoice' && (
              <div className="space-y-2">
                <Label htmlFor="invoice_number">
                  Invoice Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="invoice_number"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  placeholder="INV-12345"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter "NI" if no invoice number available
                </p>
              </div>
            )}

            {/* Check Number - for check_payment */}
            {expenseType === 'check_payment' && (
              <div className="space-y-2">
                <Label htmlFor="check_number">
                  Check Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="check_number"
                  value={formData.check_number}
                  onChange={(e) => setFormData({ ...formData, check_number: e.target.value })}
                  placeholder="1001"
                  required
                />
              </div>
            )}

            {/* Employee - for credit_card_purchase, employee_reimbursement */}
            {['credit_card_purchase', 'employee_reimbursement'].includes(expenseType) && (
              <div className="space-y-2">
                <Label htmlFor="employee_id">
                  Employee <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.employee_id} onValueChange={(value) => setFormData({ ...formData, employee_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Due Date - for vendor_invoice, recurring_bill */}
            {['vendor_invoice', 'recurring_bill'].includes(expenseType) && (
              <div className="space-y-2">
                <Label htmlFor="due_date">
                  Due Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                />
                {formData.due_date && (
                  <p className="text-xs text-muted-foreground">
                    {getDaysUntilDue(formData.due_date)} days until due
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="category_id">Category</Label>
              <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the expense..."
                rows={3}
                required
              />
            </div>

            {/* Receipt Upload with conditional styling */}
            <div className={`border-2 rounded-lg p-4 ${isReceiptRequired ? 'border-red-300 bg-red-50 dark:bg-red-950/20' : 'border-border'}`}>
              <Label htmlFor="receipt">
                Receipt Upload {isReceiptRequired && <span className="text-red-500">*</span>}
              </Label>
              {isReceiptRequired && (
                <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                  ⚠️ Receipt is mandatory for this expense type
                </p>
              )}
              <Input
                id="receipt"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Accepted formats: PDF, JPG, PNG (max 10MB)
              </p>
              {receiptFile && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>{receiptFile.name} ready to upload</span>
                </div>
              )}
              {!isReceiptRequired && !receiptFile && (
                <p className="text-xs text-yellow-600 mt-2">
                  ℹ️ Receipt optional but recommended for audit trail
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information..."
                rows={2}
              />
            </div>

            {/* Validation Summary */}
            {!isFormValid() && formData.amount && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <h4 className="font-semibold mb-2">Required Fields Missing:</h4>
                  <ul className="space-y-1">
                    {getMissingFields().map(field => (
                      <li key={field}>• {field}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStep(1)}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!isFormValid() || uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Expense
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
