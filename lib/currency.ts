import type { BillingCurrency } from "@/types/clientAccount";

// Pakistani Rupee formatting helpers used everywhere money is displayed.
const RS = "Rs";

const pkrFormatter = new Intl.NumberFormat("en-PK", {
  maximumFractionDigits: 0,
});

const pkrDecimalFormatter = new Intl.NumberFormat("en-PK", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const gbpFormatter = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format a value as PKR with thousands separators. e.g. 84200 -> "Rs 84,200" */
export function formatPKR(n: number): string {
  return `${RS} ${pkrFormatter.format(Math.round(n))}`;
}

/** PKR with 2 decimals — for unit rates. e.g. 15.33 -> "Rs 15.33" */
export function formatPKRDecimal(n: number): string {
  return `${RS} ${pkrDecimalFormatter.format(n)}`;
}

/** GBP with 2 decimals. e.g. 4110 -> "£ 4,110.00" */
export function formatGBP(n: number): string {
  return `£ ${gbpFormatter.format(n)}`;
}

export function formatMoney(n: number, currency: BillingCurrency): string {
  return currency === "GBP" ? formatGBP(n) : formatPKR(n);
}

export function formatMoneyDecimal(n: number, currency: BillingCurrency): string {
  return currency === "GBP" ? formatGBP(n) : formatPKRDecimal(n);
}

/**
 * Convert an amount entered in `inputCurrency` to the client's `billingCurrency`.
 * `exchangeRate` = PKR per 1 unit of billing currency (e.g. 350 → 1 GBP = 350 PKR).
 */
export function convertToBillingCurrency(
  amount: number,
  inputCurrency: BillingCurrency,
  billingCurrency: BillingCurrency,
  exchangeRate: number,
): number {
  if (!amount || exchangeRate <= 0) return 0;
  if (inputCurrency === billingCurrency) return amount;
  if (billingCurrency === "GBP" && inputCurrency === "PKR") return amount / exchangeRate;
  if (billingCurrency === "PKR" && inputCurrency === "GBP") return amount * exchangeRate;
  return amount;
}

/** Compute line total from qty × unit price, with optional currency conversion. */
export function computeLineValue(
  quantity: number,
  unitPrice: number,
  inputCurrency: BillingCurrency,
  billingCurrency: BillingCurrency,
  exchangeRate: number,
): number {
  const raw = quantity * unitPrice;
  return +convertToBillingCurrency(raw, inputCurrency, billingCurrency, exchangeRate).toFixed(2);
}

/** Compact PKR for KPI tiles. 84_200 -> "Rs 84.2K", 1_200_000 -> "Rs 1.2M" */
export function formatPKRCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${RS} ${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${RS} ${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${RS} ${(n / 1_000).toFixed(1)}K`;
  return `${RS} ${n}`;
}

export const CURRENCY_LABEL = "PKR";
export const CURRENCY_PREFIX = RS;
