import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Users, Tag, Eye, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VendorDialog } from "@/components/VendorDialog";
import { useToast } from "@/hooks/use-toast";

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
  created_at: string;
}

interface ExpenseCategory {
  id: string;
  category_name: string;
  created_at: string;
}

export default function Vendors() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
  const { toast } = useToast();


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
    setSelectedVendor(null);
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      category_name: '',
    });
    setSelectedCategory(null);
  };

  const handleVendorSuccess = () => {
    fetchData();
    setShowAddVendor(false);
    resetVendorForm();
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
                        <TableHead>Status</TableHead>
                        <TableHead>Contact Person</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Account Number</TableHead>
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
                        <TableRow 
                          key={vendor.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/vendors/${vendor.id}`)}
                        >
                          <TableCell className="font-medium">{vendor.vendor_name}</TableCell>
                          <TableCell>
                            <Badge variant={vendor.status === 'active' ? 'default' : 'secondary'}>
                              {vendor.status || 'active'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {vendor.primary_contact_name || vendor.contact_person || '-'}
                          </TableCell>
                          <TableCell>
                            {vendor.primary_contact_email || vendor.email || '-'}
                          </TableCell>
                          <TableCell>{vendor.your_account_number || '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/vendors/${vendor.id}`);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  editVendor(vendor);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteVendor(vendor.id);
                                }}
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

      {/* Enhanced Vendor Dialog */}
      <VendorDialog
        open={showAddVendor}
        onOpenChange={(open) => {
          setShowAddVendor(open);
          if (!open) resetVendorForm();
        }}
        vendor={selectedVendor}
        onSuccess={handleVendorSuccess}
      />

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