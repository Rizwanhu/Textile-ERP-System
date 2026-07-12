import Link from "next/link";
import { ArrowRight, Wallet, Scissors, Shirt, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/currency";
import { type OrderWorkflow as TWorkflow, type StageKey, type StageStatus } from "@/data/workflow";

const ICONS: Record<StageKey, typeof Wallet> = {
  "local-buyer": Wallet,
  cutting: Scissors,
  stitching: Shirt,
  finishing: CheckCircle2,
};

const STATUS_TONE: Record<StageStatus, string> = {
  pending:       "bg-muted-foreground/15 text-muted-foreground",
  ready:         "bg-info/15 text-info",
  "in-progress": "bg-primary/15 text-primary",
  blocked:       "bg-danger/15 text-danger",
  done:          "bg-success/15 text-success",
};

const STATUS_LABEL: Record<StageStatus, string> = {
  pending: "Pending", ready: "Ready", "in-progress": "In progress", blocked: "Blocked", done: "Done",
};

export function OrderWorkflow({ workflow }: { workflow: TWorkflow }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-1 px-6 py-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Production workflow</h3>
          <p className="text-xs text-muted-foreground">
            Local Supplier → Cutting → Stitching → Finishing &amp; QC. Each stage's output is the next stage's input.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">
            Pipeline yield: <span className="tabular text-foreground">{workflow.pipelineYield}%</span>
          </span>
          <span className="text-muted-foreground">
            Total stage cost: <span className="tabular text-foreground">{formatPKR(workflow.totalCost)}</span>
          </span>
        </div>
      </header>

      {/* Cards row */}
      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
        {workflow.stages.map((stage, i) => {
          const Icon = ICONS[stage.key];
          const next = workflow.stages[i + 1];
          const inMatch = next ? next.handoff.inputQty === stage.handoff.outputQty : true;
          const yieldPct = stage.handoff.inputQty > 0
            ? Math.min(100, Math.round((stage.handoff.outputQty / stage.handoff.inputQty) * 100))
            : 0;
          return (
            <div
              key={stage.key}
              className={cn(
                "relative flex flex-col gap-3 rounded-lg border p-4 transition-colors",
                stage.status === "blocked"
                  ? "border-danger/40 bg-danger/5"
                  : stage.status === "in-progress"
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-surface-1",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", STATUS_TONE[stage.status])}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="leading-tight">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stage {i + 1}</div>
                    <div className="text-sm font-semibold text-foreground">{stage.label}</div>
                  </div>
                </div>
                <Badge variant="secondary" className={cn("border-0 text-[10px] uppercase", STATUS_TONE[stage.status])}>
                  {STATUS_LABEL[stage.status]}
                </Badge>
              </div>

              <div className="space-y-1.5 text-xs">
                <Row label={stage.handoff.inputLabel}  value={stage.handoff.inputValue}  muted />
                <Row label={stage.handoff.outputLabel} value={stage.handoff.outputValue} strong />
                {stage.handoff.loss > 0 && (
                  <Row
                    label="Loss / waste"
                    value={`${stage.handoff.loss.toLocaleString()} ${stage.handoff.unit}`}
                    tone="text-warning"
                  />
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Stage yield</span>
                  <span className="tabular text-foreground">{yieldPct}%</span>
                </div>
                <Progress
                  value={yieldPct}
                  className={cn(
                    "h-1.5 bg-surface-3",
                    yieldPct >= 95 ? "[&>div]:bg-success" : yieldPct >= 85 ? "[&>div]:bg-warning" : "[&>div]:bg-danger",
                  )}
                />
              </div>

              {stage.meta && (
                <ul className="space-y-1 border-t border-border pt-2 text-[11px]">
                  {stage.meta.map((m) => (
                    <li key={m.label} className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">{m.label}</span>
                      <span className="tabular text-foreground">{m.value}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs">
                <span className="text-muted-foreground">
                  Cost · <span className="tabular text-foreground">{formatPKR(stage.cost)}</span>
                </span>
                <Link
                  href={stage.href}
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Open <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              {stage.blocker && (
                <div className="flex items-start gap-1.5 rounded-md border border-danger/30 bg-danger/10 p-2 text-[11px] text-danger">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>{stage.blocker}</span>
                </div>
              )}

              {next && !inMatch && (
                <div className="text-[11px] text-warning">
                  Handoff mismatch with “{next.label}” — input {next.handoff.inputValue} vs output {stage.handoff.outputValue}.
                </div>
              )}

              {/* Connector arrow on md+ */}
              {i < workflow.stages.length - 1 && (
                <ArrowRight className="absolute -right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-muted-foreground/60 xl:block" />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Row({ label, value, muted, strong, tone }: { label: string; value: string; muted?: boolean; strong?: boolean; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(
        "tabular",
        muted && "text-muted-foreground",
        strong && "font-semibold text-foreground",
        tone,
      )}>{value}</span>
    </div>
  );
}