import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Eye, Edit, Power } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface CreditCardDisplayProps {
  card: any;
}

export const CreditCardDisplay = ({ card }: CreditCardDisplayProps) => {
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

  return (
    <Card className={`bg-gradient-to-br ${getBrandColor()} text-white overflow-hidden`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="font-semibold">{card.cardholder_name || "Company Card"}</h3>
            <p className="text-xs opacity-80">{card.card_brand}</p>
          </div>
          <Badge variant={card.is_active ? "default" : "secondary"} className="bg-white/20">
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
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-white/20 text-white text-xs">
                {card.employees_enhanced.full_name?.split(" ").map((n: string) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{card.employees_enhanced.full_name}</span>
          </div>
        )}

        {card.spending_limit && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>This Month: ${(monthSpending || 0).toFixed(2)}</span>
              <span>Limit: ${Number(card.spending_limit).toFixed(2)}</span>
            </div>
            <Progress value={spendingPercent} className="h-2 bg-white/20" />
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" size="sm" className="flex-1 bg-white/20 hover:bg-white/30">
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30">
            <Power className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
