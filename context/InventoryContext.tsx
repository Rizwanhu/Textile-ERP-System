"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { InventoryItem, StockMovement } from "@/data/inventory";
import { fetchInventoryHybrid } from "@/actions/inventory";

type InventoryContextValue = {
  items: InventoryItem[];
  history: StockMovement[];
  isLoading: boolean;
  source: "supabase" | "mock";
  refresh: () => Promise<void>;
};

const InventoryContext = createContext<InventoryContextValue | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [history, setHistory] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState<"supabase" | "mock">("mock");

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchInventoryHybrid();
      setItems(data.items);
      setHistory(data.history);
      setSource(data.source);
    } catch {
      const { INVENTORY, STOCK_HISTORY } = await import("@/data/inventory");
      setItems(INVENTORY);
      setHistory(STOCK_HISTORY);
      setSource("mock");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ items, history, isLoading, source, refresh }),
    [items, history, isLoading, source, refresh]
  );

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used inside <InventoryProvider>");
  return ctx;
}
