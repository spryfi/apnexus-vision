import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Upload, CheckCircle, Plus, Trash2, ArrowLeft, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Vehicle {
  id: string;
  vehicle_name: string;
  asset_id: string;
  current_odometer: number;
}

interface Vendor {
  id: string;
  vendor_name: string;
}

interface LineItem {
  id: string;
  description: string;
  part_number: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function AddMaintenanceRecord() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const [formData, setFormData] = useState({
    service_date: '',
    service_provider_vendor_id: '',
    odometer_at_service: 0,
    cost: 0,
    service_summary: '',
    receipt_scan_url: '',
    status: 'Completed'
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, [vehicleId]);

  const fetchData = async () => {
    try {
      // Fetch vehicle details
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();

      if (vehicleError) throw vehicleError;
      setVehicle(vehicleData);
      setFormData(prev => ({ ...prev, odometer_at_service: vehicleData.current_odometer }));

      // Fetch vendors
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select('*')
        .order('vendor_name');

      if (vendorsError) throw vendorsError;
      setVendors(vendorsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${vehicleId}.${fileExt}`;
      const filePath = `maintenance-receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vendor-documents')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('vendor-documents')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, receipt_scan_url: data.publicUrl }));
      setUploadedFile(file);

      toast({
        title: "Receipt uploaded",
        description: "Receipt has been uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload receipt",
        variant: "destructive",
      });
    }
  };

  const extractInvoiceData = async () => {
    if (!formData.receipt_scan_url) {
      toast({
        title: "No receipt uploaded",
        description: "Please upload a receipt first",
        variant: "destructive",
      });
      return;
    }

    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-receipt-data', {
        body: { 
          fileUrl: formData.receipt_scan_url,
          extractionType: 'maintenance'
        }
      });

      if (error) throw error;

      if (data.extractedData) {
        const extracted = data.extractedData;
        
        // Update form fields
        setFormData(prev => ({
          ...prev,
          service_date: extracted.serviceDate || prev.service_date,
          cost: extracted.totalCost || prev.cost,
          odometer_at_service: extracted.odometerReading || prev.odometer_at_service
        }));

        // Update line items
        if (extracted.lineItems && extracted.lineItems.length > 0) {
          const newLineItems = extracted.lineItems.map((item: any, index: number) => ({
            id: `temp-${index}`,
            description: item.description || '',
            part_number: item.partNumber || '',
            quantity: item.quantity || 1,
            unit_price: item.unitPrice || 0,
            total_price: item.totalPrice || (item.quantity * item.unitPrice) || 0
          }));
          setLineItems(newLineItems);
        }

        toast({
          title: "Invoice data extracted",
          description: "AI has extracted invoice details. Please review and verify.",
        });
      }
    } catch (error) {
      console.error('Extraction error:', error);
      toast({
        title: "Extraction failed",
        description: "Failed to extract invoice data. Please enter manually.",
        variant: "destructive",
      });
    } finally {
      setExtracting(false);
    }
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      id: `temp-${Date.now()}`,
      description: '',
      part_number: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (id: string, field: string, value: any) => {
    setLineItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Auto-calculate total price
        if (field === 'quantity' || field === 'unit_price') {
          updated.total_price = updated.quantity * updated.unit_price;
        }
        return updated;
      }
      return item;
    }));
  };

  const removeLineItem = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  const validateForm = () => {
    const lineItemsTotal = lineItems.reduce((sum, item) => sum + item.total_price, 0);
    const tolerance = 0.01; // Allow for small rounding differences
    
    return {
      isValid: formData.service_date &&
               formData.service_provider_vendor_id &&
               formData.odometer_at_service > 0 &&
               formData.cost > 0 &&
               formData.service_summary.trim().length >= 10 &&
               formData.receipt_scan_url &&
               Math.abs(lineItemsTotal - formData.cost) < tolerance,
      lineItemsMatch: Math.abs(lineItemsTotal - formData.cost) < tolerance,
      lineItemsTotal
    };
  };

  const saveMaintenanceRecord = async () => {
    const validation = validateForm();
    if (!validation.isValid) {
      toast({
        title: "Form incomplete",
        description: "Please fill all required fields and ensure line items match total cost",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Create maintenance record
      const { data: maintenanceRecord, error: maintenanceError } = await supabase
        .from('maintenance_records')
        .insert({
          vehicle_id: vehicleId,
          service_date: formData.service_date,
          service_provider_vendor_id: formData.service_provider_vendor_id,
          odometer_at_service: formData.odometer_at_service,
          cost: formData.cost,
          service_description: formData.service_summary,
          service_summary: formData.service_summary,
          receipt_scan_url: formData.receipt_scan_url,
          status: formData.status
        })
        .select()
        .single();

      if (maintenanceError) throw maintenanceError;

      // Create line items
      if (lineItems.length > 0) {
        const lineItemsData = lineItems.map(item => ({
          maintenance_record_id: maintenanceRecord.id,
          description: item.description,
          part_number: item.part_number,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }));

        const { error: lineItemsError } = await supabase
          .from('maintenance_line_items')
          .insert(lineItemsData);

        if (lineItemsError) throw lineItemsError;
      }

      toast({
        title: "Maintenance record saved",
        description: "Record has been saved and vehicle odometer updated",
      });

      navigate(`/fleet/${vehicleId}`);
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save failed",
        description: "Failed to save maintenance record",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const validation = validateForm();

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Vehicle Not Found</h1>
        <Button onClick={() => navigate('/fleet')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Fleet
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="flex items-center gap-4 p-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/fleet/${vehicleId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Add Maintenance Record</h1>
            <p className="text-muted-foreground">{vehicle.vehicle_name}</p>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-100px)]">
        {/* Left Panel - Document Viewer */}
        <div className="w-1/2 border-r border-border p-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Service Invoice/Receipt</CardTitle>
            </CardHeader>
            <CardContent className="h-full flex flex-col">
              {formData.receipt_scan_url ? (
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-green-600 mb-4">
                    <CheckCircle className="h-5 w-5" />
                    <span>Receipt uploaded successfully</span>
                  </div>
                  {uploadedFile?.type.includes('image') ? (
                    <img 
                      src={formData.receipt_scan_url} 
                      alt="Receipt"
                      className="flex-1 object-contain border rounded"
                    />
                  ) : (
                    <div className="flex-1 flex items-center justify-center border rounded">
                      <div className="text-center">
                        <p className="text-muted-foreground">PDF uploaded</p>
                        <Button variant="outline" className="mt-2">
                          View PDF
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Upload Service Invoice</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drop your service invoice or receipt here
                  </p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    className="hidden"
                    id="receipt-upload"
                  />
                  <label htmlFor="receipt-upload">
                    <Button type="button" variant="outline" asChild>
                      <span>Choose File</span>
                    </Button>
                  </label>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Data Entry Form */}
        <div className="w-1/2 p-6 overflow-auto">
          <div className="space-y-6">
            {/* AI Extraction Button */}
            {formData.receipt_scan_url && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-blue-800">AI-Powered Data Extraction</h3>
                      <p className="text-sm text-blue-600">
                        Let AI automatically extract service details from your receipt
                      </p>
                    </div>
                    <Button
                      onClick={extractInvoiceData}
                      disabled={extracting}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {extracting ? (
                        <>Extracting...</>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Auto-Extract Details
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Guardrails Alert */}
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-orange-800 mb-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">AP-Fortress Maintenance Guardrails</span>
                </div>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• Receipt upload is mandatory - cannot save without it</li>
                  <li>• Service summary must be at least 10 characters</li>
                  <li>• Line items total must match invoice total</li>
                  <li>• Odometer reading will automatically update vehicle records</li>
                </ul>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Service Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="service_date">Service Date *</Label>
                    <Input
                      id="service_date"
                      type="date"
                      value={formData.service_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, service_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vendor">Service Provider *</Label>
                    <Select 
                      value={formData.service_provider_vendor_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, service_provider_vendor_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.vendor_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="odometer">Odometer at Service *</Label>
                    <Input
                      id="odometer"
                      type="number"
                      value={formData.odometer_at_service}
                      onChange={(e) => setFormData(prev => ({ ...prev, odometer_at_service: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost">Total Cost *</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="summary">Service Summary * (minimum 10 characters)</Label>
                  <Textarea
                    id="summary"
                    value={formData.service_summary}
                    onChange={(e) => setFormData(prev => ({ ...prev, service_summary: e.target.value }))}
                    placeholder="Brief summary of service performed (e.g., 'Quarterly PM & Tire Rotation')"
                    rows={2}
                  />
                  <div className="text-sm text-muted-foreground mt-1">
                    Characters: {formData.service_summary.length}/10 minimum
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Service Line Items</CardTitle>
                  <Button variant="outline" size="sm" onClick={addLineItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Line Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {lineItems.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No line items added yet</p>
                    <p className="text-sm">Click "Add Line Item" to track individual services/parts</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Part #</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lineItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Input
                                value={item.description}
                                onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                placeholder="Service description"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={item.part_number}
                                onChange={(e) => updateLineItem(item.id, 'part_number', e.target.value)}
                                placeholder="Part number"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">${item.total_price.toFixed(2)}</span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLineItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Total Validation */}
                    <div className="mt-4 p-3 border rounded">
                      <div className="flex justify-between items-center">
                        <span>Line Items Total:</span>
                        <span className="font-medium">${validation.lineItemsTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Invoice Total:</span>
                        <span className="font-medium">${formData.cost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t">
                        <span className="font-medium">Status:</span>
                        {validation.lineItemsMatch ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span>Totals match!</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            <span>Totals do not match</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between pt-6">
              <Button variant="outline" onClick={() => navigate(`/fleet/${vehicleId}`)}>
                Cancel
              </Button>
              <Button 
                onClick={saveMaintenanceRecord}
                disabled={!validation.isValid || saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? "Saving..." : "Save Maintenance Record"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}