export type MaterialUnit = "m" | "kg" | "pcs" | "rolls";
export type MaterialCondition = "new" | "leftover" | "rejected";

/**
 * Where the material physically came from. Required for every material line.
 * - local-buyer-fabric:  Purchased locally, then processed into fabric (greige → finished).
 * - local-buyer-thread:  Purchased locally, then processed into thread/yarn.
 * - existing-stock:      Pulled from existing factory inventory (leftover / surplus).
 */
export type MaterialSource =
  | "local-buyer-fabric"
  | "local-buyer-thread"
  | "existing-stock";

export const MATERIAL_SOURCES: { key: MaterialSource; label: string; group: "local-buyer" | "stock" }[] = [
  { key: "local-buyer-fabric", label: "Local Buyer · Processed Fabric", group: "local-buyer" },
  { key: "local-buyer-thread", label: "Local Buyer · Processed Thread", group: "local-buyer" },
  { key: "existing-stock",     label: "Existing Stock",                 group: "stock" },
];

export type MaterialRequirement = {
  id: string;
  name: string;       // Cotton 180 GSM, YKK Zipper, etc.
  category: "fabric" | "thread" | "trim" | "accessory" | "packaging";
  required: number;
  unit: MaterialUnit;
  condition: MaterialCondition;
  inStock: number;    // current inventory at evaluate time
  utilized: number;   // actually consumed during production
  wastage: number;    // wasted during cutting/handling
  unitCost: number;   // per unit cost
  source: MaterialSource;     // required: where this material is sourced from
  supplier?: string;          // populated when source = local-buyer-*
};

export type MaterialOrderSummary = {
  orderId: string;
  client: string;
  product: string;
  qty: number;
  status: "pending" | "evaluating" | "in-use" | "closed";
  requirements: MaterialRequirement[];
};

export const MATERIAL_ORDERS: MaterialOrderSummary[] = [
  {
    orderId: "ORD-2026-024",
    client: "Northwind Apparel",
    product: "Crew Neck Tee — Cotton 180gsm",
    qty: 1200,
    status: "in-use",
    requirements: [
      { id: "m1", name: "Cotton Jersey 180gsm",  category: "fabric",   required: 320, unit: "kg",  condition: "new",      inStock: 240, utilized: 280, wastage: 18, unitCost: 1792, source: "local-buyer-fabric", supplier: "Faisalabad Mills" },
      { id: "m2", name: "Polyester Thread 40s",  category: "thread",   required: 18,  unit: "rolls", condition: "new",    inStock: 22,  utilized: 16, wastage: 1,  unitCost: 896,  source: "local-buyer-thread", supplier: "Karachi Threads" },
      { id: "m3", name: "Care Label",            category: "trim",     required: 1200,unit: "pcs", condition: "new",      inStock: 1500,utilized: 1180,wastage: 12, unitCost: 14,   source: "existing-stock" },
      { id: "m4", name: "Polybag 12x16",         category: "packaging",required: 1200,unit: "pcs", condition: "new",      inStock: 800, utilized: 0,  wastage: 0,  unitCost: 22,   source: "local-buyer-fabric", supplier: "Pak Pack" },
    ],
  },
  {
    orderId: "ORD-2026-023",
    client: "Acme Garments",
    product: "Polo Shirt — Pique 220gsm",
    qty: 800,
    status: "evaluating",
    requirements: [
      { id: "m5", name: "Pique 220gsm",          category: "fabric",   required: 240, unit: "kg",  condition: "new",      inStock: 60,  utilized: 0, wastage: 0, unitCost: 2184, source: "local-buyer-fabric", supplier: "Faisalabad Mills" },
      { id: "m6", name: "YKK Button 18L",        category: "trim",     required: 2400,unit: "pcs", condition: "new",      inStock: 3200,utilized: 0, wastage: 0, unitCost: 34,   source: "existing-stock" },
      { id: "m7", name: "Collar Interlining",    category: "accessory",required: 90,  unit: "m",   condition: "leftover", inStock: 110, utilized: 0, wastage: 0, unitCost: 308,  source: "existing-stock" },
    ],
  },
  {
    orderId: "ORD-2026-022",
    client: "Linea Bianca",
    product: "Linen Shirt — Slim Fit",
    qty: 2400,
    status: "closed",
    requirements: [
      { id: "m8", name: "Linen 140gsm",          category: "fabric",   required: 720, unit: "kg",  condition: "new",      inStock: 720, utilized: 705, wastage: 22, unitCost: 2632, source: "local-buyer-fabric", supplier: "Faisalabad Mills" },
      { id: "m9", name: "Mother of Pearl Button",category: "trim",     required: 14400,unit:"pcs", condition: "new",      inStock: 16000,utilized: 14380,wastage: 60,unitCost: 50,   source: "existing-stock" },
      { id: "m10",name: "Hang Tag",              category: "trim",     required: 2400,unit: "pcs", condition: "new",      inStock: 2600,utilized: 2400, wastage: 0, unitCost: 20,   source: "local-buyer-fabric", supplier: "Lahore Accessories" },
      { id: "m11",name: "Carton Box L",          category: "packaging",required: 200, unit: "pcs", condition: "new",      inStock: 220, utilized: 200,  wastage: 0, unitCost: 238,  source: "local-buyer-fabric", supplier: "Pak Pack" },
    ],
  },
  {
    orderId: "ORD-2026-019",
    client: "Atlas Brand Studio",
    product: "Joggers — French Terry",
    qty: 400,
    status: "pending",
    requirements: [
      { id: "m12",name: "French Terry 280gsm",   category: "fabric",   required: 180, unit: "kg",  condition: "new",      inStock: 40,  utilized: 0, wastage: 0, unitCost: 2268, source: "local-buyer-fabric", supplier: "Faisalabad Mills" },
      { id: "m13",name: "Drawcord 8mm",          category: "accessory",required: 320, unit: "m",   condition: "new",      inStock: 0,   utilized: 0, wastage: 0, unitCost: 62,   source: "local-buyer-thread", supplier: "Karachi Threads" },
      { id: "m14",name: "Elastic 25mm",          category: "accessory",required: 280, unit: "m",   condition: "leftover", inStock: 320, utilized: 0, wastage: 0, unitCost: 87,   source: "existing-stock" },
    ],
  },
];

export function evaluateRequirement(r: MaterialRequirement) {
  const gap = Math.max(0, r.required - r.inStock);
  const surplus = Math.max(0, r.inStock - r.required);
  const fulfillment = r.required === 0 ? 1 : Math.min(1, r.inStock / r.required);
  return { gap, surplus, fulfillment };
}

export function computeLeftover(r: MaterialRequirement) {
  // What remains after production: starting stock - utilized - wastage (but never negative).
  return Math.max(0, r.inStock - r.utilized - r.wastage);
}
