import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, CheckCircle, AlertTriangle, Flag, Loader2, Sparkles, Edit, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ProcessedTransaction {
  sourceTransactionId: string;
  transactionDate: string;
  vehicleId: string;
  employeeName: string;
  gallons: number;
  costPerGallon: number;
  totalCost: number;
  odometer: number;
  merchantName: string;
  status: 'new' | 'duplicate' | 'flagged';
  flagReason?: string;
  matchedVehicleId?: string;
  matchedVehicleName?: string;
  matchType: 'Direct ID Match' | 'Odometer Match' | 'Unmatched';
  transactionType: 'Fleet Vehicle' | 'Auxiliary Fuel' | 'Rental Equipment';
}

interface FuelUploadWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function FuelUploadWizard({ isOpen, onClose, onSuccess }: FuelUploadWizardProps) {
  const [step, setStep] = useState<'upload' | 'processing' | 'verification'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [statementEndDate, setStatementEndDate] = useState<Date>();
  const [autoMatchVehicles, setAutoMatchVehicles] = useState(true);
  const [updateOdometers, setUpdateOdometers] = useState(true);
  const [flagLowConfidence, setFlagLowConfidence] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [processedData, setProcessedData] = useState<{
    transactions: ProcessedTransaction[];
    summary: { total: number; new: number; duplicate: number; flagged: number };
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [vehicles, setVehicles] = useState<Array<{id: string; asset_id: string; make: string; model: string; year: number}>>([]);
  const [transactionOverrides, setTransactionOverrides] = useState<Record<string, string>>({});
  const [transactionTypeOverrides, setTransactionTypeOverrides] = useState<Record<string, 'Auxiliary Fuel' | 'Rental Equipment'>>({});
  const { toast } = useToast();

  // Fetch vehicles for dropdown selection
  useEffect(() => {
    const fetchVehicles = async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, asset_id, make, model, year')
        .order('asset_id');
      
      if (error) {
        console.error('Error fetching vehicles:', error);
      } else {
        setVehicles(data || []);
      }
    };

    if (isOpen) {
      fetchVehicles();
    }
  }, [isOpen]);

  // Auto-detect date from filename
  const extractDateFromFilename = (filename: string): Date | undefined => {
    // Pattern: Transactions_MMDDYYYY_HHMM.csv
    const match = filename.match(/(\d{8})_\d{4}\.csv$/);
    if (match) {
      const dateStr = match[1]; // MMDDYYYY
      const month = parseInt(dateStr.substring(0, 2)) - 1; // 0-indexed
      const day = parseInt(dateStr.substring(2, 4));
      const year = parseInt(dateStr.substring(4, 8));
      return new Date(year, month, day);
    }
    return undefined;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (selectedFile.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "File size must be less than 10MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!selectedFile.name.endsWith('.csv')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
      
      // Try to auto-detect date from filename
      const detectedDate = extractDateFromFilename(selectedFile.name);
      if (detectedDate) {
        setStatementEndDate(detectedDate);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024;
      if (droppedFile.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "File size must be less than 10MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!droppedFile.name.endsWith('.csv')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
        return;
      }

      setFile(droppedFile);
      
      // Try to auto-detect date from filename
      const detectedDate = extractDateFromFilename(droppedFile.name);
      if (detectedDate) {
        setStatementEndDate(detectedDate);
      }
    }
  };

  const processFile = async () => {
    if (!file) return;

    setStep('processing');
    
    try {
      console.log('Starting file processing for:', file.name, 'Size:', file.size);
      const formData = new FormData();
      formData.append('file', file);

      console.log('Calling edge function process-fuel-statement...');
      const { data, error } = await supabase.functions.invoke('process-fuel-statement', {
        body: formData,
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      
      console.log('Received data from edge function:', data);
      
      // Handle the response format from the edge function
      if (data && data.transactions) {
        console.log('Setting processed data:', data);
        setProcessedData(data);
        setStep('verification');
      } else {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from processing function');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Processing Error",
        description: `Failed to process the fuel statement file: ${error.message}`,
        variant: "destructive",
      });
      setStep('upload');
    }
  };

  const confirmImport = async () => {
    if (!processedData) return;

    setImporting(true);
    
    try {
      console.log('Starting import process...');
      
      // Apply user overrides to transactions
      const finalTransactions = processedData.transactions
        .filter(t => t.status === 'new' || t.status === 'flagged')
        .map(t => {
          const overrideVehicleId = transactionOverrides[t.sourceTransactionId];
          const overrideTransactionType = transactionTypeOverrides[t.sourceTransactionId];
          let finalVehicleId = t.vehicleId;
          let finalMatchedVehicleId = t.matchedVehicleId;
          let finalTransactionType = t.transactionType;

          if (overrideVehicleId) {
            const overrideVehicle = vehicles.find(v => v.id === overrideVehicleId);
            finalVehicleId = overrideVehicle?.asset_id || overrideVehicleId;
            finalMatchedVehicleId = overrideVehicleId;
          }

          if (overrideTransactionType) {
            finalTransactionType = overrideTransactionType;
          }

          return {
            source_transaction_id: t.sourceTransactionId,
            transaction_date: t.transactionDate,
            vehicle_id: finalTransactionType === 'Fleet Vehicle' ? finalVehicleId : null,
            employee_name: t.employeeName,
            gallons: t.gallons,
            cost_per_gallon: t.costPerGallon,
            total_cost: t.totalCost,
            odometer: t.odometer,
            merchant_name: t.merchantName,
            status: t.status === 'flagged' ? 'Flagged for Review' : 'Verified',
            flag_reason: t.flagReason,
            matched_vehicle_id: finalTransactionType === 'Fleet Vehicle' ? finalMatchedVehicleId : null,
            transaction_type: finalTransactionType
          };
        });

      console.log('Inserting transactions:', finalTransactions);

      // Call new import function that handles both insertion and odometer updates
      const { data, error } = await supabase.functions.invoke('import-verified-fuel-transactions', {
        body: { transactions: finalTransactions }
      });

      if (error) {
        console.error('Import function error:', error);
        throw error;
      }

      console.log('Import successful!');
      
      toast({
        title: "Import Successful",
        description: `Successfully imported ${finalTransactions.length} new fuel transactions and updated vehicle odometers.`,
      });

      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error importing transactions:', error);
      toast({
        title: "Import Error",
        description: `Failed to import fuel transactions: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setFile(null);
    setStatementEndDate(undefined);
    setAutoMatchVehicles(true);
    setUpdateOdometers(true);
    setFlagLowConfidence(true);
    setProcessedData(null);
    setTransactionOverrides({});
    setTransactionTypeOverrides({});
    onClose();
  };

  const getVehicleDisplayName = (vehicle: {make: string; model: string; year: number; asset_id: string}) => {
    return `${vehicle.asset_id} - ${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  };

  const handleVehicleOverride = (transactionId: string, vehicleId: string) => {
    setTransactionOverrides(prev => ({
      ...prev,
      [transactionId]: vehicleId
    }));
  };

  const handleTransactionTypeOverride = (transactionId: string, transactionType: 'Auxiliary Fuel' | 'Rental Equipment') => {
    setTransactionTypeOverrides(prev => ({
      ...prev,
      [transactionId]: transactionType
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'duplicate':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'flagged':
        return <Flag className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-green-100 text-green-800">New</Badge>;
      case 'duplicate':
        return <Badge className="bg-yellow-100 text-yellow-800">Duplicate</Badge>;
      case 'flagged':
        return <Badge className="bg-red-100 text-red-800">Flagged</Badge>;
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'upload' && "Upload WEX Fleet Card Statement"}
            {step === 'processing' && "Processing File"}
            {step === 'verification' && "Review Your Import"}
          </DialogTitle>
          {step === 'upload' && (
            <DialogDescription>
              Upload your monthly WEX transaction report in CSV format
            </DialogDescription>
          )}
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6">
            {/* Step 1: File Upload */}
            <div>
              <h3 className="text-sm font-medium mb-3">Step 1: File Upload</h3>
              <div 
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                  isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className={cn(
                  "h-12 w-12 mx-auto mb-4",
                  isDragging ? "text-primary" : "text-muted-foreground"
                )} />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Drop your WEX statement here</h3>
                  <p className="text-sm text-muted-foreground">
                    CSV files only • Maximum 10MB
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" className="cursor-pointer mt-2" asChild>
                      <span>Choose File</span>
                    </Button>
                  </label>
                </div>
              </div>
              
              {file && (
                <Card className="mt-4">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Step 2: Statement Date Selection */}
            <div>
              <h3 className="text-sm font-medium mb-3">Step 2: Statement Date Selection</h3>
              <div className="space-y-2">
                <Label>Statement End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !statementEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {statementEndDate ? format(statementEndDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={statementEndDate}
                      onSelect={setStatementEndDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  This is the last day of the statement period
                </p>
              </div>
            </div>

            {/* Step 3: Processing Options */}
            <div>
              <h3 className="text-sm font-medium mb-3">Step 3: Processing Options</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="auto-match" 
                    checked={autoMatchVehicles}
                    onCheckedChange={(checked) => setAutoMatchVehicles(checked as boolean)}
                  />
                  <Label htmlFor="auto-match" className="text-sm font-normal cursor-pointer">
                    Automatically match vehicles using AI
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="update-odometers"
                    checked={updateOdometers}
                    onCheckedChange={(checked) => setUpdateOdometers(checked as boolean)}
                  />
                  <Label htmlFor="update-odometers" className="text-sm font-normal cursor-pointer">
                    Update vehicle odometers from latest readings
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="flag-confidence"
                    checked={flagLowConfidence}
                    onCheckedChange={(checked) => setFlagLowConfidence(checked as boolean)}
                  />
                  <Label htmlFor="flag-confidence" className="text-sm font-normal cursor-pointer">
                    Flag transactions for manual review if confidence {"<"} 80%
                  </Label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={processFile}
                disabled={!file || !statementEndDate}
              >
                Upload and Process
              </Button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <div className="space-y-3 text-center max-w-md">
              <h3 className="text-xl font-semibold">Processing Your File</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Reading CSV file...</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Parsing transactions...</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Matching vehicles with AI...</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-600" />
                  <span>Analyzing for anomalies...</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                This may take a few moments for large files
              </p>
            </div>
          </div>
        )}

        {step === 'verification' && processedData && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{processedData.summary.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{processedData.summary.new}</div>
                  <div className="text-sm text-muted-foreground">New</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{processedData.summary.duplicate}</div>
                  <div className="text-sm text-muted-foreground">Duplicates</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{processedData.summary.flagged}</div>
                  <div className="text-sm text-muted-foreground">Flagged</div>
                </CardContent>
              </Card>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Transaction Type</TableHead>
                      <TableHead>Matched Vehicle</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Gallons</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedData.transactions.map((transaction, index) => {
                      const overrideVehicleId = transactionOverrides[transaction.sourceTransactionId];
                      const overrideTransactionType = transactionTypeOverrides[transaction.sourceTransactionId];
                      const displayVehicle = overrideVehicleId 
                        ? vehicles.find(v => v.id === overrideVehicleId)
                        : null;
                      const finalTransactionType = overrideTransactionType || transaction.transactionType;
                      
                      return (
                        <TableRow 
                          key={index}
                          className={
                            transaction.status === 'new' ? 'bg-green-50' :
                            transaction.status === 'duplicate' ? 'bg-yellow-50' :
                            'bg-red-50'
                          }
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(transaction.status)}
                              {getStatusBadge(transaction.status)}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(transaction.transactionDate)}</TableCell>
                          <TableCell>
                            {transaction.transactionType === 'Fleet Vehicle' && (
                              <Badge className="bg-blue-100 text-blue-800">Fleet Vehicle</Badge>
                            )}
                            {transaction.transactionType === 'Auxiliary Fuel' && !overrideTransactionType && (
                              <Select onValueChange={(value: 'Auxiliary Fuel' | 'Rental Equipment') => handleTransactionTypeOverride(transaction.sourceTransactionId, value)} defaultValue="Auxiliary Fuel">
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Auxiliary Fuel">Auxiliary Fuel</SelectItem>
                                  <SelectItem value="Rental Equipment">Rental Equipment</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            {overrideTransactionType && (
                              <div className="flex items-center gap-1">
                                <Badge className="bg-orange-100 text-orange-800">{overrideTransactionType}</Badge>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleTransactionTypeOverride(transaction.sourceTransactionId, 'Auxiliary Fuel')}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Click to change transaction type</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {transaction.transactionType === 'Fleet Vehicle' && !overrideVehicleId && transaction.matchType === 'Direct ID Match' && (
                                <span>{transaction.matchedVehicleName || transaction.vehicleId}</span>
                              )}
                              
                              {transaction.transactionType === 'Fleet Vehicle' && !overrideVehicleId && transaction.matchType === 'Odometer Match' && (
                                <div className="flex items-center gap-1">
                                  <span>{transaction.matchedVehicleName}</span>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Sparkles className="h-3 w-3 text-blue-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Intelligently matched based on odometer reading</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              )}
                              
                              {transaction.transactionType === 'Fleet Vehicle' && transaction.matchType === 'Unmatched' && !overrideVehicleId && (
                                <Select onValueChange={(value) => handleVehicleOverride(transaction.sourceTransactionId, value)}>
                                  <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Select vehicle..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {vehicles.map((vehicle) => (
                                      <SelectItem key={vehicle.id} value={vehicle.id}>
                                        {getVehicleDisplayName(vehicle)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                              
                              {transaction.transactionType !== 'Fleet Vehicle' && (
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">N/A</span>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <AlertTriangle className="h-3 w-3 text-orange-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Non-vehicle transaction - no vehicle assignment needed</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              )}
                              
                              {overrideVehicleId && displayVehicle && (
                                <div className="flex items-center gap-1">
                                  <span>{getVehicleDisplayName(displayVehicle)}</span>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleVehicleOverride(transaction.sourceTransactionId, '')}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Click to change selection</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              )}
                              
                              {transaction.transactionType === 'Fleet Vehicle' && (transaction.matchType === 'Direct ID Match' || transaction.matchType === 'Odometer Match') && !overrideVehicleId && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => {}} // This would open override selection
                                      className="h-6 w-6 p-0"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Click to override vehicle selection</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{transaction.employeeName}</TableCell>
                          <TableCell>{transaction.gallons.toFixed(2)}</TableCell>
                          <TableCell>{formatCurrency(transaction.totalCost)}</TableCell>
                          <TableCell>
                            {transaction.status === 'duplicate' && 'Already exists'}
                            {transaction.status === 'flagged' && transaction.flagReason}
                            {transaction.status === 'new' && '✓ Ready to import'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TooltipProvider>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={confirmImport} 
                disabled={importing || (processedData.summary.new + processedData.summary.flagged) === 0}
              >
                {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirm & Import {processedData.summary.new + processedData.summary.flagged} Transactions
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}