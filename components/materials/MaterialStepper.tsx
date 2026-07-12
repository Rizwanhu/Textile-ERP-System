import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepDef = { key: string; label: string; hint: string };

interface Props {
  steps: StepDef[];
  current: number;
  onSelect?: (index: number) => void;
}

export function MaterialStepper({ steps, current, onSelect }: Props) {
  return (
    <ol className="flex w-full items-stretch gap-2 overflow-x-auto rounded-xl border border-border bg-card p-2 shadow-card">
      {steps.map((step, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        const interactive = !!onSelect;
        return (
          <li key={step.key} className="flex-1" style={{ minWidth: 180 }}>
            <button
              type="button"
              disabled={!interactive}
              onClick={() => onSelect?.(i)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                state === "current" && "bg-primary/10 ring-1 ring-primary/40",
                state === "done" && "hover:bg-surface-3",
                state === "todo" && "opacity-70 hover:opacity-100",
                interactive && "cursor-pointer",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  state === "done" && "bg-success/20 text-success",
                  state === "current" && "bg-primary text-primary-foreground",
                  state === "todo" && "bg-surface-3 text-muted-foreground",
                )}
              >
                {state === "done" ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-sm font-semibold leading-tight",
                    state === "current" ? "text-primary" : "text-foreground",
                  )}
                >
                  {step.label}
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                  {step.hint}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
