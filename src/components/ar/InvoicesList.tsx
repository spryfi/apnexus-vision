import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Download } from "lucide-react";
import { CreateInvoiceDialog } from "./CreateInvoiceDialog";
import { InvoiceDetailDialog } from "./InvoiceDetailDialog";
import { RecordPaymentDialog } from "./RecordPaymentDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

export const InvoicesList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices", searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("invoices_receivable")
        .select(`
          *,
          customers (
            first_name,
            last_name
          )
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (searchTerm) {
        query = query.or(`invoice_number.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
      case "partial":
        return "bg-orange-500/10 text-orange-700 border-orange-500/20";
      case "overdue":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  const getDueDateColor = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "text-red-600 font-semibold";
    if (diffDays <= 7) return "text-orange-600 font-medium";
    return "";
  };

  const calculateDaysOverdue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by invoice number, customer, or description"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Partial">Partial</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Invoice
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
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Invoice Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Days Overdue</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices?.map((invoice) => {
              const balanceDue = Number(invoice.amount) - Number(invoice.amount_paid || 0);
              const daysOverdue = calculateDaysOverdue(invoice.due_date);

              return (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <button
                      onClick={() => setSelectedInvoiceId(invoice.id)}
                      className="text-primary hover:underline font-medium"
                    >
                      {invoice.invoice_number}
                    </button>
                  </TableCell>
                  <TableCell>
                    {invoice.customers
                      ? `${invoice.customers.first_name} ${invoice.customers.last_name}`
                      : "N/A"}
                  </TableCell>
                  <TableCell>{format(new Date(invoice.invoice_date), "MMM d, yyyy")}</TableCell>
                  <TableCell className={getDueDateColor(invoice.due_date)}>
                    {format(new Date(invoice.due_date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${Number(invoice.amount).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    ${Number(invoice.amount_paid || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    ${balanceDue.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {daysOverdue && (
                      <span className="text-red-600 font-semibold">{daysOverdue} days</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedInvoiceId(invoice.id)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedInvoiceId(invoice.id);
                            setPaymentDialogOpen(true);
                          }}
                        >
                          Record Payment
                        </DropdownMenuItem>
                        <DropdownMenuItem>Send Reminder</DropdownMenuItem>
                        <DropdownMenuItem>Download PDF</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {invoices?.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  No invoices found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CreateInvoiceDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      {selectedInvoiceId && (
        <>
          <InvoiceDetailDialog
            invoiceId={selectedInvoiceId}
            open={!!selectedInvoiceId && !paymentDialogOpen}
            onOpenChange={(open) => !open && setSelectedInvoiceId(null)}
          />
          <RecordPaymentDialog
            invoiceId={selectedInvoiceId}
            open={paymentDialogOpen}
            onOpenChange={setPaymentDialogOpen}
            onSuccess={() => {
              setPaymentDialogOpen(false);
              setSelectedInvoiceId(null);
            }}
          />
        </>
      )}
    </div>
  );
};
