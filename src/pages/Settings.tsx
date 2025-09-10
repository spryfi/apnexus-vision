import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, CreditCard, CheckSquare, Users, Building, Tag } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import CardManagement from "@/components/CardManagement";
import TaskDashboard from "@/components/TaskDashboard";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className={`font-bold tracking-tight flex items-center justify-center gap-2 ${isMobile ? 'text-xl' : 'text-3xl'}`}>
          <SettingsIcon className={isMobile ? "h-5 w-5" : "h-8 w-8"} />
          Settings & Reference Data
        </h1>
        <p className={`text-muted-foreground ${isMobile ? 'text-sm px-2' : ''}`}>
          Manage company cards, tasks, vendors, staff, and expense categories
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="cards" className="space-y-6">
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2 h-auto gap-1' : 'grid-cols-5'}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="cards" className={`flex items-center gap-2 ${isMobile ? 'text-xs py-3 px-2' : ''}`}>
                <CreditCard className="h-4 w-4" />
                {isMobile ? 'Cards' : 'Company Cards'}
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Manage credit cards, debit cards, and fuel cards</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="tasks" className={`flex items-center gap-2 ${isMobile ? 'text-xs py-3 px-2' : ''}`}>
                <CheckSquare className="h-4 w-4" />
                {isMobile ? 'Tasks' : 'Task Dashboard'}
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>View weekly and monthly recurring tasks</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="vendors" className={`flex items-center gap-2 ${isMobile ? 'text-xs py-3 px-2' : ''}`}>
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
              <TabsTrigger value="staff" className={`flex items-center gap-2 ${isMobile ? 'text-xs py-3 px-2' : ''}`}>
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
              <TabsTrigger value="categories" className={`flex items-center gap-2 ${isMobile ? 'text-xs py-3 px-2' : ''}`}>
                <Tag className="h-4 w-4" />
                {isMobile ? 'Categories' : 'Categories'}
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Manage expense categories and classifications</p>
            </TooltipContent>
          </Tooltip>
        </TabsList>

        {/* Company Cards Tab */}
        <TabsContent value="cards">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Company Cards Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardManagement />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Task Dashboard Tab */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Task Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaskDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendors Tab */}
        <TabsContent value="vendors">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Vendor Management
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">Vendor management coming soon</p>
                <p className="text-sm text-muted-foreground">
                  This will allow you to manage vendor contacts, payment terms, and preferences
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Staff Management
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">Staff management coming soon</p>
                <p className="text-sm text-muted-foreground">
                  This will allow you to manage employee information, roles, and permissions
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Expense Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">Category management coming soon</p>
                <p className="text-sm text-muted-foreground">
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