import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle, MessageSquare, AlertTriangle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface FlaggedReceipt {
  id: string;
  receipt_id: string;
  flag_type: string;
  severity: string;
  flag_reason: string;
  flag_details: any;
  status: string;
  created_at: string;
  processed_receipts: {
    id: string;
    image_url: string;
    extracted_data: any;
    confidence_scores: any;
    employee_id: string;
    employees_enhanced: {
      full_name: string;
    };
  };
}

const AIReviewQueue: React.FC = () => {
  const [flags, setFlags] = useState<FlaggedReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlag, setSelectedFlag] = useState<FlaggedReceipt | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'escalate' | 'info' | null>(null);

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      const { data, error } = await supabase
        .from('receipt_flags')
        .select(`
          *,
          processed_receipts (
            id,
            image_url,
            extracted_data,
            confidence_scores,
            employee_id,
            employees_enhanced (full_name)
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFlags(data || []);
    } catch (error) {
      console.error('Error fetching flags:', error);
      toast({
        title: 'Error',
        description: 'Failed to load flagged receipts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFlagTypeIcon = (flagType: string) => {
    switch (flagType) {
      case 'duplicate': return <XCircle className="h-4 w-4" />;
      case 'policy_violation': return <AlertCircle className="h-4 w-4" />;
      case 'low_confidence': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleAction = async () => {
    if (!selectedFlag || !actionType) return;

    try {
      const { error } = await supabase
        .from('receipt_flags')
        .update({
          status: actionType === 'approve' ? 'resolved' : actionType === 'reject' ? 'rejected' : 'pending',
          resolution_notes: reviewNote,
          resolved_by: (await supabase.auth.getUser()).data.user?.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', selectedFlag.id);

      if (error) throw error;

      // Update processed receipt status if approved/rejected
      if (actionType === 'approve' || actionType === 'reject') {
        const { error: receiptError } = await supabase
          .from('processed_receipts')
          .update({
            status: actionType === 'approve' ? 'approved' : 'rejected',
            review_notes: reviewNote,
          })
          .eq('id', selectedFlag.receipt_id);

        if (receiptError) throw receiptError;
      }

      toast({
        title: 'Success',
        description: `Receipt ${actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'escalated'}`,
      });

      setSelectedFlag(null);
      setReviewNote('');
      setActionType(null);
      fetchFlags();
    } catch (error) {
      console.error('Error updating flag:', error);
      toast({
        title: 'Error',
        description: 'Failed to update receipt',
        variant: 'destructive',
      });
    }
  };

  const flagsByType = {
    flagged: flags,
    lowConfidence: flags.filter(f => f.flag_type === 'low_confidence'),
    policyViolations: flags.filter(f => f.flag_type === 'policy_violation'),
    duplicates: flags.filter(f => f.flag_type === 'duplicate'),
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Review Queue</h1>
        <p className="text-muted-foreground">Review AI-flagged transactions and receipts</p>
      </div>

      <Tabs defaultValue="flagged" className="space-y-4">
        <TabsList>
          <TabsTrigger value="flagged">
            Flagged Transactions
            {flagsByType.flagged.length > 0 && (
              <Badge variant="secondary" className="ml-2">{flagsByType.flagged.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="lowConfidence">
            Low Confidence
            {flagsByType.lowConfidence.length > 0 && (
              <Badge variant="secondary" className="ml-2">{flagsByType.lowConfidence.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="policyViolations">
            Policy Violations
            {flagsByType.policyViolations.length > 0 && (
              <Badge variant="secondary" className="ml-2">{flagsByType.policyViolations.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="duplicates">
            Duplicates
            {flagsByType.duplicates.length > 0 && (
              <Badge variant="secondary" className="ml-2">{flagsByType.duplicates.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {Object.entries(flagsByType).map(([key, flagList]) => (
          <TabsContent key={key} value={key}>
            <Card>
              <CardHeader>
                <CardTitle>
                  {key === 'flagged' && 'All Flagged Transactions'}
                  {key === 'lowConfidence' && 'Low Confidence Extractions'}
                  {key === 'policyViolations' && 'Policy Violations'}
                  {key === 'duplicates' && 'Duplicate Receipts'}
                </CardTitle>
                <CardDescription>
                  Review and approve or reject flagged items
                </CardDescription>
              </CardHeader>
              <CardContent>
                {flagList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No items pending review</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Flag Reason</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flagList.map((flag) => (
                        <TableRow key={flag.id}>
                          <TableCell>
                            {new Date(flag.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {flag.processed_receipts?.employees_enhanced?.full_name || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {flag.processed_receipts?.extracted_data?.vendor || 'N/A'}
                          </TableCell>
                          <TableCell>
                            ${flag.processed_receipts?.extracted_data?.total || '0.00'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getFlagTypeIcon(flag.flag_type)}
                              <span className="text-sm">{flag.flag_reason}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getSeverityColor(flag.severity)}>
                              {flag.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedFlag(flag)}
                            >
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={selectedFlag !== null} onOpenChange={() => setSelectedFlag(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Flagged Receipt</DialogTitle>
          </DialogHeader>

          {selectedFlag && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Receipt Image */}
              <div className="space-y-4">
                <img
                  src={selectedFlag.processed_receipts?.image_url}
                  alt="Receipt"
                  className="w-full rounded-lg border"
                />
                <div className="space-y-2">
                  <h3 className="font-semibold">Flag Details</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(selectedFlag.severity)}>
                        {selectedFlag.severity}
                      </Badge>
                      <span>{selectedFlag.flag_reason}</span>
                    </div>
                    {selectedFlag.flag_details && (
                      <pre className="p-2 bg-muted rounded text-xs overflow-x-auto">
                        {JSON.stringify(selectedFlag.flag_details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Transaction Details & Actions */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Transaction Details</h3>
                  <div className="space-y-1 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">Vendor:</span>
                      <span>{selectedFlag.processed_receipts?.extracted_data?.vendor}</span>
                      <span className="text-muted-foreground">Amount:</span>
                      <span>${selectedFlag.processed_receipts?.extracted_data?.total}</span>
                      <span className="text-muted-foreground">Date:</span>
                      <span>{selectedFlag.processed_receipts?.extracted_data?.date}</span>
                      <span className="text-muted-foreground">Employee:</span>
                      <span>{selectedFlag.processed_receipts?.employees_enhanced?.full_name}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Review Notes</label>
                  <Textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Add notes about your decision..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => { setActionType('approve'); handleAction(); }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => { setActionType('reject'); handleAction(); }}
                    variant="destructive"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => { setActionType('info'); handleAction(); }}
                    variant="outline"
                    className="col-span-2"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Request More Info
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIReviewQueue;