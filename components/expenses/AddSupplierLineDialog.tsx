"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useLocalSuppliers } from "@/context/LocalSuppliersContext";
import type { LocalSupplier, SupplierLineStatus } from "@/types/localSupplier";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: LocalSupplier;
};

const UNITS = ["kg", "m", "pcs", "rolls", "spools"];

export function AddSupplierLineDialog({ open, onOpenChange, supplier }: Props) {
  const { addLineItem } = useLocalSuppliers();
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [unitPrice, setUnitPrice] = useState("");
  const [orderId, setOrderId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<SupplierLineStatus>("ordered");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(quantity);
    const price = Number(unitPrice);
    if (!description.trim() || !qty || !price) {
      toast({ title: "Description, quantity and rate required", variant: "destructive" });
      return;
    }
    addLineItem({
      supplierId: supplier.id,
      description: description.trim(),
      quantity: qty,
      unit,
      unitPrice: price,
      orderId: orderId || undefined,
      invoiceNumber: invoiceNumber || undefined,
      purchaseDate,
      status,
    });
    toast({ title: "Purchase added" });
    onOpenChange(false);
    setDescription("");
    setQuantity("");
    setUnitPrice("");
    setOrderId("");
    setInvoiceNumber("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Add purchase line</DialogTitle>
          <DialogDescription>New procurement entry for {supplier.name}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Item / description">
            <Input value={description} onChange={(e) => setDescription(e.target.value)} className="border-border bg-surface-3" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Quantity">
              <Input type="number" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="border-border bg-surface-3" />
            </Field>
            <Field label="Unit">
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="border-border bg-surface-3"><SelectValue /></SelectTrigger>
                <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Rate (PKR)">
              <Input type="number" min={0} value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="border-border bg-surface-3" />
            </Field>
            <Field label="Status">
              <Select value={status} onValueChange={(v) => setStatus(v as SupplierLineStatus)}>
                <SelectTrigger className="border-border bg-surface-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Order ID">
              <Input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="ORD-2026-024" className="border-border bg-surface-3 mono" />
            </Field>
            <Field label="Invoice #">
              <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="border-border bg-surface-3" />
            </Field>
            <Field label="Purchase date">
              <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="border-border bg-surface-3" />
            </Field>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" className="border-border" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary-hover">Add purchase</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
