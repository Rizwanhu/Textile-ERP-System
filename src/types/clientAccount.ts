export type BillingCurrency = "GBP" | "PKR";

export type FulfillmentStatus =
  | "in-process"
  | "waiting-design"
  | "partial-delivered"
  | "delivered"
  | "cancelled";

export type LineItemType = "product" | "service" | "adjustment";

export type InvoiceStatus = "draft" | "issued" | "void";

export type LedgerEntryType =
  | "opening_balance"
  | "invoice"
  | "payment"
  | "credit_note"
  | "debit_note"
  | "line_item";

export type PaymentMethod = "bank_transfer" | "cash" | "other";

/** PKR per 1 unit of billing currency (e.g. 350 means 1 GBP = 350 PKR). */
export type ExchangeRateSnapshot = {
  rate: number;
  inputCurrency: BillingCurrency;
  billingCurrency: BillingCurrency;
};

export type Client = {
  id: string;
  name: string;
  type: "export" | "local";
  billingCurrency: BillingCurrency;
  contact?: { name: string; email: string; phone: string };
  billingAddress?: string;
  openingBalance: number;
  openingBalanceDate?: string;
  openingBalanceNote?: string;
  createdAt: string;
};

export type ClientLineItem = {
  id: string;
  clientId: string;
  orderId?: string;
  serialNumber: number;
  description: string;
  quantity: number;
  unitPrice: number;
  currency: BillingCurrency;
  exchangeRate: number;
  /** Value in client billing currency (GBP for export). */
  invoiceValue: number;
  /** Original entry amount in input currency before conversion. */
  inputAmount?: number;
  type: LineItemType;
  fulfillmentStatus: FulfillmentStatus;
  invoiced: boolean;
  invoiceId?: string;
  creditNoteId?: string;
  orderDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  clientId: string;
  lineItemIds: string[];
  subtotal: number;
  openingBalanceIncluded: number;
  total: number;
  currency: BillingCurrency;
  status: InvoiceStatus;
  issuedAt?: string;
  notes?: string;
  createdAt: string;
};

export type Payment = {
  id: string;
  clientId: string;
  date: string;
  /** Amount in client billing currency (credited to account). */
  amount: number;
  billingCurrency: BillingCurrency;
  /** Currency the client actually paid in. */
  inputCurrency: BillingCurrency;
  inputAmount: number;
  exchangeRate: number;
  description: string;
  method?: PaymentMethod;
  reference?: string;
  createdAt: string;
};

export type CreditNote = {
  id: string;
  creditNoteNumber: string;
  clientId: string;
  lineItemId?: string;
  invoiceId?: string;
  amount: number;
  currency: BillingCurrency;
  exchangeRate: number;
  reason: string;
  issuedAt: string;
  createdAt: string;
};

export type LedgerEntry = {
  id: string;
  clientId: string;
  type: LedgerEntryType;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  referenceId?: string;
  currency: BillingCurrency;
  exchangeRate?: number;
  inputCurrency?: BillingCurrency;
  inputAmount?: number;
};

export type ClientAccountSummary = {
  clientId: string;
  totalAmountOfGoods: number;
  totalAmountReceived: number;
  balanceOutstanding: number;
  lineItemCount: number;
  uninvoicedDeliveredCount: number;
  currency: BillingCurrency;
};

export type ClientAccountData = {
  clients: Client[];
  lineItems: ClientLineItem[];
  invoices: Invoice[];
  payments: Payment[];
  creditNotes: CreditNote[];
};
