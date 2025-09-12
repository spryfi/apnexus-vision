import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, CheckCircle, AlertTriangle, Flag, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
}

interface FuelUploadWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function FuelUploadWizard({ isOpen, onClose, onSuccess }: FuelUploadWizardProps) {
  const [step, setStep] = useState<'upload' | 'processing' | 'verification'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [processedData, setProcessedData] = useState<{
    transactions: ProcessedTransaction[];
    summary: { total: number; new: number; duplicate: number; flagged: number };
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
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
      const newTransactions = processedData.transactions
        .filter(t => t.status === 'new' || t.status === 'flagged')
        .map(t => ({
          source_transaction_id: t.sourceTransactionId,
          transaction_date: t.transactionDate,
          vehicle_id: t.vehicleId,
          employee_name: t.employeeName,
          gallons: t.gallons,
          cost_per_gallon: t.costPerGallon,
          total_cost: t.totalCost,
          odometer: t.odometer,
          merchant_name: t.merchantName,
          status: t.status === 'flagged' ? 'Flagged for Review' : 'Verified',
          flag_reason: t.flagReason
        }));

      console.log('Inserting transactions:', newTransactions);

      const { error } = await supabase
        .from('fuel_transactions_new')
        .insert(newTransactions);

      if (error) {
        console.error('Database insertion error:', error);
        throw error;
      }

      console.log('Import successful!');
      
      toast({
        title: "Import Successful",
        description: `Successfully imported ${newTransactions.length} new fuel transactions.`,
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
    setProcessedData(null);
    onClose();
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'upload' && "Upload Fuel Statement"}
            {step === 'processing' && "Processing File"}
            {step === 'verification' && "Review Your Import"}
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Drop your fuel statement here</h3>
                <p className="text-muted-foreground">
                  Upload your monthly fuel card CSV or Excel file
                </p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer" asChild>
                    <span>Choose File</span>
                  </Button>
                </label>
              </div>
            </div>
            
            {file && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button onClick={processFile}>
                      Process File
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Processing Your File</h3>
            <p className="text-muted-foreground text-center">
              We're analyzing your fuel transactions and checking for duplicates...
            </p>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Gallons</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedData.transactions.map((transaction, index) => (
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
                      <TableCell>{transaction.vehicleId}</TableCell>
                      <TableCell>{transaction.employeeName}</TableCell>
                      <TableCell>{transaction.gallons.toFixed(2)}</TableCell>
                      <TableCell>{formatCurrency(transaction.totalCost)}</TableCell>
                      <TableCell>
                        {transaction.status === 'duplicate' && 'Already exists'}
                        {transaction.status === 'flagged' && transaction.flagReason}
                        {transaction.status === 'new' && '✓ Ready to import'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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