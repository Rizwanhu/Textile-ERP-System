import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import { AppLayout } from "./components/layout/AppLayout";
import PlaceholderPage from "./pages/PlaceholderPage.tsx";
import OrdersPage from "./pages/orders/OrdersPage.tsx";
import OrderDetailPage from "./pages/orders/OrderDetailPage.tsx";
import ClientAccountPage from "./pages/orders/ClientAccountPage.tsx";
import { ClientAccountsProvider } from "./context/ClientAccountsContext.tsx";
import MaterialsPage from "./pages/materials/MaterialsPage.tsx";
import ExpensesPage from "./pages/expenses/ExpensesPage.tsx";
import InventoryPage from "./pages/inventory/InventoryPage.tsx";
import ReportsPage from "./pages/reports/ReportsPage.tsx";
import SettingsPage from "./pages/settings/SettingsPage.tsx";
import AuthPage from "./pages/auth/AuthPage.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { RequireAuth } from "./components/auth/RequireAuth.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
       <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<AuthPage initial="login" />} />
          <Route path="/signup" element={<AuthPage initial="signup" />} />
          <Route element={<RequireAuth><ClientAccountsProvider><AppLayout /></ClientAccountsProvider></RequireAuth>}>
            <Route path="/" element={<Index />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/clients/:clientId" element={<ClientAccountPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/materials" element={<MaterialsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/expenses" element={<Navigate to="/expenses/local-buyer" replace />} />
            <Route path="/expenses/local-buyer" element={<ExpensesPage />} />
            <Route path="/expenses/cutting" element={<ExpensesPage />} />
            <Route path="/expenses/stitching" element={<ExpensesPage />} />
            <Route path="/expenses/finishing" element={<ExpensesPage />} />
            <Route path="/expenses/fixed" element={<ExpensesPage />} />
            <Route path="/expenses/admin" element={<ExpensesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
       </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
