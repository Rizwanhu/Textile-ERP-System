"use client";

import { useEffect, useState } from "react";
import { Wallet, ClipboardList, Factory, AlertTriangle, Loader2 } from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { WorkflowFlow } from "@/components/dashboard/WorkflowFlow";
import { RecentOrdersTable } from "@/components/dashboard/RecentOrdersTable";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { InventoryStatus } from "@/components/dashboard/InventoryStatus";
import { fetchDashboardStats, type DashboardStats } from "@/actions/dashboard";
import { useOrders } from "@/context/OrdersContext";

export function DashboardPage() {
  const { source: ordersSource } = useOrders();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchDashboardStats().then((s) => {
      setStats(s);
      setLoading(false);
    });
  }, [ordersSource]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const revenueLabel = stats?.totalRevenueLabel ?? "Rs 0";
  const active = stats?.activeOrders ?? 0;
  const production = stats?.inProduction ?? 0;
  const alerts = stats?.criticalAlerts ?? 0;
  const alertSub = stats
    ? `${stats.lowStockCount} low stock · ${stats.overdueCount} overdue`
    : "—";

  return (
    <div className="mx-auto animate-fade-in p-4 lg:p-6" style={{ maxWidth: 1440 }}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live overview from your workspace · orders &amp; inventory
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          {ordersSource === "supabase" ? "Connected to database" : "Using demo data"}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Revenue" value={revenueLabel} delta={12} icon={Wallet} tone="success" sub="all orders" />
        <KpiCard label="Active Orders" value={String(active)} delta={8} icon={ClipboardList} tone="primary" sub="open pipeline" />
        <KpiCard label="In Production" value={String(production)} delta={-3} icon={Factory} tone="warning" sub="on floor now" />
        <KpiCard label="Critical Alerts" value={String(alerts)} icon={AlertTriangle} tone="violet" sub={alertSub} />
      </div>

      <div className="mt-6">
        <WorkflowFlow />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={stats?.revenueChart} />
        </div>
        <InventoryStatus items={stats?.topInventory} />
      </div>

      <div className="mt-6">
        <RecentOrdersTable />
      </div>
    </div>
  );
}
