import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvoicesList } from "@/components/ar/InvoicesList";
import { AgingReport } from "@/components/ar/AgingReport";

const AccountsReceivable = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts Receivable</h1>
          <p className="text-muted-foreground">Manage invoices and track receivables</p>
        </div>
      </div>

      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="aging">Aging Report</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <InvoicesList />
        </TabsContent>

        <TabsContent value="aging" className="space-y-4">
          <AgingReport />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountsReceivable;
