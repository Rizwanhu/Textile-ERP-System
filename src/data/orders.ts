import type { OrderStatus } from "@/components/dashboard/StatusBadge";

export type Order = {
  id: string;
  client: string;
  product: string;
  qty: number;
  value: number;
  orderDate: string;
  deliveryDate: string;
  status: OrderStatus;
};

export type SizeBreakdown = { size: string; color: string; qty: number; rate: number };

export type TimelineEvent = {
  key: OrderStatus | "received";
  label: string;
  date?: string;       // planned date
  actualDate?: string; // actual completion date (only for completed steps)
  note?: string;
};

export type OrderDetail = Order & {
  poNumber: string;
  contact: { name: string; email: string; phone: string };
  shipTo: string;
  fabric: string;
  notes: string;
  breakdown: SizeBreakdown[];
  timeline: TimelineEvent[];
  produced: number;
  rejected: number;
  packed: number;
};

// Values in PKR (Pakistani Rupees).
export const ORDERS: Order[] = [
  { id: "ORD-2026-024", client: "Northwind Apparel",   product: "Crew Neck Tee — Cotton 180gsm", qty: 1200, value: 5_152_000,  orderDate: "2026-04-12", deliveryDate: "2026-05-02", status: "in-production" },
  { id: "ORD-2026-023", client: "Acme Garments",       product: "Polo Shirt — Pique 220gsm",     qty: 800,  value: 3_360_000,  orderDate: "2026-04-10", deliveryDate: "2026-04-28", status: "qc-hold" },
  { id: "ORD-2026-022", client: "Linea Bianca",        product: "Linen Shirt — Slim Fit",        qty: 2400, value: 10_080_000, orderDate: "2026-04-08", deliveryDate: "2026-04-22", status: "dispatched" },
  { id: "ORD-2026-021", client: "Urban Threads Co.",   product: "Hoodie — Fleece 320gsm",        qty: 600,  value: 2_576_000,  orderDate: "2026-04-06", deliveryDate: "2026-05-10", status: "completed" },
  { id: "ORD-2026-020", client: "Heritage Textiles",   product: "Oxford Shirt — Long Sleeve",    qty: 1500, value: 6_300_000,  orderDate: "2026-04-04", deliveryDate: "2026-04-18", status: "overdue" },
  { id: "ORD-2026-019", client: "Atlas Brand Studio",  product: "Joggers — French Terry",        qty: 400,  value: 2_184_000,  orderDate: "2026-04-02", deliveryDate: "2026-05-15", status: "active" },
  { id: "ORD-2026-018", client: "Maison Verde",        product: "Tank Top — Ribbed Cotton",      qty: 950,  value: 3_192_000,  orderDate: "2026-03-29", deliveryDate: "2026-04-30", status: "in-production" },
  { id: "ORD-2026-017", client: "Coastline Outfitters",product: "Cargo Shorts — Twill",          qty: 700,  value: 3_822_000,  orderDate: "2026-03-26", deliveryDate: "2026-04-25", status: "active" },
  { id: "ORD-2026-016", client: "Rivers & Co.",        product: "Denim Jacket — 12oz",           qty: 320,  value: 5_376_000,  orderDate: "2026-03-22", deliveryDate: "2026-05-05", status: "draft" },
  { id: "ORD-2026-015", client: "Pinecrest Mills",     product: "Flannel Shirt — Brushed",       qty: 1100, value: 4_928_000,  orderDate: "2026-03-20", deliveryDate: "2026-04-15", status: "completed" },
  { id: "ORD-2026-014", client: "Solstice Wear",       product: "Bomber Jacket — Nylon",         qty: 250,  value: 3_150_000,  orderDate: "2026-03-18", deliveryDate: "2026-04-29", status: "qc-hold" },
  { id: "ORD-2026-013", client: "Northwind Apparel",   product: "V-Neck Tee — Slub Cotton",      qty: 1800, value: 6_552_000,  orderDate: "2026-03-15", deliveryDate: "2026-04-12", status: "dispatched" },
];

const SIZES = ["S", "M", "L", "XL", "XXL"];
const COLORS = ["Black", "Heather Grey", "Navy", "White"];

function buildBreakdown(o: Order): SizeBreakdown[] {
  // Distribute the order qty across a small color/size matrix deterministically.
  const colorCount = (o.qty > 1000 ? 3 : 2);
  const colors = COLORS.slice(0, colorCount);
  const rate = +(o.value / o.qty).toFixed(2);
  const weights = [0.15, 0.28, 0.27, 0.20, 0.10];
  const rows: SizeBreakdown[] = [];
  let allocated = 0;
  colors.forEach((color, ci) => {
    SIZES.forEach((size, si) => {
      const share = weights[si] / colors.length;
      let q = Math.round(o.qty * share);
      if (ci === colors.length - 1 && si === SIZES.length - 1) q = o.qty - allocated;
      allocated += q;
      rows.push({ size, color, qty: q, rate });
    });
  });
  return rows;
}

function buildTimeline(o: Order): TimelineEvent[] {
  const order = new Date(o.orderDate);
  const day = (n: number) => {
    const d = new Date(order); d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };
  // Deterministic per-order variance so actuals diverge from plan in a believable way.
  const seed = [...o.id].reduce((s, c) => s + c.charCodeAt(0), 0);
  const variance = (i: number) => {
    const v = ((seed * (i + 3)) % 7) - 3; // -3..+3 days
    return v;
  };
  const base: Omit<TimelineEvent, "actualDate">[] = [
    { key: "received",      label: "Order Received",  date: o.orderDate, note: `PO confirmed by ${o.client}` },
    { key: "draft",         label: "Drafted",         date: day(1),      note: "Tech pack & costing finalized" },
    { key: "active",        label: "Activated",       date: day(2),      note: "Materials reserved, BOM locked" },
    { key: "in-production", label: "In Production",   date: day(5),      note: "Cutting & stitching in progress" },
    { key: "qc-hold",       label: "Quality Check",   date: day(12),     note: "AQL inspection underway" },
    { key: "completed",     label: "Completed",       date: day(15),     note: "Packed & ready for dispatch" },
    { key: "dispatched",    label: "Dispatched",      date: day(17),     note: "Handed over to logistics" },
  ];
  const current = getCurrentStep(o);
  return base.map((ev, i) => {
    if (i < current && ev.date) {
      const planned = new Date(ev.date);
      planned.setDate(planned.getDate() + variance(i));
      return { ...ev, actualDate: planned.toISOString().slice(0, 10) };
    }
    return ev;
  });
}

const ORDER_OF_STATUS: Record<OrderStatus | "received", number> = {
  received: 0, draft: 1, active: 2, "in-production": 3, "qc-hold": 4, completed: 5, dispatched: 6, overdue: 3,
};

export function getCurrentStep(o: Order): number {
  if (o.status === "overdue") return ORDER_OF_STATUS["in-production"];
  return ORDER_OF_STATUS[o.status];
}

export function getOrderDetail(id: string): OrderDetail | undefined {
  const o = ORDERS.find((x) => x.id === id);
  if (!o) return undefined;
  const produced = o.status === "draft" ? 0
    : o.status === "active" ? Math.round(o.qty * 0.1)
    : o.status === "in-production" ? Math.round(o.qty * 0.62)
    : o.status === "qc-hold" ? Math.round(o.qty * 0.85)
    : o.qty;
  const rejected = Math.round(produced * 0.018);
  const packed = o.status === "completed" || o.status === "dispatched" ? o.qty : Math.max(0, produced - rejected - 40);
  return {
    ...o,
    poNumber: `PO-${o.id.split("-").slice(1).join("-")}`,
    contact: {
      name: "Priya Mehta",
      email: `orders@${o.client.toLowerCase().replace(/[^a-z]+/g, "")}.com`,
      phone: "+91 98200 41122",
    },
    shipTo: "Warehouse 4, Plot 22, MIDC Industrial Area, Pune 411019, IN",
    fabric: o.product.split("—")[1]?.trim() ?? "Cotton blend",
    notes: "Pre-shrunk fabric. Use reactive dyes only. Match Pantone shade card v3.",
    breakdown: buildBreakdown(o),
    timeline: buildTimeline(o),
    produced,
    rejected,
    packed,
  };
}