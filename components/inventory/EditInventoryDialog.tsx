"use client";

import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import type { InventoryItem, InventoryUnit } from "@/data/inventory";

const CATEGORIES: InventoryItem["category"][] = ["fabric", "thread", "trim", "accessory", "packaging"];
const UNITS: InventoryUnit[] = ["kg", "m", "pcs", "rolls", "spools"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem;
  onSave: (patch: {
    sku: string;
    name: string;
    category: InventoryItem["category"];
    unit: InventoryUnit;
    reorderLevel: number;
    unitCost: number;
    location: string;
  }) => Promise<{ error?: string }>;
};

export function EditInventoryDialog({ open, onOpenChange, item, onSave }: Props) {
  const [form, setForm] = useState({
    sku: item.sku,
    name: item.name,
    category: item.category,
    unit: item.unit,
    reorderLevel: String(item.reorderLevel),
    unitCost: String(item.unitCost),
    location: item.location,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      sku: item.sku,
      name: item.name,
      category: item.category,
      unit: item.unit,
      reorderLevel: String(item.reorderLevel),
      unitCost: String(item.unitCost),
      location: item.location,
    });
  }, [open, item]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sku.trim() || !form.name.trim()) {
      toast({ title: "SKU and name are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const result = await onSave({
      sku: form.sku.trim().toUpperCase(),
      name: form.name.trim(),
      category: form.category,
      unit: form.unit,
      reorderLevel: Number(form.reorderLevel) || 0,
      unitCost: Number(form.unitCost) || 0,
      location: form.location.trim() || "—",
    });
    setSaving(false);
    if (result.error) {
      toast({ title: "Could not update item", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Item updated", description: form.name });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card" style={{ maxWidth: 560 }}>
        <DialogHeader>
          <DialogTitle>Edit inventory item</DialogTitle>
          <DialogDescription>Update SKU details. Use stock movement to change quantity.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="SKU" required>
              <Input value={form.sku} onChange={(e) => set("sku", e.target.value)} className="border-border bg-surface-3 mono" />
            </Field>
            <Field label="Name" required>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="border-border bg-surface-3" />
            </Field>
            <Field label="Category">
              <Select value={form.category} onValueChange={(v) => set("category", v as InventoryItem["category"])}>
                <SelectTrigger className="border-border bg-surface-3"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Unit">
              <Select value={form.unit} onValueChange={(v) => set("unit", v as InventoryUnit)}>
                <SelectTrigger className="border-border bg-surface-3"><SelectValue /></SelectTrigger>
                <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Reorder level">
              <Input type="number" min={0} value={form.reorderLevel} onChange={(e) => set("reorderLevel", e.target.value)} className="border-border bg-surface-3" />
            </Field>
            <Field label="Unit cost (PKR)">
              <Input type="number" min={0} value={form.unitCost} onChange={(e) => set("unitCost", e.target.value)} className="border-border bg-surface-3" />
            </Field>
            <Field label="Location">
              <Input value={form.location} onChange={(e) => set("location", e.target.value)} className="border-border bg-surface-3" />
            </Field>
            <Field label="Current stock">
              <Input value={`${item.inStock} ${item.unit}`} disabled className="border-border bg-surface-1 text-muted-foreground" />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="border-border" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary-hover" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
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
