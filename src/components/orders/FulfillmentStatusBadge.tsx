import { cn } from "@/lib/utils";
import type { FulfillmentStatus } from "@/types/clientAccount";
import { FULFILLMENT_LABEL } from "@/lib/clientAccount";

const map: Record<FulfillmentStatus, { cls: string; rowCls: string }> = {
  delivered: { cls: "bg-success/15 text-success", rowCls: "bg-success/5" },
  "waiting-design": { cls: "bg-info/15 text-info", rowCls: "bg-info/5" },
  "in-process": { cls: "bg-warning/15 text-warning", rowCls: "bg-warning/5" },
  "partial-delivered": { cls: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400", rowCls: "bg-yellow-500/5" },
  cancelled: { cls: "bg-muted text-muted-foreground line-through", rowCls: "bg-muted/30 opacity-60" },
};

export function FulfillmentStatusBadge({ status }: { status: FulfillmentStatus }) {
  const m = map[status];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", m.cls)}>
      {FULFILLMENT_LABEL[status]}
    </span>
  );
}

export function fulfillmentRowClass(status: FulfillmentStatus): string {
  return map[status].rowCls;
}
