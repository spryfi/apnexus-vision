import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, Shield, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AlertsListProps {
  alerts: {
    overdueInvoices: number;
    missingReceipts: number;
    expiringInsurance: number;
  };
  isLoading?: boolean;
}

export function AlertsList({ alerts, isLoading }: AlertsListProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>⚠️ Alerts & Upcoming Reminders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-16 bg-muted animate-pulse rounded" />
          <div className="h-16 bg-muted animate-pulse rounded" />
          <div className="h-16 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const hasAlerts = alerts.overdueInvoices > 0 || alerts.missingReceipts > 0 || alerts.expiringInsurance > 0;

  if (!hasAlerts) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>⚠️ Alerts & Upcoming Reminders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-6">No alerts at this time. Everything looks good!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>⚠️ Alerts & Upcoming Reminders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.overdueInvoices > 0 && (
          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="font-medium">
                {alerts.overdueInvoices} invoice{alerts.overdueInvoices > 1 ? "s" : ""} overdue
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/accounts-payable")}>
              View <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {alerts.missingReceipts > 0 && (
          <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="font-medium">
                {alerts.missingReceipts} transaction{alerts.missingReceipts > 1 ? "s" : ""} missing receipts
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/credit-cards")}>
              Review <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {alerts.expiringInsurance > 0 && (
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="font-medium">
                Vehicle insurance expires in 15 days
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/fleet")}>
              View <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
