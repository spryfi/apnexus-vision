import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Users, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Vendor {
  id: string;
  vendor_name: string;
  contact_person: string;
  email: string;
  phone_number: string;
  full_address: string;
  created_at: string;
}

interface ExpenseCategory {
  id: string;
  category_name: string;
  created_at: string;
}

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
  const { toast } = useToast();

  const [vendorForm, setVendorForm] = useState({
    vendor_name: '',
    contact_person: '',
    email: '',
    phone_number: '',
    full_address: '',
  });

  const [categoryForm, setCategoryForm] = useState({
    category_name: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vendorsRes, categoriesRes] = await Promise.all([
        supabase.from('vendors').select('*').order('vendor_name'),
        supabase.from('expense_categories').select('*').order('category_name'),
      ]);

      if (vendorsRes.error) throw vendorsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setVendors(vendorsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      toast({
        title: "Error fetching data",
        description: "Failed to load vendors and categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetVendorForm = () => {
    setVendorForm({
      vendor_name: '',
      contact_person: '',
      email: '',
      phone_number: '',
      full_address: '',
    });
    setSelectedVendor(null);
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      category_name: '',
    });
    setSelectedCategory(null);
  };

  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vendorForm.vendor_name.trim()) {
      toast({
        title: "Vendor name required",
        description: "Please enter a vendor name",
        variant: "destructive",
      });
      return;
    }

    try {
      if (selectedVendor) {
        // Update existing vendor
        const { error } = await supabase
          .from('vendors')
          .update(vendorForm)
          .eq('id', selectedVendor.id);

        if (error) throw error;

        toast({
          title: "Vendor updated",
          description: "The vendor has been updated successfully",
        });
      } else {
        // Add new vendor
        const { error } = await supabase
          .from('vendors')
          .insert([vendorForm]);

        if (error) throw error;

        toast({
          title: "Vendor added",
          description: "New vendor has been created successfully",
        });
      }

      fetchData();
      setShowAddVendor(false);
      resetVendorForm();
    } catch (error: any) {
      toast({
        title: "Error saving vendor",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryForm.category_name.trim()) {
      toast({
        title: "Category name required",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }

    try {
      if (selectedCategory) {
        // Update existing category
        const { error } = await supabase
          .from('expense_categories')
          .update(categoryForm)
          .eq('id', selectedCategory.id);

        if (error) throw error;

        toast({
          title: "Category updated",
          description: "The category has been updated successfully",
        });
      } else {
        // Add new category
        const { error } = await supabase
          .from('expense_categories')
          .insert([categoryForm]);

        if (error) throw error;

        toast({
          title: "Category added",
          description: "New category has been created successfully",
        });
      }

      fetchData();
      setShowAddCategory(false);
      resetCategoryForm();
    } catch (error: any) {
      toast({
        title: "Error saving category",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const editVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setVendorForm({
      vendor_name: vendor.vendor_name,
      contact_person: vendor.contact_person || '',
      email: vendor.email || '',
      phone_number: vendor.phone_number || '',
      full_address: vendor.full_address || '',
    });
    setShowAddVendor(true);
  };

  const editCategory = (category: ExpenseCategory) => {
    setSelectedCategory(category);
    setCategoryForm({
      category_name: category.category_name,
    });
    setShowAddCategory(true);
  };

  const deleteVendor = async (vendorId: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;

    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vendorId);

      if (error) throw error;

      toast({
        title: "Vendor deleted",
        description: "The vendor has been deleted successfully",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error deleting vendor",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: "Category deleted",
        description: "The category has been deleted successfully",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error deleting category",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-muted rounded w-48 mb-2"></div>
            <div className="h-4 bg-muted rounded w-64"></div>
          </div>
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
        <h1 className="text-3xl font-bold tracking-tight">Vendors & Categories</h1>
        <p className="text-muted-foreground">
          Manage your vendors and expense categories
        </p>
      </div>

      <Tabs defaultValue="vendors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vendors" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Vendors
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Expense Categories
          </TabsTrigger>
        </TabsList>

        {/* Vendors Tab */}
        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Vendors ({vendors.length})</CardTitle>
                <CardDescription>
                  Manage your supplier information and contact details
                </CardDescription>
              </div>
              <Button onClick={() => setShowAddVendor(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor Name</TableHead>
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No vendors found. Add your first vendor to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      vendors.map((vendor) => (
                        <TableRow key={vendor.id}>
                          <TableCell className="font-medium">{vendor.vendor_name}</TableCell>
                          <TableCell>{vendor.contact_person || '-'}</TableCell>
                          <TableCell>{vendor.email || '-'}</TableCell>
                          <TableCell>{vendor.phone_number || '-'}</TableCell>
                          <TableCell className="max-w-xs truncate">{vendor.full_address || '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => editVendor(vendor)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => deleteVendor(vendor.id)}
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
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Expense Categories ({categories.length})</CardTitle>
                <CardDescription>
                  Organize your expenses into categories for better tracking
                </CardDescription>
              </div>
              <Button onClick={() => setShowAddCategory(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category Name</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          No categories found. Add your first category to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      categories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.category_name}</TableCell>
                          <TableCell>{new Date(category.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => editCategory(category)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => deleteCategory(category.id)}
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
        </TabsContent>
      </Tabs>

      {/* Add/Edit Vendor Dialog */}
      <Dialog open={showAddVendor} onOpenChange={(open) => {
        setShowAddVendor(open);
        if (!open) resetVendorForm();
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedVendor ? 'Edit Vendor' : 'Add New Vendor'}
            </DialogTitle>
            <DialogDescription>
              {selectedVendor ? 'Update vendor information' : 'Enter vendor information to add them to your system'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleVendorSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vendor_name">Vendor Name *</Label>
              <Input
                id="vendor_name"
                value={vendorForm.vendor_name}
                onChange={(e) => setVendorForm({ ...vendorForm, vendor_name: e.target.value })}
                placeholder="Enter vendor name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                value={vendorForm.contact_person}
                onChange={(e) => setVendorForm({ ...vendorForm, contact_person: e.target.value })}
                placeholder="Contact person name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={vendorForm.email}
                  onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                  placeholder="Email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={vendorForm.phone_number}
                  onChange={(e) => setVendorForm({ ...vendorForm, phone_number: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_address">Full Address</Label>
              <Textarea
                id="full_address"
                value={vendorForm.full_address}
                onChange={(e) => setVendorForm({ ...vendorForm, full_address: e.target.value })}
                placeholder="Complete address"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddVendor(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedVendor ? 'Update Vendor' : 'Add Vendor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Category Dialog */}
      <Dialog open={showAddCategory} onOpenChange={(open) => {
        setShowAddCategory(open);
        if (!open) resetCategoryForm();
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory ? 'Update category name' : 'Enter a new expense category'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category_name">Category Name *</Label>
              <Input
                id="category_name"
                value={categoryForm.category_name}
                onChange={(e) => setCategoryForm({ ...categoryForm, category_name: e.target.value })}
                placeholder="e.g., Office Supplies, Fuel, Equipment"
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddCategory(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedCategory ? 'Update Category' : 'Add Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}