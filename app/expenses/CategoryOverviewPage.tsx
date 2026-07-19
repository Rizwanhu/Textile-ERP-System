"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useOrders } from "@/context/OrdersContext";
import { formatPKR } from "@/lib/currency";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import type { ExpenseCategory } from "@/components/expenses/NewExpenseDialog";
import { CATEGORY_LABELS, expenseTabPath, orderExpensePath } from "@/lib/expenseRoutes";
import { getCategoryOrderRows, sumCategoryRows } from "@/lib/expenseCategorySummary";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });

const METRIC_HEADERS: Record<ExpenseCategory, string> = {
  "local-buyer": "Procurement",
  cutting: "Pieces cut",
  stitching: "Stitched",
  finishing: "Packed (good)",
  fixed: "Allocation",
  admin: "Spend lines",
};

type Props = { tab: ExpenseCategory };

export function CategoryOverviewPage({ tab }: Props) {
  const router = useRouter();
  const { orders, isLoading } = useOrders();
  const [query, setQuery] = useState("");
  const label = CATEGORY_LABELS[tab];
  const fromPath = expenseTabPath(tab);

  const rows = useMemo(() => getCategoryOrderRows(orders, tab), [orders, tab]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) => !q || `${r.orderId} ${r.client} ${r.product}`.toLowerCase().includes(q),
    );
  }, [rows, query]);

  const totalCost = useMemo(() => sumCategoryRows(filtered), [filtered]);
  const orderCount = filtered.length;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto animate-fade-in space-y-6 p-4 lg:p-6" style={{ maxWidth: 1440 }}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{label}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Collective {label.toLowerCase()} across all production orders. Open an order for its sheet.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Orders" value={String(orderCount)} />
        <Kpi label={`Total ${label}`} value={formatPKR(totalCost)} />
        <Kpi
          label="Avg / order"
          value={orderCount ? formatPKR(Math.round(totalCost / orderCount)) : "—"}
        />
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search order ID, client, product…"
          className="border-border bg-card pl-9"
        />
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-1">
              <th className="label-caption px-5 py-2.5 text-left">Order</th>
              <th className="label-caption px-5 py-2.5 text-left">Client / Product</th>
              <th className="label-caption px-5 py-2.5 text-right">Qty</th>
              <th className="label-caption px-5 py-2.5 text-left">{METRIC_HEADERS[tab]}</th>
              <th className="label-caption px-5 py-2.5 text-right">Cost</th>
              <th className="label-caption px-5 py-2.5 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const href = orderExpensePath(r.orderId, tab, fromPath);
              const order = orders.find((o) => o.id === r.orderId);
              return (
                <tr
                  key={r.orderId}
                  onClick={() => router.push(href)}
                  className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-surface-3/40"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-muted-foreground" />
                      <Link
                        href={`/orders/${r.orderId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="mono font-medium text-primary hover:text-primary-hover hover:underline"
                      >
                        {r.orderId}
                      </Link>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-foreground">{r.client}</div>
                    <div className="text-xs text-muted-foreground">{r.product}</div>
                  </td>
                  <td className="px-5 py-3 text-right tabular">{r.qty.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-foreground">{r.metric}</div>
                    <div className="text-xs text-muted-foreground">{r.detail}</div>
                  </td>
                  <td className="px-5 py-3 text-right tabular font-medium">{formatPKR(r.cost)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={r.status} />
                    {order && (
                      <div className="mt-0.5 text-xs text-muted-foreground">{fmtDate(order.deliveryDate)}</div>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                  No orders found for this category.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold tabular text-foreground">{value}</p>
    </div>
  );
}
