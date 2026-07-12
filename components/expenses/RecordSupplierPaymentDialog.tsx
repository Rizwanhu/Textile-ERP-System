"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useLocalSuppliers } from "@/context/LocalSuppliersContext";
import type { LocalSupplier } from "@/types/localSupplier";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: LocalSupplier;
};

export function RecordSupplierPaymentDialog({ open, onOpenChange, supplier }: Props) {
  const { recordPayment } = useLocalSuppliers();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [method, setMethod] = useState<"bank_transfer" | "cash" | "other">("bank_transfer");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    recordPayment({
      supplierId: supplier.id,
      date,
      amount: amt,
      description: description || undefined,
      method,
      reference: reference || undefined,
    });
    toast({ title: "Payment recorded", description: `${supplier.name} — ${amt.toLocaleString()} PKR` });
    onOpenChange(false);
    setAmount("");
    setDescription("");
    setReference("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>Payment to {supplier.name} (reduces balance due).</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Payment date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border-border bg-surface-3" />
          </Field>
          <Field label="Amount (PKR)">
            <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className="border-border bg-surface-3" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Method">
              <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
                <SelectTrigger className="border-border bg-surface-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Reference">
              <Input value={reference} onChange={(e) => setReference(e.target.value)} className="border-border bg-surface-3" />
            </Field>
          </div>
          <Field label="Description">
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="border-border bg-surface-3" />
          </Field>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" className="border-border" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary-hover">Save payment</Button>
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
