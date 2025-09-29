import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, CreditCard, Building2, DollarSign, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentMethod {
  id: string;
  method_type: string;
  method_name: string;
  account_details?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Employee {
  id: string;
  full_name: string;
}

export function PaymentMethodsManager() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    method_type: '',
    method_name: '',
    account_details: '',
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [methodsResponse, employeesResponse] = await Promise.all([
        supabase.from('payment_methods').select('*').order('nickname'),
        supabase.from('employees_enhanced').select('id, full_name').order('full_name')
      ]);

      if (methodsResponse.error) throw methodsResponse.error;
      if (employeesResponse.error) throw employeesResponse.error;

      setPaymentMethods(methodsResponse.data || []);
      setEmployees(employeesResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load payment methods",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      method_type: '',
      method_name: '',
      account_details: '',
      is_active: true
    });
    setEditingMethod(null);
  };

  const openEditDialog = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      method_type: method.method_type,
      method_name: method.method_name,
      account_details: method.account_details || '',
      is_active: method.is_active
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.method_type || !formData.method_name) {
      toast({
        title: "Error",
        description: "Method type and name are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const dataToSave = {
        method_type: formData.method_type,
        method_name: formData.method_name,
        account_details: formData.account_details || null,
        is_active: formData.is_active
      };

      if (editingMethod) {
        const { error } = await supabase
          .from('payment_methods')
          .update(dataToSave)
          .eq('id', editingMethod.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Payment method updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('payment_methods')
          .insert(dataToSave);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Payment method added successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving payment method:', error);
      toast({
        title: "Error",
        description: "Failed to save payment method",
        variant: "destructive",
      });
    }
  };

  const getMethodIcon = (type: string) => {
    if (type.includes('Card')) return <CreditCard className="h-4 w-4" />;
    if (type === 'Bank Account') return <Building2 className="h-4 w-4" />;
    if (type === 'Cash' || type === 'Check') return <DollarSign className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const getStatusBadge = (isActive: boolean) => {
    const variant = isActive ? 'default' : 'destructive';
    return <Badge variant={variant}>{isActive ? 'Active' : 'Inactive'}</Badge>;
  };

  if (loading) {
    return <div>Loading payment methods...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Payment Methods</h2>
          <p className="text-muted-foreground">Manage company credit cards, bank accounts, and other payment methods</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMethod ? 'Edit Payment Method' : 'Add New Payment Method'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="method_type">Method Type *</Label>
                <Select value={formData.method_type} onValueChange={(value) => setFormData({...formData, method_type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Debit Card">Debit Card</SelectItem>
                    <SelectItem value="Fuel Card">Fuel Card</SelectItem>
                    <SelectItem value="Virtual Card">Virtual Card</SelectItem>
                    <SelectItem value="Bank Account">Bank Account</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Check">Check</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="method_name">Method Name *</Label>
                <Input
                  id="method_name"
                  value={formData.method_name}
                  onChange={(e) => setFormData({...formData, method_name: e.target.value})}
                  placeholder="e.g., Main Fuel Card, Office Checking"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="account_details">Account Details</Label>
                <Textarea
                  id="account_details"
                  value={formData.account_details}
                  onChange={(e) => setFormData({...formData, account_details: e.target.value})}
                  placeholder="Enter card details, account numbers, or other relevant information"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_active">Status</Label>
                <Select value={formData.is_active.toString()} onValueChange={(value) => setFormData({...formData, is_active: value === 'true'})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingMethod ? 'Update' : 'Save'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paymentMethods.map((method) => (
          <Card key={method.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEditDialog(method)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getMethodIcon(method.method_type)}
                  <CardTitle className="text-lg">{method.method_name}</CardTitle>
                </div>
                {getStatusBadge(method.is_active)}
              </div>
              <CardDescription>
                {method.method_type}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {method.account_details && (
                  <div className="text-muted-foreground">
                    {method.account_details}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Created: {new Date(method.created_at).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {paymentMethods.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Payment Methods</h3>
            <p className="text-muted-foreground mb-4">
              Add your first payment method to start tracking expenses and transactions.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}