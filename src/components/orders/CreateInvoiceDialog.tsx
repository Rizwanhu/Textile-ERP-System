import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/currency";
import { toast } from "@/hooks/use-toast";
import { useClientAccounts } from "@/context/ClientAccountsContext";
import { generateClientInvoicePdf } from "@/lib/clientInvoicePdf";
import type { Client, ClientLineItem } from "@/types/clientAccount";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  lineItems: ClientLineItem[];
  selectedIds: string[];
  onSuccess?: () => void;
};

export function CreateInvoiceDialog({ open, onOpenChange, client, lineItems, selectedIds, onSuccess }: Props) {
  const { createInvoice, getBundle } = useClientAccounts();
  const [notes, setNotes] = useState("");

  const selected = useMemo(
    () => lineItems.filter((l) => selectedIds.includes(l.id) && !l.invoiced),
    [lineItems, selectedIds],
  );
  const subtotal = +selected.reduce((s, l) => s + l.invoiceValue, 0).toFixed(2);

  const submit = () => {
    if (!selected.length) {
      toast({ title: "Select at least one uninvoiced line", variant: "destructive" });
      return;
    }
    const invoice = createInvoice(client.id, selected.map((l) => l.id), notes || undefined);
    if (!invoice) {
      toast({ title: "Could not create invoice", variant: "destructive" });
      return;
    }
    const bundle = getBundle(client.id);
    if (bundle) {
      generateClientInvoicePdf({
        client: bundle.client,
        lineItems: bundle.lineItems.filter((l) => invoice.lineItemIds.includes(l.id)),
        allLineItems: bundle.lineItems,
        payments: bundle.payments,
        creditNotes: bundle.creditNotes,
        summary: bundle.summary,
        ledger: bundle.ledger,
        invoice,
      });
    }
    toast({
      title: "Invoice issued",
      description: `${invoice.invoiceNumber} — PDF downloaded.`,
    });
    onOpenChange(false);
    setNotes("");
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-border bg-card sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Create invoice</DialogTitle>
          <DialogDescription>
            Bundle {selected.length} line(s) into one invoice PDF with full account summary and payment history.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-1">
                  <th className="px-3 py-2 text-left label-caption">#</th>
                  <th className="px-3 py-2 text-left label-caption">Description</th>
                  <th className="px-3 py-2 text-right label-caption">Value</th>
                </tr>
              </thead>
              <tbody>
                {selected.map((l) => (
                  <tr key={l.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 tabular text-muted-foreground">{l.serialNumber}</td>
                    <td className="px-3 py-2 text-foreground">{l.description}</td>
                    <td className="px-3 py-2 text-right tabular">{formatMoney(l.invoiceValue, client.billingCurrency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between rounded-lg border border-border bg-surface-1 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Invoice subtotal</span>
            <span className="font-semibold tabular text-foreground">{formatMoney(subtotal, client.billingCurrency)}</span>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="border-border bg-surface-3" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" className="border-border" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} className="bg-primary text-primary-foreground hover:bg-primary-hover">
            Issue & download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
