"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/currency";
import {
  LOCAL_BUYER, CUTTING, STITCHING, FINISHING, FIXED_EXPENSES, ADMIN_EXPENSES,
  sumLocalBuyer, cuttingTotalCut, stitchingWages, sumFixed, sumAdmin,
} from "@/data/expenses";
import type { ExpenseCategory } from "@/components/expenses/NewExpenseDialog";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });

type Props = {
  tab: ExpenseCategory;
  orderLabel?: string;
};

export function ExpenseCategoryPanels({ tab, orderLabel }: Props) {
  return (
    <>
      {tab === "local-buyer" && (
        <Section title={`Local Supplier sheet${orderLabel ? ` · ${orderLabel}` : ""}`} total={sumLocalBuyer(LOCAL_BUYER)}>
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-1 hover:bg-surface-1">
                <TableHead>Supplier</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LOCAL_BUYER.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.supplier}</TableCell>
                  <TableCell>{row.item}</TableCell>
                  <TableCell className="text-right tabular">{row.qty} {row.unit}</TableCell>
                  <TableCell className="text-right tabular">{formatPKR(row.rate)}</TableCell>
                  <TableCell className="text-right tabular font-medium">{formatPKR(row.qty * row.rate)}</TableCell>
                  <TableCell className="text-muted-foreground">{fmtDate(row.date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>
      )}

      {tab === "cutting" && (
        <Section title="Cutting sheet" total={CUTTING.wages}>
          <div className="grid gap-4 md:grid-cols-2">
            <Info label="Material received" value={`${CUTTING.receivedKg} kg`} />
            <Info label="Total cut" value={`${cuttingTotalCut(CUTTING)} pcs`} />
            <Info label="Wastage" value={`${CUTTING.wastageKg} kg`} />
            <Info label="Team" value={CUTTING.cutterTeam} />
            <Info label="Date" value={fmtDate(CUTTING.date)} />
            <Info label="Wages" value={formatPKR(CUTTING.wages)} />
          </div>
        </Section>
      )}

      {tab === "stitching" && (
        <Section title="Stitching sheet" total={stitchingWages(STITCHING)}>
          <div className="grid gap-4 md:grid-cols-2">
            <Info label="Pieces sent" value={STITCHING.sent.toLocaleString()} />
            <Info label="Stitched" value={STITCHING.stitched.toLocaleString()} />
            <Info label="Rejected" value={STITCHING.rejected.toLocaleString()} />
            <Info label="Rate / pc" value={formatPKR(STITCHING.rate)} />
            <Info label="Team" value={STITCHING.team} />
            <Info label="Period" value={`${fmtDate(STITCHING.startDate)} → ${fmtDate(STITCHING.endDate)}`} />
          </div>
        </Section>
      )}

      {tab === "finishing" && (
        <Section title="Finishing & QC" total={FINISHING.wages}>
          <div className="grid gap-4 md:grid-cols-2">
            <Info label="Received" value={FINISHING.receivedPcs.toLocaleString()} />
            <Info label="QC pass / fail" value={`${FINISHING.qcPass} / ${FINISHING.qcFail}`} />
            <Info label="Packed" value={FINISHING.packed.toLocaleString()} />
            <Info label="Inspector" value={FINISHING.inspector} />
            <Info label="Defects" value={FINISHING.defects.join(", ")} />
            <Info label="Date" value={fmtDate(FINISHING.date)} />
          </div>
        </Section>
      )}

      {tab === "fixed" && (
        <Section title="Fixed expenses" total={sumFixed(FIXED_EXPENSES)}>
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-1 hover:bg-surface-1">
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Monthly</TableHead>
                <TableHead className="text-right">Allocated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FIXED_EXPENSES.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.category}</TableCell>
                  <TableCell className="text-right tabular">{formatPKR(row.monthly)}</TableCell>
                  <TableCell className="text-right tabular font-medium">{formatPKR(row.allocated)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>
      )}

      {tab === "admin" && (
        <Section title="Admin expenses" total={sumAdmin(ADMIN_EXPENSES)}>
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-1 hover:bg-surface-1">
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ADMIN_EXPENSES.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.category}</TableCell>
                  <TableCell className="text-right tabular font-medium">{formatPKR(row.amount)}</TableCell>
                  <TableCell className="text-muted-foreground">{fmtDate(row.date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>
      )}
    </>
  );
}

function Section({ title, total, children }: { title: string; total: number; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <Badge variant="outline" className="tabular border-border">{formatPKR(total)}</Badge>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface-1 px-4 py-3")}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export const EXPENSE_TABS: { key: ExpenseCategory; label: string }[] = [
  { key: "local-buyer", label: "Local Supplier" },
  { key: "cutting", label: "Cutting" },
  { key: "stitching", label: "Stitching" },
  { key: "finishing", label: "Finishing" },
  { key: "fixed", label: "Fixed" },
  { key: "admin", label: "Admin" },
];
