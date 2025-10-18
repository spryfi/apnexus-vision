import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import { Receipt, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Transaction {
  id: string;
  invoice_date: string;
  amount: number;
  vendors?: { vendor_name: string } | null;
  expense_categories?: { category_name: string } | null;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export function RecentTransactions({ transactions, isLoading }: RecentTransactionsProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🕒 Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🕒 Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Receipt}
            title="No transactions yet"
            description="Start adding transactions to see them here."
            actionLabel="Add Transaction"
            onAction={() => navigate("/transactions")}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>🕒 Recent Transactions</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate("/transactions")}>
          View All <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow
                key={transaction.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/transactions?id=${transaction.id}`)}
              >
                <TableCell>{format(new Date(transaction.invoice_date), "MMM d")}</TableCell>
                <TableCell>{transaction.vendors?.vendor_name || "Unknown"}</TableCell>
                <TableCell>{transaction.expense_categories?.category_name || "Uncategorized"}</TableCell>
                <TableCell className="text-right font-medium">
                  ${transaction.amount.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
