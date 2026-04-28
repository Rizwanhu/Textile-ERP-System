import { ClipboardList, Package, Wallet, CheckCircle2, Truck, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { icon: ClipboardList, label: "Order",      count: "24",  tone: "info" },
  { icon: Package,       label: "Material",   count: "18",  tone: "violet" },
  { icon: Wallet,        label: "Expenses",   count: "12",  tone: "warning" },
  { icon: CheckCircle2,  label: "QC",         count: "9",   tone: "primary" },
  { icon: Truck,         label: "Dispatched", count: "47",  tone: "success" },
] as const;

const toneMap = {
  info: "bg-info/10 text-info border-info/20",
  violet: "bg-violet/10 text-violet border-violet/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  primary: "bg-primary/10 text-primary border-primary/20",
  success: "bg-success/10 text-success border-success/20",
};

export function WorkflowFlow() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="section-header">Production Pipeline</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Orders moving through each stage this month</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
        {steps.map((s, i) => (
          <div key={s.label} className="flex flex-1 items-center gap-3">
            <div className={cn("flex flex-1 flex-col gap-2 rounded-lg border bg-surface-1 p-4 transition-all hover:bg-surface-2", toneMap[s.tone])}>
              <div className="flex items-center justify-between">
                <s.icon className="h-4 w-4" />
                <span className="text-2xl font-bold tabular">{s.count}</span>
              </div>
              <span className="text-xs font-medium uppercase tracking-wider opacity-80">{s.label}</span>
            </div>
            {i < steps.length - 1 && <ArrowRight className="hidden h-4 w-4 shrink-0 text-foreground-subtle lg:block" />}
          </div>
        ))}
      </div>
    </div>
  );
}