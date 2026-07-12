import type {
  Client,
  ClientAccountData,
  ClientAccountSummary,
  ClientLineItem,
  CreditNote,
  FulfillmentStatus,
  Invoice,
  LedgerEntry,
  Payment,
} from "@/types/clientAccount";

const DEFAULT_EXCHANGE_RATE = 350;

function activeLineTotal(items: ClientLineItem[]): number {
  return items
    .filter((i) => i.fulfillmentStatus !== "cancelled")
    .reduce((s, i) => s + i.invoiceValue, 0);
}

export function computeClientSummary(
  client: Client,
  lineItems: ClientLineItem[],
  payments: Payment[],
  creditNotes: CreditNote[],
): ClientAccountSummary {
  const clientLines = lineItems.filter((l) => l.clientId === client.id);
  const totalGoods = client.openingBalance + activeLineTotal(clientLines);
  const totalReceived =
    payments.filter((p) => p.clientId === client.id).reduce((s, p) => s + p.amount, 0) +
    creditNotes.filter((c) => c.clientId === client.id).reduce((s, c) => s + c.amount, 0);
  const uninvoicedDelivered = clientLines.filter(
    (l) => !l.invoiced && (l.fulfillmentStatus === "delivered" || l.fulfillmentStatus === "partial-delivered"),
  ).length;

  return {
    clientId: client.id,
    totalAmountOfGoods: +totalGoods.toFixed(2),
    totalAmountReceived: +totalReceived.toFixed(2),
    balanceOutstanding: +(totalGoods - totalReceived).toFixed(2),
    lineItemCount: clientLines.length,
    uninvoicedDeliveredCount: uninvoicedDelivered,
    currency: client.billingCurrency,
  };
}

export function buildClientLedger(
  client: Client,
  lineItems: ClientLineItem[],
  invoices: Invoice[],
  payments: Payment[],
  creditNotes: CreditNote[],
): LedgerEntry[] {
  const entries: Omit<LedgerEntry, "balance">[] = [];

  if (client.openingBalance > 0) {
    entries.push({
      id: `le_open_${client.id}`,
      clientId: client.id,
      type: "opening_balance",
      date: client.openingBalanceDate ?? client.createdAt,
      description: client.openingBalanceNote ?? "Previous outstanding amount",
      debit: client.openingBalance,
      credit: 0,
      referenceId: undefined,
      currency: client.billingCurrency,
    });
  }

  lineItems
    .filter((l) => l.clientId === client.id && l.fulfillmentStatus !== "cancelled")
    .sort((a, b) => a.serialNumber - b.serialNumber)
    .forEach((l) => {
      entries.push({
        id: `le_line_${l.id}`,
        clientId: client.id,
        type: "line_item",
        date: l.orderDate ?? l.createdAt,
        description: l.description,
        debit: l.invoiceValue,
        credit: 0,
        referenceId: l.id,
        currency: client.billingCurrency,
        exchangeRate: l.exchangeRate,
        inputCurrency: l.currency,
      });
    });

  invoices
    .filter((i) => i.clientId === client.id && i.status === "issued")
    .forEach((inv) => {
      entries.push({
        id: `le_inv_${inv.id}`,
        clientId: client.id,
        type: "invoice",
        date: inv.issuedAt ?? inv.createdAt,
        description: `Invoice ${inv.invoiceNumber}`,
        debit: 0,
        credit: 0,
        referenceId: inv.id,
        currency: inv.currency,
      });
    });

  payments
    .filter((p) => p.clientId === client.id)
    .forEach((p) => {
      entries.push({
        id: `le_pay_${p.id}`,
        clientId: client.id,
        type: "payment",
        date: p.date,
        description: p.description,
        debit: 0,
        credit: p.amount,
        referenceId: p.id,
        currency: client.billingCurrency,
        exchangeRate: p.exchangeRate,
        inputCurrency: p.inputCurrency,
        inputAmount: p.inputAmount,
      });
    });

  creditNotes
    .filter((c) => c.clientId === client.id)
    .forEach((c) => {
      entries.push({
        id: `le_cn_${c.id}`,
        clientId: client.id,
        type: "credit_note",
        date: c.issuedAt,
        description: `Credit note ${c.creditNoteNumber} — ${c.reason}`,
        debit: 0,
        credit: c.amount,
        referenceId: c.id,
        currency: c.currency,
        exchangeRate: c.exchangeRate,
      });
    });

  entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let balance = 0;
  return entries.map((e) => {
    balance += e.debit - e.credit;
    return { ...e, balance: +balance.toFixed(2) };
  });
}

export function nextInvoiceNumber(invoices: Invoice[]): string {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const nums = invoices
    .map((i) => i.invoiceNumber)
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.replace(prefix, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

export function nextCreditNoteNumber(creditNotes: CreditNote[]): string {
  const year = new Date().getFullYear();
  const prefix = `CN-${year}-`;
  const nums = creditNotes
    .map((c) => c.creditNoteNumber)
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.replace(prefix, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

export function nextSerialNumber(lineItems: ClientLineItem[], clientId: string): number {
  const nums = lineItems.filter((l) => l.clientId === clientId).map((l) => l.serialNumber);
  return (nums.length ? Math.max(...nums) : 0) + 1;
}

export const FULFILLMENT_LABEL: Record<FulfillmentStatus, string> = {
  "in-process": "In Process",
  "waiting-design": "Waiting Sticker Design",
  "partial-delivered": "Partial Delivered",
  delivered: "Goods Delivered",
  cancelled: "Cancelled",
};

export const DEFAULT_EXCHANGE = DEFAULT_EXCHANGE_RATE;

export function getClientAccountBundle(data: ClientAccountData, clientId: string) {
  const client = data.clients.find((c) => c.id === clientId);
  if (!client) return undefined;
  const lineItems = data.lineItems.filter((l) => l.clientId === clientId);
  const invoices = data.invoices.filter((i) => i.clientId === clientId);
  const payments = data.payments.filter((p) => p.clientId === clientId);
  const creditNotes = data.creditNotes.filter((c) => c.clientId === clientId);
  const summary = computeClientSummary(client, data.lineItems, data.payments, data.creditNotes);
  const ledger = buildClientLedger(client, lineItems, invoices, payments, creditNotes);
  return { client, lineItems, invoices, payments, creditNotes, summary, ledger };
}
