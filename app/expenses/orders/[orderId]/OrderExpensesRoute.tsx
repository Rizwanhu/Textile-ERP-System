"use client";

import { useSearchParams } from "next/navigation";
import { ExpensesPage } from "@/app/expenses/ExpensesPage";
import { useOrders } from "@/context/OrdersContext";
import { parseExpenseTab } from "@/lib/expenseRoutes";

export default function OrderExpensesRoute({ orderId }: { orderId: string }) {
  const searchParams = useSearchParams();
  const tab = parseExpenseTab(searchParams.get("tab"));
  const { orders } = useOrders();
  const order = orders.find((o) => o.id === orderId);

  return (
    <ExpensesPage
      pathTab={tab}
      orderId={orderId}
      orderLabel={order ? `${order.product} — ${order.client}` : orderId}
      backHref="/expenses/orders"
    />
  );
}
