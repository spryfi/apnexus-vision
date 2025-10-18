import { useState, useEffect } from "react";
import { Plus, CreditCard, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AddCardDialog } from "@/components/credit-cards/AddCardDialog";
import { useNavigate } from "react-router-dom";

interface FuelCard {
  id: string;
  last_four: string;
  first_four: string;
  card_brand: string;
  card_type: string;
  cardholder_name: string;
  assigned_to: string | null;
  driver_number: string | null;
  is_active: boolean;
  spending_limit: number | null;
  allowed_fuel_types: string[] | null;
  last_used_date: string | null;
  monthly_spending: number;
  notes: string | null;
  created_at: string;
}

export default function FuelCards() {
  const [cards, setCards] = useState<FuelCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const { data, error } = await supabase
        .from("company_cards")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCards(data || []);
    } catch (error: any) {
      toast.error("Failed to load fuel cards: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getSpendingPercentage = (card: FuelCard) => {
    if (!card.spending_limit) return 0;
    return (card.monthly_spending / card.spending_limit) * 100;
  };

  const getSpendingStatus = (percentage: number) => {
    if (percentage >= 100) return { color: "destructive", label: "Limit Reached" };
    if (percentage >= 80) return { color: "warning", label: "Near Limit" };
    return { color: "default", label: "Normal" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading fuel cards...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fuel Card Management</h1>
          <p className="text-muted-foreground">Manage company fuel cards and track spending</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Card
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cards.filter(c => c.is_active).length}</div>
            <p className="text-xs text-muted-foreground">
              {cards.filter(c => !c.is_active).length} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${cards.reduce((sum, card) => sum + (card.monthly_spending || 0), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Across all active cards</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cards Near Limit</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cards.filter(c => getSpendingPercentage(c) >= 80).length}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Card Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const spendingPercent = getSpendingPercentage(card);
          const status = getSpendingStatus(spendingPercent);

          return (
            <Card key={card.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      •••• {card.last_four}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{card.card_brand}</p>
                  </div>
                  <Badge variant={card.is_active ? "default" : "secondary"}>
                    {card.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">{card.cardholder_name}</p>
                  <p className="text-xs text-muted-foreground">{card.card_type}</p>
                </div>

                {card.spending_limit && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Monthly Spending</span>
                      <Badge variant={status.color as any}>{status.label}</Badge>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>${card.monthly_spending?.toFixed(2) || "0.00"}</span>
                      <span className="text-muted-foreground">
                        / ${card.spending_limit.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          spendingPercent >= 100
                            ? "bg-destructive"
                            : spendingPercent >= 80
                            ? "bg-warning"
                            : "bg-primary"
                        }`}
                        style={{ width: `${Math.min(spendingPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {card.last_used_date && (
                  <div className="text-xs text-muted-foreground">
                    Last used: {new Date(card.last_used_date).toLocaleDateString()}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/fuel?card=${card.last_four}`)}
                  >
                    View Transactions
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {cards.length === 0 && (
        <Card className="p-12 text-center">
          <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Fuel Cards</h3>
          <p className="text-muted-foreground mb-4">
            Get started by adding your first fuel card
          </p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Card
          </Button>
        </Card>
      )}

      <AddCardDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={fetchCards}
      />
    </div>
  );
}
