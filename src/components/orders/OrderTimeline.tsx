import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderDetail } from "@/data/orders";
import { getCurrentStep } from "@/data/orders";

const fmt = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export function OrderTimeline({ order }: { order: OrderDetail }) {
  const current = getCurrentStep(order);
  const isOverdue = order.status === "overdue";
  const [open, setOpen] = useState<Record<number, boolean>>({ [current]: true });
  const toggle = (i: number) => setOpen((s) => ({ ...s, [i]: !s[i] }));

  return (
    <ol className="relative space-y-5">
      {order.timeline.map((ev, i) => {
        const done = i < current;
        const active = i === current;
        const upcoming = i > current;
        const overdueHere = isOverdue && active;
        const isOpen = !!open[i];
        const variance =
          ev.actualDate && ev.date
            ? Math.round(
                (new Date(ev.actualDate).getTime() - new Date(ev.date).getTime()) / 86_400_000,
              )
            : null;

        return (
          <li key={ev.key + i} className="relative flex gap-4">
            {/* Connector */}
            {i < order.timeline.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[14px] top-8 h-[calc(100%-12px)] w-px",
                  done ? "bg-primary/60" : "bg-border",
                )}
              />
            )}
            {/* Node */}
            <div
              className={cn(
                "relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                done && "border-primary bg-primary text-primary-foreground",
                active && !overdueHere && "border-primary bg-primary/15 text-primary",
                overdueHere && "border-danger bg-danger/15 text-danger",
                upcoming && "border-border bg-card text-muted-foreground",
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
              {active && !overdueHere && (
                <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary/30" />
              )}
            </div>
            {/* Content */}
            <div className="flex-1 pb-1">
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-expanded={isOpen}
                className="group flex w-full flex-wrap items-baseline justify-between gap-2 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <h4
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-semibold",
                    upcoming ? "text-muted-foreground" : "text-foreground",
                    overdueHere && "text-danger",
                  )}
                >
                  {ev.label}
                  {overdueHere && <span className="ml-1 text-[11px] font-medium uppercase tracking-wide">Overdue</span>}
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-muted-foreground transition-transform",
                      isOpen && "rotate-180",
                    )}
                  />
                </h4>
                <time className="tabular text-xs text-muted-foreground">{fmt(ev.actualDate ?? ev.date)}</time>
              </button>
              {isOpen && (
                <div className="mt-2 space-y-2 rounded-lg border border-border bg-surface-1 p-3 text-xs">
                  {ev.note && <p className="text-muted-foreground">{ev.note}</p>}
                  <dl className="grid grid-cols-2 gap-2">
                    <div>
                      <dt className="label-caption">Planned</dt>
                      <dd className="mt-0.5 tabular text-foreground">{fmt(ev.date)}</dd>
                    </div>
                    <div>
                      <dt className="label-caption">Actual</dt>
                      <dd
                        className={cn(
                          "mt-0.5 tabular",
                          ev.actualDate ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {fmt(ev.actualDate)}
                      </dd>
                    </div>
                  </dl>
                  {variance !== null && (
                    <div
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        variance > 0 && "bg-danger/15 text-danger",
                        variance < 0 && "bg-success/15 text-success",
                        variance === 0 && "bg-surface-3 text-muted-foreground",
                      )}
                    >
                      {variance === 0
                        ? "On schedule"
                        : variance > 0
                          ? `+${variance}d late`
                          : `${Math.abs(variance)}d early`}
                    </div>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}