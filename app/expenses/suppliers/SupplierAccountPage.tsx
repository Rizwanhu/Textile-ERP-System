"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/currency";
import { useLocalSuppliers } from "@/context/LocalSuppliersContext";
import { SUPPLIER_STATUS_LABEL } from "@/lib/localSupplier";
import type { SupplierLineStatus } from "@/types/localSupplier";
import { RecordSupplierPaymentDialog } from "@/components/expenses/RecordSupplierPaymentDialog";
import { AddSupplierLineDialog } from "@/components/expenses/AddSupplierLineDialog";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default function SupplierAccountPage({ supplierId = "" }: { supplierId?: string } = {}) {
  const { getBundle, updateLineItemStatus, isLoading } = useLocalSuppliers();
  const bundle = getBundle(supplierId);
  const [payOpen, setPayOpen] = useState(false);
  const [lineOpen, setLineOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<SupplierLineStatus | "all">("all");

  const filteredLines = useMemo(() => {
    if (!bundle) return [];
    const lines = [...bundle.lineItems].sort((a, b) => a.serialNumber - b.serialNumber);
    if (statusFilter === "all") return lines;
    return lines.filter((l) => l.status === statusFilter);
  }, [bundle, statusFilter]);

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
        <h2 className="text-lg font-semibold text-foreground">Supplier not found</h2>
        <Button asChild variant="outline" size="sm" className="border-border">
          <Link href="/expenses/suppliers"><ArrowLeft className="mr-1 h-4 w-4" /> Back to suppliers</Link>
        </Button>
      </div>
    );
  }

  const { supplier, summary, payments, ledger } = bundle;
  const balanceTone = summary.balanceOutstanding > 0 ? "text-danger" : "text-success";

  return (
    <div className="mx-auto animate-fade-in space-y-6 p-4 lg:p-6" style={{ maxWidth: 1440 }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/expenses/suppliers" className="hover:text-foreground">Local suppliers</Link>
          <span className="opacity-40">/</span>
          <span className="text-foreground">{supplier.name}</span>
        </div>
        <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground">
          <Link href="/expenses/suppliers"><ArrowLeft className="h-4 w-4" /> Back</Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-surface-1 p-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{supplier.name}</h1>
            {supplier.address && <p className="mt-1 text-sm text-muted-foreground">{supplier.address}</p>}
            {supplier.contact && (
              <p className="mt-1 text-xs text-muted-foreground">
                {supplier.contact.name} · {supplier.contact.email} · {supplier.contact.phone}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-2 border-border" onClick={() => setLineOpen(true)}>
              <Plus className="h-4 w-4" /> Add purchase
            </Button>
            <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary-hover" onClick={() => setPayOpen(true)}>
              <Wallet className="h-4 w-4" /> Record payment
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-border md:grid-cols-4 md:divide-x">
          {[
            { label: "Total purchases", value: formatPKR(summary.totalPurchases) },
            { label: "Total paid", value: formatPKR(summary.totalPaid), tone: "text-success" },
            { label: "Balance due", value: formatPKR(summary.balanceOutstanding), tone: balanceTone },
            { label: "Purchase lines", value: String(summary.lineItemCount) },
          ].map(({ label, value, tone }) => (
            <div key={label} className="p-5">
              <div className="label-caption">{label}</div>
              <div className={cn("mt-1 text-lg font-semibold tabular", tone ?? "text-foreground")}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="purchases">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="mt-4 space-y-4">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-44 border-border bg-card"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {(Object.keys(SUPPLIER_STATUS_LABEL) as SupplierLineStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{SUPPLIER_STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-1">
                  <th className="label-caption px-4 py-2 text-left">#</th>
                  <th className="label-caption px-4 py-2 text-left">Description</th>
                  <th className="label-caption px-4 py-2 text-left">Order</th>
                  <th className="label-caption px-4 py-2 text-right">Qty</th>
                  <th className="label-caption px-4 py-2 text-right">Amount</th>
                  <th className="label-caption px-4 py-2 text-left">Date</th>
                  <th className="label-caption px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLines.map((l) => (
                  <tr key={l.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 tabular text-muted-foreground">{l.serialNumber}</td>
                    <td className="px-4 py-2.5 text-foreground">{l.description}</td>
                    <td className="px-4 py-2.5 mono text-xs text-muted-foreground">{l.orderId ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right tabular">{l.quantity} {l.unit}</td>
                    <td className="px-4 py-2.5 text-right tabular font-medium">{formatPKR(l.amount)}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{fmtDate(l.purchaseDate)}</td>
                    <td className="px-4 py-2.5">
                      <Select value={l.status} onValueChange={(v) => updateLineItemStatus(l.id, v as SupplierLineStatus)}>
                        <SelectTrigger className="h-8 w-36 border-border bg-surface-3 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(SUPPLIER_STATUS_LABEL) as SupplierLineStatus[]).map((s) => (
                            <SelectItem key={s} value={s}>{SUPPLIER_STATUS_LABEL[s]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-1">
                  <th className="label-caption px-4 py-2 text-left">Date</th>
                  <th className="label-caption px-4 py-2 text-left">Description</th>
                  <th className="label-caption px-4 py-2 text-right">Amount</th>
                  <th className="label-caption px-4 py-2 text-left">Reference</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 text-muted-foreground">{fmtDate(p.date)}</td>
                    <td className="px-4 py-2.5 text-foreground">{p.description}</td>
                    <td className="px-4 py-2.5 text-right tabular font-medium text-success">{formatPKR(p.amount)}</td>
                    <td className="px-4 py-2.5 mono text-xs text-muted-foreground">{p.reference ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="ledger" className="mt-4">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <table className="w-full text-sm">
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
                    <td className="px-4 py-2.5 text-muted-foreground">{fmtDate(e.date)}</td>
                    <td className="px-4 py-2.5 text-foreground">{e.description}</td>
                    <td className="px-4 py-2.5 text-right tabular">{e.debit ? formatPKR(e.debit) : "—"}</td>
                    <td className="px-4 py-2.5 text-right tabular text-success">{e.credit ? formatPKR(e.credit) : "—"}</td>
                    <td className={cn("px-4 py-2.5 text-right tabular font-medium", e.balance > 0 ? "text-danger" : "text-foreground")}>
                      {formatPKR(e.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      <RecordSupplierPaymentDialog open={payOpen} onOpenChange={setPayOpen} supplier={supplier} />
      <AddSupplierLineDialog open={lineOpen} onOpenChange={setLineOpen} supplier={supplier} />
    </div>
  );
}
