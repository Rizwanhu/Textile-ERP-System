import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  delta?: number;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "violet" | "info";
  sub?: string;
}

const toneMap: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  violet: "bg-violet/10 text-violet",
  info: "bg-info/10 text-info",
};

export function KpiCard({ label, value, delta, icon: Icon, tone = "primary", sub }: KpiCardProps) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="group rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:border-primary/30 hover:shadow-card-hover">
      <div className="flex items-start justify-between">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", toneMap[tone])}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
        {typeof delta === "number" && (
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              positive ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
            )}
          >
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {positive ? "+" : ""}
            {delta}%
          </span>
        )}
      </div>
      <p className="mt-4 label-caption">{label}</p>
      <p className="kpi-value mt-1">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}