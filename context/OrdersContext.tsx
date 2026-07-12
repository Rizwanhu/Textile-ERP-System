"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Order, OrderDetail } from "@/data/orders";
import { ORDERS as MOCK_ORDERS } from "@/data/orders";
import {
  fetchOrdersFromDb,
  fetchOrderDetailFromDb,
  getOrderDetailHybrid,
} from "@/actions/orders";

type OrdersContextValue = {
  orders: Order[];
  isLoading: boolean;
  source: "supabase" | "mock";
  refresh: () => Promise<void>;
  getDetail: (orderId: string) => Promise<OrderDetail | undefined>;
};

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState<"supabase" | "mock">("mock");

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const dbOrders = await fetchOrdersFromDb();
      if (dbOrders === null) {
        setOrders(MOCK_ORDERS);
        setSource("mock");
      } else {
        setOrders(dbOrders.length ? dbOrders : []);
        setSource("supabase");
      }
    } catch {
      setOrders(MOCK_ORDERS);
      setSource("mock");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDetail = useCallback(async (orderId: string) => {
    const fromDb = await fetchOrderDetailFromDb(orderId);
    if (fromDb) return fromDb;
    return getOrderDetailHybrid(orderId);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ orders, isLoading, source, refresh, getDetail }),
    [orders, isLoading, source, refresh, getDetail]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used inside <OrdersProvider>");
  return ctx;
}
