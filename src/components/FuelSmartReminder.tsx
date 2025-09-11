import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle } from "lucide-react";

interface FuelSmartReminderProps {
  lastMonth: string;
  onUploadClick: () => void;
}

export function FuelSmartReminder({ lastMonth, onUploadClick }: FuelSmartReminderProps) {
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-8 text-center">
        <div className="flex flex-col items-center space-y-4">
          <AlertCircle className="h-16 w-16 text-orange-600" />
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-orange-900">
              It looks like {lastMonth}'s fuel usage hasn't been logged yet.
            </h3>
            <p className="text-orange-700 text-lg">
              Upload your monthly fuel statement to automatically process and reconcile transactions.
            </p>
          </div>
          <Button 
            onClick={onUploadClick}
            size="lg"
            className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 text-lg"
          >
            <Upload className="h-5 w-5 mr-2" />
            🚀 Upload {lastMonth} Fuel Statement
          </Button>
          <p className="text-sm text-orange-600">
            Supports CSV and Excel files from your fuel card provider
          </p>
        </div>
      </CardContent>
    </Card>
  );
}