// Inventory mock data — current stock by SKU + a movement history log.
export type InventoryUnit = "kg" | "m" | "pcs" | "rolls" | "spools";
export type StockTone = "success" | "warning" | "danger" | "info";

export type InventoryItem = {
  id: string;
  sku: string;
  name: string;
  category: "fabric" | "thread" | "trim" | "accessory" | "packaging";
  unit: InventoryUnit;
  inStock: number;
  reorderLevel: number;
  unitCost: number;       // PKR
  location: string;
  lastUpdated: string;    // ISO
};

export type StockMovementType = "in" | "out" | "adjust" | "return";

export type StockMovement = {
  id: string;
  date: string;           // ISO
  itemId: string;
  type: StockMovementType;
  qty: number;            // positive number; sign derives from type
  reference: string;      // PO / Order ID / Note
  user: string;
  notes?: string;
};

export const INVENTORY: InventoryItem[] = [
  { id: "i1",  sku: "FAB-CTN-180",  name: "Cotton Jersey 180gsm",     category: "fabric",    unit: "kg",     inStock: 240,  reorderLevel: 200, unitCost: 1792, location: "Rack A1", lastUpdated: "2026-04-22" },
  { id: "i2",  sku: "FAB-PIQ-220",  name: "Pique 220gsm",             category: "fabric",    unit: "kg",     inStock: 60,   reorderLevel: 150, unitCost: 2184, location: "Rack A2", lastUpdated: "2026-04-21" },
  { id: "i3",  sku: "FAB-LIN-140",  name: "Linen 140gsm",             category: "fabric",    unit: "kg",     inStock: 18,   reorderLevel: 100, unitCost: 2632, location: "Rack A3", lastUpdated: "2026-04-19" },
  { id: "i4",  sku: "FAB-FT-280",   name: "French Terry 280gsm",      category: "fabric",    unit: "kg",     inStock: 40,   reorderLevel: 120, unitCost: 2268, location: "Rack A4", lastUpdated: "2026-04-18" },
  { id: "i5",  sku: "THR-POL-40",   name: "Polyester Thread 40s",     category: "thread",    unit: "rolls",  inStock: 22,   reorderLevel: 12,  unitCost: 896,  location: "Bin T1",  lastUpdated: "2026-04-22" },
  { id: "i6",  sku: "THR-NYL-60",   name: "Nylon Thread 60s",         category: "thread",    unit: "spools", inStock: 64,   reorderLevel: 30,  unitCost: 740,  location: "Bin T2",  lastUpdated: "2026-04-15" },
  { id: "i7",  sku: "TRM-LBL-CARE", name: "Care Label",               category: "trim",      unit: "pcs",    inStock: 1500, reorderLevel: 1200,unitCost: 14,   location: "Bin C1",  lastUpdated: "2026-04-22" },
  { id: "i8",  sku: "TRM-LBL-HANG", name: "Hang Tag",                 category: "trim",      unit: "pcs",    inStock: 2600, reorderLevel: 1500,unitCost: 20,   location: "Bin C2",  lastUpdated: "2026-04-21" },
  { id: "i9",  sku: "TRM-BTN-MOP",  name: "Mother of Pearl Button",   category: "trim",      unit: "pcs",    inStock: 16000,reorderLevel: 8000,unitCost: 50,   location: "Bin C3",  lastUpdated: "2026-04-20" },
  { id: "i10", sku: "TRM-BTN-YKK",  name: "YKK Button 18L",           category: "trim",      unit: "pcs",    inStock: 3200, reorderLevel: 2400,unitCost: 34,   location: "Bin C4",  lastUpdated: "2026-04-17" },
  { id: "i11", sku: "ACC-INT-COL",  name: "Collar Interlining",       category: "accessory", unit: "m",      inStock: 110,  reorderLevel: 80,  unitCost: 308,  location: "Rack B1", lastUpdated: "2026-04-16" },
  { id: "i12", sku: "ACC-DRC-8",    name: "Drawcord 8mm",             category: "accessory", unit: "m",      inStock: 0,    reorderLevel: 200, unitCost: 62,   location: "Rack B2", lastUpdated: "2026-04-10" },
  { id: "i13", sku: "ACC-ELS-25",   name: "Elastic 25mm",             category: "accessory", unit: "m",      inStock: 320,  reorderLevel: 200, unitCost: 87,   location: "Rack B3", lastUpdated: "2026-04-22" },
  { id: "i14", sku: "PKG-BAG-1216", name: "Polybag 12x16",            category: "packaging", unit: "pcs",    inStock: 800,  reorderLevel: 1500,unitCost: 22,   location: "Pkg 1",   lastUpdated: "2026-04-20" },
  { id: "i15", sku: "PKG-CTN-L",    name: "Carton Box L",             category: "packaging", unit: "pcs",    inStock: 220,  reorderLevel: 100, unitCost: 238,  location: "Pkg 2",   lastUpdated: "2026-04-18" },
];

export const STOCK_HISTORY: StockMovement[] = [
  { id: "h1",  date: "2026-04-22", itemId: "i1",  type: "out",    qty: 280,  reference: "ORD-2026-024", user: "Imran Q.",  notes: "Issued for cutting floor A" },
  { id: "h2",  date: "2026-04-22", itemId: "i7",  type: "out",    qty: 1180, reference: "ORD-2026-024", user: "Saima R." },
  { id: "h3",  date: "2026-04-22", itemId: "i5",  type: "out",    qty: 16,   reference: "ORD-2026-024", user: "Naseem A." },
  { id: "h4",  date: "2026-04-21", itemId: "i9",  type: "in",     qty: 4000, reference: "PO-2026-118",  user: "Stores",    notes: "Trim & Co. delivery" },
  { id: "h5",  date: "2026-04-20", itemId: "i14", type: "in",     qty: 1200, reference: "PO-2026-117",  user: "Stores" },
  { id: "h6",  date: "2026-04-19", itemId: "i3",  type: "out",    qty: 705,  reference: "ORD-2026-022", user: "Imran Q." },
  { id: "h7",  date: "2026-04-18", itemId: "i15", type: "in",     qty: 60,   reference: "PO-2026-116",  user: "Stores" },
  { id: "h8",  date: "2026-04-17", itemId: "i10", type: "in",     qty: 800,  reference: "PO-2026-115",  user: "Stores" },
  { id: "h9",  date: "2026-04-16", itemId: "i11", type: "return", qty: 30,   reference: "ORD-2026-022", user: "Imran Q.",  notes: "Leftover returned to stores" },
  { id: "h10", date: "2026-04-15", itemId: "i6",  type: "in",     qty: 30,   reference: "PO-2026-114",  user: "Stores" },
  { id: "h11", date: "2026-04-14", itemId: "i1",  type: "in",     qty: 240,  reference: "PO-2026-113",  user: "Stores",    notes: "Faisalabad Mills" },
  { id: "h12", date: "2026-04-13", itemId: "i12", type: "adjust", qty: 50,   reference: "ADJ-0042",     user: "Stores",    notes: "Damaged drawcord write-off" },
];

export function stockTone(it: InventoryItem): StockTone {
  if (it.inStock <= 0) return "danger";
  if (it.inStock < it.reorderLevel) return "warning";
  if (it.inStock < it.reorderLevel * 1.5) return "info";
  return "success";
}

export function stockStatusLabel(it: InventoryItem) {
  if (it.inStock <= 0) return "Out of stock";
  if (it.inStock < it.reorderLevel) return "Low stock";
  if (it.inStock < it.reorderLevel * 1.5) return "Watch";
  return "Healthy";
}

export const inventoryValue = (rows: InventoryItem[]) =>
  rows.reduce((s, r) => s + r.inStock * r.unitCost, 0);
