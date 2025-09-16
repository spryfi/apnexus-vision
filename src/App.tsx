import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import APFortress from "@/pages/APFortress";
import AdminHub from "@/pages/AdminHub";
import NewExpense from "@/pages/NewExpense";
import AddMaintenanceRecord from "@/pages/AddMaintenanceRecord";
import Transactions from "@/pages/Transactions";
import Vendors from "@/pages/Vendors";
import VendorDetail from "@/pages/VendorDetail";
import Fuel from "@/pages/Fuel";
import Staff from "@/pages/Staff";
import Payroll from "@/pages/Payroll";
import Settings from "@/pages/Settings";
import Fleet from "@/pages/Fleet";
import VehicleDetail from "@/pages/VehicleDetail";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

console.log("QueryClient created:", queryClient);
console.log("React:", React);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Layout><APFortress /></Layout>} />
            <Route path="/admin" element={<Layout><AdminHub /></Layout>} />
            <Route path="/new-expense" element={<Layout><NewExpense /></Layout>} />
            <Route path="/transactions" element={<Layout><Transactions /></Layout>} />
            <Route path="/vendors" element={<Layout><Vendors /></Layout>} />
            <Route path="/vendors/:id" element={<Layout><VendorDetail /></Layout>} />
            <Route path="/fuel" element={<Layout><Fuel /></Layout>} />
            <Route path="/staff" element={<Layout><Staff /></Layout>} />
            <Route path="/payroll" element={<Layout><Payroll /></Layout>} />
            <Route path="/fleet" element={<Layout><Fleet /></Layout>} />
            <Route path="/fleet/:id" element={<Layout><VehicleDetail /></Layout>} />
            <Route path="/fleet/:vehicleId/add-maintenance" element={<Layout><AddMaintenanceRecord /></Layout>} />
            <Route path="/settings" element={<Layout><Settings /></Layout>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
