import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AuditLogEntry {
  id: string;
  original_transaction_id: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  transaction_data: any;
}

const AdminAuditLog = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('flagged_transactions')
      .select('*')
      .eq('reviewed', true)
      .order('reviewed_at', { ascending: false });
    setLogs(data || []);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="mb-6 text-4xl font-bold text-center">Audit Log</h1>
      <Card>
        <CardHeader>
          <CardTitle>Approval Actions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground">Loading audit log...</div>
          ) : logs.length === 0 ? (
            <div className="text-center text-muted-foreground">No approvals yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Approved By</TableHead>
                    <TableHead>Approved At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const tx = log.transaction_data || {};
                    return (
                      <TableRow key={log.id}>
                        <TableCell>{tx.vendors?.vendor_name || tx.vendor_name || '-'}</TableCell>
                        <TableCell>{typeof tx.amount === 'number' ? `$${tx.amount.toLocaleString()}` : '-'}</TableCell>
                        <TableCell>{log.reviewed_by || '-'}</TableCell>
                        <TableCell>{log.reviewed_at ? new Date(log.reviewed_at).toLocaleString() : '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuditLog;
