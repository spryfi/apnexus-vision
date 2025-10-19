import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Upload, CreditCard } from "lucide-react";
import { CreditCardDisplay } from "./CreditCardDisplay";
import { AddCardDialog } from "./AddCardDialog";
import { ImportTransactionsDialog } from "./ImportTransactionsDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";

export const CardsTab = () => {
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { data: cards, isLoading } = useQuery({
    queryKey: ["company-cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_cards")
        .select(`
          *,
          employees_enhanced (
            full_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  const handleEdit = (card: any) => {
    // For now, just show a toast. Full edit functionality can be added later
    console.log("Edit card:", card);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={() => setAddCardOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Card
        </Button>
        <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
          <Upload className="h-4 w-4" />
          Import Transactions
        </Button>
      </div>

      {!cards || cards.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No cards added yet"
          description="Add your first company credit card to start tracking expenses and transactions."
          actionLabel="Add First Card"
          onAction={() => setAddCardOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <CreditCardDisplay key={card.id} card={card} onEdit={handleEdit} />
          ))}
        </div>
      )}

      <AddCardDialog 
        open={addCardOpen} 
        onOpenChange={setAddCardOpen}
      />
      <ImportTransactionsDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
};
