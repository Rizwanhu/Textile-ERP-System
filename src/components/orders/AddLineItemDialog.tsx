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
import { ExchangeRateFields } from "@/components/orders/ExchangeRateFields";
import { computeLineValue, formatMoney } from "@/lib/currency";
import { toast } from "@/hooks/use-toast";
import { useClientAccounts } from "@/context/ClientAccountsContext";
import { DEFAULT_EXCHANGE } from "@/lib/clientAccount";
import type { BillingCurrency, Client, FulfillmentStatus } from "@/types/clientAccount";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
};

export function AddLineItemDialog({ open, onOpenChange, client }: Props) {
  const { addLineItem } = useClientAccounts();
  const defaultCurrency: BillingCurrency = client.type === "export" ? "GBP" : "PKR";
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [inputCurrency, setInputCurrency] = useState<BillingCurrency>(defaultCurrency);
  const [exchangeRate, setExchangeRate] = useState(String(DEFAULT_EXCHANGE));
  const [status, setStatus] = useState<FulfillmentStatus>("in-process");
  const [orderId, setOrderId] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));

  const qty = Number(quantity) || 0;
  const price = Number(unitPrice) || 0;
  const rate = Number(exchangeRate) || 0;
  const preview = computeLineValue(qty, price, inputCurrency, client.billingCurrency, rate);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast({ title: "Description required", variant: "destructive" });
      return;
    }
    if (!qty || !price) {
      toast({ title: "Quantity and unit price required", variant: "destructive" });
      return;
    }
    if (!rate) {
      toast({ title: "Exchange rate required", variant: "destructive" });
      return;
    }
    addLineItem({
      clientId: client.id,
      description: description.trim(),
      quantity: qty,
      unitPrice: price,
      inputCurrency,
      exchangeRate: rate,
      fulfillmentStatus: status,
      orderId: orderId || undefined,
      orderDate,
    });
    toast({ title: "Line item added" });
    onOpenChange(false);
    setDescription("");
    setQuantity("");
    setUnitPrice("");
    setOrderId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-border bg-card sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Add order line</DialogTitle>
          <DialogDescription>
            Add a product or service row for {client.name}. Billing currency: {client.billingCurrency}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Product / service description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Adult ZIPPER HOODIES SCOTLAND PRINT" className="border-border bg-surface-3" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Quantity (pcs)</Label>
              <Input type="number" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="border-border bg-surface-3" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">CNF price / pc</Label>
              <Input type="number" min={0} step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="border-border bg-surface-3" />
            </div>
          </div>
          <ExchangeRateFields
            billingCurrency={client.billingCurrency}
            inputCurrency={inputCurrency}
            onInputCurrencyChange={setInputCurrency}
            exchangeRate={exchangeRate}
            onExchangeRateChange={setExchangeRate}
            showConverted={false}
          />
          {qty > 0 && price > 0 && rate > 0 && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
              Invoice value ({client.billingCurrency}):{" "}
              <span className="font-semibold tabular">{formatMoney(preview, client.billingCurrency)}</span>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Fulfillment status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as FulfillmentStatus)}>
                <SelectTrigger className="border-border bg-surface-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-process">In Process</SelectItem>
                  <SelectItem value="waiting-design">Waiting Sticker Design</SelectItem>
                  <SelectItem value="partial-delivered">Partial Delivered</SelectItem>
                  <SelectItem value="delivered">Goods Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Order date</Label>
              <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className="border-border bg-surface-3" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Link to production order (optional)</Label>
            <Input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="ORD-2026-024" className="border-border bg-surface-3 mono" />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" className="border-border" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary-hover">Add line</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
