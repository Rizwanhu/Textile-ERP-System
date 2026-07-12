import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ExchangeRateFields } from "@/components/orders/ExchangeRateFields";
import { formatMoney } from "@/lib/currency";
import { toast } from "@/hooks/use-toast";
import { useClientAccounts } from "@/context/ClientAccountsContext";
import { DEFAULT_EXCHANGE } from "@/lib/clientAccount";
import type { Client, ClientLineItem } from "@/types/clientAccount";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  lineItem?: ClientLineItem;
};

export function CreditNoteDialog({ open, onOpenChange, client, lineItem }: Props) {
  const { issueCreditNote } = useClientAccounts();
  const [amount, setAmount] = useState(lineItem ? String(lineItem.invoiceValue) : "");
  const [exchangeRate, setExchangeRate] = useState(String(lineItem?.exchangeRate ?? DEFAULT_EXCHANGE));
  const [reason, setReason] = useState(lineItem ? "Order cancelled" : "");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    const rate = Number(exchangeRate);
    if (!amt || amt <= 0) {
      toast({ title: "Enter a valid credit amount", variant: "destructive" });
      return;
    }
    if (!reason.trim()) {
      toast({ title: "Reason required", variant: "destructive" });
      return;
    }
    const result = await issueCreditNote({
      clientId: client.id,
      lineItemId: lineItem?.id,
      amount: amt,
      exchangeRate: rate,
      reason: reason.trim(),
    });
    if (result.error) {
      toast({ title: "Could not issue credit note", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Credit note issued", description: formatMoney(amt, client.billingCurrency) });
    onOpenChange(false);
    setAmount("");
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Issue credit note</DialogTitle>
          <DialogDescription>
            {lineItem
              ? `Credit for: ${lineItem.description}`
              : `Manual credit adjustment for ${client.name}.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Credit amount ({client.billingCurrency})</Label>
            <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="border-border bg-surface-3" />
          </div>
          <ExchangeRateFields
            billingCurrency={client.billingCurrency}
            inputCurrency={client.billingCurrency}
            onInputCurrencyChange={() => {}}
            exchangeRate={exchangeRate}
            onExchangeRateChange={setExchangeRate}
            amount={amount}
            showConverted={false}
          />
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Reason</Label>
            <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Order cancelled by client" className="border-border bg-surface-3" />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" className="border-border" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary-hover">Issue credit</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
