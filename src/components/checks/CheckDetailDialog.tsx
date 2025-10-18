import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { CheckCircle, XCircle, Edit, Printer, Download, ZoomIn } from "lucide-react";

interface CheckDetailDialogProps {
  checkId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CheckDetailDialog({ checkId, open, onOpenChange, onSuccess }: CheckDetailDialogProps) {
  const { data: check } = useQuery({
    queryKey: ["check-detail", checkId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checks")
        .select("*")
        .eq("id", checkId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!checkId,
  });

  const handleMarkCleared = async () => {
    const { error } = await supabase
      .from("checks")
      .update({ status: "Cleared" })
      .eq("id", checkId);

    if (error) {
      toast.error("Failed to mark check as cleared");
      return;
    }

    toast.success("Check marked as cleared");
    onSuccess();
  };

  const handleVoid = async () => {
    const reason = window.prompt("Enter reason for voiding this check:");
    if (!reason) return;

    const { error } = await supabase
      .from("checks")
      .update({ status: "Void", memo: `${check?.memo || ""} [VOIDED: ${reason}]` })
      .eq("id", checkId);

    if (error) {
      toast.error("Failed to void check");
      return;
    }

    toast.success("Check voided");
    onSuccess();
  };

  if (!check) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Check Details - #{check.check_number}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {check.check_image_url && (
            <div className="space-y-2">
              <div className="relative group">
                <img
                  src={check.check_image_url}
                  alt="Check"
                  className="w-full rounded-lg border"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" variant="secondary">
                    <ZoomIn className="mr-2 h-4 w-4" />
                    Zoom
                  </Button>
                  <Button size="sm" variant="secondary">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Check Information</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Check Number</div>
                  <div className="text-2xl font-bold font-mono">{check.check_number}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Date Written</div>
                  <div className="font-medium">{format(new Date(check.check_date), "MMMM d, yyyy")}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Payee</div>
                  <div className="font-medium">{check.payee}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Amount</div>
                  <div className="text-3xl font-bold">${Number(check.amount).toFixed(2)}</div>
                </div>
                {check.memo && (
                  <div>
                    <div className="text-sm text-muted-foreground">Memo</div>
                    <div className="font-medium">{check.memo}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-muted-foreground">Category</div>
                  <Badge variant="outline">General</Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <Badge variant={check.status === "Cleared" ? "default" : check.status === "Void" ? "destructive" : "secondary"}>
                    {check.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {check.status !== "Cleared" && (
                <Button onClick={handleMarkCleared}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Cleared
                </Button>
              )}
              {check.status !== "Cleared" && check.status !== "Void" && (
                <Button onClick={handleVoid} variant="destructive">
                  <XCircle className="mr-2 h-4 w-4" />
                  Void Check
                </Button>
              )}
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
