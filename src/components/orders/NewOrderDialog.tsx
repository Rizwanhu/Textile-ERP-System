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

type Props = {
  open: boolean;
  onOpenChange: (b: boolean) => void;
};

export function NewOrderDialog({ open, onOpenChange }: Props) {
  const [form, setForm] = useState({
    client: "", product: "", fabric: "Cotton 180gsm",
    qty: "", rate: "", orderDate: new Date().toISOString().slice(0, 10), deliveryDate: "",
    poNumber: "", notes: "",
  });
  const value = (Number(form.qty) || 0) * (Number(form.rate) || 0);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client || !form.product || !form.qty) {
      toast({ title: "Missing fields", description: "Client, product and quantity are required.", variant: "destructive" });
      return;
    }
    toast({
      title: "Order created",
      description: `${form.client} · ${Number(form.qty).toLocaleString()} pcs · Rs ${value.toLocaleString()}`,
    });
    onOpenChange(false);
    setForm({ ...form, client: "", product: "", qty: "", rate: "", deliveryDate: "", poNumber: "", notes: "" });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-[600px] flex-col overflow-hidden bg-card border-border p-0 sm:w-full">
        <DialogHeader className="border-b border-border px-5 py-4 sm:px-6">
          <DialogTitle>New order</DialogTitle>
          <DialogDescription>Capture a client PO and kick off the production pipeline.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
         <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Client" required><Input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} placeholder="Northwind Apparel" className="bg-surface-3 border-border" /></Field>
            <Field label="PO Number"><Input value={form.poNumber} onChange={(e) => setForm({ ...form, poNumber: e.target.value })} placeholder="PO-2026-024" className="bg-surface-3 border-border" /></Field>
            <div className="sm:col-span-2">
              <Field label="Product" required><Input value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} placeholder="Crew Neck Tee — Cotton 180gsm" className="bg-surface-3 border-border" /></Field>
            </div>
            <Field label="Fabric type">
              <Select value={form.fabric} onValueChange={(v) => setForm({ ...form, fabric: v })}>
                <SelectTrigger className="bg-surface-3 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Cotton 180gsm", "Pique 220gsm", "Linen 140gsm", "French Terry 280gsm", "Fleece 320gsm", "Twill"].map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Quantity (pcs)" required><Input type="number" min={0} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} className="bg-surface-3 border-border" /></Field>
            <Field label="Unit rate (PKR)"><Input type="number" min={0} value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} className="bg-surface-3 border-border" /></Field>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Order value</Label>
              <div className="flex h-10 items-center rounded-md border border-border bg-surface-1 px-3 tabular text-sm font-semibold text-foreground">
                Rs {value.toLocaleString()}
              </div>
            </div>
            <Field label="Order date"><Input type="date" value={form.orderDate} onChange={(e) => setForm({ ...form, orderDate: e.target.value })} className="bg-surface-3 border-border" /></Field>
            <Field label="Delivery date"><Input type="date" value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} className="bg-surface-3 border-border" /></Field>
            <div className="sm:col-span-2">
              <Field label="Notes / spec"><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-surface-3 border-border" placeholder="Pre-shrunk, reactive dyes only…" /></Field>
            </div>
          </div>
         </div>
          <DialogFooter className="gap-2 border-t border-border bg-surface-1/40 px-5 py-3 sm:px-6">
            <Button type="button" variant="outline" className="border-border" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary-hover">Create Order</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}{required && <span className="text-danger"> *</span>}</Label>
      {children}
    </div>
  );
}
