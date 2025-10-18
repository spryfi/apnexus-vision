import { useServiceWorker } from "@/hooks/useServiceWorker";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, X } from "lucide-react";

export function UpdatePrompt() {
  const { updateAvailable, offlineReady, update, close } = useServiceWorker();

  if (offlineReady) {
    return (
      <div className="fixed bottom-20 md:bottom-4 left-4 right-4 z-50">
        <Alert className="bg-green-500/10 border-green-500">
          <div className="flex items-center justify-between">
            <AlertDescription className="text-green-600">
              App ready to work offline
            </AlertDescription>
            <Button
              variant="ghost"
              size="icon"
              onClick={close}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  if (updateAvailable) {
    return (
      <div className="fixed bottom-20 md:bottom-4 left-4 right-4 z-50">
        <Alert className="bg-primary/10 border-primary">
          <div className="flex items-center justify-between gap-2">
            <AlertDescription className="flex-1">
              New version available!
            </AlertDescription>
            <div className="flex gap-2">
              <Button size="sm" onClick={update}>
                <Download className="h-4 w-4 mr-1" />
                Update
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={close}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Alert>
      </div>
    );
  }

  return null;
}
