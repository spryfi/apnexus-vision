
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";

interface FlaggedTransaction {
  id: string;
  original_transaction_id: string;
  flag_reason: string;
  reviewed: boolean | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  transaction_data: any; // JSON with transaction fields
}

const AMOUNT_THRESHOLD = 2000;

const AdminApprovals = () => {
  const [flagged, setFlagged] = useState<FlaggedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    fetchFlagged();
  }, []);

  const fetchFlagged = async () => {
    setLoading(true);
    // Get flagged transactions, filter for >$2000
    const { data, error } = await supabase
      .from('flagged_transactions')
      .select('*')
      .order('flagged_at', { ascending: false });
    if (error) {
      setFlagged([]);
      setLoading(false);
      return;
    }
    // Only show flagged transactions with amount > $2000
    const filtered = (data || []).filter((t: FlaggedTransaction) => {
      const amount = t.transaction_data?.amount;
      return typeof amount === 'number' && amount > AMOUNT_THRESHOLD;
    });
    setFlagged(filtered);
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    setApproving(id);
    // Mark as reviewed in Supabase
    const { error } = await supabase
      .from('flagged_transactions')
      .update({ reviewed: true, reviewed_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) {
      setFlagged((prev) => prev.map((t) => t.id === id ? { ...t, reviewed: true, reviewed_at: new Date().toISOString() } : t));
    }
    setApproving(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="mb-6 text-4xl font-bold text-center">Approval Queue</h1>
      {loading ? (
        <div className="text-center text-muted-foreground">Loading flagged transactions...</div>
      ) : flagged.length === 0 ? (
        <div className="text-center text-muted-foreground">No flagged transactions over $2,000 require approval.</div>
      ) : (
        <div className="space-y-6">
          {flagged.map((t) => {
            const tx = t.transaction_data || {};
            const approved = !!t.reviewed;
            return (
              <Card
                key={t.id}
                className={
                  approved
                    ? "bg-gradient-to-r from-green-200 via-green-100 to-white border-green-400 shadow-green-200 animate-pulse"
                    : "border-orange-300"
                }
              >
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="flex items-center gap-2">
                    {approved ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-orange-500" />
                    )}
                    <CardTitle className="text-xl">
                      {tx.vendors?.vendor_name || tx.vendor_name || 'Vendor'}
                    </CardTitle>
                  </div>
                  <Badge variant={approved ? 'default' : 'destructive'}>
                    {approved ? 'Approved' : 'Flagged'}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-4 items-center">
                    <span className="font-medium">Amount:</span>
                    <span>{formatCurrency(tx.amount)}</span>
                    <span className="font-medium">Reason:</span>
                    <span>{t.flag_reason || 'Flagged for review'}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 items-center">
                    <span className="font-medium">Employee:</span>
                    <span>{tx.employees?.employee_name || tx.employee_name || '-'}</span>
                    <span className="font-medium">Date:</span>
                    <span>{tx.invoice_date ? new Date(tx.invoice_date).toLocaleDateString() : '-'}</span>
                  </div>
                  {!approved && (
                    <Button
                      onClick={() => handleApprove(t.id)}
                      disabled={approving === t.id}
                      className="mt-2"
                    >
                      {approving === t.id ? 'Approving...' : 'Approve'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminApprovals;
