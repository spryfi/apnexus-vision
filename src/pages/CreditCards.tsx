import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, DollarSign, AlertTriangle, Clock } from "lucide-react";
import { CardsTab } from "@/components/credit-cards/CardsTab";
import { TransactionsTab } from "@/components/credit-cards/TransactionsTab";
import { ReconciliationTab } from "@/components/credit-cards/ReconciliationTab";

const CreditCards = () => {
  const { data: metrics } = useQuery({
    queryKey: ["credit-card-metrics"],
    queryFn: async () => {
      const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

      const [cardsResult, transactionsResult, pendingResult, flaggedResult] = await Promise.all([
        supabase.from("company_cards").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase
          .from("credit_card_transactions")
          .select("amount")
          .gte("transaction_date", firstDay.toISOString())
          .lte("transaction_date", lastDay.toISOString()),
        supabase
          .from("credit_card_transactions")
          .select("*", { count: "exact", head: true })
          .eq("receipt_uploaded", false),
        supabase
          .from("credit_card_transactions")
          .select("*", { count: "exact", head: true })
          .eq("status", "Flagged"),
      ]);

      const totalSpending = transactionsResult.data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      return {
        totalCards: cardsResult.count || 0,
        totalSpending,
        pendingTransactions: pendingResult.count || 0,
        flaggedTransactions: flaggedResult.count || 0,
      };
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credit Card Management</h1>
          <p className="text-muted-foreground">Track company cards, transactions, and reconciliation</p>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalCards || 0}</div>
            <p className="text-xs text-muted-foreground">Active cards</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Month Spending</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics?.totalSpending.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">All cards combined</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Transactions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.pendingTransactions || 0}</div>
            <p className="text-xs text-muted-foreground">Missing receipts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Flagged Transactions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.flaggedTransactions || 0}</div>
            <p className="text-xs text-muted-foreground">Require review</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="space-y-4">
          <CardsTab />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <TransactionsTab />
        </TabsContent>

        <TabsContent value="reconciliation" className="space-y-4">
          <ReconciliationTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreditCards;
