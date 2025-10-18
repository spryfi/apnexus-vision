import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation, NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import ViolationBanner from "./ViolationBanner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  LayoutDashboard, 
  DollarSign, 
  Truck, 
  Users, 
  Settings as SettingsIcon,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  Building2,
  Loader2
} from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import TaskStatusCards from "@/components/TaskStatusCards";
import { MobileNavigation } from "@/components/MobileNavigation";
import { MobileHeader } from "@/components/MobileHeader";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

interface LayoutProps {
  children: ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
}

interface NavigationGroup {
  name: string;
  icon: any;
  items: NavigationItem[];
}

const navigationGroups: (NavigationItem | NavigationGroup)[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  {
    name: "Financials",
    icon: DollarSign,
    items: [
      { name: "Accounts Payable", href: "/accounts-payable", icon: DollarSign },
      { name: "Credit Cards", href: "/credit-cards", icon: DollarSign },
      { name: "Checks", href: "/checks", icon: DollarSign },
      { name: "All Transactions", href: "/transactions", icon: DollarSign },
    ],
  },
  {
    name: "Fleet",
    icon: Truck,
    items: [
      { name: "Vehicles", href: "/fleet", icon: Truck },
      { name: "Maintenance", href: "/fleet/maintenance", icon: Truck },
      { name: "Fuel Management", href: "/fuel", icon: Truck },
      { name: "Analytics & Reports", href: "/fleet/analytics", icon: Truck },
      { name: "Documents", href: "/fleet/documents", icon: Truck },
    ],
  },
  {
    name: "People",
    icon: Users,
    items: [
      { name: "Employees", href: "/staff", icon: Users },
      { name: "Payroll", href: "/payroll", icon: Users },
      { name: "Devices", href: "/devices", icon: Users },
    ],
  },
  {
    name: "Admin",
    icon: SettingsIcon,
    items: [
      { name: "Approval Queue", href: "/admin/approvals", icon: SettingsIcon },
      { name: "AI Review", href: "/admin/ai-review", icon: SettingsIcon },
      { name: "Reminders", href: "/reminders", icon: SettingsIcon },
      { name: "Vendors", href: "/vendors", icon: SettingsIcon },
      { name: "Categories", href: "/categories", icon: SettingsIcon },
      { name: "Reports", href: "/reports", icon: SettingsIcon },
    ],
  },
];

const isGroup = (item: any): item is NavigationGroup => {
  return 'items' in item;
};

const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => {
  const { signOut, userProfile } = useAuth();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  useEffect(() => {
    // Auto-expand group containing active route
    navigationGroups.forEach((item) => {
      if (isGroup(item)) {
        const hasActive = item.items.some(child => 
          location.pathname === child.href || location.pathname.startsWith(child.href + '/')
        );
        if (hasActive) {
          setOpenGroups(prev => ({ ...prev, [item.name]: true }));
        }
      }
    });
  }, [location.pathname]);

  const toggleGroup = (name: string) => {
    setOpenGroups(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-900">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">APNexus</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {navigationGroups.map((item) => {
          if (isGroup(item)) {
            const isOpen = openGroups[item.name];
            const hasActive = item.items.some(child => 
              location.pathname === child.href || location.pathname.startsWith(child.href + '/')
            );
            return (
              <Collapsible key={item.name} open={isOpen} onOpenChange={() => toggleGroup(item.name)}>
                <CollapsibleTrigger asChild>
                  <button className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-slate-200 dark:hover:bg-slate-800 ${
                    hasActive ? 'text-primary' : 'text-slate-700 dark:text-slate-200'
                  }`}>
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.name}</span>
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </>
                    )}
                  </button>
                </CollapsibleTrigger>
                {!collapsed && (
                  <CollapsibleContent className="ml-8 space-y-1 pt-1">
                    {item.items.map((child) => (
                      <NavLink
                        key={child.href}
                        to={child.href}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          `block rounded-lg px-3 py-2 text-sm transition-all ${
                            isActive
                              ? "border-l-4 border-primary bg-primary/10 font-medium text-primary"
                              : "text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
                          }`
                        }
                      >
                        {child.name}
                      </NavLink>
                    ))}
                  </CollapsibleContent>
                )}
              </Collapsible>
            );
          } else {
            return (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? "border-l-4 border-primary bg-primary/10 text-primary"
                      : "text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            );
          }
        })}
      </nav>

      {/* Task Status (if not collapsed) */}
      {!collapsed && (
        <div className="border-t p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">TASK STATUS</h3>
          <TaskStatusCards />
        </div>
      )}

      {/* User Profile */}
      {!collapsed && (
        <div className="border-t p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {userProfile?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{userProfile?.full_name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{userProfile?.role || 'User'}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      )}
    </div>
  );
};

const MobileLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  
  // Get page title based on route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/" || path === "/dashboard") return "Dashboard";
    if (path.includes("/transactions")) return "Transactions";
    if (path.includes("/fleet")) return "Fleet";
    if (path.includes("/staff")) return "People";
    if (path.includes("/reports")) return "Reports";
    if (path.includes("/settings")) return "Settings";
    return "APNexus";
  };

  return (
    <div className="flex min-h-screen flex-col pb-16">
      <MobileHeader title={getPageTitle()} />
      <main className="flex-1 overflow-y-auto p-4">
        <OfflineIndicator />
        <ViolationBanner />
        {children}
      </main>
      <MobileNavigation />
      <PWAInstallPrompt />
    </div>
  );
};

export default function Layout({ children }: LayoutProps) {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  return (
    <div className="flex min-h-screen w-full">
      <aside className="w-64 border-r transition-all duration-300">
        <SidebarContent />
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">
          <OfflineIndicator />
          <Breadcrumb />
          <ViolationBanner />
          {children}
          <PWAInstallPrompt />
        </div>
      </main>
    </div>
  );
}
