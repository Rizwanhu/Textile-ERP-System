"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, CalendarDays, Download, Plus, Search, Users, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge, type OrderStatus } from "@/components/dashboard/StatusBadge";
import { cn } from "@/lib/utils";
import { formatMoney, formatPKR } from "@/lib/currency";
import { NewOrderDialog } from "@/components/orders/NewOrderDialog";
import { ClientFormDialog } from "@/components/orders/ClientFormDialog";
import { useClientAccounts } from "@/context/ClientAccountsContext";
import { clientRouteId } from "@/lib/clientAccount";
import { useOrders } from "@/context/OrdersContext";
import type { Order } from "@/data/orders";

const STATUSES: OrderStatus[] = ["draft","active","in-production","qc-hold","completed","dispatched","overdue"];
const STATUS_LABEL: Record<OrderStatus,string> = {
  draft:"Draft", active:"Active", "in-production":"In Production", "qc-hold":"QC Hold",
  completed:"Completed", dispatched:"Dispatched", overdue:"Overdue",
};

type SortKey = "id" | "client" | "qty" | "value" | "orderDate" | "deliveryDate" | "status";
type SortDir = "asc" | "desc";
type DateRange = "all" | "7d" | "30d" | "90d" | "overdue";
type ViewMode = "orders" | "clients";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
const fmtMoney = (n: number) => formatPKR(n);
const daysUntil = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);

function deliveryTone(o: Order) {
  if (o.status === "completed" || o.status === "dispatched") return "text-muted-foreground";
  const d = daysUntil(o.deliveryDate);
  if (d < 0) return "text-danger";
  if (d <= 7) return "text-warning";
  return "text-foreground";
}

export default function OrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const { getClientSummaries } = useClientAccounts();
  const { orders: ORDERS, refresh: refreshOrders } = useOrders();
  const clientSummaries = getClientSummaries();

  const commitParams = (next: URLSearchParams, replace = true) => {
    const nextSearch = next.toString();
    const href = `${pathname}${nextSearch ? `?${nextSearch}` : ""}`;
    if (replace) router.replace(href);
    else router.push(href);
  };

  // Allow opening the New Order dialog via ?new=1 (used by global header button).
  useEffect(() => {
    if (params.get("new")) setOrderDialogOpen(true);
    if (params.get("newClient")) setClientDialogOpen(true);
  }, [params]);

  const handleDialogChange = (open: boolean) => {
    setOrderDialogOpen(open);
    if (!open && params.get("new")) {
      const next = new URLSearchParams(params);
      next.delete("new");
      commitParams(next, true);
    }
  };

  const query = params.get("q") ?? "";
  const view = (params.get("view") as ViewMode) || "orders";
  const status = (params.get("status") as OrderStatus | "all") || "all";
  const range = (params.get("range") as DateRange) || "all";
  const sortKey = (params.get("sort") as SortKey) || "orderDate";
  const sortDir = (params.get("dir") as SortDir) || "desc";

  const updateParam = (key: string, value: string, defaultValue: string) => {
    const next = new URLSearchParams(params);
    if (value === defaultValue) next.delete(key);
    else next.set(key, value);
    commitParams(next, true);
  };
  const setQuery = (v: string) => updateParam("q", v, "");
  const setView = (v: ViewMode) => updateParam("view", v, "orders");
  const setStatus = (v: OrderStatus | "all") => updateParam("status", v, "all");
  const setRange = (v: DateRange) => updateParam("range", v, "all");
  const setSortKey = (v: SortKey) => updateParam("sort", v, "orderDate");
  const setSortDir = (v: SortDir) => updateParam("dir", v, "desc");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: ORDERS.length };
    STATUSES.forEach((s) => (c[s] = ORDERS.filter((o) => o.status === s).length));
    return c;
  }, [ORDERS]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = Date.now();
    return ORDERS.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (q && !`${o.id} ${o.client} ${o.product}`.toLowerCase().includes(q)) return false;
      if (range !== "all") {
        const delivery = new Date(o.deliveryDate).getTime();
        if (range === "overdue") {
          if (!(delivery < now && o.status !== "completed" && o.status !== "dispatched")) return false;
        } else {
          const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
          const diff = (delivery - now) / 86_400_000;
          if (!(diff >= 0 && diff <= days)) return false;
        }
      }
      return true;
    }).sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const va = a[sortKey]; const vb = b[sortKey];
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [ORDERS, query, status, range, sortKey, sortDir]);

  const totalValue = filtered.reduce((s, o) => s + o.value, 0);
  const totalQty = filtered.reduce((s, o) => s + o.qty, 0);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir(k === "orderDate" || k === "deliveryDate" ? "desc" : "asc"); }
  };
  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="ml-1 inline h-3 w-3 text-primary" />
      : <ArrowDown className="ml-1 inline h-3 w-3 text-primary" />;
  };

  const clearAll = () => commitParams(new URLSearchParams(), true);
  const hasFilters = query !== "" || status !== "all" || range !== "all";
  const goToOrder = (id: string) => router.push(`/orders/${id}${search ? `?from=${encodeURIComponent(search)}` : ""}`);
  const goToClient = (id: string) => router.push(`/orders/clients/${id}${search ? `?from=${encodeURIComponent(search)}` : ""}`);

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clientSummaries.filter(({ client }) =>
      !q || client.name.toLowerCase().includes(q),
    );
  }, [clientSummaries, query]);

  return (
    <div className="mx-auto animate-fade-in p-4 lg:p-6" style={{ maxWidth: 1440 }}>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage production orders and client invoicing accounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border bg-card p-1">
            <button
              onClick={() => setView("orders")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                view === "orders" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              All orders
            </button>
            <button
              onClick={() => setView("clients")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                view === "clients" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Client accounts
            </button>
          </div>
          <Button variant="outline" size="sm" className="gap-2 border-border bg-card">
            <Download className="h-4 w-4" /> Export
          </Button>
          {view === "clients" ? (
            <Button
              size="sm"
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary-hover"
              onClick={() => setClientDialogOpen(true)}
            >
              <Plus className="h-4 w-4" /> Add client
            </Button>
          ) : (
            <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary-hover" onClick={() => setOrderDialogOpen(true)}>
              <Plus className="h-4 w-4" /> New Order
            </Button>
          )}
        </div>
      </div>

      {/* Status pills — orders view only */}
      {view === "orders" && (
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setStatus("all")}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
            status === "all"
              ? "border-primary/50 bg-primary/15 text-primary"
              : "border-border bg-card text-muted-foreground hover:bg-surface-3/50",
          )}
        >
          All <span className="ml-1 tabular opacity-70">{counts.all}</span>
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              status === s
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-surface-3/50",
            )}
          >
            {STATUS_LABEL[s]} <span className="ml-1 tabular opacity-70">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>
      )}

      {/* Search + filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card">
        <div className="relative flex-1" style={{ minWidth: 240 }}>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={view === "clients" ? "Search clients…" : "Search by order ID, client, or product…"}
            className="border-border bg-surface-3/40 pl-9"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-3/40 p-1">
          <CalendarDays className="ml-2 h-4 w-4 text-muted-foreground" />
          {view === "orders" && ([
            ["all","All dates"],
            ["7d","Next 7d"],
            ["30d","Next 30d"],
            ["90d","Next 90d"],
            ["overdue","Overdue"],
          ] as [DateRange,string][]).map(([k,label]) => (
            <button
              key={k}
              onClick={() => setRange(k)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                range === k
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {hasFilters && view === "orders" && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1 text-muted-foreground">
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      {view === "clients" ? (
        <>
          <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing <span className="font-semibold text-foreground">{filteredClients.length}</span> client accounts
            </span>
            <button
              type="button"
              onClick={() => setClientDialogOpen(true)}
              className="font-semibold text-primary hover:text-primary-hover"
            >
              + Add new client
            </button>
          </div>
          <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-1">
                    <th className="label-caption px-5 py-2.5 text-left">Client</th>
                    <th className="label-caption px-5 py-2.5 text-left">Type</th>
                    <th className="label-caption px-5 py-2.5 text-right">Order lines</th>
                    <th className="label-caption px-5 py-2.5 text-right">Total goods</th>
                    <th className="label-caption px-5 py-2.5 text-right">Received</th>
                    <th className="label-caption px-5 py-2.5 text-right">Balance</th>
                    <th className="label-caption px-5 py-2.5 text-right">Ready to invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map(({ client, summary }) => (
                    <tr
                      key={client.id}
                      onClick={() => goToClient(clientRouteId(client))}
                      className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-surface-3/40"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-foreground">{client.name}</div>
                            <div className="text-xs text-muted-foreground">{client.billingCurrency} billing</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 capitalize text-muted-foreground">{client.type}</td>
                      <td className="px-5 py-3 text-right tabular">{summary.lineItemCount}</td>
                      <td className="px-5 py-3 text-right tabular font-medium">{formatMoney(summary.totalAmountOfGoods, summary.currency)}</td>
                      <td className="px-5 py-3 text-right tabular text-success">{formatMoney(summary.totalAmountReceived, summary.currency)}</td>
                      <td className={cn("px-5 py-3 text-right tabular font-semibold", summary.balanceOutstanding > 0 ? "text-danger" : "text-success")}>
                        {formatMoney(summary.balanceOutstanding, summary.currency)}
                      </td>
                      <td className="px-5 py-3 text-right tabular text-primary">{summary.uninvoicedDeliveredCount}</td>
                    </tr>
                  ))}
                  {filteredClients.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center">
                        {clientSummaries.length === 0 ? (
                          <div className="mx-auto max-w-sm">
                            <Users className="mx-auto h-10 w-10 text-muted-foreground/60" />
                            <h4 className="mt-3 text-sm font-semibold text-foreground">No clients yet</h4>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Add your first export or local client to start invoicing and payments.
                            </p>
                            <Button size="sm" className="mt-4 gap-2 bg-primary text-primary-foreground" onClick={() => setClientDialogOpen(true)}>
                              <Plus className="h-4 w-4" /> Add client
                            </Button>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No clients match your search.</p>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
      {/* Results meta */}
      <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {ORDERS.length} orders
        </span>
        <span className="tabular">
          Total qty <span className="font-semibold text-foreground">{totalQty.toLocaleString()}</span>
          <span className="mx-2 opacity-50">·</span>
          Total value <span className="font-semibold text-foreground">{fmtMoney(totalValue)}</span>
        </span>
      </div>

      {/* Table */}
      <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-1">
                {([
                  ["id","Order ID","left"],
                  ["client","Client","left"],
                  ["qty","Qty","right"],
                  ["value","Value","right"],
                  ["orderDate","Order date","left"],
                  ["deliveryDate","Delivery","left"],
                  ["status","Status","left"],
                ] as [SortKey,string,"left"|"right"][]).map(([k,label,align]) => (
                  <th
                    key={k}
                    onClick={() => toggleSort(k)}
                    className={cn(
                      "label-caption cursor-pointer select-none px-5 py-2.5 transition-colors hover:text-foreground",
                      align === "right" ? "text-right" : "text-left",
                    )}
                  >
                    {label}<SortIcon k={k} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const d = daysUntil(o.deliveryDate);
                const isLive = o.status !== "completed" && o.status !== "dispatched";
                return (
                  <tr
                    key={o.id}
                    onClick={() => goToOrder(o.id)}
                    className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-surface-3/40"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/orders/${o.id}${search ? `?from=${encodeURIComponent(search)}` : ""}`}
                        onClick={(e) => e.stopPropagation()}
                        className="mono font-medium text-primary hover:text-primary-hover"
                      >
                        {o.id}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-foreground">{o.client}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{o.product}</div>
                    </td>
                    <td className="px-5 py-3 text-right tabular text-foreground">{o.qty.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right tabular font-medium text-foreground">{fmtMoney(o.value)}</td>
                    <td className="px-5 py-3 text-muted-foreground">{fmtDate(o.orderDate)}</td>
                    <td className={cn("px-5 py-3", deliveryTone(o))}>
                      <div className="font-medium">{fmtDate(o.deliveryDate)}</div>
                      {isLive && (
                        <div className="mt-0.5 text-xs">
                          {d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? "Due today" : `in ${d}d`}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="mx-auto max-w-sm">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-3/60">
                        <Search className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <h4 className="mt-3 text-sm font-semibold text-foreground">No orders match</h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Try adjusting search or filters to find what you're looking for.
                      </p>
                      <Button variant="outline" size="sm" className="mt-4 border-border" onClick={clearAll}>
                        Reset filters
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
      <NewOrderDialog
        open={orderDialogOpen}
        onOpenChange={handleDialogChange}
        onCreated={() => void refreshOrders()}
      />
      <ClientFormDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        onCreated={(id) => goToClient(id)}
      />
    </div>
  );
}