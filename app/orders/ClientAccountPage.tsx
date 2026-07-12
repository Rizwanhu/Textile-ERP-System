"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft, Download, FileText, Loader2, Pencil, Plus, Receipt, RotateCcw, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/currency";
import { useClientAccounts } from "@/context/ClientAccountsContext";
import { FULFILLMENT_LABEL } from "@/lib/clientAccount";
import { fulfillmentRowClass } from "@/components/orders/FulfillmentStatusBadge";
import { RecordPaymentDialog } from "@/components/orders/RecordPaymentDialog";
import { AddLineItemDialog } from "@/components/orders/AddLineItemDialog";
import { CreateInvoiceDialog } from "@/components/orders/CreateInvoiceDialog";
import { CreditNoteDialog } from "@/components/orders/CreditNoteDialog";
import { ClientFormDialog } from "@/components/orders/ClientFormDialog";
import { generateClientStatementPdf } from "@/lib/clientInvoicePdf";
import type { FulfillmentStatus } from "@/types/clientAccount";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default function ClientAccountPage({ clientId = "" }: { clientId?: string } = {}) {
  const searchParams = useSearchParams();
  const fromQuery = searchParams.get("from") ?? "";
  const ordersBackHref = fromQuery ? `/orders?${decodeURIComponent(fromQuery)}` : "/orders";

  const { getBundle, updateLineItemStatus, isLoading } = useClientAccounts();
  const bundle = getBundle(clientId);

  const [statusFilter, setStatusFilter] = useState<FulfillmentStatus | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [payOpen, setPayOpen] = useState(false);
  const [lineOpen, setLineOpen] = useState(false);
  const [invOpen, setInvOpen] = useState(false);
  const [cnOpen, setCnOpen] = useState(false);
  const [cnLine, setCnLine] = useState<string | undefined>();
  const [editClientOpen, setEditClientOpen] = useState(false);

  const filteredLines = useMemo(() => {
    if (!bundle) return [];
    const lines = [...bundle.lineItems].sort((a, b) => a.serialNumber - b.serialNumber);
    if (statusFilter === "all") return lines;
    return lines.filter((l) => l.fulfillmentStatus === statusFilter);
  }, [bundle, statusFilter]);

  const selectable = filteredLines.filter(
    (l) => !l.invoiced && (l.fulfillmentStatus === "delivered" || l.fulfillmentStatus === "partial-delivered"),
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === selectable.length) setSelected(new Set());
    else setSelected(new Set(selectable.map((l) => l.id)));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card p-16 text-center shadow-card">
        <FileText className="h-10 w-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Client not found</h2>
        <Button asChild variant="outline" size="sm" className="border-border">
          <Link href={ordersBackHref}><ArrowLeft className="mr-1 h-4 w-4" /> Back to orders</Link>
        </Button>
      </div>
    );
  }

  const { client, summary, payments, ledger } = bundle;
  const cur = client.billingCurrency;
  const balanceTone = summary.balanceOutstanding > 0 ? "text-danger" : "text-success";

  const downloadStatement = () => {
    generateClientStatementPdf({
      client: bundle.client,
      allLineItems: bundle.lineItems,
      payments: bundle.payments,
      creditNotes: bundle.creditNotes,
      summary: bundle.summary,
      ledger: bundle.ledger,
    });
  };

  return (
    <div className="mx-auto animate-fade-in space-y-6 p-4 lg:p-6" style={{ maxWidth: 1440 }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href={ordersBackHref} className="hover:text-foreground">Orders</Link>
          <span className="opacity-40">/</span>
          <span className="text-foreground">Client account</span>
        </div>
        <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground">
          <Link href={ordersBackHref}><ArrowLeft className="h-4 w-4" /> Back</Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-surface-1 p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{client.name}</h1>
              <span className="rounded-full border border-border bg-surface-3 px-2.5 py-0.5 text-[11px] font-semibold uppercase text-muted-foreground">
                {client.type} · {cur}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{client.billingAddress}</p>
            {client.contact && (
              <p className="mt-1 text-xs text-muted-foreground">
                {client.contact.name} · {client.contact.email}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-2 border-border" onClick={() => setEditClientOpen(true)}>
              <Pencil className="h-4 w-4" /> Edit client
            </Button>
            <Button variant="outline" size="sm" className="gap-2 border-border" onClick={downloadStatement}>
              <Download className="h-4 w-4" /> Statement PDF
            </Button>
            <Button variant="outline" size="sm" className="gap-2 border-border" onClick={() => setPayOpen(true)}>
              <Wallet className="h-4 w-4" /> Record payment
            </Button>
            <Button
              size="sm"
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary-hover"
              disabled={!selected.size}
              onClick={() => setInvOpen(true)}
            >
              <Receipt className="h-4 w-4" /> Create invoice ({selected.size})
            </Button>
          </div>
        </div>

        <div className="grid divide-border md:grid-cols-3 md:divide-x">
          {[
            { label: "Total amount of goods", value: formatMoney(summary.totalAmountOfGoods, cur), icon: FileText },
            { label: "Total amount received", value: formatMoney(summary.totalAmountReceived, cur), icon: Wallet },
            { label: "Balance outstanding", value: formatMoney(summary.balanceOutstanding, cur), icon: Receipt, tone: balanceTone },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="flex items-center gap-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-3/60 text-muted-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="label-caption">{label}</div>
                <div className={cn("mt-0.5 text-lg font-semibold tabular", tone ?? "text-foreground")}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="lines" className="space-y-4">
        <TabsList className="border border-border bg-card">
          <TabsTrigger value="lines">Order lines ({bundle.lineItems.length})</TabsTrigger>
          <TabsTrigger value="ledger">Payment ledger ({payments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="lines" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FulfillmentStatus | "all")}>
                <SelectTrigger className="border-border bg-card" style={{ width: 200 }}><SelectValue placeholder="Filter status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="delivered">Goods Delivered</SelectItem>
                  <SelectItem value="in-process">In Process</SelectItem>
                  <SelectItem value="waiting-design">Waiting Sticker Design</SelectItem>
                  <SelectItem value="partial-delivered">Partial Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {client.openingBalance > 0 && (
                <span className="text-xs text-muted-foreground">
                  Opening balance: <span className="font-semibold text-foreground">{formatMoney(client.openingBalance, cur)}</span>
                </span>
              )}
            </div>
            <Button variant="outline" size="sm" className="gap-2 border-border" onClick={() => setLineOpen(true)}>
              <Plus className="h-4 w-4" /> Add line
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-1">
                    <th className="w-10 px-3 py-2.5">
                      <Checkbox
                        checked={selectable.length > 0 && selected.size === selectable.length}
                        onCheckedChange={toggleAll}
                        aria-label="Select all invoiceable"
                      />
                    </th>
                    <th className="label-caption px-3 py-2.5 text-left">Sr.</th>
                    <th className="label-caption px-3 py-2.5 text-left">Product description</th>
                    <th className="label-caption px-3 py-2.5 text-right">Qty</th>
                    <th className="label-caption px-3 py-2.5 text-right">CNF price/pc</th>
                    <th className="label-caption px-3 py-2.5 text-right">Invoice value</th>
                    <th className="label-caption px-3 py-2.5 text-left">Status</th>
                    <th className="label-caption px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLines.map((l) => {
                    const canInvoice = !l.invoiced && (l.fulfillmentStatus === "delivered" || l.fulfillmentStatus === "partial-delivered");
                    return (
                      <tr
                        key={l.id}
                        className={cn("border-b border-border last:border-0", fulfillmentRowClass(l.fulfillmentStatus))}
                      >
                        <td className="px-3 py-2.5">
                          {canInvoice && (
                            <Checkbox checked={selected.has(l.id)} onCheckedChange={() => toggle(l.id)} />
                          )}
                        </td>
                        <td className="px-3 py-2.5 tabular text-muted-foreground">{l.serialNumber}</td>
                        <td className="px-3 py-2.5">
                          <div className="text-foreground">{l.description}</div>
                          {l.orderId && <div className="mono mt-0.5 text-xs text-muted-foreground">{l.orderId}</div>}
                          {l.invoiced && <div className="mt-0.5 text-xs text-primary">Invoiced</div>}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular">{l.quantity.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right tabular text-muted-foreground">{formatMoney(l.unitPrice, cur)}</td>
                        <td className="px-3 py-2.5 text-right tabular font-medium">{formatMoney(l.invoiceValue, cur)}</td>
                        <td className="px-3 py-2.5">
                          <Select
                            value={l.fulfillmentStatus}
                            onValueChange={(v) => updateLineItemStatus(l.id, v as FulfillmentStatus)}
                          >
                            <SelectTrigger className="h-8 border-border bg-card text-xs" style={{ width: 180 }}>
                              <SelectValue>{FULFILLMENT_LABEL[l.fulfillmentStatus]}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="in-process">In Process</SelectItem>
                              <SelectItem value="waiting-design">Waiting Sticker Design</SelectItem>
                              <SelectItem value="partial-delivered">Partial Delivered</SelectItem>
                              <SelectItem value="delivered">Goods Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {l.fulfillmentStatus !== "cancelled" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-muted-foreground"
                              onClick={() => { setCnLine(l.id); setCnOpen(true); }}
                            >
                              <RotateCcw className="mr-1 h-3.5 w-3.5" /> Credit
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-surface-1">
                    <td colSpan={5} className="px-3 py-3 label-caption text-right">Total amount of goods</td>
                    <td className="px-3 py-3 text-right tabular font-semibold text-foreground">
                      {formatMoney(summary.totalAmountOfGoods, cur)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-success" /> Goods Delivered</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-info" /> Waiting Sticker Design</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-warning" /> In Process</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-yellow-500" /> Partial Delivered</span>
          </div>
        </TabsContent>

        <TabsContent value="ledger">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-[hsl(210,80%,45%)] text-white">
                    <th className="px-5 py-3 text-left font-semibold" colSpan={2}>Total amount of goods</th>
                    <th className="px-5 py-3 text-right font-semibold tabular">{formatMoney(summary.totalAmountOfGoods, cur)}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((p) => (
                      <tr key={p.id} className="border-b border-border bg-yellow-500/10">
                        <td className="px-5 py-3 text-foreground" colSpan={2}>{p.description}</td>
                        <td className="px-5 py-3 text-right tabular font-medium text-foreground">
                          {formatMoney(p.amount, cur)}
                          {p.inputCurrency !== p.billingCurrency && (
                            <div className="text-xs text-muted-foreground">
                              ({formatMoney(p.inputAmount, p.inputCurrency)} @ {p.exchangeRate})
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-[hsl(210,80%,45%)] text-white">
                    <td className="px-5 py-3 font-semibold" colSpan={2}>Total amount received</td>
                    <td className="px-5 py-3 text-right tabular font-semibold">{formatMoney(summary.totalAmountReceived, cur)}</td>
                  </tr>
                  <tr className="bg-yellow-500/20">
                    <td className="px-5 py-3 font-semibold text-foreground" colSpan={2}>Balance outstanding</td>
                    <td className={cn("px-5 py-3 text-right tabular font-semibold", balanceTone)}>
                      {formatMoney(summary.balanceOutstanding, cur)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <header className="border-b border-border px-5 py-3">
              <h3 className="text-sm font-semibold text-foreground">Full ledger (running balance)</h3>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-1">
                    <th className="label-caption px-4 py-2 text-left">Date</th>
                    <th className="label-caption px-4 py-2 text-left">Description</th>
                    <th className="label-caption px-4 py-2 text-right">Debit</th>
                    <th className="label-caption px-4 py-2 text-right">Credit</th>
                    <th className="label-caption px-4 py-2 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((e) => (
                    <tr key={e.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 tabular text-muted-foreground">{fmtDate(e.date)}</td>
                      <td className="px-4 py-2 text-foreground">{e.description}</td>
                      <td className="px-4 py-2 text-right tabular">{e.debit ? formatMoney(e.debit, cur) : "—"}</td>
                      <td className="px-4 py-2 text-right tabular">{e.credit ? formatMoney(e.credit, cur) : "—"}</td>
                      <td className="px-4 py-2 text-right tabular font-medium">{formatMoney(e.balance, cur)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <RecordPaymentDialog open={payOpen} onOpenChange={setPayOpen} client={client} />
      <AddLineItemDialog open={lineOpen} onOpenChange={setLineOpen} client={client} />
      <CreateInvoiceDialog
        open={invOpen}
        onOpenChange={setInvOpen}
        client={client}
        lineItems={bundle.lineItems}
        selectedIds={[...selected]}
        onSuccess={() => setSelected(new Set())}
      />
      <CreditNoteDialog
        open={cnOpen}
        onOpenChange={(o) => { setCnOpen(o); if (!o) setCnLine(undefined); }}
        client={client}
        lineItem={cnLine ? bundle.lineItems.find((l) => l.id === cnLine) : undefined}
      />
      <ClientFormDialog open={editClientOpen} onOpenChange={setEditClientOpen} client={client} />
    </div>
  );
}
