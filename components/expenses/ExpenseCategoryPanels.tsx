"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/currency";
import {
  LOCAL_BUYER, CUTTING, STITCHING, FINISHING,
  sumLocalBuyer, cuttingTotalCut, stitchingWages, sumFixed, sumAdmin,
  adminForOrder, fixedForOrder,
} from "@/data/expenses";
import type { ExpenseCategory } from "@/components/expenses/NewExpenseDialog";
import type { Order } from "@/data/orders";
import { getOrderWorkflow } from "@/data/workflow";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });

type Props = {
  tab: ExpenseCategory;
  orderId?: string;
  order?: Order;
  orderLabel?: string;
};

export function ExpenseCategoryPanels({ tab, orderId, order, orderLabel }: Props) {
  const wf = order ? getOrderWorkflow(order) : orderId ? getOrderWorkflow(orderId) : undefined;
  const stage = wf?.stages.find((s) => s.key === tab);
  const titleSuffix = orderLabel ? ` · ${orderLabel}` : orderId ? ` · ${orderId}` : "";

  if (tab === "local-buyer") {
    const cost = stage?.cost ?? sumLocalBuyer(LOCAL_BUYER);
    const showDemo = !orderId || orderId === "ORD-2026-024";
    return (
      <Section title={`Local Supplier sheet${titleSuffix}`} total={cost}>
        {showDemo ? (
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
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Info label="Procurement spend" value={formatPKR(cost)} />
            {stage?.meta?.map((m) => (
              <Info key={m.label} label={m.label} value={m.value} />
            ))}
            {stage && (
              <>
                <Info label={stage.handoff.inputLabel} value={stage.handoff.inputValue} />
                <Info label={stage.handoff.outputLabel} value={stage.handoff.outputValue} />
              </>
            )}
          </div>
        )}
      </Section>
    );
  }

  if (tab === "cutting") {
    const cost = stage?.cost ?? CUTTING.wages;
    const showDemo = !orderId || orderId === "ORD-2026-024";
    return (
      <Section title={`Cutting sheet${titleSuffix}`} total={cost}>
        {showDemo ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Info label="Material received" value={`${CUTTING.receivedKg} kg`} />
            <Info label="Total cut" value={`${cuttingTotalCut(CUTTING)} pcs`} />
            <Info label="Wastage" value={`${CUTTING.wastageKg} kg`} />
            <Info label="Team" value={CUTTING.cutterTeam} />
            <Info label="Date" value={fmtDate(CUTTING.date)} />
            <Info label="Wages" value={formatPKR(CUTTING.wages)} />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Info label={stage?.handoff.inputLabel ?? "Fabric received"} value={stage?.handoff.inputValue ?? "—"} />
            <Info label={stage?.handoff.outputLabel ?? "Pieces cut"} value={stage?.handoff.outputValue ?? "—"} />
            <Info label="Wastage" value={stage?.meta?.[0]?.value ?? "—"} />
            <Info label="Cutting wages" value={formatPKR(cost)} />
            <Info label="Status" value={stage?.status ?? "—"} />
            {stage?.blocker && <Info label="Blocker" value={stage.blocker} />}
          </div>
        )}
      </Section>
    );
  }

  if (tab === "stitching") {
    const cost = stage?.cost ?? stitchingWages(STITCHING);
    const showDemo = !orderId || orderId === "ORD-2026-024";
    return (
      <Section title={`Stitching sheet${titleSuffix}`} total={cost}>
        {showDemo ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Info label="Pieces sent" value={STITCHING.sent.toLocaleString()} />
            <Info label="Stitched" value={STITCHING.stitched.toLocaleString()} />
            <Info label="Rejected" value={STITCHING.rejected.toLocaleString()} />
            <Info label="Rate / pc" value={formatPKR(STITCHING.rate)} />
            <Info label="Team" value={STITCHING.team} />
            <Info label="Period" value={`${fmtDate(STITCHING.startDate)} → ${fmtDate(STITCHING.endDate)}`} />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Info label={stage?.handoff.inputLabel ?? "Sent"} value={stage?.handoff.inputValue ?? "—"} />
            <Info label={stage?.handoff.outputLabel ?? "Stitched"} value={stage?.handoff.outputValue ?? "—"} />
            <Info label="Rejected" value={stage?.meta?.[0]?.value ?? "—"} />
            <Info label="Stitching wages" value={formatPKR(cost)} />
            <Info label="Status" value={stage?.status ?? "—"} />
            {stage?.blocker && <Info label="Blocker" value={stage.blocker} />}
          </div>
        )}
      </Section>
    );
  }

  if (tab === "finishing") {
    const cost = stage?.cost ?? FINISHING.wages;
    const showDemo = !orderId || orderId === "ORD-2026-024";
    return (
      <Section title={`Finishing & QC${titleSuffix}`} total={cost}>
        {showDemo ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Info label="Received" value={FINISHING.receivedPcs.toLocaleString()} />
            <Info label="QC pass / fail" value={`${FINISHING.qcPass} / ${FINISHING.qcFail}`} />
            <Info label="Packed" value={FINISHING.packed.toLocaleString()} />
            <Info label="Inspector" value={FINISHING.inspector} />
            <Info label="Defects" value={FINISHING.defects.join(", ")} />
            <Info label="Date" value={fmtDate(FINISHING.date)} />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Info label={stage?.handoff.inputLabel ?? "Received"} value={stage?.handoff.inputValue ?? "—"} />
            <Info label={stage?.handoff.outputLabel ?? "Packed"} value={stage?.handoff.outputValue ?? "—"} />
            <Info label="QC failed" value={stage?.meta?.[0]?.value ?? "—"} />
            <Info label="Finishing wages" value={formatPKR(cost)} />
            <Info label="Status" value={stage?.status ?? "—"} />
            {stage?.blocker && <Info label="Blocker" value={stage.blocker} />}
          </div>
        )}
      </Section>
    );
  }

  if (tab === "fixed") {
    const rows = orderId && order ? fixedForOrder(orderId, order.qty) : fixedForOrder(orderId ?? "ORD-2026-024", order?.qty ?? 1200);
    return (
      <Section title={`Fixed expenses${titleSuffix}`} total={sumFixed(rows)}>
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-1 hover:bg-surface-1">
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Monthly</TableHead>
              <TableHead className="text-right">Allocated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.category}</TableCell>
                <TableCell className="text-right tabular">{formatPKR(row.monthly)}</TableCell>
                <TableCell className="text-right tabular font-medium">{formatPKR(row.allocated)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>
    );
  }

  if (tab === "admin") {
    const rows = orderId && order ? adminForOrder(orderId, order.qty) : adminForOrder(orderId ?? "ORD-2026-024", order?.qty ?? 1200);
    return (
      <Section title={`Admin expenses${titleSuffix}`} total={sumAdmin(rows)}>
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-1 hover:bg-surface-1">
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.category}</TableCell>
                <TableCell className="text-right tabular font-medium">{formatPKR(row.amount)}</TableCell>
                <TableCell className="text-muted-foreground">{fmtDate(row.date)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>
    );
  }

  return null;
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
