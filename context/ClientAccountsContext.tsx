import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { SEED_CLIENT_ACCOUNT_DATA } from "@/data/clients";
import {
  computeClientSummary,
  findClientByRef,
  getClientAccountBundle,
} from "@/lib/clientAccount";
import {
  createClientAccount,
  createClientCreditNote,
  createClientInvoice,
  createClientLineItem,
  createClientPayment,
  fetchClientAccountDataHybrid,
  updateClientAccount,
  updateClientLineItemStatus,
} from "@/actions/clientAccounts";
import type {
  BillingCurrency,
  Client,
  ClientAccountData,
  CreditNote,
  FulfillmentStatus,
  Invoice,
  Payment,
} from "@/types/clientAccount";

type ClientAccountsContextValue = {
  data: ClientAccountData;
  isLoading: boolean;
  source: "supabase" | "mock";
  refresh: () => Promise<void>;
  getBundle: (clientRef: string) => ReturnType<typeof getClientAccountBundle>;
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
  }) => Promise<{ error?: string }>;
  updateLineItemStatus: (lineId: string, status: FulfillmentStatus) => Promise<{ error?: string }>;
  recordPayment: (input: {
    clientId: string;
    date: string;
    inputAmount: number;
    inputCurrency: BillingCurrency;
    exchangeRate: number;
    description?: string;
    method?: Payment["method"];
    reference?: string;
  }) => Promise<{ error?: string }>;
  createInvoice: (clientId: string, lineItemIds: string[], notes?: string) => Promise<Invoice | { error: string }>;
  issueCreditNote: (input: {
    clientId: string;
    lineItemId?: string;
    amount: number;
    exchangeRate: number;
    reason: string;
  }) => Promise<{ error?: string }>;
  addClient: (input: Omit<Client, "id" | "createdAt" | "slug">) => Promise<{ id: string; slug?: string } | { error: string }>;
  updateClient: (clientId: string, patch: Partial<Omit<Client, "id" | "createdAt">>) => Promise<{ error?: string }>;
};

const ClientAccountsContext = createContext<ClientAccountsContextValue | null>(null);

export function ClientAccountsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ClientAccountData>(SEED_CLIENT_ACCOUNT_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState<"supabase" | "mock">("mock");

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchClientAccountDataHybrid();
      setData(result.data);
      setSource(result.source);
    } catch {
      setData(structuredClone(SEED_CLIENT_ACCOUNT_DATA));
      setSource("mock");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const getBundle = useCallback((clientRef: string) => getClientAccountBundle(data, clientRef), [data]);

  const getClientSummaries = useCallback(() => {
    return data.clients.map((client) => ({
      client,
      summary: computeClientSummary(client, data.lineItems, data.payments, data.creditNotes),
    }));
  }, [data]);

  const addLineItem: ClientAccountsContextValue["addLineItem"] = useCallback(
    async (input) => {
      if (source === "mock") {
        return { error: "Connect to Supabase to save line items" };
      }
      const client = findClientByRef(data.clients, input.clientId);
      if (!client) return { error: "Client not found" };
      const result = await createClientLineItem({ ...input, clientId: client.id });
      if (!result.error) await refresh();
      return result;
    },
    [data.clients, refresh, source],
  );

  const updateLineItemStatus: ClientAccountsContextValue["updateLineItemStatus"] = useCallback(
    async (lineId, status) => {
      if (source === "mock") {
        setData((prev) => ({
          ...prev,
          lineItems: prev.lineItems.map((l) =>
            l.id === lineId ? { ...l, fulfillmentStatus: status, updatedAt: new Date().toISOString() } : l,
          ),
        }));
        return {};
      }
      const result = await updateClientLineItemStatus(lineId, status);
      if (!result.error) await refresh();
      return result;
    },
    [refresh, source],
  );

  const recordPayment: ClientAccountsContextValue["recordPayment"] = useCallback(
    async (input) => {
      if (source === "mock") return { error: "Connect to Supabase to record payments" };
      const client = findClientByRef(data.clients, input.clientId);
      if (!client) return { error: "Client not found" };
      const result = await createClientPayment({ ...input, clientId: client.id });
      if (!result.error) await refresh();
      return result;
    },
    [data.clients, refresh, source],
  );

  const createInvoice: ClientAccountsContextValue["createInvoice"] = useCallback(
    async (clientId, lineItemIds, notes) => {
      if (source === "mock") return { error: "Connect to Supabase to create invoices" };
      const client = findClientByRef(data.clients, clientId);
      if (!client) return { error: "Client not found" };
      const result = await createClientInvoice(client.id, lineItemIds, notes);
      if (!("error" in result)) await refresh();
      return result;
    },
    [data.clients, refresh, source],
  );

  const issueCreditNote: ClientAccountsContextValue["issueCreditNote"] = useCallback(
    async (input) => {
      if (source === "mock") return { error: "Connect to Supabase to issue credit notes" };
      const client = findClientByRef(data.clients, input.clientId);
      if (!client) return { error: "Client not found" };
      const result = await createClientCreditNote({ ...input, clientId: client.id });
      if (!result.error) await refresh();
      return result;
    },
    [data.clients, refresh, source],
  );

  const addClient: ClientAccountsContextValue["addClient"] = useCallback(
    async (input) => {
      if (source === "mock") return { error: "Connect to Supabase to add clients" };
      const result = await createClientAccount(input);
      if (!("error" in result)) await refresh();
      return result;
    },
    [refresh, source],
  );

  const updateClient: ClientAccountsContextValue["updateClient"] = useCallback(
    async (clientId, patch) => {
      if (source === "mock") {
        setData((prev) => ({
          ...prev,
          clients: prev.clients.map((c) => (c.id === clientId ? { ...c, ...patch } : c)),
        }));
        return {};
      }
      const result = await updateClientAccount(clientId, patch);
      if (!result.error) await refresh();
      return result;
    },
    [refresh, source],
  );

  const value = useMemo(
    () => ({
      data,
      isLoading,
      source,
      refresh,
      getBundle,
      getClientSummaries,
      addLineItem,
      updateLineItemStatus,
      recordPayment,
      createInvoice,
      issueCreditNote,
      addClient,
      updateClient,
    }),
    [
      data,
      isLoading,
      source,
      refresh,
      getBundle,
      getClientSummaries,
      addLineItem,
      updateLineItemStatus,
      recordPayment,
      createInvoice,
      issueCreditNote,
      addClient,
      updateClient,
    ],
  );

  return <ClientAccountsContext.Provider value={value}>{children}</ClientAccountsContext.Provider>;
}

export function useClientAccounts() {
  const ctx = useContext(ClientAccountsContext);
  if (!ctx) throw new Error("useClientAccounts must be used within ClientAccountsProvider");
  return ctx;
}
