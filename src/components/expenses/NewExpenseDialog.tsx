import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

export type ExpenseCategory =
  | "local-buyer" | "cutting" | "stitching" | "finishing" | "fixed" | "admin";

const CATEGORIES: { key: ExpenseCategory; label: string }[] = [
  { key: "local-buyer", label: "Local Buyer (procurement)" },
  { key: "cutting",     label: "Cutting" },
  { key: "stitching",   label: "Stitching" },
  { key: "finishing",   label: "Finishing & QC" },
  { key: "fixed",       label: "Fixed (overhead)" },
  { key: "admin",       label: "Admin" },
];

type Props = {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  defaultCategory?: ExpenseCategory;
};

export function NewExpenseDialog({ open, onOpenChange, defaultCategory = "local-buyer" }: Props) {
  const [form, setForm] = useState({
    category: defaultCategory,
    title: "",
    supplier: "",
    qty: "",
    unit: "pcs",
    rate: "",
    date: new Date().toISOString().slice(0, 10),
    invoice: "",
    notes: "",
  });

  // keep category in sync when caller opens with different default
  useEffect(() => {
    setForm((p) => ({ ...p, category: defaultCategory }));
  }, [defaultCategory]);

  const total = (Number(form.qty) || 0) * (Number(form.rate) || 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      toast({ title: "Item required", description: "Please enter what this expense is for.", variant: "destructive" });
      return;
    }
    toast({
      title: "Expense recorded",
      description: `${form.title} · Rs ${total.toLocaleString()} (${form.category.replace("-", " ")})`,
    });
    onOpenChange(false);
    setForm({ ...form, title: "", supplier: "", qty: "", rate: "", invoice: "", notes: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>New expense entry</DialogTitle>
          <DialogDescription>Record a procurement, labour, or overhead expense for this order.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 py-2">
          <Field label="Category">
            <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v as ExpenseCategory }))}>
              <SelectTrigger className="bg-surface-3 border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Item / Description" required>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Cotton Jersey 180gsm" className="bg-surface-3 border-border" />
            </Field>
            <Field label="Supplier / Team">
              <Input value={form.supplier} onChange={(e) => setForm((p) => ({ ...p, supplier: e.target.value }))} placeholder="Faisalabad Mills" className="bg-surface-3 border-border" />
            </Field>
            <Field label="Quantity">
              <Input type="number" min={0} value={form.qty} onChange={(e) => setForm((p) => ({ ...p, qty: e.target.value }))} className="bg-surface-3 border-border" />
            </Field>
            <Field label="Unit">
              <Select value={form.unit} onValueChange={(v) => setForm((p) => ({ ...p, unit: v }))}>
                <SelectTrigger className="bg-surface-3 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["pcs", "kg", "m", "rolls", "spools", "hours"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Rate (PKR)">
              <Input type="number" min={0} value={form.rate} onChange={(e) => setForm((p) => ({ ...p, rate: e.target.value }))} className="bg-surface-3 border-border" />
            </Field>
            <Field label="Date">
              <Input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} className="bg-surface-3 border-border" />
            </Field>
            <Field label="Invoice / Reference">
              <Input value={form.invoice} onChange={(e) => setForm((p) => ({ ...p, invoice: e.target.value }))} placeholder="FM-1042" className="bg-surface-3 border-border" />
            </Field>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Subtotal</Label>
              <div className="flex h-10 items-center rounded-md border border-border bg-surface-1 px-3 tabular text-sm font-semibold text-foreground">
                Rs {total.toLocaleString()}
              </div>
            </div>
          </div>
          <Field label="Notes">
            <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2} className="bg-surface-3 border-border" />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" className="border-border" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary-hover">Save Entry</Button>
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
