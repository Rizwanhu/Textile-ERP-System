"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge, type OrderStatus } from "./StatusBadge";
import { formatPKR } from "@/lib/currency";
import { useOrders } from "@/context/OrdersContext";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });

export function RecentOrdersTable() {
  const router = useRouter();
  const { orders } = useOrders();
  const recent = orders.slice(0, 6);

  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <h3 className="section-header">Recent Orders</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Latest 6 client orders</p>
        </div>
        <Link href="/orders" className="text-xs font-semibold text-primary hover:text-primary-hover">
          View all →
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-border bg-surface-1">
              <th className="label-caption px-5 py-2.5 text-left">Order ID</th>
              <th className="label-caption px-5 py-2.5 text-left">Client</th>
              <th className="label-caption px-5 py-2.5 text-right">Qty</th>
              <th className="label-caption px-5 py-2.5 text-right">Value</th>
              <th className="label-caption px-5 py-2.5 text-left">Date</th>
              <th className="label-caption px-5 py-2.5 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((o) => (
              <tr
                key={o.id}
                onClick={() => router.push(`/orders/${o.id}`)}
                className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-surface-3/40"
              >
                <td className="px-5 py-3">
                  <Link
                    href={`/orders/${o.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="mono text-primary hover:text-primary-hover hover:underline"
                  >
                    {o.id}
                  </Link>
                </td>
                <td className="px-5 py-3 text-foreground">{o.client}</td>
                <td className="px-5 py-3 text-right tabular text-foreground">{o.qty.toLocaleString()}</td>
                <td className="px-5 py-3 text-right tabular text-foreground">{formatPKR(o.value)}</td>
                <td className="px-5 py-3 text-muted-foreground">{fmtDate(o.orderDate)}</td>
                <td className="px-5 py-3"><StatusBadge status={o.status as OrderStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
