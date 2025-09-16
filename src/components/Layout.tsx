import { ReactNode, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, Settings, Receipt, Users, LogOut, Fuel, DollarSign, UserCheck, Menu, Truck } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Loader2 } from "lucide-react";
import TaskStatusCards from "@/components/TaskStatusCards";

const navigation = [
  { name: "AP-Fortress", href: "/", icon: Shield },
  { name: "➕ New Expense", href: "/new-expense", icon: Receipt },
  { name: "Admin Hub", href: "/admin", icon: Settings },
  { name: "Legacy Transactions", href: "/transactions", icon: Receipt },
  { name: "Vendors & Categories", href: "/vendors", icon: Users },
  { name: "Fuel Tracking", href: "/fuel", icon: Fuel },
  { name: "Fleet", href: "/fleet", icon: Truck },
  { name: "Staff", href: "/staff", icon: UserCheck },
  { name: "Payroll", href: "/payroll", icon: DollarSign },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface LayoutProps {
  children: ReactNode;
}

function NavigationContent({ onNavigate }: { onNavigate?: () => void }) {
  const { signOut, userProfile } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleNavClick = () => {
    onNavigate?.();
  };

  return (
    <>
      <div className="flex items-center gap-2 p-4 border-b">
        <div className="font-bold text-primary text-lg">APNexus</div>
      </div>
      
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">NAVIGATION</h3>
          <div className="space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>
        </div>

        <div className="p-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">TASK STATUS</h3>
          <TaskStatusCards />
        </div>
      </div>
      
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {userProfile?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userProfile?.full_name || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{userProfile?.role || 'User'}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </>
  );
}

function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <NavigationContent />
      </SidebarContent>
    </Sidebar>
  );
}

function MobileNavigation() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <NavigationContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

export default function Layout({ children }: LayoutProps) {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Mobile-first PWA layout
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-4">
            <MobileNavigation />
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold">APNexus</h1>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="w-full px-4 py-6">
            {children}
          </div>
        </main>
      </div>
    );
  }

  // Desktop layout
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border flex items-center px-6">
            <SidebarTrigger />
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}