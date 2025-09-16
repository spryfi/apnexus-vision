import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ViolationBanner() {
  const [violationCount, setViolationCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
    fetchViolations();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAdmin(user?.email === 'paul@spryfi.net');
  };

  const fetchViolations = async () => {
    if (!isAdmin) return;

    const { data, error } = await supabase
      .from('transactions')
      .select('id')
      .in('status', ['Paid', 'Reconciled'])
      .is('invoice_receipt_url', null)
      .eq('document_required_override', false);

    if (!error && data) {
      setViolationCount(data.length);
    }
  };

  if (!isAdmin || violationCount === 0) return null;

  return (
    <Alert className="border-red-500 bg-red-50 dark:bg-red-950 mb-4">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertDescription className="flex items-center justify-between w-full">
        <span className="text-red-800 dark:text-red-200 font-medium">
          ⚠️ Transaction Violation Detected: {violationCount} transaction{violationCount > 1 ? 's have' : ' has'} been closed without a required document.
        </span>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={() => navigate('/admin-hub')}
        >
          Review Violations
        </Button>
      </AlertDescription>
    </Alert>
  );
}