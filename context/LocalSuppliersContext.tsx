import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  loadLocalSupplierData,
  saveLocalSupplierData,
  SEED_LOCAL_SUPPLIER_DATA,
} from "@/data/localSuppliers";
import {
  computeSupplierSummary,
  findSupplierByRef,
  getSupplierAccountBundle,
  nextCreditNoteNumber,
  nextSerialNumber,
} from "@/lib/localSupplier";
import type {
  LocalSupplier,
  LocalSupplierAccountData,
  SupplierLineItem,
  SupplierLineStatus,
  SupplierPayment,
} from "@/types/localSupplier";

type LocalSuppliersContextValue = {
  data: LocalSupplierAccountData;
  isLoading: boolean;
  refresh: () => void;
  getBundle: (supplierRef: string) => ReturnType<typeof getSupplierAccountBundle>;
  getSupplierSummaries: () => Array<{ supplier: LocalSupplier; summary: ReturnType<typeof computeSupplierSummary> }>;
  addLineItem: (input: {
    supplierId: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    orderId?: string;
    purchaseDate?: string;
    invoiceNumber?: string;
    status?: SupplierLineStatus;
  }) => void;
  updateLineItemStatus: (lineId: string, status: SupplierLineStatus) => void;
  recordPayment: (input: {
    supplierId: string;
    date: string;
    amount: number;
    description?: string;
    method?: SupplierPayment["method"];
    reference?: string;
  }) => void;
  issueCreditNote: (input: { supplierId: string; lineItemId?: string; amount: number; reason: string }) => void;
  addSupplier: (input: Omit<LocalSupplier, "id" | "createdAt" | "slug">) => string;
  updateSupplier: (supplierId: string, patch: Partial<Omit<LocalSupplier, "id" | "createdAt">>) => void;
};

const LocalSuppliersContext = createContext<LocalSuppliersContextValue | null>(null);

export function LocalSuppliersProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LocalSupplierAccountData>(SEED_LOCAL_SUPPLIER_DATA);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setData(loadLocalSupplierData());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const persist = useCallback((next: LocalSupplierAccountData) => {
    setData(next);
    saveLocalSupplierData(next);
  }, []);

  const getBundle = useCallback((ref: string) => getSupplierAccountBundle(data, ref), [data]);

  const getSupplierSummaries = useCallback(
    () =>
      data.suppliers.map((supplier) => ({
        supplier,
        summary: computeSupplierSummary(supplier, data.lineItems, data.payments, data.creditNotes),
      })),
    [data],
  );

  const addLineItem = useCallback(
    (input: {
      supplierId: string;
      description: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      orderId?: string;
      purchaseDate?: string;
      invoiceNumber?: string;
      status?: SupplierLineStatus;
    }) => {
      const supplier = findSupplierByRef(data.suppliers, input.supplierId);
      if (!supplier) return;
      const item: SupplierLineItem = {
        id: `sli_${Date.now()}`,
        supplierId: supplier.id,
        orderId: input.orderId,
        serialNumber: nextSerialNumber(data.lineItems, supplier.id),
        description: input.description,
        quantity: input.quantity,
        unit: input.unit,
        unitPrice: input.unitPrice,
        amount: +(input.quantity * input.unitPrice).toFixed(2),
        status: input.status ?? "ordered",
        purchaseDate: input.purchaseDate ?? new Date().toISOString().slice(0, 10),
        invoiceNumber: input.invoiceNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      persist({ ...data, lineItems: [...data.lineItems, item] });
    },
    [data, persist],
  );

  const updateLineItemStatus = useCallback(
    (lineId: string, status: SupplierLineStatus) => {
      persist({
        ...data,
        lineItems: data.lineItems.map((l) =>
          l.id === lineId ? { ...l, status, updatedAt: new Date().toISOString() } : l,
        ),
      });
    },
    [data, persist],
  );

  const recordPayment = useCallback(
    (input: {
      supplierId: string;
      date: string;
      amount: number;
      description?: string;
      method?: SupplierPayment["method"];
      reference?: string;
    }) => {
      const supplier = findSupplierByRef(data.suppliers, input.supplierId);
      if (!supplier) return;
      const payment: SupplierPayment = {
        id: `spay_${Date.now()}`,
        supplierId: supplier.id,
        date: input.date,
        amount: +input.amount.toFixed(2),
        description:
          input.description ??
          `Payment ${new Date(input.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`,
        method: input.method ?? "bank_transfer",
        reference: input.reference,
        createdAt: new Date().toISOString(),
      };
      persist({ ...data, payments: [...data.payments, payment] });
    },
    [data, persist],
  );

  const issueCreditNote = useCallback(
    (input: { supplierId: string; lineItemId?: string; amount: number; reason: string }) => {
      const supplier = findSupplierByRef(data.suppliers, input.supplierId);
      if (!supplier) return;
      const cn = {
        id: `scn_${Date.now()}`,
        creditNoteNumber: nextCreditNoteNumber(data.creditNotes),
        supplierId: supplier.id,
        lineItemId: input.lineItemId,
        amount: +input.amount.toFixed(2),
        reason: input.reason,
        issuedAt: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
      };
      const lineItems = input.lineItemId
        ? data.lineItems.map((l) =>
            l.id === input.lineItemId ? { ...l, status: "cancelled" as const, updatedAt: new Date().toISOString() } : l,
          )
        : data.lineItems;
      persist({ ...data, creditNotes: [...data.creditNotes, cn], lineItems });
    },
    [data, persist],
  );

  const addSupplier = useCallback(
    (input: Omit<LocalSupplier, "id" | "createdAt" | "slug">): string => {
      const id = `supplier_${Date.now().toString(36)}`;
      const supplier: LocalSupplier = {
        ...input,
        id,
        slug: id,
        createdAt: new Date().toISOString(),
      };
      persist({ ...data, suppliers: [...data.suppliers, supplier] });
      return id;
    },
    [data, persist],
  );

  const updateSupplier = useCallback(
    (supplierId: string, patch: Partial<Omit<LocalSupplier, "id" | "createdAt">>) => {
      persist({
        ...data,
        suppliers: data.suppliers.map((s) => (s.id === supplierId ? { ...s, ...patch } : s)),
      });
    },
    [data, persist],
  );

  const value = useMemo(
    () => ({
      data,
      isLoading,
      refresh,
      getBundle,
      getSupplierSummaries,
      addLineItem,
      updateLineItemStatus,
      recordPayment,
      issueCreditNote,
      addSupplier,
      updateSupplier,
    }),
    [
      data,
      isLoading,
      refresh,
      getBundle,
      getSupplierSummaries,
      addLineItem,
      updateLineItemStatus,
      recordPayment,
      issueCreditNote,
      addSupplier,
      updateSupplier,
    ],
  );

  return <LocalSuppliersContext.Provider value={value}>{children}</LocalSuppliersContext.Provider>;
}

export function useLocalSuppliers() {
  const ctx = useContext(LocalSuppliersContext);
  if (!ctx) throw new Error("useLocalSuppliers must be used within LocalSuppliersProvider");
  return ctx;
}
