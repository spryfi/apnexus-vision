import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Download, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Invoice {
  id: string;
  invoice_number: string;
  vendor_id: string;
  vendors?: { vendor_name: string };
  invoice_date: string;
  due_date: string;
  amount: number;
  status: string;
  description?: string;
  created_at: string;
}

interface Vendor {
  id: string;
  vendor_name: string;
}

export default function AccountsPayable() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [vendorFilter, setVendorFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();

  const [invoiceForm, setInvoiceForm] = useState<{
    invoice_number: string;
    vendor_id: string;
    invoice_date: string;
    due_date: string;
    amount: string;
    description: string;
    status: "Pending Approval" | "Approved for Payment" | "Paid";
  }>({
    invoice_number: '',
    vendor_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    amount: '',
    description: '',
    status: 'Pending Approval',
  });

  useEffect(() => {
    fetchData();
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('invoices-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch invoices (using transactions table with type filter)
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('transactions')
        .select(`
          *,
          vendors(vendor_name)
        `)
        .order('invoice_date', { ascending: false });

      if (invoicesError) throw invoicesError;

      // Fetch vendors
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select('id, vendor_name')
        .order('vendor_name');

      if (vendorsError) throw vendorsError;

      setInvoices(invoicesData || []);
      setVendors(vendorsData || []);
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setInvoiceForm({
      invoice_number: '',
      vendor_id: '',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: '',
      amount: '',
      description: '',
      status: 'Pending Approval',
    });
    setSelectedInvoice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoiceForm.invoice_number || !invoiceForm.vendor_id || !invoiceForm.amount) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const invoiceData = {
        invoice_number: invoiceForm.invoice_number,
        vendor_id: invoiceForm.vendor_id,
        employee_id: null,
        expense_category_id: null,
        invoice_date: invoiceForm.invoice_date,
        due_date: invoiceForm.due_date,
        amount: parseFloat(invoiceForm.amount),
        status: invoiceForm.status as "Pending Approval" | "Approved for Payment" | "Paid",
        transaction_memo: invoiceForm.description,
        payment_method: 'Check' as const,
      };

      if (selectedInvoice) {
        const { error } = await supabase
          .from('transactions')
          .update(invoiceData)
          .eq('id', selectedInvoice.id);

        if (error) throw error;

        toast({
          title: "Invoice updated",
          description: "The invoice has been updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('transactions')
          .insert([invoiceData]);

        if (error) throw error;

        toast({
          title: "Invoice added",
          description: "New invoice has been created successfully",
        });
      }

      fetchData();
      setShowAddDialog(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error saving invoice",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    const validStatus = ["Pending Approval", "Approved for Payment", "Paid"].includes(invoice.status)
      ? invoice.status as "Pending Approval" | "Approved for Payment" | "Paid"
      : "Pending Approval";
    
    setInvoiceForm({
      invoice_number: invoice.invoice_number || '',
      vendor_id: invoice.vendor_id || '',
      invoice_date: invoice.invoice_date || '',
      due_date: invoice.due_date || '',
      amount: invoice.amount?.toString() || '',
      description: invoice.description || '',
      status: validStatus,
    });
    setShowAddDialog(true);
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'Paid' })
        .eq('id', invoiceId);

      if (error) throw error;

      toast({
        title: "Invoice marked as paid",
        description: "The invoice status has been updated",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error updating invoice",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;

      toast({
        title: "Invoice deleted",
        description: "The invoice has been deleted successfully",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error deleting invoice",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    const csv = [
      ['Invoice Number', 'Vendor', 'Invoice Date', 'Due Date', 'Amount', 'Status'],
      ...filteredInvoices.map(inv => [
        inv.invoice_number || '',
        inv.vendors?.vendor_name || '',
        inv.invoice_date,
        inv.due_date,
        inv.amount,
        inv.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadge = (invoice: Invoice) => {
    const today = new Date();
    const dueDate = new Date(invoice.due_date);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (invoice.status === 'Paid') {
      return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Paid</Badge>;
    }

    if (dueDate < today && invoice.status !== 'Paid') {
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Overdue</Badge>;
    }

    if (daysUntilDue <= 7 && daysUntilDue >= 0) {
      return <Badge className="bg-yellow-600"><Clock className="h-3 w-3 mr-1" /> Due Soon</Badge>;
    }

    if (invoice.status === 'Approved for Payment') {
      return <Badge className="bg-blue-600">Approved</Badge>;
    }

    return <Badge variant="secondary">{invoice.status}</Badge>;
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const days = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `${days} days`;
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesStatus = statusFilter === "All" || invoice.status === statusFilter;
    const matchesVendor = vendorFilter === "All" || invoice.vendor_id === vendorFilter;
    const matchesSearch = !searchQuery || 
      invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.vendors?.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesVendor && matchesSearch;
  });

  // Calculate metrics
  const today = new Date();
  const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const totalOutstanding = invoices
    .filter(inv => ['Pending Approval', 'Approved for Payment'].includes(inv.status))
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

  const overdueAmount = invoices
    .filter(inv => {
      const dueDate = new Date(inv.due_date);
      return dueDate < today && inv.status !== 'Paid';
    })
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

  const dueThisWeek = invoices
    .filter(inv => {
      const dueDate = new Date(inv.due_date);
      return dueDate >= today && dueDate <= oneWeekFromNow && inv.status !== 'Paid';
    })
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

  const paidThisMonth = invoices
    .filter(inv => {
      const invoiceDate = new Date(inv.invoice_date);
      return invoiceDate >= startOfMonth && inv.status === 'Paid';
    })
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-muted rounded w-64 mb-2"></div>
            <div className="h-4 bg-muted rounded w-96"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-32"></div>
                  <div className="h-8 bg-muted rounded w-24"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Accounts Payable</h1>
        <p className="text-muted-foreground">
          Manage invoices and track outstanding payables
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Outstanding"
          value={`$${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`${invoices.filter(i => ['Pending Approval', 'Approved for Payment'].includes(i.status)).length} invoices`}
          icon={Clock}
        />
        <MetricCard
          title="Overdue Amount"
          value={`$${overdueAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`${invoices.filter(i => new Date(i.due_date) < today && i.status !== 'Paid').length} invoices`}
          icon={AlertCircle}
        />
        <MetricCard
          title="Due This Week"
          value={`$${dueThisWeek.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`${invoices.filter(i => {
            const dueDate = new Date(i.due_date);
            return dueDate >= today && dueDate <= oneWeekFromNow && i.status !== 'Paid';
          }).length} invoices`}
          icon={Clock}
        />
        <MetricCard
          title="Paid This Month"
          value={`$${paidThisMonth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`${invoices.filter(i => new Date(i.invoice_date) >= startOfMonth && i.status === 'Paid').length} invoices`}
          icon={CheckCircle}
        />
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Search</Label>
                <Input
                  placeholder="Invoice # or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    <SelectItem value="Pending Approval">Pending</SelectItem>
                    <SelectItem value="Approved for Payment">Approved</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vendor</Label>
                <Select value={vendorFilter} onValueChange={setVendorFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Vendors</SelectItem>
                    {vendors.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.vendor_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 items-end">
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Invoice
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Invoice Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Days Until Due</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-12 w-12 text-muted-foreground" />
                        <p className="text-lg font-medium">No invoices found</p>
                        <p className="text-sm text-muted-foreground">
                          {invoices.length === 0 
                            ? "Add your first invoice to get started" 
                            : "Try adjusting your filters"}
                        </p>
                        {invoices.length === 0 && (
                          <Button onClick={() => setShowAddDialog(true)} className="mt-2">
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Invoice
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number || '-'}</TableCell>
                      <TableCell>{invoice.vendors?.vendor_name || '-'}</TableCell>
                      <TableCell>{new Date(invoice.invoice_date).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                      <TableCell>${invoice.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>{getStatusBadge(invoice)}</TableCell>
                      <TableCell>{getDaysUntilDue(invoice.due_date)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleEdit(invoice)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {invoice.status !== 'Paid' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-green-600 hover:text-green-600"
                              onClick={() => handleMarkAsPaid(invoice.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDelete(invoice.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Invoice Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedInvoice ? 'Edit Invoice' : 'Add New Invoice'}
            </DialogTitle>
            <DialogDescription>
              {selectedInvoice ? 'Update invoice information' : 'Enter invoice details'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoice_number">Invoice Number *</Label>
                <Input
                  id="invoice_number"
                  value={invoiceForm.invoice_number}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_number: e.target.value })}
                  placeholder="INV-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor_id">Vendor *</Label>
                <Select 
                  value={invoiceForm.vendor_id} 
                  onValueChange={(value) => setInvoiceForm({ ...invoiceForm, vendor_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.vendor_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoice_date">Invoice Date *</Label>
                <Input
                  id="invoice_date"
                  type="date"
                  value={invoiceForm.invoice_date}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={invoiceForm.due_date}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={invoiceForm.amount}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={invoiceForm.status} 
                  onValueChange={(value: "Pending Approval" | "Approved for Payment" | "Paid") => 
                    setInvoiceForm({ ...invoiceForm, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending Approval">Pending</SelectItem>
                    <SelectItem value="Approved for Payment">Approved</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={invoiceForm.description}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                placeholder="Invoice description or notes..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedInvoice ? 'Update Invoice' : 'Add Invoice'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
