"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { useOrders } from "@/context/OrdersContext";
import { formatPKR } from "@/lib/currency";
import { getExpenseTotals } from "@/data/expenses";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });

export default function OrderExpensesListPage() {
  const router = useRouter();
  const { orders, isLoading } = useOrders();
  const [query, setQuery] = useState("");
  const demoTotal = getExpenseTotals().grand;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter(
      (o) => !q || `${o.id} ${o.client} ${o.product}`.toLowerCase().includes(q),
    );
  }, [orders, query]);

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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Order Expenses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a production order to view Local Supplier, Cutting, Stitching, Finishing, Fixed and Admin costs.
          </p>
        </div>
        <Button asChild variant="outline" className="border-border">
          <Link href="/expenses/suppliers">Local supplier accounts →</Link>
        </Button>
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
              <th className="label-caption px-5 py-2.5 text-right">Order value</th>
              <th className="label-caption px-5 py-2.5 text-right">Est. expenses</th>
              <th className="label-caption px-5 py-2.5 text-left">Delivery</th>
              <th className="label-caption px-5 py-2.5 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr
                key={o.id}
                onClick={() => router.push(`/expenses/orders/${o.id}`)}
                className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-surface-3/40"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    <Link
                      href={`/orders/${o.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="mono font-medium text-primary hover:text-primary-hover hover:underline"
                    >
                      {o.id}
                    </Link>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="font-medium text-foreground">{o.client}</div>
                  <div className="text-xs text-muted-foreground">{o.product}</div>
                </td>
                <td className="px-5 py-3 text-right tabular">{o.qty.toLocaleString()}</td>
                <td className="px-5 py-3 text-right tabular font-medium">{formatPKR(o.value)}</td>
                <td className="px-5 py-3 text-right tabular text-muted-foreground">
                  {o.id === "ORD-2026-024" ? formatPKR(demoTotal) : "—"}
                </td>
                <td className="px-5 py-3 text-muted-foreground">{fmtDate(o.deliveryDate)}</td>
                <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                  No orders found. Create an order first from the Orders workspace.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
