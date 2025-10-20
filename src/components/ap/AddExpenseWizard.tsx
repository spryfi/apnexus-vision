import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, CreditCard, Fuel, FileCheck, UserCheck, RefreshCw, MoreHorizontal, ArrowLeft, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
    if (!formData.amount || !formData.description) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (selectedType?.requiresReceipt && !receiptFile) {
      toast({
        title: "Receipt required",
        description: `A receipt is required for ${selectedType.label}`,
        variant: "destructive",
      });
      return;
    }

    if (selectedType?.requiresInvoiceNumber && !formData.invoice_number) {
      toast({
        title: "Invoice number required",
        description: `An invoice number is required for ${selectedType.label}`,
        variant: "destructive",
      });
      return;
    }

    // Amount >= $500 always requires receipt
    const amount = parseFloat(formData.amount);
    if (amount >= 500 && !receiptFile) {
      toast({
        title: "Receipt required",
        description: "Expenses of $500 or more require a receipt",
        variant: "destructive",
      });
      return;
    }

    if (expenseType === 'employee_reimbursement' && !formData.employee_id) {
      toast({
        title: "Employee required",
        description: "Please select the employee to reimburse",
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
        
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transaction_date">Transaction Date *</Label>
                <Input
                  id="transaction_date"
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
                {formData.amount && parseFloat(formData.amount) >= 500 && (
                  <p className="text-xs text-orange-600">⚠️ Receipt required (≥ $500)</p>
                )}
              </div>
            </div>

            {expenseType === 'employee_reimbursement' && (
              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee *</Label>
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

            {['vendor_invoice', 'recurring_bill', 'other'].includes(expenseType) && (
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

            {selectedType?.requiresInvoiceNumber && (
              <div className="space-y-2">
                <Label htmlFor="invoice_number">Invoice Number *</Label>
                <Input
                  id="invoice_number"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  placeholder="INV-12345"
                  required
                />
              </div>
            )}

            {expenseType === 'check_payment' && (
              <div className="space-y-2">
                <Label htmlFor="check_number">Check Number</Label>
                <Input
                  id="check_number"
                  value={formData.check_number}
                  onChange={(e) => setFormData({ ...formData, check_number: e.target.value })}
                  placeholder="1001"
                />
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
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the expense..."
                rows={3}
                required
              />
            </div>

            {['vendor_invoice', 'recurring_bill'].includes(expenseType) && (
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes (optional)"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="receipt">
                Receipt Upload
                {selectedType?.requiresReceipt && <span className="text-red-500"> *</span>}
              </Label>
              <Input
                id="receipt"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
              {receiptFile && (
                <p className="text-sm text-green-600">✓ {receiptFile.name}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Accepted formats: PDF, JPG, PNG (max 10MB)
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? 'Saving...' : 'Add Expense'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
