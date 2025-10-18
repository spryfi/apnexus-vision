import { Home, DollarSign, Truck, Users, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const primaryTabs = [
  { name: "Dashboard", path: "/dashboard", icon: Home },
  { name: "Financials", path: "/transactions", icon: DollarSign },
  { name: "Fleet", path: "/fleet", icon: Truck },
  { name: "People", path: "/staff", icon: Users },
];

const secondaryPages = [
  { name: "Admin Hub", path: "/admin-hub" },
  { name: "Reminders", path: "/reminders" },
  { name: "Reports", path: "/reports" },
  { name: "Settings", path: "/settings" },
  { name: "Accounts Payable", path: "/accounts-payable" },
  { name: "Accounts Receivable", path: "/accounts-receivable" },
  { name: "Credit Cards", path: "/credit-cards" },
  { name: "Checks", path: "/checks" },
  { name: "Categories", path: "/categories" },
  { name: "Vendors", path: "/vendors" },
];

export function MobileNavigation() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex items-center justify-around h-16">
        {primaryTabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{tab.name}</span>
            </Link>
          );
        })}
        
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <Menu className="h-5 w-5" />
              <span className="text-xs font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <div className="py-4">
              <h2 className="text-lg font-semibold mb-4">More Options</h2>
              <div className="space-y-2">
                {secondaryPages.map((page) => (
                  <Link key={page.path} to={page.path}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-base h-12"
                    >
                      {page.name}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
