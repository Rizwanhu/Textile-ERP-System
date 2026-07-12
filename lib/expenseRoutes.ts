import type { ExpenseCategory } from "@/components/expenses/NewExpenseDialog";

const VALID_TABS: ExpenseCategory[] = [
  "local-buyer",
  "cutting",
  "stitching",
  "finishing",
  "fixed",
  "admin",
];

export function parseExpenseTab(value?: string | null): ExpenseCategory {
  if (value && VALID_TABS.includes(value as ExpenseCategory)) {
    return value as ExpenseCategory;
  }
  return "local-buyer";
}

export function expenseTabPath(tab: ExpenseCategory): string {
  return `/expenses/${tab}`;
}
