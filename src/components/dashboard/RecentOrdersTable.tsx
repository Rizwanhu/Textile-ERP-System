import { StatusBadge, type OrderStatus } from "./StatusBadge";
import { formatPKR } from "@/lib/currency";

const orders: { id: string; client: string; qty: number; value: number; date: string; status: OrderStatus }[] = [
  { id: "ORD-2026-024", client: "Northwind Apparel",   qty: 1200, value: 5_152_000, date: "12 Apr 2026", status: "in-production" },
  { id: "ORD-2026-023", client: "Acme Garments",       qty: 800,  value: 3_360_000, date: "10 Apr 2026", status: "qc-hold" },
  { id: "ORD-2026-022", client: "Linea Bianca",        qty: 2400, value: 10_080_000, date: "08 Apr 2026", status: "dispatched" },
  { id: "ORD-2026-021", client: "Urban Threads Co.",   qty: 600,  value: 2_576_000, date: "06 Apr 2026", status: "completed" },
  { id: "ORD-2026-020", client: "Heritage Textiles",   qty: 1500, value: 6_300_000, date: "04 Apr 2026", status: "overdue" },
  { id: "ORD-2026-019", client: "Atlas Brand Studio",  qty: 400,  value: 2_184_000, date: "02 Apr 2026", status: "active" },
];

export function RecentOrdersTable() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <h3 className="section-header">Recent Orders</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Latest 6 client orders</p>
        </div>
        <button className="text-xs font-semibold text-primary hover:text-primary-hover">View all →</button>
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
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border last:border-0 transition-colors hover:bg-surface-3/40">
                <td className="px-5 py-3"><span className="mono text-foreground">{o.id}</span></td>
                <td className="px-5 py-3 text-foreground">{o.client}</td>
                <td className="px-5 py-3 text-right tabular text-foreground">{o.qty.toLocaleString()}</td>
                <td className="px-5 py-3 text-right tabular font-medium text-foreground">{formatPKR(o.value)}</td>
                <td className="px-5 py-3 text-muted-foreground">{o.date}</td>
                <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}