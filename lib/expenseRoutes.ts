import type { ExpenseCategory } from "@/components/expenses/NewExpenseDialog";

const VALID_TABS: ExpenseCategory[] = [
  "local-buyer",
  "cutting",
  "stitching",
  "finishing",
  "fixed",
  "admin",
];

/** Sidebar category pages that show all-orders rollups (not Local Suppliers). */
export const OVERVIEW_TABS: ExpenseCategory[] = [
  "cutting",
  "stitching",
  "finishing",
  "fixed",
  "admin",
];

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  "local-buyer": "Local Supplier",
  cutting: "Cutting",
  stitching: "Stitching",
  finishing: "Finishing & QC",
  fixed: "Fixed Expenses",
  admin: "Admin Expenses",
};

export function parseExpenseTab(value?: string | null): ExpenseCategory {
  if (value && VALID_TABS.includes(value as ExpenseCategory)) {
    return value as ExpenseCategory;
  }
  return "local-buyer";
}

export function isOverviewTab(value?: string | null): value is ExpenseCategory {
  return !!value && OVERVIEW_TABS.includes(value as ExpenseCategory);
}

export function expenseTabPath(tab: ExpenseCategory): string {
  return `/expenses/${tab}`;
}

export function orderExpensePath(orderId: string, tab: ExpenseCategory, from?: string): string {
  const qs = new URLSearchParams({ tab });
  if (from) qs.set("from", from);
  return `/expenses/orders/${orderId}?${qs.toString()}`;
}
