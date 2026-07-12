import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/currency";
import { toast } from "@/hooks/use-toast";
import { useClientAccounts } from "@/context/ClientAccountsContext";
import type { BillingCurrency, Client } from "@/types/clientAccount";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, dialog edits an existing client instead of creating one. */
  client?: Client;
  onCreated?: (clientId: string) => void;
};

export function ClientFormDialog({ open, onOpenChange, client, onCreated }: Props) {
  const { addClient, updateClient } = useClientAccounts();
  const isEdit = !!client;

  const [name, setName] = useState("");
  const [type, setType] = useState<"export" | "local">("export");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("");
  const [openingBalanceDate, setOpeningBalanceDate] = useState("");
  const [openingBalanceNote, setOpeningBalanceNote] = useState("Previous outstanding amount");

  const billingCurrency: BillingCurrency = type === "export" ? "GBP" : "PKR";

  useEffect(() => {
    if (!open) return;
    if (client) {
      setName(client.name);
      setType(client.type);
      setContactName(client.contact?.name ?? "");
      setEmail(client.contact?.email ?? "");
      setPhone(client.contact?.phone ?? "");
      setBillingAddress(client.billingAddress ?? "");
      setOpeningBalance(client.openingBalance ? String(client.openingBalance) : "");
      setOpeningBalanceDate(client.openingBalanceDate ?? "");
      setOpeningBalanceNote(client.openingBalanceNote ?? "Previous outstanding amount");
      setShowMore(!!(client.contact || client.billingAddress || client.openingBalance));
    } else {
      setName("");
      setType("export");
      setContactName("");
      setEmail("");
      setPhone("");
      setBillingAddress("");
      setOpeningBalance("");
      setOpeningBalanceDate("");
      setOpeningBalanceNote("Previous outstanding amount");
      setShowMore(false);
    }
  }, [open, client]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast({ title: "Client name is required", variant: "destructive" });
      return;
    }

    const contact =
      contactName.trim() || email.trim() || phone.trim()
        ? {
            name: contactName.trim() || trimmed,
            email: email.trim(),
            phone: phone.trim(),
          }
        : undefined;

    const opening = Number(openingBalance) || 0;

    if (isEdit && client) {
      updateClient(client.id, {
        name: trimmed,
        type,
        billingCurrency,
        contact,
        billingAddress: billingAddress.trim() || undefined,
        openingBalance: opening,
        openingBalanceDate: opening > 0 ? openingBalanceDate || undefined : undefined,
        openingBalanceNote: opening > 0 ? openingBalanceNote.trim() || undefined : undefined,
      });
      toast({ title: "Client updated", description: trimmed });
    } else {
      const id = addClient({
        name: trimmed,
        type,
        billingCurrency,
        contact,
        billingAddress: billingAddress.trim() || undefined,
        openingBalance: opening,
        openingBalanceDate: opening > 0 ? openingBalanceDate || new Date().toISOString().slice(0, 10) : undefined,
        openingBalanceNote: opening > 0 ? openingBalanceNote.trim() || undefined : undefined,
      });
      toast({ title: "Client added", description: `${trimmed} · ${billingCurrency} billing` });
      onCreated?.(id);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-[520px] flex-col overflow-hidden border-border bg-card p-0 sm:w-full">
        <DialogHeader className="border-b border-border px-5 py-4 sm:px-6">
          <DialogTitle>{isEdit ? "Edit client" : "Add client"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update billing and contact details for this client account."
              : "Create a new client account for invoicing and payments."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Client / company name <span className="text-danger">*</span>
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Scotland Print Co."
                className="border-border bg-surface-3"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Client type</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["export", "local"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                      type === t
                        ? "border-primary/50 bg-primary/10 text-foreground"
                        : "border-border bg-surface-3/40 text-muted-foreground hover:bg-surface-3/60",
                    )}
                  >
                    <div className="font-semibold capitalize">{t}</div>
                    <div className="mt-0.5 text-xs opacity-80">
                      {t === "export" ? "GBP billing · overseas" : "PKR billing · local"}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Billing currency: <span className="font-semibold text-foreground">{billingCurrency}</span>
                {type === "export" && " — exchange rate asked when recording payments/lines"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              className="text-xs font-semibold text-primary hover:text-primary-hover"
            >
              {showMore ? "− Hide contact & opening balance" : "+ Contact, address & opening balance"}
            </button>

            {showMore && (
              <div className="space-y-3 rounded-lg border border-border bg-surface-1/50 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Contact name</Label>
                    <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="James MacLeod" className="border-border bg-surface-3" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Phone</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 7700 900123" className="border-border bg-surface-3" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="orders@client.com" className="border-border bg-surface-3" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Billing address</Label>
                  <Textarea rows={2} value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} placeholder="Street, city, country" className="border-border bg-surface-3" />
                </div>
                <div className="border-t border-border pt-3">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">Opening balance (optional)</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Amount ({billingCurrency})</Label>
                      <Input type="number" min={0} step="0.01" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} placeholder="0" className="border-border bg-surface-3" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">As of date</Label>
                      <Input type="date" value={openingBalanceDate} onChange={(e) => setOpeningBalanceDate(e.target.value)} className="border-border bg-surface-3" />
                    </div>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Note</Label>
                    <Input value={openingBalanceNote} onChange={(e) => setOpeningBalanceNote(e.target.value)} className="border-border bg-surface-3" />
                  </div>
                  {Number(openingBalance) > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Carried forward: <span className="font-semibold text-foreground">{formatMoney(Number(openingBalance), billingCurrency)}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 border-t border-border bg-surface-1/40 px-5 py-3 sm:px-6">
            <Button type="button" variant="outline" className="border-border" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary-hover">
              {isEdit ? "Save changes" : "Add client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
