import { cn } from "@/lib/utils";

export type OrderStatus = "draft" | "active" | "in-production" | "qc-hold" | "completed" | "dispatched" | "overdue";

const map: Record<OrderStatus, { label: string; cls: string }> = {
  draft:          { label: "Draft",         cls: "bg-foreground/10 text-muted-foreground" },
  active:         { label: "Active",        cls: "bg-info/15 text-info" },
  "in-production":{ label: "In Production", cls: "bg-warning/15 text-warning" },
  "qc-hold":      { label: "QC Hold",       cls: "bg-violet/15 text-violet" },
  completed:      { label: "Completed",     cls: "bg-success/15 text-success" },
  dispatched:     { label: "Dispatched",    cls: "bg-primary/15 text-primary" },
  overdue:        { label: "Overdue",       cls: "bg-danger/15 text-danger" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const m = map[status];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", m.cls)}>
      {m.label}
    </span>
  );
}