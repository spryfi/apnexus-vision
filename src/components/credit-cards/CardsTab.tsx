import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { CreditCardDisplay } from "./CreditCardDisplay";
import { AddCardDialog } from "./AddCardDialog";
import { ImportTransactionsDialog } from "./ImportTransactionsDialog";
import { Skeleton } from "@/components/ui/skeleton";

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards?.map((card) => (
          <CreditCardDisplay key={card.id} card={card} />
        ))}
      </div>

      {cards?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No cards found. Add your first card to get started.
        </div>
      )}

      <AddCardDialog open={addCardOpen} onOpenChange={setAddCardOpen} />
      <ImportTransactionsDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
};
