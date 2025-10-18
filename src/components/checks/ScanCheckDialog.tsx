import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Camera, Upload } from "lucide-react";

interface ScanCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ScanCheckDialog({ open, onOpenChange, onSuccess }: ScanCheckDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    toast.info("OCR processing would happen here");
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Scan Check</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
            {preview ? (
              <img src={preview} alt="Check preview" className="max-w-full mx-auto rounded" />
            ) : (
              <div className="space-y-4">
                <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload a check image or take a photo
                  </p>
                  <Label htmlFor="check-image" className="cursor-pointer">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                      <Upload className="h-4 w-4" />
                      Choose File
                    </div>
                    <Input
                      id="check-image"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </Label>
                </div>
              </div>
            )}
          </div>

          {preview && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                OCR processing will extract check details automatically
              </p>
              <div className="flex gap-2">
                <Button onClick={() => { setFile(null); setPreview(""); }} variant="outline">
                  Retake
                </Button>
                <Button onClick={handleUpload} className="flex-1">
                  Process & Extract Data
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
