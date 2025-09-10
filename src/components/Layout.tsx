import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, Settings, Receipt, Users, LogOut, Fuel, DollarSign, UserCheck } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Loader2 } from "lucide-react";
import TaskStatusCards from "@/components/TaskStatusCards";

const navigation = [
  { name: "AP-Fortress", href: "/", icon: Shield },
  { name: "Admin Hub", href: "/admin", icon: Settings },
  { name: "Legacy Transactions", href: "/transactions", icon: Receipt },
  { name: "Vendors & Categories", href: "/vendors", icon: Users },
  { name: "Fuel Tracking", href: "/fuel", icon: Fuel },
  { name: "Staff", href: "/staff", icon: UserCheck },
  { name: "Payroll", href: "/payroll", icon: DollarSign },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface LayoutProps {
  children: ReactNode;
}

function AppSidebar() {
  const { signOut, userProfile } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="flex items-center gap-2">
              <div className="font-bold text-primary">AP-Fortress</div>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Task Status</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2">
              <TaskStatusCards />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <div className="mt-auto p-4 border-t border-sidebar-border">
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
      </SidebarContent>
    </Sidebar>
  );
}

export default function Layout({ children }: LayoutProps) {
  const { user, loading } = useAuth();

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