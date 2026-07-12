import { LOCAL_BUYER } from "@/data/expenses";
import type {
  LocalSupplier,
  LocalSupplierAccountData,
  SupplierLineItem,
  SupplierPayment,
} from "@/types/localSupplier";

const now = () => new Date().toISOString();

function slugify(name: string): string {
  return `supplier_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`;
}

const SUPPLIER_META: Record<string, { contact?: LocalSupplier["contact"]; address?: string; openingBalance?: number }> = {
  "Faisalabad Mills": {
    contact: { name: "Ahmed Khan", email: "sales@faisalabadmills.pk", phone: "+92 300 1112233" },
    address: "Faisalabad, Punjab",
    openingBalance: 125_000,
  },
  "Karachi Threads": {
    contact: { name: "Bilal Hussain", email: "orders@karachithreads.com", phone: "+92 321 4455667" },
    address: "Karachi, Sindh",
  },
  "Trim & Co.": {
    contact: { name: "Sara Malik", email: "billing@trimco.pk", phone: "+92 333 7788990" },
    address: "Lahore, Punjab",
    openingBalance: 45_000,
  },
  "Pak Pack": {
    contact: { name: "Usman Ali", email: "accounts@pakpack.pk", phone: "+92 300 9900112" },
    address: "Gujranwala, Punjab",
  },
  "Lahore Accessories": {
    contact: { name: "Hina Shah", email: "info@lahoreaccessories.pk", phone: "+92 322 3344556" },
    address: "Lahore, Punjab",
  },
};

function buildSeed(): LocalSupplierAccountData {
  const supplierNames = Array.from(new Set(LOCAL_BUYER.map((r) => r.supplier)));
  const suppliers: LocalSupplier[] = supplierNames.map((name, i) => {
    const meta = SUPPLIER_META[name] ?? {};
    return {
      id: slugify(name),
      slug: slugify(name),
      name,
      contact: meta.contact,
      address: meta.address,
      openingBalance: meta.openingBalance ?? 0,
      openingBalanceDate: meta.openingBalance ? "2026-04-01" : undefined,
      openingBalanceNote: meta.openingBalance ? "Previous outstanding amount" : undefined,
      createdAt: new Date(2026, 3, 1 + i).toISOString(),
    };
  });

  const lineItems: SupplierLineItem[] = LOCAL_BUYER.map((row, i) => ({
    id: `sli_${row.id}`,
    supplierId: slugify(row.supplier),
    orderId: "ORD-2026-024",
    serialNumber: i + 1,
    description: row.item,
    quantity: row.qty,
    unit: row.unit,
    unitPrice: row.rate,
    amount: row.qty * row.rate,
    status: "received",
    purchaseDate: row.date,
    invoiceNumber: row.invoice,
    notes: row.notes,
    createdAt: now(),
    updatedAt: now(),
  }));

  const payments: SupplierPayment[] = [
    {
      id: "spay_1",
      supplierId: slugify("Faisalabad Mills"),
      date: "2026-04-20",
      amount: 200_000,
      description: "Payment 20-Apr-2026",
      method: "bank_transfer",
      createdAt: now(),
    },
    {
      id: "spay_2",
      supplierId: slugify("Trim & Co."),
      date: "2026-04-22",
      amount: 15_000,
      description: "Partial payment — labels batch",
      method: "bank_transfer",
      createdAt: now(),
    },
    {
      id: "spay_3",
      supplierId: slugify("Karachi Threads"),
      date: "2026-04-18",
      amount: 10_000,
      description: "Thread rolls payment",
      method: "cash",
      createdAt: now(),
    },
  ];

  return { suppliers, lineItems, payments, creditNotes: [] };
}

export const SEED_LOCAL_SUPPLIER_DATA = buildSeed();

const STORAGE_KEY = "textileerp_local_suppliers";

export function loadLocalSupplierData(): LocalSupplierAccountData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LocalSupplierAccountData;
  } catch {
    /* use seed */
  }
  return structuredClone(SEED_LOCAL_SUPPLIER_DATA);
}

export function saveLocalSupplierData(data: LocalSupplierAccountData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
