import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Eye, Edit, Power, CreditCard as CreditCardIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CreditCardDisplayProps {
  card: any;
  onEdit?: (card: any) => void;
}

export const CreditCardDisplay = ({ card, onEdit }: CreditCardDisplayProps) => {
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

  const { data: monthSpending } = useQuery({
    queryKey: ["card-spending", card.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_card_transactions")
        .select("amount")
        .eq("card_id", card.id)
        .gte("transaction_date", firstDay.toISOString())
        .lte("transaction_date", lastDay.toISOString());

      if (error) throw error;
      return data.reduce((sum, t) => sum + Number(t.amount), 0);
    },
  });

  const spendingPercent = card.spending_limit
    ? Math.min((monthSpending || 0) / Number(card.spending_limit) * 100, 100)
    : 0;

  const getBrandColor = () => {
    switch (card.card_brand?.toLowerCase()) {
      case "american express":
      case "amex":
        return "from-blue-600 to-blue-800";
      case "visa":
        return "from-blue-500 to-blue-700";
      case "mastercard":
        return "from-orange-500 to-red-600";
      case "discover":
        return "from-orange-400 to-orange-600";
      default:
        return "from-gray-600 to-gray-800";
    }
  };

  const handleViewTransactions = () => {
    // Navigate to transactions tab with this card filtered
    navigate(`/credit-cards?tab=transactions&card=${card.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(card);
    }
  };

  const handleToggleActive = async () => {
    try {
      const { error } = await supabase
        .from("company_cards")
        .update({ is_active: !card.is_active })
        .eq("id", card.id);

      if (error) throw error;

      toast({
        title: card.is_active ? "Card deactivated" : "Card activated",
        description: `${card.cardholder_name || "Card"} has been ${card.is_active ? "deactivated" : "activated"}`,
      });

      queryClient.invalidateQueries({ queryKey: ["company-cards"] });
      queryClient.invalidateQueries({ queryKey: ["credit-card-metrics"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setShowDeactivateDialog(false);
  };

  return (
    <>
      <Card 
        className={`bg-gradient-to-br ${getBrandColor()} text-white overflow-hidden cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl`}
        onClick={handleViewTransactions}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CreditCardIcon className="h-5 w-5" />
                <h3 className="font-semibold text-lg">{card.cardholder_name || "Company Card"}</h3>
              </div>
              <p className="text-sm opacity-90 font-medium">{card.card_brand}</p>
              {card.card_type && (
                <p className="text-xs opacity-70">{card.card_type}</p>
              )}
            </div>
            <Badge variant={card.is_active ? "default" : "secondary"} className="bg-white/20 text-white border-white/30">
              {card.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-mono tracking-widest">
              {card.first_four ? `${card.first_four} ` : ""}•••• {card.last_four}
            </div>
          </div>

          {card.employees_enhanced && (
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-white/20 text-white text-xs">
                  {card.employees_enhanced.full_name?.split(" ").map((n: string) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs opacity-70">Assigned to</p>
                <p className="text-sm font-medium truncate">{card.employees_enhanced.full_name}</p>
              </div>
            </div>
          )}

          {card.spending_limit && (
            <div className="space-y-2 bg-white/10 rounded-lg px-3 py-2">
              <div className="flex justify-between text-xs">
                <span>This Month</span>
                <span className="font-semibold">${(monthSpending || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <Progress value={spendingPercent} className="h-2 bg-white/20" />
              <div className="flex justify-between text-xs opacity-80">
                <span>Limit: ${Number(card.spending_limit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span>{spendingPercent.toFixed(0)}% used</span>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button 
              variant="secondary" 
              size="sm" 
              className="flex-1 bg-white/20 hover:bg-white/30 border-white/30"
              onClick={(e) => {
                e.stopPropagation();
                handleViewTransactions();
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              Transactions
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              className="bg-white/20 hover:bg-white/30 border-white/30"
              onClick={handleEdit}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              className="bg-white/20 hover:bg-white/30 border-white/30"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeactivateDialog(true);
              }}
            >
              <Power className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {card.is_active ? "Deactivate" : "Activate"} Card?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {card.is_active 
                ? "This will mark the card as inactive. You can reactivate it later."
                : "This will mark the card as active and allow transactions."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleActive}>
              {card.is_active ? "Deactivate" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
