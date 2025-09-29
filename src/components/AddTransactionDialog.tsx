import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";

interface Vendor {
  id: string;
  vendor_name: string;
}

interface Employee {
  id: string;
  employee_name: string;
}

interface ExpenseCategory {
  id: string;
  category_name: string;
}

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddTransactionDialog({ open, onOpenChange, onSuccess }: AddTransactionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [companyCards, setCompanyCards] = useState<any[]>([]);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    vendor_id: '',
    invoice_number: '',
    invoice_date: '',
    due_date: '',
    amount: '',
    expense_category_id: '',
    purchase_description: '',
    employee_id: '',
    payment_method: '',
    payment_source: '',
    check_number: '',
  });

  const [newVendor, setNewVendor] = useState({
    vendor_name: '',
    contact_person: '',
    email: '',
    phone_number: '',
    full_address: '',
  });

  useEffect(() => {
    if (open) {
      fetchDropdownData();
    }
  }, [open]);

  const fetchDropdownData = async () => {
    try {
      const [vendorsRes, employeesRes, categoriesRes, cardsRes] = await Promise.all([
        supabase.from('vendors').select('id, vendor_name').order('vendor_name'),
        supabase.from('employees').select('id, employee_name').order('employee_name'),
        supabase.from('expense_categories').select('id, category_name').order('category_name'),
        supabase.from('company_cards').select('*').eq('is_active', true).order('cardholder_name')
      ]);

      if (vendorsRes.error) throw vendorsRes.error;
      if (employeesRes.error) throw employeesRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (cardsRes.error) throw cardsRes.error;

      setVendors(vendorsRes.data || []);
      setEmployees(employeesRes.data || []);
      setExpenseCategories(categoriesRes.data || []);
      setCompanyCards(cardsRes.data || []);
    } catch (error) {
      toast({
        title: "Error loading data",
        description: "Failed to load vendors, employees, or categories",
        variant: "destructive",
      });
    }
  };

  const handleAddVendor = async () => {
    if (!newVendor.vendor_name.trim()) {
      toast({
        title: "Vendor name required",
        description: "Please enter a vendor name",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('vendors')
        .insert([newVendor])
        .select()
        .single();

      if (error) throw error;

      setVendors([...vendors, data]);
      setFormData({ ...formData, vendor_id: data.id });
      setNewVendor({
        vendor_name: '',
        contact_person: '',
        email: '',
        phone_number: '',
        full_address: '',
      });
      setShowAddVendor(false);

      toast({
        title: "Vendor added",
        description: "New vendor has been created and selected",
      });
    } catch (error) {
      toast({
        title: "Error adding vendor",
        description: "Failed to create new vendor",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.vendor_id || !formData.invoice_date || !formData.amount || 
          !formData.expense_category_id || !formData.purchase_description || 
          !formData.employee_id || !formData.payment_source) {
        throw new Error("Please fill in all required fields");
      }

      const { error } = await supabase
        .from('transactions')
        .insert([{
          ...formData,
          amount: parseFloat(formData.amount),
          status: 'Pending Approval' as const,
          payment_method: "Credit Card" as any,
          payment_source_detail: formData.payment_source
        }]);

      if (error) throw error;

      toast({
        title: "Transaction added",
        description: "The transaction has been created successfully",
      });

      onSuccess();
      
      // Reset form
      setFormData({
        vendor_id: '',
        invoice_number: '',
        invoice_date: '',
        due_date: '',
        amount: '',
        expense_category_id: '',
        purchase_description: '',
        employee_id: '',
        payment_method: '',
        payment_source: '',
        check_number: '',
      });
    } catch (error: any) {
      toast({
        title: "Error adding transaction",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pay a Bill</DialogTitle>
          <DialogDescription>
            Enter bill information to process payment
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vendor Selection */}
          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor *</Label>
            <div className="flex gap-2">
              <Select value={formData.vendor_id} onValueChange={(value) => setFormData({ ...formData, vendor_id: value })}>
                <SelectTrigger className="flex-1">
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
              <Button type="button" variant="outline" onClick={() => setShowAddVendor(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Add Vendor Section */}
          {showAddVendor && (
            <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
              <h4 className="font-medium">Add New Vendor</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Vendor Name *</Label>
                  <Input
                    value={newVendor.vendor_name}
                    onChange={(e) => setNewVendor({ ...newVendor, vendor_name: e.target.value })}
                    placeholder="Enter vendor name"
                  />
                </div>
                <div>
                  <Label>Contact Person</Label>
                  <Input
                    value={newVendor.contact_person}
                    onChange={(e) => setNewVendor({ ...newVendor, contact_person: e.target.value })}
                    placeholder="Contact person"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newVendor.email}
                    onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                    placeholder="Email address"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={newVendor.phone_number}
                    onChange={(e) => setNewVendor({ ...newVendor, phone_number: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Textarea
                  value={newVendor.full_address}
                  onChange={(e) => setNewVendor({ ...newVendor, full_address: e.target.value })}
                  placeholder="Full address"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" onClick={handleAddVendor}>Add Vendor</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddVendor(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_number">Invoice Number</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                placeholder="Invoice number"
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
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_date">Invoice Date *</Label>
              <Input
                id="invoice_date"
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expense_category">Expense Category *</Label>
              <Select value={formData.expense_category_id} onValueChange={(value) => setFormData({ ...formData, expense_category_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee">Employee *</Label>
              <Select value={formData.employee_id} onValueChange={(value) => setFormData({ ...formData, employee_id: value })}>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase_description">Purchase Description *</Label>
            <Textarea
              id="purchase_description"
              value={formData.purchase_description}
              onChange={(e) => setFormData({ ...formData, purchase_description: e.target.value })}
              placeholder="Describe the purchase..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_method">Company Card *</Label>
              {companyCards.length === 0 ? (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    ⚠️ No Active Company Cards found. Please add a card under Settings &gt; Company Cards.
                  </p>
                </div>
              ) : (
                <Select value={formData.payment_source} onValueChange={(value) => setFormData({ ...formData, payment_source: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company card" />
                  </SelectTrigger>
                  <SelectContent>
                    {companyCards.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        {card.cardholder_name} - {card.card_type} (•••• {card.last_four})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_source">Payment Source</Label>
              <Input
                id="payment_source"
                value={formData.payment_source}
                onChange={(e) => setFormData({ ...formData, payment_source: e.target.value })}
                placeholder="e.g., Amex Gold x1005"
              />
            </div>
          </div>

          {formData.payment_method === 'Check' && (
            <div className="space-y-2">
              <Label htmlFor="check_number">Check Number</Label>
              <Input
                id="check_number"
                value={formData.check_number}
                onChange={(e) => setFormData({ ...formData, check_number: e.target.value })}
                placeholder="Check number"
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Bill Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}