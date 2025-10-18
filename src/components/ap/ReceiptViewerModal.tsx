import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";

interface ReceiptViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptUrl: string;
  receiptFileName: string;
}

export function ReceiptViewerModal({ open, onOpenChange, receiptUrl, receiptFileName }: ReceiptViewerModalProps) {
  const [zoom, setZoom] = useState(100);
  const isPdf = receiptFileName?.toLowerCase().endsWith('.pdf');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = receiptUrl;
    link.download = receiptFileName;
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{receiptFileName}</DialogTitle>
            <div className="flex gap-2">
              {!isPdf && (
                <>
                  <Button variant="outline" size="icon" onClick={() => setZoom(Math.min(200, zoom + 25))}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setZoom(Math.max(50, zoom - 25))}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button variant="outline" size="icon" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="overflow-auto max-h-[70vh]">
          {isPdf ? (
            <iframe
              src={receiptUrl}
              className="w-full h-[70vh]"
              title="Receipt PDF"
            />
          ) : (
            <img
              src={receiptUrl}
              alt="Receipt"
              style={{ width: `${zoom}%` }}
              className="mx-auto"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
