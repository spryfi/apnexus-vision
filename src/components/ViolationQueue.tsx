import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ViolationTransaction {
  id: string;
  amount: number;
  status: string;
  vendors: { vendor_name: string };
  employees: { employee_name: string };
  expense_categories: { category_name: string };
  invoice_date: string;
  created_at: string;
}

export default function ViolationQueue() {
  const [violations, setViolations] = useState<ViolationTransaction[]>([]);
  const [selectedViolation, setSelectedViolation] = useState<ViolationTransaction | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchViolations();
  }, []);

  const fetchViolations = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          vendors(vendor_name),
          employees(employee_name),
          expense_categories(category_name)
        `)
        .in('status', ['Paid', 'Reconciled'])
        .is('invoice_receipt_url', null)
        .eq('document_required_override', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setViolations(data || []);
    } catch (error) {
      console.error('Error fetching violations:', error);
      toast({
        title: "Error fetching violations",
        description: "Failed to load transaction violations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const authorizeOverride = async () => {
    if (!selectedViolation || !overrideReason.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('transactions')
        .update({
          document_required_override: true,
          override_reason: overrideReason,
          override_by: user?.email || 'Unknown Admin'
        })
        .eq('id', selectedViolation.id);

      if (error) throw error;

      toast({
        title: "Override Authorized",
        description: "Transaction violation has been resolved with admin override",
      });

      setSelectedViolation(null);
      setOverrideReason("");
      fetchViolations();
    } catch (error) {
      toast({
        title: "Error authorizing override",
        description: "Failed to process admin override",
        variant: "destructive",
      });
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Transaction Violations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Transaction Violations ({violations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {violations.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-muted-foreground">No transaction violations found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {violations.map((violation) => (
                  <TableRow key={violation.id} className="border-l-4 border-l-red-500">
                    <TableCell className="font-medium">
                      {violation.vendors?.vendor_name}
                    </TableCell>
                    <TableCell>{formatCurrency(violation.amount)}</TableCell>
                    <TableCell>{violation.employees?.employee_name}</TableCell>
                    <TableCell>{violation.expense_categories?.category_name}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{violation.status}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(violation.invoice_date)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedViolation(violation)}
                      >
                        Authorize Override
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Override Authorization Dialog */}
      <Dialog open={!!selectedViolation} onOpenChange={() => setSelectedViolation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Authorize Document Override</DialogTitle>
            <DialogDescription>
              You are about to authorize an override for a transaction that was marked as Paid/Reconciled without a required receipt.
              Please provide a detailed justification for this override.
            </DialogDescription>
          </DialogHeader>
          
          {selectedViolation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Vendor:</span> {selectedViolation.vendors?.vendor_name}
                </div>
                <div>
                  <span className="font-medium">Amount:</span> {formatCurrency(selectedViolation.amount)}
                </div>
                <div>
                  <span className="font-medium">Employee:</span> {selectedViolation.employees?.employee_name}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {selectedViolation.status}
                </div>
              </div>
              
              <Textarea
                placeholder="Enter detailed justification for this override (required)..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={4}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedViolation(null)}>
              Cancel
            </Button>
            <Button
              onClick={authorizeOverride}
              disabled={!overrideReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              Authorize Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}