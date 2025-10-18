import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, X, AlertTriangle, Upload } from "lucide-react";
import { format } from "date-fns";

export const ReconciliationTab = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCard, setSelectedCard] = useState("");
  const [statementBalance, setStatementBalance] = useState("");
  const [previousBalance, setPreviousBalance] = useState("");
  const [paymentsMade, setPaymentsMade] = useState("");

  const { data: cards } = useQuery({
    queryKey: ["reconciliation-cards"],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_cards")
        .select("id, cardholder_name, last_four")
        .eq("is_active", true);
      return data || [];
    },
  });

  const { data: transactions } = useQuery({
    queryKey: ["reconciliation-transactions", selectedCard, selectedMonth, selectedYear],
    queryFn: async () => {
      if (!selectedCard) return [];

      const firstDay = new Date(selectedYear, selectedMonth, 1);
      const lastDay = new Date(selectedYear, selectedMonth + 1, 0);

      const { data, error } = await supabase
        .from("credit_card_transactions")
        .select(`
          *,
          employees_enhanced (
            full_name
          )
        `)
        .eq("card_id", selectedCard)
        .gte("transaction_date", firstDay.toISOString())
        .lte("transaction_date", lastDay.toISOString())
        .order("transaction_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedCard,
  });

  const systemTotal = transactions?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
  const statement = parseFloat(statementBalance) || 0;
  const difference = statement - systemTotal;

  const missingReceipts = transactions?.filter((tx) => !tx.receipt_uploaded) || [];

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reconciliation Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Card</Label>
              <Select value={selectedCard} onValueChange={setSelectedCard}>
                <SelectTrigger>
                  <SelectValue placeholder="Select card" />
                </SelectTrigger>
                <SelectContent>
                  {cards?.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.cardholder_name} (•••• {card.last_four})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Previous Balance</Label>
              <Input
                type="number"
                step="0.01"
                value={previousBalance}
                onChange={(e) => setPreviousBalance(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Payments Made</Label>
              <Input
                type="number"
                step="0.01"
                value={paymentsMade}
                onChange={(e) => setPaymentsMade(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>New Charges (System)</Label>
              <Input value={`$${systemTotal.toFixed(2)}`} disabled />
            </div>

            <div className="space-y-2">
              <Label>Statement Balance</Label>
              <Input
                type="number"
                step="0.01"
                value={statementBalance}
                onChange={(e) => setStatementBalance(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedCard && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Reconciliation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">System Total</p>
                  <p className="text-2xl font-bold">${systemTotal.toFixed(2)}</p>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Statement Total</p>
                  <p className="text-2xl font-bold">${statement.toFixed(2)}</p>
                </div>

                <div className={`text-center p-4 rounded-lg ${Math.abs(difference) < 0.01 ? "bg-green-50" : "bg-red-50"}`}>
                  <p className="text-sm text-muted-foreground mb-1">Difference</p>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-2xl font-bold">${Math.abs(difference).toFixed(2)}</p>
                    {Math.abs(difference) < 0.01 ? (
                      <Check className="h-6 w-6 text-green-600" />
                    ) : (
                      <X className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                </div>
              </div>

              {Math.abs(difference) < 0.01 ? (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <p className="text-green-700 font-medium">Account reconciled successfully!</p>
                </div>
              ) : (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <p className="text-red-700 font-medium">
                    Discrepancy of ${Math.abs(difference).toFixed(2)} - Please review transactions
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {missingReceipts.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Missing Receipts ({missingReceipts.length})</CardTitle>
                  <Button variant="outline" size="sm">
                    Send Reminders
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {missingReceipts.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{tx.merchant}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(tx.transaction_date), "MMM d, yyyy")} • $
                          {Number(tx.amount).toFixed(2)}
                        </p>
                      </div>
                      <Button size="sm" className="gap-2">
                        <Upload className="h-4 w-4" />
                        Upload Receipt
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox />
                      </TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Merchant</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions?.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <Checkbox />
                        </TableCell>
                        <TableCell>{format(new Date(tx.transaction_date), "MMM d, yyyy")}</TableCell>
                        <TableCell>{tx.merchant}</TableCell>
                        <TableCell className="text-right font-medium">
                          ${Number(tx.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {tx.receipt_uploaded ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : (
                            <X className="h-5 w-5 text-red-600" />
                          )}
                        </TableCell>
                        <TableCell>{tx.status}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted font-bold">
                      <TableCell colSpan={3}>Total</TableCell>
                      <TableCell className="text-right">${systemTotal.toFixed(2)}</TableCell>
                      <TableCell colSpan={2} />
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
