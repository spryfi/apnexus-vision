import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { UpdatePrompt } from "@/components/UpdatePrompt";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import APFortress from "@/pages/APFortress";
import AdminHub from "@/pages/AdminHub";
import NewExpense from "@/pages/NewExpense";
import AddMaintenanceRecord from "@/pages/AddMaintenanceRecord";
import Transactions from "@/pages/Transactions";
import Vendors from "@/pages/Vendors";
import VendorDetail from "@/pages/VendorDetail";
import Fuel from "@/pages/Fuel";
import StaffEnhanced from "@/pages/StaffEnhanced";
import EmployeeDetail from "@/pages/EmployeeDetail";
import InvoiceEntry from "@/pages/InvoiceEntry";
import Payroll from "@/pages/Payroll";
import Settings from "@/pages/Settings";
import Fleet from "@/pages/Fleet";
import VehicleDetail from "@/pages/VehicleDetail";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import AccountsPayable from "@/pages/AccountsPayable";
import AccountsReceivable from "@/pages/AccountsReceivable";
import CreditCards from "@/pages/CreditCards";
import Checks from "@/pages/Checks";
import FleetMaintenance from "@/pages/FleetMaintenance";
import FleetDocuments from "@/pages/FleetDocuments";
import Devices from "@/pages/Devices";
import AdminApprovals from "@/pages/AdminApprovals";
import AdminAIReview from "@/pages/AdminAIReview";
import Reminders from "@/pages/Reminders";
import Categories from "@/pages/Categories";
import Reports from "@/pages/Reports";

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
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <UpdatePrompt />
          <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Layout><APFortress /></Layout>} />
            
            {/* Financials */}
            <Route path="/accounts-payable" element={<Layout><AccountsPayable /></Layout>} />
            <Route path="/accounts-receivable" element={<Layout><AccountsReceivable /></Layout>} />
            <Route path="/credit-cards" element={<Layout><CreditCards /></Layout>} />
            <Route path="/checks" element={<Layout><Checks /></Layout>} />
            <Route path="/transactions" element={<Layout><Transactions /></Layout>} />
            
            {/* Fleet */}
            <Route path="/fleet" element={<Layout><Fleet /></Layout>} />
            <Route path="/fleet/:id" element={<Layout><VehicleDetail /></Layout>} />
            <Route path="/fleet/:vehicleId/add-maintenance" element={<Layout><AddMaintenanceRecord /></Layout>} />
            <Route path="/fleet/maintenance" element={<Layout><FleetMaintenance /></Layout>} />
            <Route path="/fleet/documents" element={<Layout><FleetDocuments /></Layout>} />
            <Route path="/fuel" element={<Layout><Fuel /></Layout>} />
            
            {/* People */}
            <Route path="/staff" element={<Layout><StaffEnhanced /></Layout>} />
            <Route path="/staff/:id" element={<Layout><EmployeeDetail /></Layout>} />
            <Route path="/payroll" element={<Layout><Payroll /></Layout>} />
            <Route path="/devices" element={<Layout><Devices /></Layout>} />
            
            {/* Admin */}
            <Route path="/admin/approvals" element={<Layout><AdminApprovals /></Layout>} />
            <Route path="/admin/ai-review" element={<Layout><AdminAIReview /></Layout>} />
            <Route path="/reminders" element={<Layout><Reminders /></Layout>} />
            <Route path="/vendors" element={<Layout><Vendors /></Layout>} />
            <Route path="/vendors/:id" element={<Layout><VendorDetail /></Layout>} />
            <Route path="/categories" element={<Layout><Categories /></Layout>} />
            <Route path="/reports" element={<Layout><Reports /></Layout>} />
            
            {/* Legacy/Other routes */}
            <Route path="/admin" element={<Layout><AdminHub /></Layout>} />
            <Route path="/new-expense" element={<Layout><NewExpense /></Layout>} />
            <Route path="/invoice-entry" element={<Layout><InvoiceEntry /></Layout>} />
            <Route path="/settings" element={<Layout><Settings /></Layout>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
