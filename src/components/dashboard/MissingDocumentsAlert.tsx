import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface Transaction {
  id: string;
  invoice_number: string;
  vendor_name: string;
  amount: number;
  invoice_date: string;
  status: string;
}

export function MissingDocumentsAlert() {
  const navigate = useNavigate();

  const { data: missingDocs, isLoading } = useQuery({
    queryKey: ['missing-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          invoice_number,
          amount,
          invoice_date,
          status,
          vendors (vendor_name)
        `)
        .or('invoice_receipt_url.is.null,invoice_receipt_url.eq.')
        .in('status', ['Pending Approval', 'Approved for Payment', 'Paid', 'Reconciled'])
        .order('invoice_date', { ascending: false });

      if (error) throw error;

      return data?.map(item => ({
        id: item.id,
        invoice_number: item.invoice_number || 'N/A',
        vendor_name: (item.vendors as any)?.vendor_name || 'Unknown',
        amount: item.amount || 0,
        invoice_date: item.invoice_date,
        status: item.status,
      })) || [];
    },
  });

  if (isLoading || !missingDocs || missingDocs.length === 0) {
    return null;
  }

  return (
    <Alert className="border-red-500 bg-red-50 dark:bg-red-950/20">
      <AlertTriangle className="h-5 w-5 text-red-600" />
      <AlertDescription className="ml-2">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-100 text-base">
              ⚠️ {missingDocs.length} Transaction{missingDocs.length > 1 ? 's' : ''} Missing Documentation
            </h3>
            <p className="text-sm text-red-800 dark:text-red-200 mt-1">
              These transactions do not have required supporting documents and cannot be processed until receipts are uploaded.
            </p>
          </div>

          {missingDocs.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {missingDocs.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                        {transaction.vendor_name}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {transaction.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {transaction.invoice_number}
                      </p>
                      <span className="text-xs text-gray-400">•</span>
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                        ${transaction.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/transactions')}
                    className="ml-3 flex-shrink-0 border-red-300 text-red-700 hover:bg-red-100"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Upload
                  </Button>
                </div>
              ))}
            </div>
          )}

          {missingDocs.length > 5 && (
            <p className="text-xs text-red-700 dark:text-red-300">
              ...and {missingDocs.length - 5} more
            </p>
          )}

          <Button
            size="sm"
            variant="destructive"
            onClick={() => navigate('/transactions')}
            className="w-full"
          >
            Review All Missing Documents
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
