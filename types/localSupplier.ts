export type SupplierLineStatus =
  | "ordered"
  | "received"
  | "partial"
  | "cancelled";

export type SupplierLedgerEntryType =
  | "opening_balance"
  | "purchase"
  | "payment"
  | "credit_note";

export type LocalSupplier = {
  id: string;
  slug?: string;
  name: string;
  contact?: { name: string; email: string; phone: string };
  address?: string;
  openingBalance: number;
  openingBalanceDate?: string;
  openingBalanceNote?: string;
  createdAt: string;
};

export type SupplierLineItem = {
  id: string;
  supplierId: string;
  orderId?: string;
  serialNumber: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  status: SupplierLineStatus;
  purchaseDate: string;
  invoiceNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type SupplierPayment = {
  id: string;
  supplierId: string;
  date: string;
  amount: number;
  description: string;
  method?: "bank_transfer" | "cash" | "other";
  reference?: string;
  createdAt: string;
};

export type SupplierCreditNote = {
  id: string;
  creditNoteNumber: string;
  supplierId: string;
  lineItemId?: string;
  amount: number;
  reason: string;
  issuedAt: string;
  createdAt: string;
};

export type SupplierLedgerEntry = {
  id: string;
  supplierId: string;
  type: SupplierLedgerEntryType;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  referenceId?: string;
};

export type SupplierAccountSummary = {
  supplierId: string;
  totalPurchases: number;
  totalPaid: number;
  balanceOutstanding: number;
  lineItemCount: number;
};

export type LocalSupplierAccountData = {
  suppliers: LocalSupplier[];
  lineItems: SupplierLineItem[];
  payments: SupplierPayment[];
  creditNotes: SupplierCreditNote[];
};
