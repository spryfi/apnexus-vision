import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

interface ReconciliationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReconciliationDialog({ open, onOpenChange }: ReconciliationDialogProps) {
  const [month, setMonth] = useState(new Date().getMonth().toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [statementBalance, setStatementBalance] = useState("");
  const [clearedChecks, setClearedChecks] = useState<Set<string>>(new Set());

  const { data: checks = [] } = useQuery({
    queryKey: ["outstanding-checks", month, year],
    queryFn: async () => {
      const startDate = new Date(Number(year), Number(month), 1);
      const endDate = new Date(Number(year), Number(month) + 1, 0);

      const { data, error } = await supabase
        .from("checks")
        .select("*")
        .in("status", ["Written", "Outstanding"])
        .gte("check_date", startDate.toISOString())
        .lte("check_date", endDate.toISOString())
        .order("check_date");

      if (error) throw error;
      return data;
    },
  });

  const totalOutstanding = checks
    .filter(c => !clearedChecks.has(c.id))
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const handleReconcile = async () => {
    const statement = Number(statementBalance);
    const adjusted = statement - totalOutstanding;
    
    if (Math.abs(adjusted - statement) < 0.01) {
      toast.success("Reconciliation successful!");
    } else {
      toast.warning(`Discrepancy of $${Math.abs(adjusted - statement).toFixed(2)}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bank Reconciliation</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Month</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const y = new Date().getFullYear() - i;
                    return <SelectItem key={y} value={y.toString()}>{y}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
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

          <div className="border rounded-lg p-4 space-y-2 bg-muted/50">
            <div className="flex justify-between">
              <span>Statement Balance:</span>
              <span className="font-bold">${Number(statementBalance || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Outstanding Checks:</span>
              <span className="text-destructive">-${totalOutstanding.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Adjusted Balance:</span>
              <span className="font-bold">${(Number(statementBalance || 0) - totalOutstanding).toFixed(2)}</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Outstanding Checks</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Check #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Payee</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Days Out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checks.map((check) => {
                  const daysOut = Math.floor((new Date().getTime() - new Date(check.check_date).getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <TableRow key={check.id}>
                      <TableCell>
                        <Checkbox
                          checked={clearedChecks.has(check.id)}
                          onCheckedChange={(checked) => {
                            const newSet = new Set(clearedChecks);
                            if (checked) {
                              newSet.add(check.id);
                            } else {
                              newSet.delete(check.id);
                            }
                            setClearedChecks(newSet);
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-mono">{check.check_number}</TableCell>
                      <TableCell>{new Date(check.check_date).toLocaleDateString()}</TableCell>
                      <TableCell>{check.payee}</TableCell>
                      <TableCell>${Number(check.amount).toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={daysOut > 90 ? "text-destructive font-semibold" : ""}>
                          {daysOut} days
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleReconcile}>Complete Reconciliation</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
