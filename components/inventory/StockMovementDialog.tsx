"use client";

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
import type { InventoryItem, InventoryUnit, StockMovementType } from "@/data/inventory";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem;
  onSubmit: (input: {
    type: StockMovementType;
    qty: number;
    reference: string;
    notes?: string;
    orderId?: string;
  }) => Promise<{ error?: string }>;
};

const MOVE_TYPES: { value: StockMovementType; label: string }[] = [
  { value: "in", label: "Stock in" },
  { value: "out", label: "Stock out" },
  { value: "return", label: "Return" },
  { value: "adjust", label: "Adjust / write-off" },
];

export function StockMovementDialog({ open, onOpenChange, item, onSubmit }: Props) {
  const [type, setType] = useState<StockMovementType>("in");
  const [qty, setQty] = useState("");
  const [reference, setReference] = useState("");
  const [orderId, setOrderId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType("in");
    setQty("");
    setReference("");
    setOrderId("");
    setNotes("");
  }, [open, item.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(qty);
    if (!amount || amount <= 0) {
      toast({ title: "Enter a valid quantity", variant: "destructive" });
      return;
    }
    if (!reference.trim()) {
      toast({ title: "Reference is required", description: "PO, order ID, or note.", variant: "destructive" });
      return;
    }
    if ((type === "out" || type === "adjust") && amount > item.inStock) {
      toast({
        title: "Insufficient stock",
        description: `Only ${item.inStock.toLocaleString()} ${item.unit} available.`,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const result = await onSubmit({
      type,
      qty: amount,
      reference: reference.trim(),
      notes: notes.trim() || undefined,
      orderId: orderId.trim() || undefined,
    });
    setSaving(false);

    if (result.error) {
      toast({ title: "Movement failed", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Stock updated", description: `${item.name} — ${type} ${amount} ${item.unit}` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Record stock movement</DialogTitle>
          <DialogDescription>
            {item.name} · {item.inStock.toLocaleString()} {item.unit} in stock
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Movement type</Label>
            <Select value={type} onValueChange={(v) => setType(v as StockMovementType)}>
              <SelectTrigger className="border-border bg-surface-3"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MOVE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Quantity ({item.unit})</Label>
            <Input type="number" min={0} step="0.01" value={qty} onChange={(e) => setQty(e.target.value)} className="border-border bg-surface-3" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Reference</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="PO-2026-118 or ADJ-0042" className="border-border bg-surface-3 mono" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Link to order (optional)</Label>
            <Input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="ORD-2026-024" className="border-border bg-surface-3 mono" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="border-border bg-surface-3" />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" className="border-border" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary-hover" disabled={saving}>
              {saving ? "Saving…" : "Record movement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
