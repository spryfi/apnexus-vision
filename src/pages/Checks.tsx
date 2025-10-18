import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Camera, FileCheck, Download, Search, MoreVertical, Image as ImageIcon, Edit, CheckCircle, XCircle, Printer, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { WriteCheckDialog } from "@/components/checks/WriteCheckDialog";
import { CheckDetailDialog } from "@/components/checks/CheckDetailDialog";
import { ScanCheckDialog } from "@/components/checks/ScanCheckDialog";
import { ReconciliationDialog } from "@/components/checks/ReconciliationDialog";

const Checks = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCheck, setSelectedCheck] = useState<string | null>(null);
  const [writeCheckOpen, setWriteCheckOpen] = useState(false);
  const [scanCheckOpen, setScanCheckOpen] = useState(false);
  const [reconcileOpen, setReconcileOpen] = useState(false);

  const { data: checks = [], refetch } = useQuery({
    queryKey: ["checks", statusFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("checks")
        .select("*")
        .order("check_date", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (searchTerm) {
        query = query.or(`check_number.ilike.%${searchTerm}%,payee.ilike.%${searchTerm}%,memo.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: metrics } = useQuery({
    queryKey: ["check-metrics"],
    queryFn: async () => {
      const { data: allChecks } = await supabase.from("checks").select("status, amount, check_date");
      
      const totalChecks = allChecks?.length || 0;
      const outstanding = allChecks?.filter(c => c.status === "Outstanding" || c.status === "Written")
        .reduce((sum, c) => sum + Number(c.amount), 0) || 0;
      const clearedThisMonth = allChecks?.filter(c => 
        c.status === "Cleared" && 
        new Date(c.check_date).getMonth() === new Date().getMonth()
      ).length || 0;
      const voided = allChecks?.filter(c => c.status === "Void").length || 0;

      return { totalChecks, outstanding, clearedThisMonth, voided };
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "Written": "secondary",
      "Cleared": "default",
      "Void": "destructive",
      "Outstanding": "outline",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Check Register</h1>
          <p className="text-muted-foreground">Track all company checks with scanning and reconciliation</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setScanCheckOpen(true)} variant="outline">
            <Camera className="mr-2 h-4 w-4" />
            Scan Check
          </Button>
          <Button onClick={() => setReconcileOpen(true)} variant="outline">
            <FileCheck className="mr-2 h-4 w-4" />
            Reconcile
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Register
          </Button>
          <Button onClick={() => setWriteCheckOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Write Check
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Checks Written</div>
          <div className="text-2xl font-bold">{metrics?.totalChecks || 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Outstanding Amount</div>
          <div className="text-2xl font-bold">${metrics?.outstanding.toFixed(2) || "0.00"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Cleared This Month</div>
          <div className="text-2xl font-bold">{metrics?.clearedThisMonth || 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Voided Checks</div>
          <div className="text-2xl font-bold">{metrics?.voided || 0}</div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by check number, payee, or memo"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Written">Written</SelectItem>
              <SelectItem value="Cleared">Cleared</SelectItem>
              <SelectItem value="Outstanding">Outstanding</SelectItem>
              <SelectItem value="Void">Void</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Check #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Payee</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Memo</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {checks.map((check) => (
              <TableRow key={check.id} className="cursor-pointer" onClick={() => setSelectedCheck(check.id)}>
                <TableCell className="font-medium">{check.check_number}</TableCell>
                <TableCell>{format(new Date(check.check_date), "MMM d, yyyy")}</TableCell>
                <TableCell>{check.payee}</TableCell>
                <TableCell>${Number(check.amount).toFixed(2)}</TableCell>
                <TableCell className="max-w-[200px] truncate">{check.memo}</TableCell>
                <TableCell>
                  <Badge variant="outline">General</Badge>
                </TableCell>
                <TableCell>{getStatusBadge(check.status || "Written")}</TableCell>
                <TableCell>
                  {check.check_image_url ? (
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setScanCheckOpen(true); }}>
                      Upload
                    </Button>
                  )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedCheck(check.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {check.status !== "Cleared" && (
                        <DropdownMenuItem>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark as Cleared
                        </DropdownMenuItem>
                      )}
                      {check.status !== "Cleared" && (
                        <DropdownMenuItem>
                          <XCircle className="mr-2 h-4 w-4" />
                          Void Check
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Check
                      </DropdownMenuItem>
                      {check.status !== "Cleared" && (
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <WriteCheckDialog open={writeCheckOpen} onOpenChange={setWriteCheckOpen} onSuccess={refetch} />
      <ScanCheckDialog open={scanCheckOpen} onOpenChange={setScanCheckOpen} onSuccess={refetch} />
      <ReconciliationDialog open={reconcileOpen} onOpenChange={setReconcileOpen} />
      {selectedCheck && (
        <CheckDetailDialog 
          checkId={selectedCheck} 
          open={!!selectedCheck} 
          onOpenChange={(open) => !open && setSelectedCheck(null)}
          onSuccess={refetch}
        />
      )}
    </div>
  );
};

export default Checks;
