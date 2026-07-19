"use client";

import { useSearchParams } from "next/navigation";
import { ExpensesPage } from "@/app/expenses/ExpensesPage";
import { useOrders } from "@/context/OrdersContext";
import { parseExpenseTab } from "@/lib/expenseRoutes";

export default function OrderExpensesRoute({ orderId }: { orderId: string }) {
  const searchParams = useSearchParams();
  const tab = parseExpenseTab(searchParams.get("tab"));
  const from = searchParams.get("from");
  const { orders } = useOrders();
  const order = orders.find((o) => o.id === orderId);

  const backHref =
    from && from.startsWith("/expenses/") && !from.includes("..") ? from : "/expenses/orders";

  return (
    <ExpensesPage
      pathTab={tab}
      orderId={orderId}
      order={order}
      orderLabel={order ? `${order.product} — ${order.client}` : orderId}
      backHref={backHref}
    />
  );
}
