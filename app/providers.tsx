"use client";

import { AuthProvider } from "@/context/AuthContext";
import { ClientAccountsProvider } from "@/context/ClientAccountsContext";
import { LocalSuppliersProvider } from "@/context/LocalSuppliersContext";
import { OrdersProvider } from "@/context/OrdersContext";
import { MaterialsProvider } from "@/context/MaterialsContext";
import { InventoryProvider } from "@/context/InventoryContext";
import { Toaster } from "@/components/ui/toaster";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <OrdersProvider>
        <MaterialsProvider>
          <InventoryProvider>
            <ClientAccountsProvider>
              <LocalSuppliersProvider>
                {children}
                <Toaster />
              </LocalSuppliersProvider>
            </ClientAccountsProvider>
          </InventoryProvider>
        </MaterialsProvider>
      </OrdersProvider>
    </AuthProvider>
  );
}