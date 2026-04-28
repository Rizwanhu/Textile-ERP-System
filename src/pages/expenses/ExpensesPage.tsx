import { useCallback, useMemo } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Wallet, Scissors, Shirt, CheckCircle2, Building2, Receipt,
  Plus, Download, ArrowRight, FileText, AlertTriangle, Package, Truck, Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/currency";
import {
  LOCAL_BUYER, CUTTING, STITCHING, FINISHING, FIXED_EXPENSES, ADMIN_EXPENSES,
  sumLocalBuyer, cuttingTotalCut, stitchingWages, sumFixed, sumAdmin, getExpenseTotals,
  type LocalBuyerLine, type FixedExpenseRow, type AdminExpenseRow,
} from "@/data/expenses";
import { generateExpensesPdf } from "@/lib/expensePdf";
import { NewExpenseDialog, type ExpenseCategory } from "@/components/expenses/NewExpenseDialog";
import { ExpenseDialogContext, useExpenseDialog } from "./expense-dialog-context";

/* ----------------------------- Tab definitions ---------------------------- */

const TABS = [
  { key: "local-buyer", label: "Local Buyer",   icon: Wallet,       to: "/expenses/local-buyer" },
  { key: "cutting",     label: "Cutting",       icon: Scissors,     to: "/expenses/cutting" },
  { key: "stitching",   label: "Stitching",     icon: Shirt,        to: "/expenses/stitching" },
  { key: "finishing",   label: "Finishing & QC",icon: CheckCircle2, to: "/expenses/finishing" },
  { key: "fixed",       label: "Fixed",         icon: Building2,    to: "/expenses/fixed" },
  { key: "admin",       label: "Admin",         icon: Receipt,      to: "/expenses/admin" },
] as const;

type TabKey = typeof TABS[number]["key"];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });

/* --------------------------------- Page ---------------------------------- */

export default function ExpensesPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const active = (TABS.find((t) => pathname.startsWith(t.to))?.key ?? "local-buyer") as TabKey;

  // URL-driven dialog state: ?new=<category> (or ?new for current tab)
  const newParam = searchParams.get("new");
  const dialogOpen = newParam !== null;
  const dialogCategory = (
    TABS.some((t) => t.key === newParam) ? (newParam as ExpenseCategory) : (active as ExpenseCategory)
  );

  const openDialog = useCallback(
    (category?: ExpenseCategory) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("new", category ?? active);
          return next;
        },
        { replace: false },
      );
    },
    [active, setSearchParams],
  );

  const closeDialog = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("new");
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const totals = useMemo(getExpenseTotals, []);
  const orderId = "ORD-2026-024";
  const orderClient = "Northwind Apparel";

  const tabAmount: Record<TabKey, number> = {
    "local-buyer": totals.buyer,
    cutting:       totals.cutting,
    stitching:     totals.stitching,
    finishing:     totals.finishing,
    fixed:         totals.fixed,
    admin:         totals.admin,
  };

  return (
   <ExpenseDialogContext.Provider value={{ open: dialogOpen, category: dialogCategory, openDialog, closeDialog }}>
    <div className="mx-auto max-w-[1440px] animate-fade-in space-y-6 p-4 lg:p-6">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/orders" className="hover:text-foreground">Orders</Link>
            <span className="opacity-40">/</span>
            <Link to={`/orders/${orderId}`} className="mono hover:text-foreground">{orderId}</Link>
            <span className="opacity-40">/</span>
            <span className="text-foreground">Expenses</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Expenses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Production cost tracking for <span className="text-foreground">{orderClient}</span> ·
            split across procurement, labour, fixed and admin overheads.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm"
            className="gap-2 border-border bg-card"
            onClick={() => generateExpensesPdf(orderId, orderClient)}
          >
            <Printer className="h-4 w-4" /> Print / PDF
          </Button>
          <Button
            size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary-hover"
            onClick={() => openDialog(active as ExpenseCategory)}
          >
            <Plus className="h-4 w-4" /> New Entry
          </Button>
        </div>
      </div>

      {/* Cost summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryTile label="Total expenses"  value={formatPKR(totals.grand)}                 sub="All sub-modules"      icon={Wallet}      tone="primary" />
        <SummaryTile label="Materials & buyer" value={formatPKR(totals.buyer)}              sub={`${LOCAL_BUYER.length} purchases`} icon={Package}     tone="info" />
        <SummaryTile label="Direct labour"   value={formatPKR(totals.cutting + totals.stitching + totals.finishing)} sub="Cut · Stitch · Finish" icon={Scissors}    tone="success" />
        <SummaryTile label="Overhead"        value={formatPKR(totals.fixed + totals.admin)} sub="Fixed + admin"        icon={Building2}   tone="violet" />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-card">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() => navigate(t.to)}
              className={cn(
                "group flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-surface-3/50 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
              <span className={cn(
                "ml-1 rounded-md px-1.5 py-0.5 text-[10px] tabular",
                isActive ? "bg-primary/20" : "bg-surface-3/60 group-hover:bg-surface-3",
              )}>
                {formatPKR(tabAmount[t.key])}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sub-module content */}
      {active === "local-buyer" && <LocalBuyerView />}
      {active === "cutting"     && <CuttingView />}
      {active === "stitching"   && <StitchingView />}
      {active === "finishing"   && <FinishingView />}
      {active === "fixed"       && <FixedView />}
      {active === "admin"       && <AdminView />}

      <NewExpenseDialog
        open={dialogOpen}
        onOpenChange={(o) => (o ? openDialog(dialogCategory) : closeDialog())}
        defaultCategory={dialogCategory}
      />
    </div>
   </ExpenseDialogContext.Provider>
  );
}

/* ----------------------------- Shared atoms ------------------------------ */

const TONE: Record<string, string> = {
  primary: "bg-primary/15 text-primary",
  info:    "bg-info/15 text-info",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger:  "bg-danger/15 text-danger",
  violet:  "bg-violet/15 text-violet",
};

function SummaryTile({
  label, value, sub, icon: Icon, tone,
}: { label: string; value: string; sub?: string; icon: typeof Wallet; tone: keyof typeof TONE }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", TONE[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 label-caption">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular text-foreground">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function SectionCard({ title, subtitle, action, children }: {
  title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

/* ============================== 3A · Local Buyer ============================== */
function LocalBuyerView() {
  const total = sumLocalBuyer(LOCAL_BUYER);
  const totalQty = LOCAL_BUYER.reduce((s, r) => s + r.qty, 0);
  const { openDialog } = useExpenseDialog();
  return (
    <div className="space-y-6">
      <SectionCard
        title="Local buyer sheet"
        subtitle={`${LOCAL_BUYER.length} purchases · total qty ${totalQty.toLocaleString()}`}
        action={
          <Button size="sm" variant="outline" className="gap-1.5 border-border bg-card" onClick={() => openDialog("local-buyer")}>
            <Plus className="h-3.5 w-3.5" /> Add row
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-surface-1 hover:bg-surface-1">
                <TableHead className="label-caption">Supplier</TableHead>
                <TableHead className="label-caption">Item</TableHead>
                <TableHead className="label-caption text-right">Qty</TableHead>
                <TableHead className="label-caption text-right">Rate</TableHead>
                <TableHead className="label-caption text-right">Total</TableHead>
                <TableHead className="label-caption">Date</TableHead>
                <TableHead className="label-caption">Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LOCAL_BUYER.map((r: LocalBuyerLine) => (
                <TableRow key={r.id} className="border-border">
                  <TableCell className="font-medium text-foreground">{r.supplier}</TableCell>
                  <TableCell>
                    <div className="text-foreground">{r.item}</div>
                    {r.notes && <div className="mt-0.5 text-xs text-muted-foreground">{r.notes}</div>}
                  </TableCell>
                  <TableCell className="text-right tabular text-foreground">
                    {r.qty.toLocaleString()} <span className="text-xs text-muted-foreground">{r.unit}</span>
                  </TableCell>
                  <TableCell className="text-right tabular text-muted-foreground">{formatPKR(r.rate)}</TableCell>
                  <TableCell className="text-right tabular font-medium text-foreground">{formatPKR(r.qty * r.rate)}</TableCell>
                  <TableCell className="text-muted-foreground">{fmtDate(r.date)}</TableCell>
                  <TableCell className="mono text-xs text-muted-foreground">{r.invoice}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <tfoot>
              <tr className="border-t border-border bg-surface-1">
                <td className="px-4 py-3 label-caption" colSpan={4}>Total purchases</td>
                <td className="px-4 py-3 text-right tabular font-semibold text-foreground">{formatPKR(total)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}

/* ============================== 3B · Cutting ================================ */
function CuttingView() {
  const cutTotal = cuttingTotalCut(CUTTING);
  const leftover = +(CUTTING.receivedKg - CUTTING.wastageKg).toFixed(1);
  const wastagePct = +((CUTTING.wastageKg / CUTTING.receivedKg) * 100).toFixed(1);
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <SectionCard title="Cutting per size" subtitle={`Total cut ${cutTotal.toLocaleString()} pcs`}>
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-surface-1 hover:bg-surface-1">
                <TableHead className="label-caption">Size</TableHead>
                <TableHead className="label-caption text-right">Pieces cut</TableHead>
                <TableHead className="label-caption text-right">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CUTTING.cutPerSize.map((r) => {
                const share = +((r.qty / cutTotal) * 100).toFixed(1);
                return (
                  <TableRow key={r.size} className="border-border">
                    <TableCell className="mono text-foreground">{r.size}</TableCell>
                    <TableCell className="text-right tabular text-foreground">{r.qty.toLocaleString()}</TableCell>
                    <TableCell className="w-[280px]">
                      <div className="flex items-center justify-end gap-3">
                        <Progress value={share} className="h-1.5 w-40 bg-surface-3" />
                        <span className="w-12 text-right text-xs tabular text-muted-foreground">{share}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <tfoot>
              <tr className="border-t border-border bg-surface-1">
                <td className="px-4 py-3 label-caption">Total</td>
                <td className="px-4 py-3 text-right tabular font-semibold text-foreground">{cutTotal.toLocaleString()}</td>
                <td />
              </tr>
            </tfoot>
          </Table>
        </SectionCard>

        {CUTTING.notes && (
          <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground shadow-card">
            <span className="font-semibold text-foreground">Notes · </span>{CUTTING.notes}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <KvCard
          title="Material flow"
          rows={[
            { label: "Received for cutting", value: `${CUTTING.receivedKg} kg` },
            { label: "Wastage", value: `${CUTTING.wastageKg} kg`, tone: wastagePct > 6 ? "text-danger" : "text-warning" },
            { label: "Wastage %", value: `${wastagePct}%`,         tone: wastagePct > 6 ? "text-danger" : "text-warning" },
            { label: "Material left", value: `${leftover} kg`,    tone: "text-success" },
          ]}
        />
        <KvCard
          title="Labour & schedule"
          rows={[
            { label: "Team", value: CUTTING.cutterTeam },
            { label: "Date", value: fmtDate(CUTTING.date) },
            { label: "Cutting wages", value: formatPKR(CUTTING.wages), tone: "text-foreground" },
          ]}
        />
      </div>
    </div>
  );
}

/* ============================== 3C · Stitching ============================== */
function StitchingView() {
  const wages = stitchingWages(STITCHING);
  const yieldPct = +((STITCHING.stitched / STITCHING.sent) * 100).toFixed(1);
  const rejectPct = +((STITCHING.rejected / STITCHING.stitched) * 100).toFixed(2);
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <SectionCard title="Production output" subtitle={`Yield ${yieldPct}% · reject rate ${rejectPct}%`}>
          <div className="grid gap-0 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
            <Stat label="Sent for stitching" value={STITCHING.sent.toLocaleString()} sub="pcs" />
            <Stat label="Pieces stitched"    value={STITCHING.stitched.toLocaleString()} sub="pcs" tone="text-success" />
            <Stat label="Rejected / rework"  value={STITCHING.rejected.toLocaleString()} sub={`${rejectPct}% of stitched`} tone="text-danger" />
          </div>
        </SectionCard>

        {STITCHING.notes && (
          <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground shadow-card">
            <span className="font-semibold text-foreground">Notes · </span>{STITCHING.notes}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <KvCard
          title="Wages"
          rows={[
            { label: "Rate per piece", value: formatPKR(STITCHING.rate) },
            { label: "Pieces stitched", value: STITCHING.stitched.toLocaleString() },
            { label: "Total wages",    value: formatPKR(wages), tone: "text-foreground" },
          ]}
        />
        <KvCard
          title="Schedule"
          rows={[
            { label: "Team", value: STITCHING.team },
            { label: "Start", value: fmtDate(STITCHING.startDate) },
            { label: "Completed", value: fmtDate(STITCHING.endDate) },
          ]}
        />
      </div>
    </div>
  );
}

/* ============================== 3D · Finishing ============================== */
function FinishingView() {
  const passPct = +((FINISHING.qcPass / FINISHING.receivedPcs) * 100).toFixed(1);
  const failPct = +((FINISHING.qcFail / FINISHING.receivedPcs) * 100).toFixed(1);
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <SectionCard title="Finishing pipeline" subtitle={`${FINISHING.receivedPcs.toLocaleString()} pcs received`}>
          <div className="grid gap-0 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 md:grid-cols-3">
            <PipelineStat label="Ironing"  value={FINISHING.ironed} of={FINISHING.receivedPcs} />
            <PipelineStat label="Tagging"  value={FINISHING.tagged} of={FINISHING.receivedPcs} />
            <PipelineStat label="Packing"  value={FINISHING.packed} of={FINISHING.receivedPcs} />
          </div>
        </SectionCard>

        <SectionCard
          title="Quality check"
          subtitle={`Pass ${passPct}% · fail ${failPct}%`}
          action={<Badge variant="secondary" className={cn("border-0", passPct >= 95 ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>{passPct}% pass</Badge>}
        >
          <div className="grid gap-0 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
            <Stat label="QC pass" value={FINISHING.qcPass.toLocaleString()} sub={`${passPct}%`} tone="text-success" />
            <Stat label="QC fail" value={FINISHING.qcFail.toLocaleString()} sub={`${failPct}%`} tone="text-danger" />
          </div>
          <div className="border-t border-border p-5">
            <div className="label-caption mb-2">Defect categories</div>
            <div className="flex flex-wrap gap-2">
              {FINISHING.defects.map((d) => (
                <Badge key={d} variant="secondary" className="border-0 bg-danger/15 text-danger">
                  <AlertTriangle className="mr-1 h-3 w-3" /> {d}
                </Badge>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="space-y-4">
        <KvCard
          title="Finishing wages"
          rows={[
            { label: "Wages", value: formatPKR(FINISHING.wages), tone: "text-foreground" },
            { label: "Inspector", value: FINISHING.inspector },
            { label: "Date", value: fmtDate(FINISHING.date) },
          ]}
        />
        {FINISHING.notes && (
          <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground shadow-card">
            <span className="font-semibold text-foreground">Notes · </span>{FINISHING.notes}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================== 3E · Fixed ================================== */
function FixedView() {
  const totalMonthly = FIXED_EXPENSES.reduce((s, r) => s + r.monthly, 0);
  const totalAlloc = sumFixed(FIXED_EXPENSES);
  const allocPct = +((totalAlloc / totalMonthly) * 100).toFixed(1);
  return (
    <div className="space-y-6">
      <SectionCard
        title="Fixed expense allocation"
        subtitle={`This order absorbs ${allocPct}% of monthly fixed cost`}
        action={
          <Button asChild size="sm" variant="ghost" className="text-primary">
            <Link to="/settings"><FileText className="mr-1 h-3.5 w-3.5" /> Manage templates</Link>
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-surface-1 hover:bg-surface-1">
              <TableHead className="label-caption">Category</TableHead>
              <TableHead className="label-caption text-right">Monthly</TableHead>
              <TableHead className="label-caption text-right">Allocated to order</TableHead>
              <TableHead className="label-caption">Share</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {FIXED_EXPENSES.map((r: FixedExpenseRow) => {
              const share = +((r.allocated / r.monthly) * 100).toFixed(1);
              return (
                <TableRow key={r.id} className="border-border">
                  <TableCell className="font-medium text-foreground">
                    {r.category}
                    {r.notes && <div className="mt-0.5 text-xs text-muted-foreground">{r.notes}</div>}
                  </TableCell>
                  <TableCell className="text-right tabular text-muted-foreground">{formatPKR(r.monthly)}</TableCell>
                  <TableCell className="text-right tabular font-medium text-foreground">{formatPKR(r.allocated)}</TableCell>
                  <TableCell className="w-[220px]">
                    <div className="flex items-center gap-3">
                      <Progress value={share} className="h-1.5 flex-1 bg-surface-3" />
                      <span className="w-10 text-right text-xs tabular text-muted-foreground">{share}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <tfoot>
            <tr className="border-t border-border bg-surface-1">
              <td className="px-4 py-3 label-caption">Totals</td>
              <td className="px-4 py-3 text-right tabular text-muted-foreground">{formatPKR(totalMonthly)}</td>
              <td className="px-4 py-3 text-right tabular font-semibold text-foreground">{formatPKR(totalAlloc)}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{allocPct}% avg</td>
            </tr>
          </tfoot>
        </Table>
      </SectionCard>
    </div>
  );
}

/* ============================== 3F · Admin ================================== */
function AdminView() {
  const total = sumAdmin(ADMIN_EXPENSES);
  const { openDialog } = useExpenseDialog();
  return (
    <div className="space-y-6">
      <SectionCard
        title="Admin & overhead expenses"
        subtitle={`${ADMIN_EXPENSES.length} entries`}
        action={
          <Button size="sm" variant="outline" className="gap-1.5 border-border bg-card" onClick={() => openDialog("admin")}>
            <Plus className="h-3.5 w-3.5" /> Add expense
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-surface-1 hover:bg-surface-1">
              <TableHead className="label-caption">Category</TableHead>
              <TableHead className="label-caption">Date</TableHead>
              <TableHead className="label-caption">Notes</TableHead>
              <TableHead className="label-caption text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ADMIN_EXPENSES.map((r: AdminExpenseRow) => (
              <TableRow key={r.id} className="border-border">
                <TableCell className="font-medium text-foreground">{r.category}</TableCell>
                <TableCell className="text-muted-foreground">{fmtDate(r.date)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.notes ?? "—"}</TableCell>
                <TableCell className="text-right tabular font-medium text-foreground">{formatPKR(r.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <tfoot>
            <tr className="border-t border-border bg-surface-1">
              <td colSpan={3} className="px-4 py-3 label-caption">Total admin expenses</td>
              <td className="px-4 py-3 text-right tabular font-semibold text-foreground">{formatPKR(total)}</td>
            </tr>
          </tfoot>
        </Table>
      </SectionCard>
    </div>
  );
}

/* ----------------------------- Tiny helpers ------------------------------ */

function Stat({ label, value, sub, tone = "text-foreground" }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="p-5">
      <div className="label-caption">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold tabular", tone)}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function PipelineStat({ label, value, of }: { label: string; value: number; of: number }) {
  const pct = +((value / of) * 100).toFixed(1);
  return (
    <div className="p-5">
      <div className="flex items-center justify-between">
        <span className="label-caption">{label}</span>
        <span className="text-xs tabular text-muted-foreground">{pct}%</span>
      </div>
      <div className="mt-1 text-xl font-semibold tabular text-foreground">{value.toLocaleString()}</div>
      <Progress value={pct} className="mt-2 h-1.5 bg-surface-3 [&>div]:bg-success" />
    </div>
  );
}

function KvCard({ title, rows }: { title: string; rows: { label: string; value: string; tone?: string }[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <dl className="mt-4 space-y-3 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-4">
            <dt className="text-xs text-muted-foreground">{r.label}</dt>
            <dd className={cn("text-right tabular font-medium", r.tone ?? "text-foreground")}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
