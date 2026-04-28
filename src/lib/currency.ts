// Pakistani Rupee formatting helpers used everywhere money is displayed.
const RS = "Rs";

const pkrFormatter = new Intl.NumberFormat("en-PK", {
  maximumFractionDigits: 0,
});

const pkrDecimalFormatter = new Intl.NumberFormat("en-PK", {
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
