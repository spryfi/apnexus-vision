import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertCircle, CheckCircle, XCircle, Loader2, Flag } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface FlaggedTransaction {
  id: string;
  original_transaction_id: string;
  flag_reason: string;
  transaction_data: any;
  flagged_at: string;
  reviewed: boolean;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

interface TransactionData {
  id: string;
  transaction_date: string;
  amount: number;
  vendor_name?: string;
  merchant?: string;
  description?: string;
  purchase_description?: string;
  receipt_url?: string;
  receipt_uploaded?: boolean;
  category_name?: string;
}

const getSeverity = (reason: string): { level: string; color: string } => {
  if (reason.includes("High Amount") || reason.includes("Duplicate")) {
    return { level: "High", color: "destructive" };
  }
  if (reason.includes("Missing Receipt")) {
    return { level: "Medium", color: "warning" };
  }
  return { level: "Low", color: "default" };
};

const AdminAIReview = () => {
  const [flaggedItems, setFlaggedItems] = useState<FlaggedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<FlaggedTransaction | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [analyzingAI, setAnalyzingAI] = useState(false);

  const fetchFlaggedTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("flagged_transactions")
        .select("*")
        .eq("reviewed", false)
        .order("flagged_at", { ascending: false });

      if (error) throw error;
      setFlaggedItems(data || []);
    } catch (error) {
      console.error("Error fetching flagged transactions:", error);
      toast.error("Failed to load flagged transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlaggedTransactions();

    // Set up real-time subscription
    const channel = supabase
      .channel("flagged-transactions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "flagged_transactions",
        },
        () => {
          fetchFlaggedTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const analyzeWithAI = async (item: FlaggedTransaction) => {
    setAnalyzingAI(true);
    try {
      const txData = item.transaction_data as TransactionData;
      const { data, error } = await supabase.functions.invoke("analyze-transaction", {
        body: {
          transaction: txData,
          flagReason: item.flag_reason,
        },
      });

      if (error) throw error;
      setAiAnalysis(data.analysis || "No analysis available");
    } catch (error) {
      console.error("Error analyzing transaction:", error);
      toast.error("Failed to get AI analysis");
      setAiAnalysis("AI analysis unavailable. Please review manually.");
    } finally {
      setAnalyzingAI(false);
    }
  };

  const handleReview = async (item: FlaggedTransaction) => {
    setSelectedItem(item);
    await analyzeWithAI(item);
  };

  const handleApprove = async () => {
    if (!selectedItem) return;

    try {
      const { error } = await supabase
        .from("flagged_transactions")
        .update({
          reviewed: true,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", selectedItem.id);

      if (error) throw error;

      toast.success("Transaction approved");
      setSelectedItem(null);
      setAiAnalysis("");
      fetchFlaggedTransactions();
    } catch (error) {
      console.error("Error approving transaction:", error);
      toast.error("Failed to approve transaction");
    }
  };

  const handleReject = async () => {
    if (!selectedItem) return;

    try {
      const { error } = await supabase
        .from("flagged_transactions")
        .update({
          reviewed: true,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", selectedItem.id);

      if (error) throw error;

      toast.success("Transaction flagged for manual review");
      setSelectedItem(null);
      setAiAnalysis("");
      fetchFlaggedTransactions();
    } catch (error) {
      console.error("Error flagging transaction:", error);
      toast.error("Failed to flag transaction");
    }
  };

  const filteredItems = flaggedItems.filter((item) => {
    if (severityFilter === "all") return true;
    const severity = getSeverity(item.flag_reason);
    return severity.level.toLowerCase() === severityFilter.toLowerCase();
  });

  const highPriorityCount = flaggedItems.filter(
    (item) => getSeverity(item.flag_reason).level === "High"
  ).length;

  const totalAmount = flaggedItems.reduce((sum, item) => {
    const txData = item.transaction_data as TransactionData;
    return sum + (txData.amount || 0);
  }, 0);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Review Queue</h1>
          <p className="text-muted-foreground">
            AI-powered validation and anomaly detection
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Requiring Review</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flaggedItems.length}</div>
            <p className="text-xs text-muted-foreground">Total flagged transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{highPriorityCount}</div>
            <p className="text-xs text-muted-foreground">Urgent attention needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">In flagged transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviewed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Items processed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Flagged Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="mb-4 h-12 w-12 text-green-500" />
              <h3 className="text-lg font-semibold">All Clear!</h3>
              <p className="text-muted-foreground">
                No transactions require review at this time.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor/Merchant</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Flag Reason</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const txData = item.transaction_data as TransactionData;
                  const severity = getSeverity(item.flag_reason);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        {format(new Date(txData.transaction_date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>{txData.vendor_name || txData.merchant || "Unknown"}</TableCell>
                      <TableCell className="font-medium">
                        ${txData.amount?.toFixed(2) || "0.00"}
                      </TableCell>
                      <TableCell>{item.flag_reason}</TableCell>
                      <TableCell>
                        <Badge variant={severity.color as any}>{severity.level}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleReview(item)}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* AI Analysis Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Transaction Analysis</DialogTitle>
            <DialogDescription>
              Review AI-powered analysis and take action
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-2">Transaction Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Date:</span>{" "}
                    {format(
                      new Date((selectedItem.transaction_data as TransactionData).transaction_date),
                      "MMM dd, yyyy"
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Amount:</span> $
                    {(selectedItem.transaction_data as TransactionData).amount?.toFixed(2)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vendor:</span>{" "}
                    {(selectedItem.transaction_data as TransactionData).vendor_name ||
                      (selectedItem.transaction_data as TransactionData).merchant}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category:</span>{" "}
                    {(selectedItem.transaction_data as TransactionData).category_name || "Uncategorized"}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Flag Reason
                </h3>
                <p className="text-sm">{selectedItem.flag_reason}</p>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-2">AI Analysis</h3>
                {analyzingAI ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing transaction...
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-line">{aiAnalysis}</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedItem(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              <XCircle className="mr-2 h-4 w-4" />
              Flag for Manual Review
            </Button>
            <Button onClick={handleApprove}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAIReview;
