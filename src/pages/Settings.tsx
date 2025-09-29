import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, CreditCard, CheckSquare, Users, Building, Tag, Wallet } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import CardManagement from "@/components/CardManagement";
import TaskDashboard from "@/components/TaskDashboard";
import { PaymentMethodsManager } from "@/components/PaymentMethodsManager";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access settings",
        variant: "destructive",
      });
    }
  }, [user, loading, toast]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-48 mb-4"></div>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <SettingsIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
        <p className="text-muted-foreground">Please log in to access settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className={`flex items-center justify-center gap-2 ${isMobile ? 'flex-col' : ''}`}>
          <SettingsIcon className={isMobile ? "h-6 w-6" : "h-8 w-8"} />
          <h1 className={`font-bold tracking-tight ${isMobile ? 'text-lg' : 'text-3xl'}`}>
            Settings & Reference Data
          </h1>
        </div>
        <p className={`text-muted-foreground ${isMobile ? 'text-xs px-4' : ''}`}>
          Manage company cards, tasks, vendors, staff, and expense categories
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="payments" className="space-y-4">
        {isMobile ? (
          /* Mobile: Scrollable horizontal tabs */
          <div className="overflow-x-auto">
            <TabsList className="inline-flex h-auto min-w-max gap-1 p-1 bg-muted">
              <TabsTrigger value="payments" className="whitespace-nowrap text-xs px-3 py-2">
                <Wallet className="h-3 w-3 mr-1" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="cards" className="whitespace-nowrap text-xs px-3 py-2">
                <CreditCard className="h-3 w-3 mr-1" />
                Cards
              </TabsTrigger>
              <TabsTrigger value="tasks" className="whitespace-nowrap text-xs px-3 py-2">
                <CheckSquare className="h-3 w-3 mr-1" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="vendors" className="whitespace-nowrap text-xs px-3 py-2">
                <Building className="h-3 w-3 mr-1" />
                Vendors
              </TabsTrigger>
              <TabsTrigger value="staff" className="whitespace-nowrap text-xs px-3 py-2">
                <Users className="h-3 w-3 mr-1" />
                Staff
              </TabsTrigger>
              <TabsTrigger value="categories" className="whitespace-nowrap text-xs px-3 py-2">
                <Tag className="h-3 w-3 mr-1" />
                Categories
              </TabsTrigger>
            </TabsList>
          </div>
        ) : (
          /* Desktop: Grid layout */
          <TabsList className="grid w-full grid-cols-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="payments" className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Payment Methods
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Manage all payment methods: cards, bank accounts, cash, etc.</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="cards" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Company Cards (Legacy)
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Legacy company cards management</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="tasks" className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Task Dashboard
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>View weekly and monthly recurring tasks</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="vendors" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Vendors
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Manage vendor information and contact details</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="staff" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Staff
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Manage employee information and roles</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="categories" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Categories
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Manage expense categories and classifications</p>
              </TooltipContent>
            </Tooltip>
          </TabsList>
        )}

        {/* Payment Methods Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader className={isMobile ? "pb-3" : ""}>
              <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                <Wallet className="h-5 w-5" />
                Payment Methods Management
              </CardTitle>
            </CardHeader>
            <CardContent className={isMobile ? "p-3" : ""}>
              <PaymentMethodsManager />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Cards Tab */}
        <TabsContent value="cards">
          <Card>
            <CardHeader className={isMobile ? "pb-3" : ""}>
              <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                <CreditCard className="h-5 w-5" />
                Company Cards Management (Legacy)
              </CardTitle>
            </CardHeader>
            <CardContent className={isMobile ? "p-3" : ""}>
              <CardManagement />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Task Dashboard Tab */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader className={isMobile ? "pb-3" : ""}>
              <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                <CheckSquare className="h-5 w-5" />
                Task Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className={isMobile ? "p-3" : ""}>
              <TaskDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendors Tab */}
        <TabsContent value="vendors">
          <Card>
            <CardHeader className={isMobile ? "pb-3" : ""}>
              <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                <Building className="h-5 w-5" />
                Vendor Management
              </CardTitle>
            </CardHeader>
            <CardContent className={isMobile ? "p-3 py-6" : "p-6"}>
              <div className="text-center py-4">
                <Building className={`text-muted-foreground mx-auto mb-4 ${isMobile ? 'h-8 w-8' : 'h-12 w-12'}`} />
                <p className={`text-muted-foreground mb-2 ${isMobile ? 'text-sm' : ''}`}>Vendor management coming soon</p>
                <p className={`text-muted-foreground ${isMobile ? 'text-xs px-2' : 'text-sm'}`}>
                  This will allow you to manage vendor contacts, payment terms, and preferences
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff">
          <Card>
            <CardHeader className={isMobile ? "pb-3" : ""}>
              <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                <Users className="h-5 w-5" />
                Staff Management
              </CardTitle>
            </CardHeader>
            <CardContent className={isMobile ? "p-3 py-6" : "p-6"}>
              <div className="text-center py-4">
                <Users className={`text-muted-foreground mx-auto mb-4 ${isMobile ? 'h-8 w-8' : 'h-12 w-12'}`} />
                <p className={`text-muted-foreground mb-2 ${isMobile ? 'text-sm' : ''}`}>Staff management coming soon</p>
                <p className={`text-muted-foreground ${isMobile ? 'text-xs px-2' : 'text-sm'}`}>
                  This will allow you to manage employee information, roles, and permissions
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader className={isMobile ? "pb-3" : ""}>
              <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                <Tag className="h-5 w-5" />
                Expense Categories
              </CardTitle>
            </CardHeader>
            <CardContent className={isMobile ? "p-3 py-6" : "p-6"}>
              <div className="text-center py-4">
                <Tag className={`text-muted-foreground mx-auto mb-4 ${isMobile ? 'h-8 w-8' : 'h-12 w-12'}`} />
                <p className={`text-muted-foreground mb-2 ${isMobile ? 'text-sm' : ''}`}>Category management coming soon</p>
                <p className={`text-muted-foreground ${isMobile ? 'text-xs px-2' : 'text-sm'}`}>
                  This will allow you to manage expense categories and budget classifications
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}