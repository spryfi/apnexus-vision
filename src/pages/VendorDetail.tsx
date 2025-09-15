import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Edit, AlertTriangle, FileText, DollarSign, StickyNote } from "lucide-react";
import { VendorDialog } from "@/components/VendorDialog";
import { useToast } from "@/hooks/use-toast";

interface Vendor {
  id: string;
  vendor_name: string;
  status: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  full_address?: string;
  your_account_number?: string;
  tax_id_ein?: string;
  default_expense_category_id?: string;
  preferred_payment_method?: string;
  payment_terms?: string;
  internal_notes?: string;
  created_at: string;
  updated_at?: string;
}

interface VendorDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  expiry_date?: string;
  created_at: string;
}

interface ExpenseCategory {
  id: string;
  category_name: string;
}

export default function VendorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVendorData();
    }
  }, [id]);

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      
      const [vendorRes, documentsRes, categoriesRes] = await Promise.all([
        supabase.from('vendors').select('*').eq('id', id).single(),
        supabase.from('vendor_documents').select('*').eq('vendor_id', id).order('created_at', { ascending: false }),
        supabase.from('expense_categories').select('*').order('category_name')
      ]);

      if (vendorRes.error && vendorRes.error.code !== 'PGRST116') {
        throw vendorRes.error;
      }

      if (documentsRes.error && documentsRes.error.code !== 'PGRST116') {
        throw documentsRes.error;
      }

      if (categoriesRes.error) {
        throw categoriesRes.error;
      }

      if (!vendorRes.data) {
        toast({
          title: "Vendor not found",
          description: "The requested vendor could not be found",
          variant: "destructive",
        });
        navigate('/vendors');
        return;
      }

      setVendor(vendorRes.data);
      setDocuments(documentsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error loading vendor",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getExpiringDocuments = () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return documents.filter(doc => {
      if (!doc.expiry_date) return false;
      const expiryDate = new Date(doc.expiry_date);
      return expiryDate <= thirtyDaysFromNow;
    });
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.category_name : 'N/A';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-4"></div>
          <div className="h-4 bg-muted rounded w-48"></div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/vendors')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vendors
          </Button>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Vendor not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const expiringDocuments = getExpiringDocuments();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/vendors')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vendors
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{vendor.vendor_name}</h1>
            <p className="text-muted-foreground">
              Vendor Details & Management Hub
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={vendor.status === 'active' ? 'default' : 'secondary'}>
            {vendor.status}
          </Badge>
          <Button onClick={() => setShowEditDialog(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Vendor
          </Button>
        </div>
      </div>

      {/* At a Glance Section */}
      <Card>
        <CardHeader>
          <CardTitle>At a Glance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Primary Contact</p>
              <p className="text-sm">{vendor.primary_contact_name || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Your Account Number</p>
              <p className="text-sm">{vendor.your_account_number || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Payment Terms</p>
              <p className="text-sm">{vendor.payment_terms || 'Not specified'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proactive Alerts */}
      {expiringDocuments.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {expiringDocuments.length === 1 
              ? `Document "${expiringDocuments[0].file_name}" expires soon!`
              : `${expiringDocuments.length} documents are expiring soon!`
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Tabbed Interface */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{vendor.primary_contact_email || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-sm">{vendor.primary_contact_phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="text-sm">{vendor.full_address || 'Not provided'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle>Financial & Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tax ID / EIN</p>
                  <p className="text-sm">{vendor.tax_id_ein || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Default Expense Category</p>
                  <p className="text-sm">
                    {vendor.default_expense_category_id 
                      ? getCategoryName(vendor.default_expense_category_id)
                      : 'Not set'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Preferred Payment Method</p>
                  <p className="text-sm">{vendor.preferred_payment_method || 'Not specified'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                All past and present transactions with this vendor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>Transaction integration coming soon.</p>
                <p className="text-sm">This will show all transactions filtered by vendor.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Documents</CardTitle>
              <CardDescription>
                W-9s, Certificates of Insurance, and other important documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No documents uploaded yet.</p>
                  <p className="text-sm">Document upload functionality coming soon.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{doc.file_name}</p>
                        <p className="text-sm text-muted-foreground">Type: {doc.document_type}</p>
                        {doc.expiry_date && (
                          <p className="text-sm text-muted-foreground">
                            Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
              <CardDescription>
                Private notes about this vendor for your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vendor.internal_notes ? (
                <div className="whitespace-pre-wrap text-sm">
                  {vendor.internal_notes}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No internal notes added yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <VendorDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        vendor={vendor}
        onSuccess={fetchVendorData}
      />
    </div>
  );
}