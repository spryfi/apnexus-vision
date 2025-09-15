import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface ExpenseCategory {
  id: string;
  category_name: string;
}

interface Vendor {
  id: string;
  vendor_name: string;
  contact_person?: string;
  email?: string;
  phone_number?: string;
  full_address?: string;
  status?: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  your_account_number?: string;
  tax_id_ein?: string;
  default_expense_category_id?: string;
  preferred_payment_method?: string;
  payment_terms?: string;
  internal_notes?: string;
}

interface VendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: Vendor | null;
  onSuccess: () => void;
}

export function VendorDialog({ open, onOpenChange, vendor, onSuccess }: VendorDialogProps) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    vendor_name: '',
    status: 'active',
    // Contact Information
    primary_contact_name: '',
    primary_contact_email: '',
    primary_contact_phone: '',
    full_address: '',
    // Financial & Payment Details
    your_account_number: '',
    tax_id_ein: '',
    default_expense_category_id: '',
    preferred_payment_method: '',
    payment_terms: 'Net 30',
    // Internal Notes
    internal_notes: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (vendor) {
      setFormData({
        vendor_name: vendor.vendor_name || '',
        status: vendor.status || 'active',
        primary_contact_name: vendor.primary_contact_name || vendor.contact_person || '',
        primary_contact_email: vendor.primary_contact_email || vendor.email || '',
        primary_contact_phone: vendor.primary_contact_phone || vendor.phone_number || '',
        full_address: vendor.full_address || '',
        your_account_number: vendor.your_account_number || '',
        tax_id_ein: vendor.tax_id_ein || '',
        default_expense_category_id: vendor.default_expense_category_id || '',
        preferred_payment_method: vendor.preferred_payment_method || '',
        payment_terms: vendor.payment_terms || 'Net 30',
        internal_notes: vendor.internal_notes || '',
      });
    } else {
      setFormData({
        vendor_name: '',
        status: 'active',
        primary_contact_name: '',
        primary_contact_email: '',
        primary_contact_phone: '',
        full_address: '',
        your_account_number: '',
        tax_id_ein: '',
        default_expense_category_id: '',
        preferred_payment_method: '',
        payment_terms: 'Net 30',
        internal_notes: '',
      });
    }
  }, [vendor, open]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .order('category_name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vendor_name.trim()) {
      toast({
        title: "Vendor name required",
        description: "Please enter a vendor name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const vendorData = {
        ...formData,
        // Ensure backwards compatibility with old fields
        contact_person: formData.primary_contact_name,
        email: formData.primary_contact_email,
        phone_number: formData.primary_contact_phone,
        default_expense_category_id: formData.default_expense_category_id || null,
      };

      if (vendor) {
        const { error } = await supabase
          .from('vendors')
          .update(vendorData)
          .eq('id', vendor.id);

        if (error) throw error;

        toast({
          title: "Vendor updated",
          description: "The vendor has been updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('vendors')
          .insert([vendorData]);

        if (error) throw error;

        toast({
          title: "Vendor added",
          description: "New vendor has been created successfully",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error saving vendor",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {vendor ? 'Edit Vendor' : 'Add New Vendor'}
          </DialogTitle>
          <DialogDescription>
            {vendor ? 'Update vendor information' : 'Enter comprehensive vendor information to streamline your accounts payable workflow'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="contact" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>

            <TabsContent value="contact" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor_name">Vendor Name *</Label>
                  <Input
                    id="vendor_name"
                    value={formData.vendor_name}
                    onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                    placeholder="Enter vendor name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary_contact_name">Primary Contact Name</Label>
                <Input
                  id="primary_contact_name"
                  value={formData.primary_contact_name}
                  onChange={(e) => setFormData({ ...formData, primary_contact_name: e.target.value })}
                  placeholder="Contact person name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_contact_email">Email</Label>
                  <Input
                    id="primary_contact_email"
                    type="email"
                    value={formData.primary_contact_email}
                    onChange={(e) => setFormData({ ...formData, primary_contact_email: e.target.value })}
                    placeholder="Email address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primary_contact_phone">Phone Number</Label>
                  <Input
                    id="primary_contact_phone"
                    value={formData.primary_contact_phone}
                    onChange={(e) => setFormData({ ...formData, primary_contact_phone: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_address">Full Address</Label>
                <Textarea
                  id="full_address"
                  value={formData.full_address}
                  onChange={(e) => setFormData({ ...formData, full_address: e.target.value })}
                  placeholder="Complete address"
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="your_account_number">Your Account Number *</Label>
                <Input
                  id="your_account_number"
                  value={formData.your_account_number}
                  onChange={(e) => setFormData({ ...formData, your_account_number: e.target.value })}
                  placeholder="The account number they use for you on their invoices"
                />
                <p className="text-sm text-muted-foreground">
                  This is the account number the vendor has assigned to your company
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_id_ein">Tax ID / EIN</Label>
                <Input
                  id="tax_id_ein"
                  value={formData.tax_id_ein}
                  onChange={(e) => setFormData({ ...formData, tax_id_ein: e.target.value })}
                  placeholder="For 1099 reporting"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_expense_category_id">Default Expense Category</Label>
                <Select 
                  value={formData.default_expense_category_id} 
                  onValueChange={(value) => setFormData({ ...formData, default_expense_category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select default category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No default category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.category_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preferred_payment_method">Preferred Payment Method</Label>
                  <Select 
                    value={formData.preferred_payment_method} 
                    onValueChange={(value) => setFormData({ ...formData, preferred_payment_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Not specified</SelectItem>
                      <SelectItem value="ACH">ACH</SelectItem>
                      <SelectItem value="Check">Check</SelectItem>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_terms">Payment Terms</Label>
                  <Select 
                    value={formData.payment_terms} 
                    onValueChange={(value) => setFormData({ ...formData, payment_terms: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                      <SelectItem value="Net 15">Net 15</SelectItem>
                      <SelectItem value="Net 30">Net 30</SelectItem>
                      <SelectItem value="Net 60">Net 60</SelectItem>
                      <SelectItem value="COD">COD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <p>Document management will be available in the vendor detail page.</p>
                <p className="text-sm">Upload W-9s, Certificates of Insurance, and other compliance documents.</p>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="internal_notes">Internal Notes</Label>
                <Textarea
                  id="internal_notes"
                  value={formData.internal_notes}
                  onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                  placeholder="Internal notes about this vendor (e.g., Always late on Tuesdays, Ask for Jane for billing)"
                  rows={6}
                />
              </div>
            </TabsContent>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : (vendor ? 'Update Vendor' : 'Add Vendor')}
              </Button>
            </DialogFooter>
          </form>
          </Tabs>
      </DialogContent>
    </Dialog>
  );
}