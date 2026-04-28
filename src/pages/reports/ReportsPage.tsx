import { useMemo } from "react";
import {
  BarChart3, Download, TrendingUp, ClipboardList, Package, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { formatPKR, formatPKRCompact } from "@/lib/currency";
import { ORDERS } from "@/data/orders";
import { getExpenseTotals, LOCAL_BUYER, sumLocalBuyer } from "@/data/expenses";
import { INVENTORY, inventoryValue } from "@/data/inventory";
import { generateReportsPdf } from "@/lib/reportsPdf";

const SERIES = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--chart-6))",
];

const tooltipStyle = {
  background: "hsl(var(--surface-3))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8, fontSize: 12,
};

export default function ReportsPage() {
  /* ----- Orders by status ----- */
  const ordersByStatus = useMemo(() => {
    const m: Record<string, { status: string; count: number; value: number }> = {};
    ORDERS.forEach((o) => {
      m[o.status] = m[o.status] ?? { status: o.status.replace("-", " "), count: 0, value: 0 };
      m[o.status].count += 1;
      m[o.status].value += o.value;
    });
    return Object.values(m);
  }, []);

  /* ----- Monthly orders revenue (mock) ----- */
  const monthlyRevenue = [
    { m: "Nov", revenue: 11_760_000, orders: 14 },
    { m: "Dec", revenue: 14_280_000, orders: 17 },
    { m: "Jan", revenue: 13_160_000, orders: 16 },
    { m: "Feb", revenue: 17_360_000, orders: 21 },
    { m: "Mar", revenue: 19_880_000, orders: 24 },
    { m: "Apr", revenue: 23_520_000, orders: 24 },
  ];

  /* ----- Expense pie ----- */
  const totals = useMemo(getExpenseTotals, []);
  const expensePie = [
    { name: "Local Buyer", value: totals.buyer },
    { name: "Cutting",     value: totals.cutting },
    { name: "Stitching",   value: totals.stitching },
    { name: "Finishing",   value: totals.finishing },
    { name: "Fixed",       value: totals.fixed },
    { name: "Admin",       value: totals.admin },
  ];

  /* ----- Materials by category ----- */
  const matByCategory = useMemo(() => {
    const m: Record<string, number> = {};
    INVENTORY.forEach((i) => { m[i.category] = (m[i.category] ?? 0) + i.inStock * i.unitCost; });
    return Object.entries(m).map(([k, v]) => ({ category: k, value: v }));
  }, []);

  return (
    <div className="mx-auto max-w-[1440px] animate-fade-in space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Operational charts across orders, expenses, materials &amp; inventory · all amounts in PKR.
          </p>
        </div>
        <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary-hover" onClick={generateReportsPdf}>
          <Download className="h-4 w-4" /> Export PDF
        </Button>
      </div>

      {/* Quick KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="Total revenue (6m)"  value={formatPKRCompact(monthlyRevenue.reduce((s, m) => s + m.revenue, 0))} icon={TrendingUp} tone="primary" />
        <Tile label="Active orders"       value={ORDERS.filter((o) => !["completed", "dispatched"].includes(o.status)).length.toString()} icon={ClipboardList} tone="info" />
        <Tile label="Total expenses"      value={formatPKR(totals.grand)} icon={Wallet} tone="warning" />
        <Tile label="Inventory value"     value={formatPKR(inventoryValue(INVENTORY))} icon={Package} tone="success" />
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
        </TabsList>

        {/* Orders */}
        <TabsContent value="orders" className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="Monthly revenue" subtitle="Last 6 months · PKR" className="lg:col-span-2">
            <ResponsiveContainer>
              <LineChart data={monthlyRevenue}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="m" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `Rs ${(v / 1_000_000).toFixed(0)}M`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatPKR(v)} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Orders by status" subtitle={`${ORDERS.length} total orders`}>
            <ResponsiveContainer>
              <BarChart data={ordersByStatus} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="status" type="category" width={90} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {ordersByStatus.map((_, i) => <Cell key={i} fill={SERIES[i % SERIES.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </TabsContent>

        {/* Expenses */}
        <TabsContent value="expenses" className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="Expenses by category" subtitle={`Total ${formatPKR(totals.grand)}`}>
            <ResponsiveContainer>
              <PieChart>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatPKR(v)} />
                <Pie data={expensePie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {expensePie.map((_, i) => <Cell key={i} fill={SERIES[i % SERIES.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Top suppliers" subtitle="Local buyer purchases" className="lg:col-span-2">
            <ResponsiveContainer>
              <BarChart data={LOCAL_BUYER.map((b) => ({ supplier: b.supplier, total: b.qty * b.rate }))} margin={{ bottom: 28 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="supplier" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} angle={-12} textAnchor="end" height={50} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1_000).toFixed(0)}K`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatPKR(v)} />
                <Bar dataKey="total" fill="hsl(var(--info))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="px-5 pb-4 text-xs text-muted-foreground">
              Procurement total: <span className="text-foreground font-semibold">{formatPKR(sumLocalBuyer(LOCAL_BUYER))}</span>
            </div>
          </ChartCard>
        </TabsContent>

        {/* Materials */}
        <TabsContent value="materials" className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="Stock value by category" className="lg:col-span-2">
            <ResponsiveContainer>
              <BarChart data={matByCategory}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} className="capitalize" />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatPKR(v)} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {matByCategory.map((_, i) => <Cell key={i} fill={SERIES[i % SERIES.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Stock health" subtitle="Items by status">
            <ResponsiveContainer>
              <PieChart>
                <Tooltip contentStyle={tooltipStyle} />
                <Pie
                  data={[
                    { name: "Healthy",    value: INVENTORY.filter((i) => i.inStock >= i.reorderLevel * 1.5).length },
                    { name: "Watch",      value: INVENTORY.filter((i) => i.inStock < i.reorderLevel * 1.5 && i.inStock >= i.reorderLevel).length },
                    { name: "Low",        value: INVENTORY.filter((i) => i.inStock > 0 && i.inStock < i.reorderLevel).length },
                    { name: "Out",        value: INVENTORY.filter((i) => i.inStock <= 0).length },
                  ]}
                  dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}
                >
                  <Cell fill="hsl(var(--success))" />
                  <Cell fill="hsl(var(--info))" />
                  <Cell fill="hsl(var(--warning))" />
                  <Cell fill="hsl(var(--danger))" />
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ChartCard({ title, subtitle, children, className }: {
  title: string; subtitle?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-xl border border-border bg-card shadow-card", className)}>
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
      </header>
      <div className="h-72 w-full p-3">{children}</div>
    </section>
  );
}

function Tile({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof TrendingUp; tone: "primary"|"success"|"warning"|"info" }) {
  const map = {
    primary: "bg-primary/15 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    info:    "bg-info/15 text-info",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", map[tone])}><Icon className="h-5 w-5" /></div>
      <div className="mt-4 label-caption">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular text-foreground">{value}</div>
    </div>
  );
}
