"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { MaterialOrderSummary } from "@/data/materials";
import { fetchMaterialOrdersHybrid } from "@/actions/materials";

type MaterialsContextValue = {
  orders: MaterialOrderSummary[];
  isLoading: boolean;
  source: "supabase" | "mock";
  refresh: () => Promise<void>;
};

const MaterialsContext = createContext<MaterialsContextValue | null>(null);

export function MaterialsProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<MaterialOrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState<"supabase" | "mock">("mock");

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchMaterialOrdersHybrid();
      const fromDb = await import("@/actions/materials").then((m) => m.fetchMaterialOrdersFromDb());
      setOrders(data);
      setSource(fromDb && fromDb.length > 0 ? "supabase" : "mock");
    } catch {
      const { MATERIAL_ORDERS } = await import("@/data/materials");
      setOrders(MATERIAL_ORDERS);
      setSource("mock");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ orders, isLoading, source, refresh }),
    [orders, isLoading, source, refresh]
  );

  return <MaterialsContext.Provider value={value}>{children}</MaterialsContext.Provider>;
}

export function useMaterials() {
  const ctx = useContext(MaterialsContext);
  if (!ctx) throw new Error("useMaterials must be used inside <MaterialsProvider>");
  return ctx;
}
