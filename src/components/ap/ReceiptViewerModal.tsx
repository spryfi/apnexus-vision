import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, ZoomIn, ZoomOut, RotateCw, RotateCcw, Printer, Maximize2 } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface ReceiptViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptUrl: string;
  receiptFileName: string;
}

export function ReceiptViewerModal({ open, onOpenChange, receiptUrl, receiptFileName }: ReceiptViewerModalProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState(false);
  const isPdf = receiptFileName?.toLowerCase().endsWith('.pdf');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = receiptUrl;
    link.download = receiptFileName;
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open(receiptUrl, '_blank');
    printWindow?.addEventListener('load', () => {
      printWindow.print();
    });
  };

  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90) % 360);
  };

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleFitToScreen = () => {
    setZoom(100);
    setRotation(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate max-w-md">{receiptFileName}</DialogTitle>
            <div className="flex gap-2">
              {!isPdf && (
                <>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setZoom(Math.min(200, zoom + 25))}
                    title="Zoom In"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setZoom(Math.max(50, zoom - 25))}
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleFitToScreen}
                    title="Fit to Screen"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleRotateLeft}
                    title="Rotate Left"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleRotateRight}
                    title="Rotate Right"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handlePrint}
                title="Print"
              >
                <Printer className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleDownload}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto bg-muted/20 rounded-lg flex items-center justify-center min-h-0">
          {error ? (
            <Alert variant="destructive" className="max-w-md">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Failed to load receipt. The file may be corrupted or no longer available.
              </AlertDescription>
            </Alert>
          ) : isPdf ? (
            <iframe
              src={receiptUrl}
              className="w-full h-full border-0"
              title="Receipt PDF"
              onError={() => setError(true)}
            />
          ) : (
            <div className="overflow-auto w-full h-full flex items-center justify-center p-4">
              <img
                src={receiptUrl}
                alt="Receipt"
                style={{ 
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transition: 'transform 0.3s ease',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
                className="mx-auto"
                onError={() => setError(true)}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
