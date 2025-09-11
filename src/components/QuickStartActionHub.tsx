import { Card, CardContent } from "@/components/ui/card";
import { Plus, DollarSign, CreditCard, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickStartActionHubProps {
  onEnterExpense: () => void;
}

export default function QuickStartActionHub({ onEnterExpense }: QuickStartActionHubProps) {
  const navigate = useNavigate();

  const actionCards = [
    {
      id: "enter-expense",
      icon: Plus,
      title: "Enter a New Expense",
      description: "Scan and upload a new invoice or receipt to start the payment process.",
      onClick: onEnterExpense,
      gradient: "from-blue-500 to-blue-600"
    },
    {
      id: "pay-invoice",
      icon: DollarSign,
      title: "Pay an Approved Invoice",
      description: "Select from a list of approved bills to log a payment and close out the transaction.",
      onClick: () => navigate("/transactions?status=Approved for Payment"),
      gradient: "from-green-500 to-green-600"
    },
    {
      id: "reconcile-statement",
      icon: CreditCard,
      title: "Reconcile a Statement",
      description: "Log individual credit card or fleet fuel card charges and match them to your monthly statement.",
      onClick: () => navigate("/transactions?status=Paid"),
      gradient: "from-purple-500 to-purple-600"
    },
    {
      id: "search-transactions",
      icon: Search,
      title: "Search All Transactions",
      description: "Find any past invoice, payment, or expense record in the entire system.",
      onClick: () => navigate("/transactions?focus=search"),
      gradient: "from-orange-500 to-orange-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight mb-2">What would you like to do?</h2>
        <p className="text-muted-foreground">Choose an action to get started with your most common tasks</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {actionCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <Card 
              key={card.id}
              className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-0 bg-gradient-to-br from-card to-card/50"
              onClick={card.onClick}
            >
              <CardContent className="p-6 text-center space-y-4">
                <div className={`mx-auto w-16 h-16 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <IconComponent className="h-8 w-8 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg group-hover:text-primary transition-colors duration-200">
                    {card.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}