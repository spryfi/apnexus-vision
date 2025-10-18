import { useRef, useState } from "react";
import { Camera, X, Check, RotateCcw, Zap, ZapOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface CameraCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (imageData: string) => void;
  mode?: "receipt" | "check" | "document";
}

export function CameraCapture({ open, onClose, onCapture, mode = "receipt" }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Enable flash if supported
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      if ('torch' in capabilities) {
        await track.applyConstraints({
          // @ts-ignore
          advanced: [{ torch: flashEnabled }]
        });
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(imageData);
  };

  const handleUsePhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      handleClose();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    onClose();
  };

  const toggleFlash = async () => {
    if (!stream) return;
    
    const track = stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities();
    
    if ('torch' in capabilities) {
      const newFlashState = !flashEnabled;
      try {
        await track.applyConstraints({
          // @ts-ignore
          advanced: [{ torch: newFlashState }]
        });
        setFlashEnabled(newFlashState);
      } catch (error) {
        console.error("Error toggling flash:", error);
      }
    }
  };

  const switchCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === "user" ? "environment" : "user");
    setTimeout(startCamera, 100);
  };

  useState(() => {
    if (open) {
      startCamera();
    }
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="p-0 max-w-full h-screen md:h-auto md:max-w-2xl">
        <div className="relative w-full h-full bg-black">
          {!capturedImage ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Overlay guides */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-white/50 rounded-lg w-[90%] h-[60%] relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/70 text-sm text-center">
                    {mode === "receipt" && "Align receipt within frame"}
                    {mode === "check" && "Align check within frame"}
                    {mode === "document" && "Align document within frame"}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="absolute top-4 left-4 right-4 flex justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="bg-black/50 text-white hover:bg-black/70"
                >
                  <X className="h-6 w-6" />
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFlash}
                    className="bg-black/50 text-white hover:bg-black/70"
                  >
                    {flashEnabled ? <Zap className="h-6 w-6" /> : <ZapOff className="h-6 w-6" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={switchCamera}
                    className="bg-black/50 text-white hover:bg-black/70"
                  >
                    <RotateCcw className="h-6 w-6" />
                  </Button>
                </div>
              </div>

              {/* Capture button */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                <Button
                  size="icon"
                  onClick={handleCapture}
                  className="h-16 w-16 rounded-full bg-white hover:bg-white/90"
                >
                  <Camera className="h-8 w-8 text-black" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-contain"
              />
              
              {/* Action buttons */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleRetake}
                  className="bg-black/50 text-white border-white hover:bg-black/70"
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Retake
                </Button>
                <Button
                  size="lg"
                  onClick={handleUsePhoto}
                  className="bg-primary"
                >
                  <Check className="h-5 w-5 mr-2" />
                  Use Photo
                </Button>
              </div>
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
