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
import { ExchangeRateFields } from "@/components/orders/ExchangeRateFields";
import { toast } from "@/hooks/use-toast";
import { useClientAccounts } from "@/context/ClientAccountsContext";
import { DEFAULT_EXCHANGE } from "@/lib/clientAccount";
import type { BillingCurrency, Client } from "@/types/clientAccount";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
};

export function RecordPaymentDialog({ open, onOpenChange, client }: Props) {
  const { recordPayment } = useClientAccounts();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [inputCurrency, setInputCurrency] = useState<BillingCurrency>(client.billingCurrency);
  const [exchangeRate, setExchangeRate] = useState(String(DEFAULT_EXCHANGE));
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [method, setMethod] = useState<"bank_transfer" | "cash" | "other">("bank_transfer");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    const rate = Number(exchangeRate);
    if (!amt || amt <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    if (!rate || rate <= 0) {
      toast({ title: "Enter a valid exchange rate", variant: "destructive" });
      return;
    }
    recordPayment({
      clientId: client.id,
      date,
      inputAmount: amt,
      inputCurrency,
      exchangeRate: rate,
      description: description || undefined,
      method,
      reference: reference || undefined,
    });
    toast({ title: "Payment recorded", description: `${client.name} — batch payment saved.` });
    onOpenChange(false);
    setAmount("");
    setDescription("");
    setReference("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-border bg-card sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            Record a batch or full payment for {client.name}. Enter currency, exchange rate, and amount.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Payment date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border-border bg-surface-3" />
          </div>
          <ExchangeRateFields
            billingCurrency={client.billingCurrency}
            inputCurrency={inputCurrency}
            onInputCurrencyChange={setInputCurrency}
            exchangeRate={exchangeRate}
            onExchangeRateChange={setExchangeRate}
            amount={amount}
            onAmountChange={setAmount}
            amountLabel="Payment amount"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
                <SelectTrigger className="border-border bg-surface-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Reference (optional)</Label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="TXN-12345" className="border-border bg-surface-3" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Description (optional)</Label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Received Payment 11-Jun-2026"
              className="border-border bg-surface-3"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" className="border-border" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary-hover">Save payment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
