"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Download, Loader2, Mail, MapPin, Package, Phone, Printer,
  Scissors, Shirt, ShoppingCart, Sparkles, Truck, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { getCurrentStep, type OrderDetail } from "@/data/orders";
import { getOrderWorkflow } from "@/data/workflow";
import { OrderWorkflow } from "@/components/orders/OrderWorkflow";
import { cn } from "@/lib/utils";
import { generateOrderPdf } from "@/lib/orderPdf";
import { formatPKR, formatPKRDecimal } from "@/lib/currency";
import { clientRouteId, findClientByRef } from "@/lib/clientAccount";
import { useClientAccounts } from "@/context/ClientAccountsContext";
import { useOrders } from "@/context/OrdersContext";
import { UpdateOrderDialog } from "@/components/orders/UpdateOrderDialog";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
const fmtMoney = (n: number) => formatPKR(n);
const daysUntil = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);

export default function OrderDetailPage({ orderId = "" }: { orderId?: string } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: clientData } = useClientAccounts();
  const { getDetail, refresh: refreshOrders } = useOrders();
  const [order, setOrder] = useState<OrderDetail | null | undefined>(undefined);
  const [updateOpen, setUpdateOpen] = useState(false);
  const fromQuery = searchParams.get("from") ?? "";
  const ordersBackHref = fromQuery ? `/orders?${decodeURIComponent(fromQuery)}` : "/orders";

  useEffect(() => {
    let mounted = true;
    void getDetail(orderId).then((detail) => {
      if (mounted) setOrder(detail ?? null);
    });
    return () => { mounted = false; };
  }, [getDetail, orderId]);

  const grouped = useMemo(() => {
    const m = new Map<string, NonNullable<typeof order>["breakdown"]>();
    order?.breakdown.forEach((b) => {
      if (!m.has(b.color)) m.set(b.color, []);
      m.get(b.color)!.push(b);
    });
    return Array.from(m.entries());
  }, [order]);

  const clientAccountId = useMemo(() => {
    if (!order) return undefined;
    const byOrder = clientData.lineItems.find((l) => l.orderId === order.id)?.clientId;
    if (byOrder) {
      const client = findClientByRef(clientData.clients, byOrder);
      return client ? clientRouteId(client) : byOrder;
    }
    const byName = clientData.clients.find(
      (c) => c.name.toLowerCase() === order.client.toLowerCase(),
    );
    return byName ? clientRouteId(byName) : undefined;
  }, [clientData, order]);

  if (order === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card p-16 text-center shadow-card">
        <Package className="h-10 w-10 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">Order not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">We couldn't locate <span className="mono">{orderId}</span>.</p>
        </div>
        <Button asChild variant="outline" size="sm" className="border-border">
          <Link href={ordersBackHref}><ArrowLeft className="mr-1 h-4 w-4" /> Back to orders</Link>
        </Button>
      </div>
    );
  }

  const d = daysUntil(order.deliveryDate);
  const isLive = order.status !== "completed" && order.status !== "dispatched";
  const deliveryClass = !isLive ? "text-muted-foreground" : d < 0 ? "text-danger" : d <= 7 ? "text-warning" : "text-foreground";
  const deliveryLabel = !isLive ? "Closed" : d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? "Due today" : `in ${d} days`;

  const totalQty = order.breakdown.reduce((s, b) => s + b.qty, 0);
  const producedPct = Math.min(100, Math.round((order.produced / order.qty) * 100));
  const packedPct = Math.min(100, Math.round((order.packed / order.qty) * 100));
  const rejectPct = order.produced ? +(order.rejected / order.produced * 100).toFixed(1) : 0;
  const currentStep = getCurrentStep(order);
  const workflow = getOrderWorkflow(order.id);

  const goToClientAccount = () => {
    if (clientAccountId) {
      router.push(`/orders/clients/${clientAccountId}${fromQuery ? `?from=${encodeURIComponent(fromQuery)}` : ""}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb / back */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href={ordersBackHref} className="hover:text-foreground">Orders</Link>
          <span className="opacity-40">/</span>
          <span className="mono text-foreground">{order.id}</span>
        </div>
        <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground">
          <Link href={ordersBackHref}><ArrowLeft className="h-4 w-4" /> Back</Link>
        </Button>
      </div>

      {/* Header card */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-surface-1 p-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{order.client}</h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-sm text-muted-foreground">{order.product}</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
              <span className="mono">{order.id}</span>
              <span className="opacity-40">·</span>
              <span>PO <span className="mono text-foreground">{order.poNumber}</span></span>
              <span className="opacity-40">·</span>
              <span>Ordered {fmtDate(order.orderDate)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-border bg-card"
              onClick={() => generateOrderPdf(order)}
            >
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-border bg-card"
              disabled={!clientAccountId}
              onClick={goToClientAccount}
            >
              <Download className="h-4 w-4" /> Client invoice
            </Button>
            <Button
              size="sm"
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary-hover"
              onClick={() => setUpdateOpen(true)}
            >
              <Sparkles className="h-4 w-4" /> Update Status
            </Button>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-2 divide-border md:grid-cols-4 md:divide-x">
          {[
            { label: "Order qty",    value: order.qty.toLocaleString(), icon: ShoppingCart },
            { label: "Order value",  value: fmtMoney(order.value),       icon: Package },
            { label: "Unit rate",    value: formatPKRDecimal(order.value / order.qty), icon: Shirt },
            { label: "Delivery",     value: fmtDate(order.deliveryDate), sub: deliveryLabel, subClass: deliveryClass, icon: Truck },
          ].map(({ label, value, sub, subClass, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-3/60 text-muted-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="label-caption">{label}</div>
                <div className="mt-0.5 text-base font-semibold tabular text-foreground">{value}</div>
                {sub && <div className={cn("mt-0.5 text-xs", subClass)}>{sub}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column body */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* LEFT — main column */}
        <div className="space-y-6 xl:col-span-2">
          {/* Line items / breakdown */}
          <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <header className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Size & color breakdown</h3>
                <p className="text-xs text-muted-foreground">{grouped.length} colors · {totalQty.toLocaleString()} pieces</p>
              </div>
              <span className="label-caption">Rate {formatPKRDecimal(order.value / order.qty)} / pc</span>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-1">
                    <th className="label-caption px-5 py-2.5 text-left">Color</th>
                    <th className="label-caption px-5 py-2.5 text-left">Size</th>
                    <th className="label-caption px-5 py-2.5 text-right">Qty</th>
                    <th className="label-caption px-5 py-2.5 text-right">Rate</th>
                    <th className="label-caption px-5 py-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped.map(([color, rows]) =>
                    rows.map((r, i) => (
                      <tr key={color + r.size} className="border-b border-border last:border-0 hover:bg-surface-3/40">
                        <td className="px-5 py-2.5">
                          {i === 0 ? <span className="font-medium text-foreground">{color}</span> : <span className="text-muted-foreground/40">↳</span>}
                        </td>
                        <td className="px-5 py-2.5 mono text-foreground">{r.size}</td>
                        <td className="px-5 py-2.5 text-right tabular text-foreground">{r.qty.toLocaleString()}</td>
                        <td className="px-5 py-2.5 text-right tabular text-muted-foreground">{formatPKRDecimal(r.rate)}</td>
                        <td className="px-5 py-2.5 text-right tabular font-medium text-foreground">{fmtMoney(+(r.qty * r.rate).toFixed(0))}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-surface-1">
                    <td className="px-5 py-3 label-caption" colSpan={2}>Total</td>
                    <td className="px-5 py-3 text-right tabular font-semibold text-foreground">{totalQty.toLocaleString()}</td>
                    <td />
                    <td className="px-5 py-3 text-right tabular font-semibold text-foreground">{fmtMoney(order.value)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* Production progress */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Production progress</h3>
                <p className="text-xs text-muted-foreground">Live counts from the shop floor</p>
              </div>
              <span className="label-caption">Target {order.qty.toLocaleString()} pcs</span>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {[
                { label: "Produced", icon: Scissors, value: order.produced, pct: producedPct, tone: "text-info" },
                { label: "Packed",   icon: Package,  value: order.packed,   pct: packedPct,   tone: "text-success" },
                { label: "Rejected", icon: Shirt,    value: order.rejected, pct: rejectPct,   tone: "text-danger", suffix: "%" },
              ].map(({ label, icon: Icon, value, pct, tone, suffix }) => (
                <div key={label} className="space-y-2 rounded-lg border border-border bg-surface-1 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon className={cn("h-4 w-4", tone)} /> {label}
                    </div>
                    <span className={cn("text-xs font-semibold tabular", tone)}>{pct}{suffix ?? "%"}</span>
                  </div>
                  <div className="text-xl font-semibold tabular text-foreground">{value.toLocaleString()}</div>
                  <Progress value={Math.min(100, pct)} className="h-1.5" />
                </div>
              ))}
            </div>
          </section>

          {/* Production workflow — Local Buyer → Cutting → Stitching → Finishing & QC */}
          {workflow && <OrderWorkflow workflow={workflow} />}

          {/* Delivery overview — planned vs actual per stage */}
          <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <header className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Delivery overview</h3>
                <p className="text-xs text-muted-foreground">Planned vs actual dates per production stage</p>
              </div>
              <span className={cn("text-xs font-semibold", deliveryClass)}>{deliveryLabel}</span>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-1">
                    <th className="label-caption px-5 py-2.5 text-left">Stage</th>
                    <th className="label-caption px-5 py-2.5 text-left">Planned</th>
                    <th className="label-caption px-5 py-2.5 text-left">Actual</th>
                    <th className="label-caption px-5 py-2.5 text-right">Variance</th>
                    <th className="label-caption px-5 py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {order.timeline.map((ev, i) => {
                    const done = i < currentStep;
                    const active = i === currentStep;
                    const variance =
                      ev.actualDate && ev.date
                        ? Math.round(
                            (new Date(ev.actualDate).getTime() - new Date(ev.date).getTime()) / 86_400_000,
                          )
                        : null;
                    const stageStatus = done
                      ? "Completed"
                      : active
                        ? order.status === "overdue" ? "Overdue" : "In progress"
                        : "Upcoming";
                    const stageTone = done
                      ? "text-success"
                      : active && order.status === "overdue"
                        ? "text-danger"
                        : active
                          ? "text-primary"
                          : "text-muted-foreground";
                    return (
                      <tr key={ev.key + i} className="border-b border-border last:border-0">
                        <td className="px-5 py-2.5 font-medium text-foreground">{ev.label}</td>
                        <td className="px-5 py-2.5 tabular text-muted-foreground">{fmtDate(ev.date!)}</td>
                        <td className={cn("px-5 py-2.5 tabular", ev.actualDate ? "text-foreground" : "text-muted-foreground/60")}>
                          {ev.actualDate ? fmtDate(ev.actualDate) : "—"}
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          {variance === null ? (
                            <span className="text-muted-foreground/60">—</span>
                          ) : (
                            <span
                              className={cn(
                                "tabular text-xs font-semibold",
                                variance > 0 && "text-danger",
                                variance < 0 && "text-success",
                                variance === 0 && "text-muted-foreground",
                              )}
                            >
                              {variance === 0 ? "On time" : variance > 0 ? `+${variance}d` : `${variance}d`}
                            </span>
                          )}
                        </td>
                        <td className={cn("px-5 py-2.5 text-right text-xs font-semibold", stageTone)}>{stageStatus}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="grid gap-4 border-t border-border bg-surface-1 p-4 md:grid-cols-2">
              <div className="flex items-start gap-2 text-xs">
                <Truck className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <div className="label-caption">Delivery due</div>
                  <div className={cn("mt-0.5 text-sm font-medium", deliveryClass)}>{fmtDate(order.deliveryDate)}</div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <MapPin className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <div className="label-caption">Ship to</div>
                  <div className="mt-0.5 text-sm text-foreground">{order.shipTo}</div>
                </div>
              </div>
            </div>
            {order.notes && (
              <div className="border-t border-border bg-surface-1/60 p-4 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Notes · </span>{order.notes}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT — sidebar */}
        <div className="space-y-6">
          {/* Status timeline */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-foreground">Status timeline</h3>
              <p className="text-xs text-muted-foreground">Order lifecycle history</p>
            </div>
            <OrderTimeline order={order} />
          </section>

          {/* Client */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Client contact</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2.5">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{order.contact.name}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${order.contact.email}`} className="text-primary hover:text-primary-hover">{order.contact.email}</a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground tabular">{order.contact.phone}</span>
              </div>
            </div>
          </section>

          {/* Specs */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Product specs</h3>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Style</dt>
                <dd className="text-right text-foreground">{order.product.split("—")[0].trim()}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Fabric</dt>
                <dd className="text-right text-foreground">{order.fabric}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Colors</dt>
                <dd className="text-right text-foreground">{grouped.length}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Sizes</dt>
                <dd className="text-right text-foreground mono">S · M · L · XL · XXL</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      <UpdateOrderDialog
        open={updateOpen}
        onOpenChange={setUpdateOpen}
        order={order}
        onUpdated={(updated) => {
          setOrder(updated);
          void refreshOrders();
        }}
      />
    </div>
  );
}