import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ExternalLink, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ReceiptViewerModal } from "@/components/ap/ReceiptViewerModal";

interface MaintenanceLineItem {
  id: string;
  description: string;
  part_number?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface MaintenanceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maintenanceId: string;
  maintenanceData: {
    service_date: string;
    service_description: string;
    cost: number;
    odometer_at_service: number;
    receipt_scan_url?: string;
    vendors?: {
      vendor_name: string;
    };
  };
}

export function MaintenanceDetailDialog({ 
  open, 
  onOpenChange, 
  maintenanceId,
  maintenanceData 
}: MaintenanceDetailDialogProps) {
  const [lineItems, setLineItems] = useState<MaintenanceLineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showReceiptViewer, setShowReceiptViewer] = useState(false);

  useEffect(() => {
    if (open && maintenanceId) {
      fetchLineItems();
    }
  }, [open, maintenanceId]);

  const fetchLineItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('maintenance_line_items')
        .select('*')
        .eq('maintenance_record_id', maintenanceId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setLineItems(data || []);
    } catch (error) {
      console.error('Error fetching line items:', error);
      toast({
        title: "Error",
        description: "Failed to load service line items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Maintenance Record Details</DialogTitle>
              {maintenanceData.receipt_scan_url && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReceiptViewer(true)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Receipt
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(maintenanceData.receipt_scan_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Summary Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Service Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Service Date</p>
                    <p className="text-base font-semibold">{formatDate(maintenanceData.service_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Service Provider</p>
                    <p className="text-base font-semibold">{maintenanceData.vendors?.vendor_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Odometer Reading</p>
                    <p className="text-base font-semibold">{maintenanceData.odometer_at_service.toLocaleString()} miles</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                    <p className="text-base font-semibold text-primary">{formatCurrency(maintenanceData.cost)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Service Description</p>
                  <p className="text-base mt-1">{maintenanceData.service_description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Service Line Items</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading line items...</p>
                  </div>
                ) : lineItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No detailed line items recorded for this service.</p>
                    <p className="text-sm text-muted-foreground mt-2">Only summary information is available.</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Part Number</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lineItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.description}</TableCell>
                            <TableCell className="text-muted-foreground">{item.part_number || '-'}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(item.total_price)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50">
                          <TableCell colSpan={4} className="text-right font-bold">Total:</TableCell>
                          <TableCell className="text-right font-bold text-primary">
                            {formatCurrency(lineItems.reduce((sum, item) => sum + item.total_price, 0))}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                    
                    {/* Validation check */}
                    {Math.abs(lineItems.reduce((sum, item) => sum + item.total_price, 0) - maintenanceData.cost) > 0.01 && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          ⚠️ Note: Line items total does not match the recorded service cost. This may indicate partial itemization.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Viewer Modal */}
      {maintenanceData.receipt_scan_url && (
        <ReceiptViewerModal
          open={showReceiptViewer}
          onOpenChange={setShowReceiptViewer}
          receiptUrl={maintenanceData.receipt_scan_url}
          receiptFileName={`Maintenance-${maintenanceId}.pdf`}
        />
      )}
    </>
  );
}
