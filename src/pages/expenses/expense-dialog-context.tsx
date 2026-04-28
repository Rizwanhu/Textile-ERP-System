import { createContext, useContext } from "react";
import type { ExpenseCategory } from "@/components/expenses/NewExpenseDialog";

type Ctx = {
  open: boolean;
  category: ExpenseCategory;
  openDialog: (category?: ExpenseCategory) => void;
  closeDialog: () => void;
};

export const ExpenseDialogContext = createContext<Ctx | null>(null);

export function useExpenseDialog(): Ctx {
  const ctx = useContext(ExpenseDialogContext);
  if (!ctx) throw new Error("useExpenseDialog must be used inside <ExpensesPage />");
  return ctx;
}
