import { Wallet, ClipboardList, Factory, AlertTriangle } from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { WorkflowFlow } from "@/components/dashboard/WorkflowFlow";
import { RecentOrdersTable } from "@/components/dashboard/RecentOrdersTable";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { InventoryStatus } from "@/components/dashboard/InventoryStatus";

const Index = () => {
  return (
    <div className="mx-auto max-w-[1440px] animate-fade-in p-4 lg:p-6">
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of orders, production, and finances · April 2026
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          All systems operational
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Total Revenue"   value="Rs 23.6M" delta={12} icon={Wallet}         tone="success" sub="vs last month" />
        <KpiCard label="Active Orders"   value="24"      delta={8}  icon={ClipboardList}  tone="primary" sub="6 due this week" />
        <KpiCard label="In Production"   value="18"      delta={-3} icon={Factory}        tone="warning" sub="across 3 floors" />
        <KpiCard label="Critical Alerts" value="4"       icon={AlertTriangle}             tone="violet"  sub="2 low stock · 2 overdue" />
      </div>

      {/* Workflow */}
      <div className="mt-6">
        <WorkflowFlow />
      </div>

      {/* Charts row */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <InventoryStatus />
      </div>

      {/* Recent orders */}
      <div className="mt-6">
        <RecentOrdersTable />
      </div>
    </div>
  );
};

export default Index;
