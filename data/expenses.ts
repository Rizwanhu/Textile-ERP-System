// Mock data for the 6 expense sub-modules. All amounts are in PKR.
// Demo data is anchored to ORD-2026-024 so it reads as a single order's expense file.

export type ExpenseUnit = "kg" | "m" | "pcs" | "rolls";

export type LocalBuyerLine = {
  id: string;
  supplier: string;
  item: string;
  qty: number;
  unit: ExpenseUnit;
  rate: number;
  date: string;       // ISO
  invoice: string;
  notes?: string;
};

export type CuttingSizeRow = { size: string; qty: number };

export type CuttingSheet = {
  receivedKg: number;
  cutPerSize: CuttingSizeRow[];
  wastageKg: number;
  cutterTeam: string;
  date: string;
  wages: number;
  notes?: string;
};

export type StitchingSheet = {
  sent: number;
  stitched: number;
  rejected: number;
  rate: number;        // per piece
  team: string;
  startDate: string;
  endDate: string;
  notes?: string;
};

export type FinishingSheet = {
  receivedPcs: number;
  ironed: number;
  tagged: number;
  packed: number;
  qcPass: number;
  qcFail: number;
  defects: string[];
  wages: number;
  inspector: string;
  date: string;
  notes?: string;
};

export type FixedExpenseRow = {
  id: string;
  category: string;
  monthly: number;
  allocated: number;   // share allocated to this order
  notes?: string;
};

export type AdminExpenseRow = {
  id: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
};

/* ----------------------------- Mock dataset ----------------------------- */

export const LOCAL_BUYER: LocalBuyerLine[] = [
  { id: "lb1", supplier: "Faisalabad Mills",   item: "Cotton Jersey 180gsm", qty: 240, unit: "kg",    rate: 1792, date: "2026-04-13", invoice: "FM-1042" },
  { id: "lb2", supplier: "Karachi Threads",    item: "Polyester Thread 40s", qty: 12,  unit: "rolls", rate: 896,  date: "2026-04-13", invoice: "KT-0418" },
  { id: "lb3", supplier: "Trim & Co.",         item: "Care Label",           qty: 1500,unit: "pcs",   rate: 14,   date: "2026-04-14", invoice: "TC-2210" },
  { id: "lb4", supplier: "Pak Pack",           item: "Polybag 12x16",        qty: 1200,unit: "pcs",   rate: 22,   date: "2026-04-15", invoice: "PP-7745" },
  { id: "lb5", supplier: "Lahore Accessories", item: "Hang Tag",             qty: 1300,unit: "pcs",   rate: 20,   date: "2026-04-15", invoice: "LA-3091", notes: "Brand sticker included" },
];

export const CUTTING: CuttingSheet = {
  receivedKg: 320,
  cutPerSize: [
    { size: "S",   qty: 180 },
    { size: "M",   qty: 336 },
    { size: "L",   qty: 324 },
    { size: "XL",  qty: 240 },
    { size: "XXL", qty: 120 },
  ],
  wastageKg: 18,
  cutterTeam: "Cutting Floor A — Imran's team",
  date: "2026-04-16",
  wages: 42_000,
  notes: "Layered marker plan v2; bias correction applied for stripe match.",
};

export const STITCHING: StitchingSheet = {
  sent: 1200,
  stitched: 1158,
  rejected: 22,
  rate: 240,
  team: "Stitching Line 3 — Naseem & co.",
  startDate: "2026-04-17",
  endDate: "2026-04-21",
  notes: "Two minor needle breakages on day 2; recovered within shift.",
};

export const FINISHING: FinishingSheet = {
  receivedPcs: 1158,
  ironed: 1140,
  tagged: 1138,
  packed: 1118,
  qcPass: 1118,
  qcFail: 20,
  defects: ["Stitching skip", "Measurement", "Fabric defect"],
  wages: 28_500,
  inspector: "Saima Riaz",
  date: "2026-04-23",
  notes: "Failed pcs sent back for rework on collar tip.",
};

export const FIXED_EXPENSES: FixedExpenseRow[] = [
  { id: "fx1", category: "Factory rent",       monthly: 450_000, allocated: 38_400, notes: "Pro-rated by qty" },
  { id: "fx2", category: "Electricity",        monthly: 220_000, allocated: 19_200 },
  { id: "fx3", category: "Gas",                monthly: 95_000,  allocated: 8_200 },
  { id: "fx4", category: "Generator fuel",     monthly: 180_000, allocated: 15_600 },
  { id: "fx5", category: "Equipment depreciation", monthly: 140_000, allocated: 12_100 },
];

export const ADMIN_EXPENSES: AdminExpenseRow[] = [
  { id: "ad1", category: "Salaries (admin)",  amount: 32_000, date: "2026-04-12" },
  { id: "ad2", category: "Communication",     amount: 4_500,  date: "2026-04-14" },
  { id: "ad3", category: "Stationery",        amount: 2_200,  date: "2026-04-15" },
  { id: "ad4", category: "Bank charges",      amount: 1_850,  date: "2026-04-18" },
  { id: "ad5", category: "Freight / transport", amount: 18_400, date: "2026-04-22", notes: "Courier to ship-to warehouse" },
  { id: "ad6", category: "Miscellaneous",     amount: 3_100,  date: "2026-04-22", notes: "Site repairs" },
];

/* -------------------------------- Helpers -------------------------------- */

export const sumLocalBuyer = (rows: LocalBuyerLine[]) =>
  rows.reduce((s, r) => s + r.qty * r.rate, 0);

export const cuttingTotalCut = (c: CuttingSheet) =>
  c.cutPerSize.reduce((s, r) => s + r.qty, 0);

export const stitchingWages = (s: StitchingSheet) => s.stitched * s.rate;

export const sumFixed = (rows: FixedExpenseRow[]) =>
  rows.reduce((s, r) => s + r.allocated, 0);

export const sumAdmin = (rows: AdminExpenseRow[]) =>
  rows.reduce((s, r) => s + r.amount, 0);

/** Aggregate expense across all sub-modules — used in the Expenses header. */
export function getExpenseTotals() {
  const buyer    = sumLocalBuyer(LOCAL_BUYER);
  const cutting  = CUTTING.wages;
  const stitching= stitchingWages(STITCHING);
  const finishing= FINISHING.wages;
  const fixed    = sumFixed(FIXED_EXPENSES);
  const admin    = sumAdmin(ADMIN_EXPENSES);
  const grand    = buyer + cutting + stitching + finishing + fixed + admin;
  return { buyer, cutting, stitching, finishing, fixed, admin, grand };
}
