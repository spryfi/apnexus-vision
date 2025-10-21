import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, ZoomIn, ZoomOut, RotateCw, RotateCcw, Printer, Maximize2, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
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
  
  // Reset error state when receipt changes or modal opens
  useEffect(() => {
    if (open && receiptUrl) {
      setError(false);
      setZoom(100);
      setRotation(0);
    }
  }, [open, receiptUrl]);
  
  // Safety checks
  if (!receiptUrl) {
    return null;
  }
  
  const isPdf = receiptUrl?.toLowerCase().endsWith('.pdf') || receiptFileName?.toLowerCase().endsWith('.pdf');

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = receiptUrl;
      link.download = receiptFileName || 'receipt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
      window.open(receiptUrl, '_blank');
    }
  };

  const handlePrint = () => {
    try {
      const printWindow = window.open(receiptUrl, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }
    } catch (err) {
      console.error('Print failed:', err);
    }
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
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => window.open(receiptUrl, '_blank')}
                title="Open in New Tab"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
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
                <p className="font-semibold mb-2">Failed to load receipt</p>
                <p className="text-sm mb-3">The file may be corrupted or no longer available.</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(receiptUrl, '_blank')}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Try opening in new tab
                </Button>
              </AlertDescription>
            </Alert>
          ) : isPdf ? (
            <iframe
              src={receiptUrl}
              className="w-full h-full border-0"
              title="Receipt PDF"
              onError={(e) => {
                console.error('PDF load failed:', receiptUrl);
                setError(true);
              }}
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
                onError={(e) => {
                  console.error('Image load failed:', receiptUrl);
                  setError(true);
                }}
                onLoad={() => setError(false)}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
