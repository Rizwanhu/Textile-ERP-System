import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  loadClientAccountData,
  saveClientAccountData,
  SEED_CLIENT_ACCOUNT_DATA,
} from "@/data/clients";
import {
  computeClientSummary,
  getClientAccountBundle,
  nextCreditNoteNumber,
  nextInvoiceNumber,
  nextSerialNumber,
} from "@/lib/clientAccount";
import { computeLineValue, convertToBillingCurrency } from "@/lib/currency";
import type {
  BillingCurrency,
  Client,
  ClientAccountData,
  ClientLineItem,
  CreditNote,
  FulfillmentStatus,
  Invoice,
  Payment,
} from "@/types/clientAccount";

type ClientAccountsContextValue = {
  data: ClientAccountData;
  getBundle: (clientId: string) => ReturnType<typeof getClientAccountBundle>;
  getClientSummaries: () => Array<{ client: Client; summary: ReturnType<typeof computeClientSummary> }>;
  addLineItem: (input: {
    clientId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    inputCurrency: BillingCurrency;
    exchangeRate: number;
    fulfillmentStatus?: FulfillmentStatus;
    orderId?: string;
    orderDate?: string;
  }) => void;
  updateLineItemStatus: (lineId: string, status: FulfillmentStatus) => void;
  recordPayment: (input: {
    clientId: string;
    date: string;
    inputAmount: number;
    inputCurrency: BillingCurrency;
    exchangeRate: number;
    description?: string;
    method?: Payment["method"];
    reference?: string;
  }) => void;
  createInvoice: (clientId: string, lineItemIds: string[], notes?: string) => Invoice | null;
  issueCreditNote: (input: {
    clientId: string;
    lineItemId?: string;
    amount: number;
    exchangeRate: number;
    reason: string;
  }) => void;
  addClient: (input: Omit<Client, "id" | "createdAt">) => string;
  updateClient: (clientId: string, patch: Partial<Omit<Client, "id" | "createdAt">>) => void;
  resetData: () => void;
};

const ClientAccountsContext = createContext<ClientAccountsContextValue | null>(null);

export function ClientAccountsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ClientAccountData>(() => loadClientAccountData());

  const persist = useCallback((next: ClientAccountData) => {
    setData(next);
    saveClientAccountData(next);
  }, []);

  const getBundle = useCallback((clientId: string) => getClientAccountBundle(data, clientId), [data]);

  const getClientSummaries = useCallback(() => {
    return data.clients.map((client) => ({
      client,
      summary: computeClientSummary(client, data.lineItems, data.payments, data.creditNotes),
    }));
  }, [data]);

  const addLineItem = useCallback(
    (input: {
      clientId: string;
      description: string;
      quantity: number;
      unitPrice: number;
      inputCurrency: BillingCurrency;
      exchangeRate: number;
      fulfillmentStatus?: FulfillmentStatus;
      orderId?: string;
      orderDate?: string;
    }) => {
      const client = data.clients.find((c) => c.id === input.clientId);
      if (!client) return;
      const invoiceValue = computeLineValue(
        input.quantity,
        input.unitPrice,
        input.inputCurrency,
        client.billingCurrency,
        input.exchangeRate,
      );
      const item: ClientLineItem = {
        id: `li_${Date.now()}`,
        clientId: input.clientId,
        orderId: input.orderId,
        serialNumber: nextSerialNumber(data.lineItems, input.clientId),
        description: input.description,
        quantity: input.quantity,
        unitPrice: input.unitPrice,
        currency: input.inputCurrency,
        exchangeRate: input.exchangeRate,
        invoiceValue,
        inputAmount: input.quantity * input.unitPrice,
        type: input.description.toLowerCase().includes("courier") ? "service" : "product",
        fulfillmentStatus: input.fulfillmentStatus ?? "in-process",
        invoiced: false,
        orderDate: input.orderDate ?? new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      persist({ ...data, lineItems: [...data.lineItems, item] });
    },
    [data, persist],
  );

  const updateLineItemStatus = useCallback(
    (lineId: string, status: FulfillmentStatus) => {
      persist({
        ...data,
        lineItems: data.lineItems.map((l) =>
          l.id === lineId ? { ...l, fulfillmentStatus: status, updatedAt: new Date().toISOString() } : l,
        ),
      });
    },
    [data, persist],
  );

  const recordPayment = useCallback(
    (input: {
      clientId: string;
      date: string;
      inputAmount: number;
      inputCurrency: BillingCurrency;
      exchangeRate: number;
      description?: string;
      method?: Payment["method"];
      reference?: string;
    }) => {
      const client = data.clients.find((c) => c.id === input.clientId);
      if (!client) return;
      const amount = convertToBillingCurrency(
        input.inputAmount,
        input.inputCurrency,
        client.billingCurrency,
        input.exchangeRate,
      );
      const payment: Payment = {
        id: `pay_${Date.now()}`,
        clientId: input.clientId,
        date: input.date,
        amount: +amount.toFixed(2),
        billingCurrency: client.billingCurrency,
        inputCurrency: input.inputCurrency,
        inputAmount: input.inputAmount,
        exchangeRate: input.exchangeRate,
        description:
          input.description ??
          `Payment received ${new Date(input.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`,
        method: input.method ?? "bank_transfer",
        reference: input.reference,
        createdAt: new Date().toISOString(),
      };
      persist({ ...data, payments: [...data.payments, payment] });
    },
    [data, persist],
  );

  const createInvoice = useCallback(
    (clientId: string, lineItemIds: string[], notes?: string): Invoice | null => {
      const client = data.clients.find((c) => c.id === clientId);
      if (!client) return null;
      const lines = data.lineItems.filter(
        (l) => lineItemIds.includes(l.id) && l.clientId === clientId && !l.invoiced,
      );
      if (!lines.length) return null;

      const subtotal = +lines.reduce((s, l) => s + l.invoiceValue, 0).toFixed(2);
      const invoice: Invoice = {
        id: `inv_${Date.now()}`,
        invoiceNumber: nextInvoiceNumber(data.invoices),
        clientId,
        lineItemIds: lines.map((l) => l.id),
        subtotal,
        openingBalanceIncluded: 0,
        total: subtotal,
        currency: client.billingCurrency,
        status: "issued",
        issuedAt: new Date().toISOString(),
        notes,
        createdAt: new Date().toISOString(),
      };

      persist({
        ...data,
        invoices: [...data.invoices, invoice],
        lineItems: data.lineItems.map((l) =>
          lineItemIds.includes(l.id) ? { ...l, invoiced: true, invoiceId: invoice.id } : l,
        ),
      });
      return invoice;
    },
    [data, persist],
  );

  const issueCreditNote = useCallback(
    (input: {
      clientId: string;
      lineItemId?: string;
      amount: number;
      exchangeRate: number;
      reason: string;
    }) => {
      const client = data.clients.find((c) => c.id === input.clientId);
      if (!client) return;
      const cn: CreditNote = {
        id: `cn_${Date.now()}`,
        creditNoteNumber: nextCreditNoteNumber(data.creditNotes),
        clientId: input.clientId,
        lineItemId: input.lineItemId,
        amount: +input.amount.toFixed(2),
        currency: client.billingCurrency,
        exchangeRate: input.exchangeRate,
        reason: input.reason,
        issuedAt: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
      };
      const lineItems = input.lineItemId
        ? data.lineItems.map((l) =>
            l.id === input.lineItemId
              ? { ...l, fulfillmentStatus: "cancelled" as const, creditNoteId: cn.id }
              : l,
          )
        : data.lineItems;
      persist({
        ...data,
        creditNotes: [...data.creditNotes, cn],
        lineItems,
      });
    },
    [data, persist],
  );

  const addClient = useCallback(
    (input: Omit<Client, "id" | "createdAt">): string => {
      const id = `client_${Date.now().toString(36)}`;
      const client: Client = {
        ...input,
        id,
        billingCurrency: input.billingCurrency ?? (input.type === "export" ? "GBP" : "PKR"),
        createdAt: new Date().toISOString(),
      };
      persist({ ...data, clients: [...data.clients, client] });
      return id;
    },
    [data, persist],
  );

  const updateClient = useCallback(
    (clientId: string, patch: Partial<Omit<Client, "id" | "createdAt">>) => {
      persist({
        ...data,
        clients: data.clients.map((c) =>
          c.id === clientId ? { ...c, ...patch } : c,
        ),
      });
    },
    [data, persist],
  );

  const resetData = useCallback(() => {
    persist(structuredClone(SEED_CLIENT_ACCOUNT_DATA));
  }, [persist]);

  const value = useMemo(
    () => ({
      data,
      getBundle,
      getClientSummaries,
      addLineItem,
      updateLineItemStatus,
      recordPayment,
      createInvoice,
      issueCreditNote,
      addClient,
      updateClient,
      resetData,
    }),
    [
      data,
      getBundle,
      getClientSummaries,
      addLineItem,
      updateLineItemStatus,
      recordPayment,
      createInvoice,
      issueCreditNote,
      addClient,
      updateClient,
      resetData,
    ],
  );

  return <ClientAccountsContext.Provider value={value}>{children}</ClientAccountsContext.Provider>;
}

export function useClientAccounts() {
  const ctx = useContext(ClientAccountsContext);
  if (!ctx) throw new Error("useClientAccounts must be used within ClientAccountsProvider");
  return ctx;
}
