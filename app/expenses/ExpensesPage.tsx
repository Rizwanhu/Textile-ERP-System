"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Plus, Download, ArrowRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPKR } from "@/lib/currency";
import { getExpenseTotals } from "@/data/expenses";
import { NewExpenseDialog, type ExpenseCategory } from "@/components/expenses/NewExpenseDialog";
import { ExpenseDialogContext } from "./expense-dialog-context";
import { generateExpensesPdf } from "@/lib/expensePdf";
import { ExpenseCategoryPanels, EXPENSE_TABS } from "@/components/expenses/ExpenseCategoryPanels";
import { expenseTabPath, parseExpenseTab } from "@/lib/expenseRoutes";

const TAB_ICONS: Record<ExpenseCategory, string> = {
  "local-buyer": "💼",
  cutting: "✂️",
  stitching: "🧵",
  finishing: "✅",
  fixed: "🏢",
  admin: "🧾",
};

type Props = {
  /** Override tab from route param */
  pathTab?: string;
  orderId?: string;
  orderLabel?: string;
  backHref?: string;
};

export function ExpensesPage({ pathTab, orderId, orderLabel, backHref }: Props = {}) {
  const router = useRouter();
  const params = useParams();
  const routeTab = pathTab ?? (params?.tab as string | undefined);
  const tab = parseExpenseTab(routeTab);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogCategory, setDialogCategory] = useState<ExpenseCategory>(tab);
  const totals = useMemo(() => getExpenseTotals(), []);

  const setTab = useCallback(
    (next: ExpenseCategory) => {
      if (orderId) {
        router.replace(`/expenses/orders/${orderId}?tab=${next}`);
        return;
      }
      router.replace(expenseTabPath(next));
    },
    [orderId, router],
  );

  const openDialog = useCallback(
    (category: ExpenseCategory = tab) => {
      setDialogCategory(category);
      setDialogOpen(true);
    },
    [tab],
  );

  const closeDialog = useCallback(() => setDialogOpen(false), []);

  const displayOrder = orderId ?? "ORD-2026-024";
  const displayLabel = orderLabel ?? "Crew Neck Tee — Northwind Apparel";

  return (
    <ExpenseDialogContext.Provider value={{ open: dialogOpen, category: dialogCategory, openDialog, closeDialog }}>
      <div className="mx-auto animate-fade-in space-y-6 p-4 lg:p-6" style={{ maxWidth: 1440 }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{displayOrder}</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Production Expenses</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {orderId
                ? `Expense breakdown for ${displayLabel}.`
                : "Track procurement, cutting, stitching, finishing, fixed and admin costs."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {backHref && (
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                <Link href={backHref}>← Back to orders</Link>
              </Button>
            )}
            <Button variant="outline" className="gap-2 border-border" onClick={() => generateExpensesPdf()}>
              <Download className="h-4 w-4" /> Export PDF
            </Button>
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary-hover" onClick={() => openDialog()}>
              <Plus className="h-4 w-4" /> Add expense
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Procurement", value: totals.buyer },
            { label: "Cutting + Stitching", value: totals.cutting + totals.stitching },
            { label: "Finishing + Fixed", value: totals.finishing + totals.fixed },
            { label: "Grand total", value: totals.grand },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-border bg-card p-4 shadow-card">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="mt-1 text-xl font-bold tabular text-foreground">{formatPKR(kpi.value)}</p>
            </div>
          ))}
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as ExpenseCategory)}>
          <TabsList className="h-auto flex-wrap justify-start gap-1 bg-surface-2 p-1">
            {EXPENSE_TABS.map(({ key, label }) => (
              <TabsTrigger key={key} value={key} className="gap-1.5 data-[state=active]:bg-card">
                <span>{TAB_ICONS[key]}</span> {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-4">
            <ExpenseCategoryPanels tab={tab} orderLabel={orderLabel} />
          </div>
        </Tabs>

        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">Linked production order</p>
              <p className="text-xs text-muted-foreground">{displayLabel}</p>
            </div>
          </div>
          <Link
            href={`/orders/${displayOrder}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover"
          >
            View order <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <NewExpenseDialog open={dialogOpen} onOpenChange={setDialogOpen} defaultCategory={dialogCategory} />
    </ExpenseDialogContext.Provider>
  );
}
