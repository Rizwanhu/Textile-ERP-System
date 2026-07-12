import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { formatPKR } from "@/lib/currency";
import {
  MATERIAL_ORDERS, MATERIAL_SOURCES,
  type MaterialSource, type MaterialUnit, type MaterialCondition,
} from "@/data/materials";
import { LOCAL_BUYER } from "@/data/expenses";
import { Info } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  defaultOrderId?: string;
};

const CATEGORIES = ["fabric", "thread", "trim", "accessory", "packaging"] as const;
const UNITS: MaterialUnit[] = ["kg", "m", "pcs", "rolls"];
const CONDITIONS: MaterialCondition[] = ["new", "leftover", "rejected"];

// Suppliers come from the Local Buyer ledger (de-duped) so the two modules stay linked.
function uniqueSuppliers() {
  return Array.from(new Set(LOCAL_BUYER.map((l) => l.supplier))).sort();
}

export function NewMaterialDialog({ open, onOpenChange, defaultOrderId }: Props) {
  const suppliers = useMemo(uniqueSuppliers, []);
  const [form, setForm] = useState({
    orderId: defaultOrderId ?? MATERIAL_ORDERS[0].orderId,
    name: "",
    category: "fabric" as (typeof CATEGORIES)[number],
    required: "",
    unit: "kg" as MaterialUnit,
    condition: "new" as MaterialCondition,
    unitCost: "",
    source: "local-buyer-fabric" as MaterialSource,
    supplier: suppliers[0] ?? "",
    inStock: "",
    notes: "",
  });

  useEffect(() => {
    if (defaultOrderId) setForm((p) => ({ ...p, orderId: defaultOrderId }));
  }, [defaultOrderId]);

  // When source switches to existing-stock, supplier is N/A.
  useEffect(() => {
    if (form.source === "existing-stock") setForm((p) => ({ ...p, supplier: "" }));
    else if (!form.supplier) setForm((p) => ({ ...p, supplier: suppliers[0] ?? "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.source]);

  const isLocalBuyer = form.source === "local-buyer-fabric" || form.source === "local-buyer-thread";
  const subtotal = (Number(form.required) || 0) * (Number(form.unitCost) || 0);

  const validate = (): string | null => {
    if (!form.name.trim()) return "Material name is required.";
    if (!form.required || Number(form.required) <= 0) return "Required quantity must be greater than zero.";
    if (!form.unitCost || Number(form.unitCost) < 0) return "Unit cost is required.";
    if (!form.source) return "Please choose where this material comes from.";
    if (isLocalBuyer && !form.supplier.trim()) return "Local Buyer source needs a supplier.";
    if (form.source === "existing-stock" && (!form.inStock || Number(form.inStock) <= 0)) {
      return "Existing stock source needs the available stock quantity.";
    }
    return null;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast({ title: "Cannot save material", description: err, variant: "destructive" });
      return;
    }
    const sourceLabel = MATERIAL_SOURCES.find((s) => s.key === form.source)?.label ?? form.source;
    toast({
      title: "Material added",
      description: `${form.name} · ${form.required} ${form.unit} · ${sourceLabel}${isLocalBuyer ? ` (${form.supplier})` : ""}`,
    });
    onOpenChange(false);
    setForm((p) => ({ ...p, name: "", required: "", unitCost: "", inStock: "", notes: "" }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-[640px] flex-col overflow-hidden bg-card border-border p-0 sm:w-full">
        <DialogHeader className="border-b border-border px-5 py-4 sm:px-6">
          <DialogTitle>Add material to order</DialogTitle>
          <DialogDescription>
            Every material must be sourced — from the Local Buyer (processed fabric / thread) or pulled from existing stock.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Order" required>
                  <Select value={form.orderId} onValueChange={(v) => setForm({ ...form, orderId: v })}>
                    <SelectTrigger className="bg-surface-3 border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MATERIAL_ORDERS.map((o) => (
                        <SelectItem key={o.orderId} value={o.orderId}>
                          {o.orderId} · {o.client}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Material name" required>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Cotton Jersey 180gsm"
                    className="bg-surface-3 border-border"
                  />
                </Field>
              </div>

              <Field label="Category">
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as typeof form.category })}>
                  <SelectTrigger className="bg-surface-3 border-border capitalize"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Condition">
                <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v as MaterialCondition })}>
                  <SelectTrigger className="bg-surface-3 border-border capitalize"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Required qty" required>
                <Input
                  type="number" min={0}
                  value={form.required}
                  onChange={(e) => setForm({ ...form, required: e.target.value })}
                  className="bg-surface-3 border-border"
                />
              </Field>
              <Field label="Unit">
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v as MaterialUnit })}>
                  <SelectTrigger className="bg-surface-3 border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Unit cost (PKR)" required>
                <Input
                  type="number" min={0}
                  value={form.unitCost}
                  onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
                  className="bg-surface-3 border-border"
                />
              </Field>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Subtotal</Label>
                <div className="flex h-10 items-center rounded-md border border-border bg-surface-1 px-3 tabular text-sm font-semibold text-foreground">
                  {formatPKR(subtotal)}
                </div>
              </div>

              {/* Sourcing section */}
              <div className="sm:col-span-2 mt-2 rounded-lg border border-border bg-surface-1/60 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="secondary" className="border-0 bg-primary/15 text-[10px] uppercase text-primary">Required</Badge>
                  <span className="text-xs font-semibold text-foreground">Material sourcing</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Source" required>
                    <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v as MaterialSource })}>
                      <SelectTrigger className="bg-surface-3 border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MATERIAL_SOURCES.map((s) => (
                          <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  {isLocalBuyer ? (
                    <Field label="Supplier (Local Buyer)" required>
                      <Select value={form.supplier} onValueChange={(v) => setForm({ ...form, supplier: v })}>
                        <SelectTrigger className="bg-surface-3 border-border">
                          <SelectValue placeholder="Choose a supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          <SelectItem value="__new__">+ Add as new supplier in Local Buyer</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  ) : (
                    <Field label="Available in stock" required>
                      <Input
                        type="number" min={0}
                        value={form.inStock}
                        onChange={(e) => setForm({ ...form, inStock: e.target.value })}
                        placeholder="Qty already in inventory"
                        className="bg-surface-3 border-border"
                      />
                    </Field>
                  )}
                </div>
                <p className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <Info className="mt-0.5 h-3 w-3" />
                  {isLocalBuyer
                    ? "This entry will appear under Expenses → Local Buyer for the chosen supplier."
                    : "Existing stock won't create a Local Buyer entry — it just decrements your inventory."}
                </p>
              </div>

              <div className="sm:col-span-2">
                <Field label="Notes">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Pre-shrunk, reactive dyes only…"
                    className="bg-surface-3 border-border"
                  />
                </Field>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-border bg-surface-1/40 px-5 py-3 sm:px-6">
            <Button type="button" variant="outline" className="border-border" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary-hover">Add Material</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">
        {label}{required && <span className="text-danger"> *</span>}
      </Label>
      {children}
    </div>
  );
}