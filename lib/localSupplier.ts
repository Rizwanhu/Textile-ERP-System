import type {
  LocalSupplier,
  LocalSupplierAccountData,
  SupplierAccountSummary,
  SupplierCreditNote,
  SupplierLedgerEntry,
  SupplierLineItem,
  SupplierPayment,
} from "@/types/localSupplier";

function activeLineTotal(items: SupplierLineItem[]): number {
  return items.filter((i) => i.status !== "cancelled").reduce((s, i) => s + i.amount, 0);
}

export function computeSupplierSummary(
  supplier: LocalSupplier,
  lineItems: SupplierLineItem[],
  payments: SupplierPayment[],
  creditNotes: SupplierCreditNote[],
): SupplierAccountSummary {
  const lines = lineItems.filter((l) => l.supplierId === supplier.id);
  const totalPurchases = supplier.openingBalance + activeLineTotal(lines);
  const totalPaid =
    payments.filter((p) => p.supplierId === supplier.id).reduce((s, p) => s + p.amount, 0) +
    creditNotes.filter((c) => c.supplierId === supplier.id).reduce((s, c) => s + c.amount, 0);

  return {
    supplierId: supplier.id,
    totalPurchases: +totalPurchases.toFixed(2),
    totalPaid: +totalPaid.toFixed(2),
    balanceOutstanding: +(totalPurchases - totalPaid).toFixed(2),
    lineItemCount: lines.length,
  };
}

export function buildSupplierLedger(
  supplier: LocalSupplier,
  lineItems: SupplierLineItem[],
  payments: SupplierPayment[],
  creditNotes: SupplierCreditNote[],
): SupplierLedgerEntry[] {
  const entries: Omit<SupplierLedgerEntry, "balance">[] = [];

  if (supplier.openingBalance > 0) {
    entries.push({
      id: `sle_open_${supplier.id}`,
      supplierId: supplier.id,
      type: "opening_balance",
      date: supplier.openingBalanceDate ?? supplier.createdAt,
      description: supplier.openingBalanceNote ?? "Previous outstanding amount",
      debit: supplier.openingBalance,
      credit: 0,
    });
  }

  lineItems
    .filter((l) => l.supplierId === supplier.id && l.status !== "cancelled")
    .sort((a, b) => a.serialNumber - b.serialNumber)
    .forEach((l) => {
      entries.push({
        id: `sle_line_${l.id}`,
        supplierId: supplier.id,
        type: "purchase",
        date: l.purchaseDate,
        description: l.description,
        debit: l.amount,
        credit: 0,
        referenceId: l.id,
      });
    });

  payments
    .filter((p) => p.supplierId === supplier.id)
    .forEach((p) => {
      entries.push({
        id: `sle_pay_${p.id}`,
        supplierId: supplier.id,
        type: "payment",
        date: p.date,
        description: p.description,
        debit: 0,
        credit: p.amount,
        referenceId: p.id,
      });
    });

  creditNotes
    .filter((c) => c.supplierId === supplier.id)
    .forEach((c) => {
      entries.push({
        id: `sle_cn_${c.id}`,
        supplierId: supplier.id,
        type: "credit_note",
        date: c.issuedAt,
        description: `Credit note ${c.creditNoteNumber} — ${c.reason}`,
        debit: 0,
        credit: c.amount,
        referenceId: c.id,
      });
    });

  entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let balance = 0;
  return entries.map((e) => {
    balance += e.debit - e.credit;
    return { ...e, balance: +balance.toFixed(2) };
  });
}

export function nextSerialNumber(lineItems: SupplierLineItem[], supplierId: string): number {
  const nums = lineItems.filter((l) => l.supplierId === supplierId).map((l) => l.serialNumber);
  return (nums.length ? Math.max(...nums) : 0) + 1;
}

export function nextCreditNoteNumber(creditNotes: SupplierCreditNote[]): string {
  const year = new Date().getFullYear();
  const prefix = `SCN-${year}-`;
  const nums = creditNotes
    .map((c) => c.creditNoteNumber)
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.replace(prefix, ""), 10))
    .filter((n) => !Number.isNaN(n));
  return `${prefix}${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0")}`;
}

export function supplierRouteId(supplier: LocalSupplier): string {
  return supplier.slug ?? supplier.id;
}

export function findSupplierByRef(suppliers: LocalSupplier[], ref: string): LocalSupplier | undefined {
  return suppliers.find((s) => s.id === ref || s.slug === ref);
}

export function getSupplierAccountBundle(data: LocalSupplierAccountData, supplierRef: string) {
  const supplier = findSupplierByRef(data.suppliers, supplierRef);
  if (!supplier) return undefined;
  const lineItems = data.lineItems.filter((l) => l.supplierId === supplier.id);
  const payments = data.payments.filter((p) => p.supplierId === supplier.id);
  const creditNotes = data.creditNotes.filter((c) => c.supplierId === supplier.id);
  const summary = computeSupplierSummary(supplier, data.lineItems, data.payments, data.creditNotes);
  const ledger = buildSupplierLedger(supplier, lineItems, payments, creditNotes);
  return { supplier, lineItems, payments, creditNotes, summary, ledger };
}

export const SUPPLIER_STATUS_LABEL = {
  ordered: "Ordered",
  received: "Received",
  partial: "Partial",
  cancelled: "Cancelled",
} as const;
