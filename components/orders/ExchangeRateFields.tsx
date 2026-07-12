import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { convertToBillingCurrency, formatMoney } from "@/lib/currency";
import type { BillingCurrency } from "@/types/clientAccount";

type Props = {
  billingCurrency: BillingCurrency;
  inputCurrency: BillingCurrency;
  onInputCurrencyChange: (c: BillingCurrency) => void;
  exchangeRate: string;
  onExchangeRateChange: (v: string) => void;
  amount: string;
  onAmountChange?: (v: string) => void;
  amountLabel?: string;
  showConverted?: boolean;
  convertedAmount?: number;
};

export function ExchangeRateFields({
  billingCurrency,
  inputCurrency,
  onInputCurrencyChange,
  exchangeRate,
  onExchangeRateChange,
  amount,
  onAmountChange,
  amountLabel = "Amount",
  showConverted = true,
  convertedAmount,
}: Props) {
  const rate = Number(exchangeRate) || 0;
  const amt = Number(amount) || 0;
  const converted =
    convertedAmount ??
    convertToBillingCurrency(amt, inputCurrency, billingCurrency, rate);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Currency</Label>
        <Select value={inputCurrency} onValueChange={(v) => onInputCurrencyChange(v as BillingCurrency)}>
          <SelectTrigger className="border-border bg-surface-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GBP">GBP (£)</SelectItem>
            <SelectItem value="PKR">PKR (Rs)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          Exchange rate (PKR per 1 {billingCurrency})
        </Label>
        <Input
          type="number"
          min={0}
          step="0.01"
          value={exchangeRate}
          onChange={(e) => onExchangeRateChange(e.target.value)}
          placeholder="350"
          className="border-border bg-surface-3"
        />
      </div>
      {onAmountChange && (
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs text-muted-foreground">{amountLabel} ({inputCurrency})</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            className="border-border bg-surface-3"
          />
        </div>
      )}
      {showConverted && onAmountChange && inputCurrency !== billingCurrency && rate > 0 && amt > 0 && (
        <div className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm sm:col-span-2">
          <span className="text-muted-foreground">Converted to billing ({billingCurrency}): </span>
          <span className="font-semibold tabular text-foreground">{formatMoney(converted, billingCurrency)}</span>
        </div>
      )}
    </div>
  );
}
