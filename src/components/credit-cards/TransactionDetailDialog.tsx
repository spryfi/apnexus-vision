import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TransactionDetailDialogProps {
  transactionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TransactionDetailDialog = ({
  transactionId,
  open,
  onOpenChange,
}: TransactionDetailDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>
        <p>Details for transaction {transactionId}</p>
      </DialogContent>
    </Dialog>
  );
};
