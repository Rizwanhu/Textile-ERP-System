import type { ClientAccountData, ClientLineItem, FulfillmentStatus } from "@/types/clientAccount";

const now = () => new Date().toISOString();

function line(
  clientId: string,
  serial: number,
  description: string,
  qty: number,
  unitPrice: number,
  status: FulfillmentStatus,
  orderId?: string,
  orderDate?: string,
): ClientLineItem {
  const invoiceValue = +(qty * unitPrice).toFixed(2);
  return {
    id: `li_${clientId}_${serial}`,
    clientId,
    orderId,
    serialNumber: serial,
    description,
    quantity: qty,
    unitPrice,
    currency: "GBP",
    exchangeRate: 350,
    invoiceValue,
    type: description.toLowerCase().includes("courier") || description.toLowerCase().includes("charges")
      ? "service"
      : "product",
    fulfillmentStatus: status,
    invoiced: false,
    orderDate: orderDate ?? "2025-08-01",
    createdAt: now(),
    updatedAt: now(),
  };
}

/** Seed data modelled on the manual Scotland/export client spreadsheet. */
export const SEED_CLIENT_ACCOUNT_DATA: ClientAccountData = {
  clients: [
    {
      id: "client_scotland",
      name: "Scotland Print Co.",
      type: "export",
      billingCurrency: "GBP",
      contact: {
        name: "James MacLeod",
        email: "orders@scotlandprint.co.uk",
        phone: "+44 7700 900123",
      },
      billingAddress: "12 Royal Mile, Edinburgh EH1 1RE, United Kingdom",
      openingBalance: 4110,
      openingBalanceDate: "2025-07-01",
      openingBalanceNote: "Previous outstanding amount",
      createdAt: "2025-07-01T00:00:00.000Z",
    },
    {
      id: "client_northwind",
      name: "Northwind Apparel",
      type: "local",
      billingCurrency: "PKR",
      contact: {
        name: "Priya Mehta",
        email: "orders@northwindapparel.com",
        phone: "+91 98200 41122",
      },
      billingAddress: "Warehouse 4, Plot 22, MIDC, Pune 411019, IN",
      openingBalance: 0,
      createdAt: "2026-01-15T00:00:00.000Z",
    },
  ],
  lineItems: [
    line("client_scotland", 1, "HOODIES", 800, 4.35, "delivered", "ORD-2026-024", "2025-08-05"),
    line("client_scotland", 2, "Adult ZIPPER HOODIES SCOTLAND PRINT", 1050, 6.0, "delivered", undefined, "2025-08-12"),
    line("client_scotland", 3, "Kids Zipper Hoody Scotland", 600, 5.25, "waiting-design", undefined, "2025-09-01"),
    line("client_scotland", 4, "Woven Patch", 2000, 0.85, "delivered", undefined, "2025-09-10"),
    line("client_scotland", 5, "NEW Hoodies order (Black, Dark Pink & Light Pink)", 1200, 4.5, "delivered", undefined, "2025-09-18"),
    line("client_scotland", 6, "Design 1,2,7 (Mens Football shirt)", 900, 3.75, "delivered", undefined, "2025-10-02"),
    line("client_scotland", 7, "First Courier Charges DHL", 1, 450, "delivered", undefined, "2025-10-05"),
    line("client_scotland", 8, "Kids Hoody with COW Patch", 500, 5.5, "in-process", undefined, "2025-11-01"),
    line("client_scotland", 9, "Scotland Rugby Polo — Adult", 750, 4.2, "delivered", undefined, "2025-11-15"),
    line("client_scotland", 10, "Scotland Rugby Polo — Kids", 400, 3.9, "partial-delivered", undefined, "2025-12-01"),
    line("client_scotland", 11, "Embroidered Cap — Tartan", 1500, 2.1, "delivered", undefined, "2026-01-10"),
    line("client_scotland", 12, "Second Courier Charges DHL", 1, 380, "delivered", undefined, "2026-02-05"),
    line("client_scotland", 13, "Scotland Flag Sticker Sheet", 3000, 0.35, "delivered", undefined, "2026-02-20"),
    line("client_scotland", 14, "Adult Track Suit — Navy/Green", 650, 7.25, "in-process", undefined, "2026-03-05"),
    line("client_scotland", 15, "Fleece Jacket — Scotland Crest", 420, 8.5, "delivered", undefined, "2026-03-18"),
    line("client_northwind", 1, "Crew Neck Tee — Cotton 180gsm", 1200, 4293, "delivered", "ORD-2026-024", "2026-04-12"),
    line("client_northwind", 2, "V-Neck Tee — Slub Cotton", 1800, 3640, "delivered", "ORD-2026-013", "2026-03-15"),
  ],
  invoices: [],
  payments: [
    {
      id: "pay_1",
      clientId: "client_scotland",
      date: "2025-10-09",
      amount: 2000,
      billingCurrency: "GBP",
      inputCurrency: "GBP",
      inputAmount: 2000,
      exchangeRate: 350,
      description: "Received Payment 09-Oct-2025",
      method: "bank_transfer",
      createdAt: now(),
    },
    {
      id: "pay_2",
      clientId: "client_scotland",
      date: "2025-11-06",
      amount: 2000,
      billingCurrency: "GBP",
      inputCurrency: "GBP",
      inputAmount: 2000,
      exchangeRate: 350,
      description: "Received Payment 06-Nov-2025",
      method: "bank_transfer",
      createdAt: now(),
    },
    {
      id: "pay_3",
      clientId: "client_scotland",
      date: "2025-12-04",
      amount: 2000,
      billingCurrency: "GBP",
      inputCurrency: "GBP",
      inputAmount: 2000,
      exchangeRate: 352,
      description: "Received Payment 04-Dec-2025",
      method: "bank_transfer",
      createdAt: now(),
    },
    {
      id: "pay_4",
      clientId: "client_scotland",
      date: "2026-01-08",
      amount: 2000,
      billingCurrency: "GBP",
      inputCurrency: "GBP",
      inputAmount: 2000,
      exchangeRate: 355,
      description: "Received Payment 08-Jan-2026",
      method: "bank_transfer",
      createdAt: now(),
    },
    {
      id: "pay_5",
      clientId: "client_scotland",
      date: "2026-02-05",
      amount: 3000,
      billingCurrency: "GBP",
      inputCurrency: "GBP",
      inputAmount: 3000,
      exchangeRate: 358,
      description: "Received Payment 05-Feb-2026",
      method: "bank_transfer",
      createdAt: now(),
    },
    {
      id: "pay_6",
      clientId: "client_scotland",
      date: "2026-03-10",
      amount: 3000,
      billingCurrency: "GBP",
      inputCurrency: "GBP",
      inputAmount: 3000,
      exchangeRate: 360,
      description: "Received Payment 10-Mar-2026",
      method: "bank_transfer",
      createdAt: now(),
    },
    {
      id: "pay_7",
      clientId: "client_scotland",
      date: "2026-04-15",
      amount: 4000,
      billingCurrency: "GBP",
      inputCurrency: "GBP",
      inputAmount: 4000,
      exchangeRate: 362,
      description: "Received Payment 15-Apr-2026",
      method: "bank_transfer",
      createdAt: now(),
    },
    {
      id: "pay_8",
      clientId: "client_scotland",
      date: "2026-05-20",
      amount: 5000,
      billingCurrency: "GBP",
      inputCurrency: "GBP",
      inputAmount: 5000,
      exchangeRate: 365,
      description: "Received Payment 20-May-2026",
      method: "bank_transfer",
      createdAt: now(),
    },
    {
      id: "pay_9",
      clientId: "client_scotland",
      date: "2026-06-11",
      amount: 6000,
      billingCurrency: "GBP",
      inputCurrency: "GBP",
      inputAmount: 6000,
      exchangeRate: 368,
      description: "Received Payment 11-Jun-2026",
      method: "bank_transfer",
      createdAt: now(),
    },
  ],
  creditNotes: [],
};

const STORAGE_KEY = "textileerp_client_accounts";

export function loadClientAccountData(): ClientAccountData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ClientAccountData;
  } catch {
    /* use seed */
  }
  return structuredClone(SEED_CLIENT_ACCOUNT_DATA);
}

export function saveClientAccountData(data: ClientAccountData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetClientAccountData(): ClientAccountData {
  localStorage.removeItem(STORAGE_KEY);
  return structuredClone(SEED_CLIENT_ACCOUNT_DATA);
}
