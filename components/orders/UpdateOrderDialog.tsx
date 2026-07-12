"use client";

import { useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { updateOrderInDb } from "@/actions/orders";
import type { OrderDetail } from "@/data/orders";
import type { OrderStatus } from "@/components/dashboard/StatusBadge";

const STATUSES: OrderStatus[] = [
  "draft", "active", "in-production", "qc-hold", "completed", "dispatched", "overdue",
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  draft: "Draft",
  active: "Active",
  "in-production": "In Production",
  "qc-hold": "QC Hold",
  completed: "Completed",
  dispatched: "Dispatched",
  overdue: "Overdue",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderDetail;
  onUpdated: (order: OrderDetail) => void;
};

export function UpdateOrderDialog({ open, onOpenChange, order, onUpdated }: Props) {
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [clientName, setClientName] = useState(order.client);
  const [product, setProduct] = useState(order.product);
  const [poNumber, setPoNumber] = useState(order.poNumber);
  const [orderDate, setOrderDate] = useState(order.orderDate);
  const [deliveryDate, setDeliveryDate] = useState(order.deliveryDate);
  const [qty, setQty] = useState(String(order.qty));
  const [value, setValue] = useState(String(order.value));
  const [contactName, setContactName] = useState(order.contact.name);
  const [contactEmail, setContactEmail] = useState(order.contact.email);
  const [contactPhone, setContactPhone] = useState(order.contact.phone);
  const [shipTo, setShipTo] = useState(order.shipTo);
  const [fabric, setFabric] = useState(order.fabric);
  const [notes, setNotes] = useState(order.notes);
  const [produced, setProduced] = useState(String(order.produced));
  const [packed, setPacked] = useState(String(order.packed));
  const [rejected, setRejected] = useState(String(order.rejected));

  useEffect(() => {
    if (!open) return;
    setStatus(order.status);
    setClientName(order.client);
    setProduct(order.product);
    setPoNumber(order.poNumber);
    setOrderDate(order.orderDate);
    setDeliveryDate(order.deliveryDate);
    setQty(String(order.qty));
    setValue(String(order.value));
    setContactName(order.contact.name);
    setContactEmail(order.contact.email);
    setContactPhone(order.contact.phone);
    setShipTo(order.shipTo);
    setFabric(order.fabric);
    setNotes(order.notes);
    setProduced(String(order.produced));
    setPacked(String(order.packed));
    setRejected(String(order.rejected));
  }, [open, order]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = Number(qty);
    const valueNum = Number(value);
    if (!clientName.trim() || !product.trim()) {
      toast({ title: "Client and product are required", variant: "destructive" });
      return;
    }
    if (!qtyNum || qtyNum <= 0 || !valueNum || valueNum <= 0) {
      toast({ title: "Valid quantity and value required", variant: "destructive" });
      return;
    }

    setSaving(true);
    const result = await updateOrderInDb(order.id, {
      status,
      clientName: clientName.trim(),
      product: product.trim(),
      poNumber: poNumber.trim(),
      orderDate,
      deliveryDate,
      qty: qtyNum,
      value: valueNum,
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      shipTo: shipTo.trim(),
      fabric: fabric.trim(),
      notes: notes.trim(),
      produced: Number(produced) || 0,
      packed: Number(packed) || 0,
      rejected: Number(rejected) || 0,
    });
    setSaving(false);

    if ("error" in result) {
      toast({ title: "Could not update order", description: result.error, variant: "destructive" });
      return;
    }

    const updated: OrderDetail = {
      ...order,
      status,
      client: clientName.trim(),
      product: product.trim(),
      poNumber: poNumber.trim(),
      orderDate,
      deliveryDate,
      qty: qtyNum,
      value: valueNum,
      contact: {
        name: contactName.trim(),
        email: contactEmail.trim(),
        phone: contactPhone.trim(),
      },
      shipTo: shipTo.trim(),
      fabric: fabric.trim(),
      notes: notes.trim(),
      produced: Number(produced) || 0,
      packed: Number(packed) || 0,
      rejected: Number(rejected) || 0,
    };
    onUpdated(updated);
    toast({ title: "Order updated", description: `${order.id} saved to database.` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-[640px] flex-col overflow-hidden border-border bg-card p-0 sm:w-full">
        <DialogHeader className="border-b border-border px-5 py-4 sm:px-6">
          <DialogTitle>Update order</DialogTitle>
          <DialogDescription>
            Edit status, order details, contact, delivery, and production counts for {order.id}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <Tabs defaultValue="status" className="flex min-h-0 flex-1 flex-col">
            <TabsList className="mx-5 mt-4 w-auto justify-start bg-surface-1 sm:mx-6">
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="details">Order</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="production">Production</TabsTrigger>
            </TabsList>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
              <TabsContent value="status" className="mt-0 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Order status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
                    <SelectTrigger className="border-border bg-surface-3"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Order date">
                    <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className="border-border bg-surface-3" />
                  </Field>
                  <Field label="Delivery date">
                    <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="border-border bg-surface-3" />
                  </Field>
                </div>
              </TabsContent>

              <TabsContent value="details" className="mt-0 space-y-4">
                <Field label="Client name" required>
                  <Input value={clientName} onChange={(e) => setClientName(e.target.value)} className="border-border bg-surface-3" />
                </Field>
                <Field label="Product" required>
                  <Input value={product} onChange={(e) => setProduct(e.target.value)} className="border-border bg-surface-3" />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="PO number">
                    <Input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} className="border-border bg-surface-3 mono" />
                  </Field>
                  <Field label="Fabric">
                    <Input value={fabric} onChange={(e) => setFabric(e.target.value)} className="border-border bg-surface-3" />
                  </Field>
                  <Field label="Quantity (pcs)" required>
                    <Input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} className="border-border bg-surface-3" />
                  </Field>
                  <Field label="Order value (PKR)" required>
                    <Input type="number" min={1} value={value} onChange={(e) => setValue(e.target.value)} className="border-border bg-surface-3" />
                  </Field>
                </div>
                <Field label="Ship to">
                  <Textarea rows={2} value={shipTo} onChange={(e) => setShipTo(e.target.value)} className="border-border bg-surface-3" />
                </Field>
                <Field label="Notes">
                  <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="border-border bg-surface-3" />
                </Field>
              </TabsContent>

              <TabsContent value="contact" className="mt-0 space-y-4">
                <Field label="Contact name">
                  <Input value={contactName} onChange={(e) => setContactName(e.target.value)} className="border-border bg-surface-3" />
                </Field>
                <Field label="Email">
                  <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="border-border bg-surface-3" />
                </Field>
                <Field label="Phone">
                  <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="border-border bg-surface-3" />
                </Field>
              </TabsContent>

              <TabsContent value="production" className="mt-0 space-y-4">
                <p className="text-xs text-muted-foreground">Shop floor counts — target {order.qty.toLocaleString()} pcs.</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Produced">
                    <Input type="number" min={0} value={produced} onChange={(e) => setProduced(e.target.value)} className="border-border bg-surface-3" />
                  </Field>
                  <Field label="Packed">
                    <Input type="number" min={0} value={packed} onChange={(e) => setPacked(e.target.value)} className="border-border bg-surface-3" />
                  </Field>
                  <Field label="Rejected">
                    <Input type="number" min={0} value={rejected} onChange={(e) => setRejected(e.target.value)} className="border-border bg-surface-3" />
                  </Field>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="gap-2 border-t border-border bg-surface-1/40 px-5 py-3 sm:px-6">
            <Button type="button" variant="outline" className="border-border" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
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
