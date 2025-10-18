import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface ImportTransactionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportTransactionsDialog = ({ open, onOpenChange }: ImportTransactionsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Transactions</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Upload a CSV file from your credit card statement
            </p>
            <Button variant="outline" size="sm">
              Choose File
            </Button>
          </div>
          <Button variant="link" className="w-full">
            Download CSV Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
