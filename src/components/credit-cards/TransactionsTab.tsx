import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Download, Upload, Check, X, AlertTriangle, MoreVertical } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddTransactionDialog } from "./AddTransactionDialog";
import { TransactionDetailDialog } from "./TransactionDetailDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ReceiptViewerModal } from "@/components/ap/ReceiptViewerModal";
import { FileText } from "lucide-react";

export const TransactionsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cardFilter, setCardFilter] = useState("all");
  const [receiptFilter, setReceiptFilter] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [receiptViewerOpen, setReceiptViewerOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<{ url: string; fileName: string } | null>(null);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["credit-card-transactions", searchTerm, statusFilter, cardFilter, receiptFilter],
    queryFn: async () => {
      let query = supabase
        .from("credit_card_transactions")
        .select(`
          *,
          company_cards (
            last_four,
            card_brand
          ),
          employees_enhanced (
            full_name
          ),
          expense_categories (
            category_name
          )
        `)
        .order("transaction_date", { ascending: false });

      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      if (cardFilter !== "all") query = query.eq("card_id", cardFilter);
      if (receiptFilter === "uploaded") query = query.eq("receipt_uploaded", true);
      if (receiptFilter === "missing") query = query.eq("receipt_uploaded", false);
      if (searchTerm) {
        query = query.or(`merchant.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: cards } = useQuery({
    queryKey: ["cards-filter"],
    queryFn: async () => {
      const { data } = await supabase.from("company_cards").select("id, cardholder_name, last_four");
      return data || [];
    },
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      Pending: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
      Approved: "bg-green-500/10 text-green-700 border-green-500/20",
      Flagged: "bg-orange-500/10 text-orange-700 border-orange-500/20",
      Rejected: "bg-red-500/10 text-red-700 border-red-500/20",
    };
    return styles[status as keyof typeof styles] || "";
  };

  const handleViewReceipt = (receiptUrl: string, fileName: string) => {
    setSelectedReceipt({ url: receiptUrl, fileName });
    setReceiptViewerOpen(true);
  };

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by merchant, employee, or description"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Select value={cardFilter} onValueChange={setCardFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Cards" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cards</SelectItem>
            {cards?.map((card) => (
              <SelectItem key={card.id} value={card.id}>
                •••• {card.last_four}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Flagged">Flagged</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={receiptFilter} onValueChange={setReceiptFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Receipts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Receipts</SelectItem>
            <SelectItem value="uploaded">Uploaded</SelectItem>
            <SelectItem value="missing">Missing</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>

        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>

        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Card</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Receipt</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions?.map((tx) => (
              <TableRow
                key={tx.id}
                className={tx.status === "Flagged" ? "bg-yellow-50/50" : ""}
                onClick={() => setSelectedTxId(tx.id)}
              >
                <TableCell>{format(new Date(tx.transaction_date), "MMM d, yyyy")}</TableCell>
                <TableCell className="font-mono text-sm">
                  •••• {tx.company_cards?.last_four}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {tx.employees_enhanced?.full_name?.split(" ").map((n: string) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{tx.employees_enhanced?.full_name}</span>
                  </div>
                </TableCell>
                <TableCell>{tx.merchant}</TableCell>
                <TableCell className="text-right font-medium">${Number(tx.amount).toFixed(2)}</TableCell>
                <TableCell>
                  {tx.expense_categories && (
                    <Badge variant="outline">{tx.expense_categories.category_name}</Badge>
                  )}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">{tx.description || "-"}</TableCell>
                <TableCell>
                  {tx.receipt_url ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewReceipt(tx.receipt_url, `Receipt-${tx.merchant}`);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FileText className="h-5 w-5" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="text-xs font-medium">Missing</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusBadge(tx.status)}>
                    {tx.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedTxId(tx.id)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>Upload Receipt</DropdownMenuItem>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Approve</DropdownMenuItem>
                      <DropdownMenuItem>Flag for Review</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Reject</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {transactions?.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  No transactions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AddTransactionDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      {selectedTxId && (
        <TransactionDetailDialog
          transactionId={selectedTxId}
          open={!!selectedTxId}
          onOpenChange={(open) => !open && setSelectedTxId(null)}
        />
      )}
      {selectedReceipt && (
        <ReceiptViewerModal
          open={receiptViewerOpen}
          onOpenChange={setReceiptViewerOpen}
          receiptUrl={selectedReceipt.url}
          receiptFileName={selectedReceipt.fileName}
        />
      )}
    </div>
  );
};
