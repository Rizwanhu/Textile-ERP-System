"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Search, Users, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { useLocalSuppliers } from "@/context/LocalSuppliersContext";
import { formatPKR } from "@/lib/currency";
import { supplierRouteId } from "@/lib/localSupplier";

export default function SuppliersListPage() {
  const router = useRouter();
  const { getSupplierSummaries, isLoading } = useLocalSuppliers();
  const [query, setQuery] = useState("");
  const summaries = getSupplierSummaries();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return summaries.filter(({ supplier }) =>
      !q || supplier.name.toLowerCase().includes(q),
    );
  }, [summaries, query]);

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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Local Supplier Accounts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track purchases, payments, and outstanding balances for local suppliers — like client accounts for export orders.
          </p>
        </div>
        <Button asChild variant="outline" className="border-border">
          <Link href="/expenses/orders">Order expenses →</Link>
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search supplier name…"
          className="border-border bg-card pl-9"
        />
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-1">
              <th className="label-caption px-5 py-2.5 text-left">Supplier</th>
              <th className="label-caption px-5 py-2.5 text-right">Purchase lines</th>
              <th className="label-caption px-5 py-2.5 text-right">Total purchases</th>
              <th className="label-caption px-5 py-2.5 text-right">Paid</th>
              <th className="label-caption px-5 py-2.5 text-right">Balance due</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ supplier, summary }) => (
              <tr
                key={supplier.id}
                onClick={() => router.push(`/expenses/suppliers/${supplierRouteId(supplier)}`)}
                className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-surface-3/40"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-foreground">{supplier.name}</div>
                      {supplier.contact && (
                        <div className="text-xs text-muted-foreground">{supplier.contact.phone}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-right tabular">{summary.lineItemCount}</td>
                <td className="px-5 py-3 text-right tabular font-medium">{formatPKR(summary.totalPurchases)}</td>
                <td className="px-5 py-3 text-right tabular text-success">{formatPKR(summary.totalPaid)}</td>
                <td className={`px-5 py-3 text-right tabular font-semibold ${summary.balanceOutstanding > 0 ? "text-danger" : "text-success"}`}>
                  {formatPKR(summary.balanceOutstanding)}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                  <Wallet className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  No suppliers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
