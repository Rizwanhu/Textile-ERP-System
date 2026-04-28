import { useState } from "react";
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
import type { InventoryItem, InventoryUnit } from "@/data/inventory";

type Props = {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onCreate: (item: InventoryItem) => void;
};

const CATEGORIES: InventoryItem["category"][] = ["fabric", "thread", "trim", "accessory", "packaging"];
const UNITS: InventoryUnit[] = ["kg", "m", "pcs", "rolls", "spools"];

export function NewInventoryDialog({ open, onOpenChange, onCreate }: Props) {
  const [form, setForm] = useState({
    sku: "", name: "", category: "fabric" as InventoryItem["category"], unit: "kg" as InventoryUnit,
    inStock: "", reorderLevel: "", unitCost: "", location: "", notes: "",
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sku || !form.name) {
      toast({ title: "Missing fields", description: "SKU and name are required.", variant: "destructive" });
      return;
    }
    const item: InventoryItem = {
      id: `i_${Date.now()}`,
      sku: form.sku.toUpperCase(),
      name: form.name,
      category: form.category,
      unit: form.unit,
      inStock: Number(form.inStock) || 0,
      reorderLevel: Number(form.reorderLevel) || 0,
      unitCost: Number(form.unitCost) || 0,
      location: form.location || "—",
      lastUpdated: new Date().toISOString().slice(0, 10),
    };
    onCreate(item);
    toast({ title: "Item added", description: `${item.name} added to inventory.` });
    onOpenChange(false);
    setForm({ sku: "", name: "", category: "fabric", unit: "kg", inStock: "", reorderLevel: "", unitCost: "", location: "", notes: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>New inventory item</DialogTitle>
          <DialogDescription>Add a fabric, trim, accessory, or packaging SKU to your store.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="SKU" required>
              <Input value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="FAB-CTN-180" className="bg-surface-3 border-border" />
            </Field>
            <Field label="Name" required>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Cotton Jersey 180gsm" className="bg-surface-3 border-border" />
            </Field>
            <Field label="Category">
              <Select value={form.category} onValueChange={(v) => set("category", v as InventoryItem["category"])}>
                <SelectTrigger className="bg-surface-3 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Unit">
              <Select value={form.unit} onValueChange={(v) => set("unit", v as InventoryUnit)}>
                <SelectTrigger className="bg-surface-3 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="In Stock">
              <Input type="number" min={0} value={form.inStock} onChange={(e) => set("inStock", e.target.value)} className="bg-surface-3 border-border" />
            </Field>
            <Field label="Reorder Level">
              <Input type="number" min={0} value={form.reorderLevel} onChange={(e) => set("reorderLevel", e.target.value)} className="bg-surface-3 border-border" />
            </Field>
            <Field label="Unit Cost (PKR)">
              <Input type="number" min={0} value={form.unitCost} onChange={(e) => set("unitCost", e.target.value)} className="bg-surface-3 border-border" />
            </Field>
            <Field label="Location">
              <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Rack A1" className="bg-surface-3 border-border" />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className="bg-surface-3 border-border" />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" className="border-border" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary-hover">Add Item</Button>
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
