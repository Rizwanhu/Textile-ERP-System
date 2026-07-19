import type { Order } from "@/data/orders";
import type { ExpenseCategory } from "@/components/expenses/NewExpenseDialog";
import { adminForOrder, fixedForOrder, sumAdmin, sumFixed } from "@/data/expenses";
import { getOrderWorkflow, type StageKey } from "@/data/workflow";

export type CategoryOrderRow = {
  orderId: string;
  client: string;
  product: string;
  qty: number;
  status: Order["status"];
  cost: number;
  metric: string;
  detail: string;
};

const STAGE_TABS: StageKey[] = ["cutting", "stitching", "finishing"];

function stageRow(order: Order, tab: StageKey): CategoryOrderRow | null {
  const wf = getOrderWorkflow(order);
  const stage = wf?.stages.find((s) => s.key === tab);
  if (!wf || !stage) return null;
  return {
    orderId: order.id,
    client: order.client,
    product: order.product,
    qty: order.qty,
    status: order.status,
    cost: stage.cost,
    metric: stage.handoff.outputValue,
    detail: stage.meta?.[0] ? `${stage.meta[0].label}: ${stage.meta[0].value}` : stage.handoff.inputValue,
  };
}

function fixedRow(order: Order): CategoryOrderRow {
  const rows = fixedForOrder(order.id, order.qty);
  const cost = sumFixed(rows);
  return {
    orderId: order.id,
    client: order.client,
    product: order.product,
    qty: order.qty,
    status: order.status,
    cost,
    metric: `${rows.length} line items`,
    detail: `Allocated overhead · ${formatCompact(cost)}`,
  };
}

function adminRow(order: Order): CategoryOrderRow {
  const rows = adminForOrder(order.id, order.qty);
  const cost = sumAdmin(rows);
  return {
    orderId: order.id,
    client: order.client,
    product: order.product,
    qty: order.qty,
    status: order.status,
    cost,
    metric: `${rows.length} line items`,
    detail: `Admin spend · ${formatCompact(cost)}`,
  };
}

function formatCompact(n: number): string {
  return n.toLocaleString("en-PK");
}

/** Per-order summary rows for a sidebar expense category. */
export function getCategoryOrderRows(orders: Order[], tab: ExpenseCategory): CategoryOrderRow[] {
  if (tab === "fixed") return orders.map(fixedRow);
  if (tab === "admin") return orders.map(adminRow);
  if (STAGE_TABS.includes(tab as StageKey)) {
    return orders
      .map((o) => stageRow(o, tab as StageKey))
      .filter((r): r is CategoryOrderRow => r !== null);
  }
  return [];
}

export function sumCategoryRows(rows: CategoryOrderRow[]): number {
  return rows.reduce((s, r) => s + r.cost, 0);
}
