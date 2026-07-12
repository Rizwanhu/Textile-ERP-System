"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Package, AlertTriangle, CheckCircle2, Boxes, ArrowRight,
  Layers, ClipboardCheck, Factory, Archive, Plus,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { MaterialStepper, type StepDef } from "@/components/materials/MaterialStepper";
import { NewMaterialDialog } from "@/components/materials/NewMaterialDialog";
import {
  MATERIAL_SOURCES, type MaterialOrderSummary, type MaterialRequirement,
  evaluateRequirement, computeLeftover,
} from "@/data/materials";
import { formatPKR } from "@/lib/currency";
import { useMaterials } from "@/context/MaterialsContext";

const STEPS: StepDef[] = [
  { key: "define",    label: "Define",     hint: "Type, condition, required qty" },
  { key: "evaluate",  label: "Evaluate",   hint: "Stock check & gap analysis" },
  { key: "utilized",  label: "Utilized",   hint: "Record material consumed" },
  { key: "leftover",  label: "Leftover",   hint: "Update inventory left over" },
];

const STATUS_TO_STEP: Record<MaterialOrderSummary["status"], number> = {
  pending: 0, evaluating: 1, "in-use": 2, closed: 3,
};

const STATUS_TONE: Record<MaterialOrderSummary["status"], string> = {
  pending:    "bg-muted-foreground/15 text-muted-foreground",
  evaluating: "bg-warning/15 text-warning",
  "in-use":   "bg-info/15 text-info",
  closed:     "bg-success/15 text-success",
};

const CATEGORY_ICONS = {
  fabric: Layers, thread: Boxes, trim: Package, accessory: Package, packaging: Archive,
} as const;

function fmt(n: number, unit?: string) {
  return `${n.toLocaleString()}${unit ? ` ${unit}` : ""}`;
}

const MaterialsPage = () => {
  const { orders: materialOrders, isLoading, refresh } = useMaterials();
  const [activeOrderId, setActiveOrderId] = useState(materialOrders[0]?.orderId ?? "");
  const [newOpen, setNewOpen] = useState(false);

  useEffect(() => {
    if (materialOrders.length && !materialOrders.find((o) => o.orderId === activeOrderId)) {
      setActiveOrderId(materialOrders[0].orderId);
    }
  }, [materialOrders, activeOrderId]);

  const order = useMemo(
    () => materialOrders.find((o) => o.orderId === activeOrderId) ?? materialOrders[0],
    [activeOrderId, materialOrders],
  );

  if (isLoading || !order) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Loading materials…</p>
      </div>
    );
  }
  const baseStep = STATUS_TO_STEP[order.status];
  const [stepOverride, setStepOverride] = useState<number | null>(null);
  const currentStep = stepOverride ?? baseStep;

  // Reset override when switching order so it follows that order's status.
  const handleSelectOrder = (id: string) => {
    setActiveOrderId(id);
    setStepOverride(null);
  };

  // KPIs across all orders
  const kpis = useMemo(() => {
    let req = 0, stock = 0, util = 0, waste = 0, gapItems = 0, items = 0;
    materialOrders.forEach((o) =>
      o.requirements.forEach((r) => {
        req += r.required; stock += r.inStock; util += r.utilized; waste += r.wastage;
        items += 1;
        if (r.inStock < r.required) gapItems += 1;
      }),
    );
    return { req, stock, util, waste, gapItems, items };
  }, []);

  return (
    <div className="mx-auto animate-fade-in p-4 lg:p-6" style={{ maxWidth: 1440 }}>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Materials</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Four-step pipeline: Define requirements → Evaluate stock → Record utilization → Update inventory leftover.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-border bg-surface-2">
            Export Sheet
          </Button>
          <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary-hover" onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4" /> New Material
          </Button>
        </div>
      </div>

      <NewMaterialDialog open={newOpen} onOpenChange={setNewOpen} defaultOrderId={order.orderId} onCreated={() => void refresh()} />

      {/* Pipeline KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile icon={Layers}        tone="info"    label="Required"    value={fmt(kpis.req)}  sub={`${kpis.items} line items`} />
        <KpiTile icon={Boxes}         tone="primary" label="In Stock"    value={fmt(kpis.stock)} sub="Across active orders" />
        <KpiTile icon={Factory}       tone="success" label="Utilized"    value={fmt(kpis.util)}  sub="Consumed in production" />
        <KpiTile icon={AlertTriangle} tone="warning" label="Stock Gap"   value={String(kpis.gapItems)} sub={`Items below requirement`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Order list rail */}
        <Card className="h-fit border-border bg-card shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="section-header">Active orders</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ul className="flex flex-col gap-1">
              {materialOrders.map((o) => {
                const active = o.orderId === order.orderId;
                return (
                  <li key={o.orderId}>
                    <button
                      onClick={() => handleSelectOrder(o.orderId)}
                      className={cn(
                        "flex w-full flex-col items-start gap-1 rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors",
                        active
                          ? "border-primary/30 bg-primary/10"
                          : "hover:bg-surface-3",
                      )}
                    >
                      <span className="flex w-full items-center justify-between gap-2">
                        <span className="mono text-foreground">{o.orderId}</span>
                        <Badge variant="secondary" className={cn("border-0 text-[10px] uppercase", STATUS_TONE[o.status])}>
                          {o.status}
                        </Badge>
                      </span>
                      <span className="line-clamp-1 text-xs text-muted-foreground">
                        {o.client} · {o.qty.toLocaleString()} pcs
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        {/* Working area */}
        <div className="flex flex-col gap-4">
          <Card className="border-border bg-card shadow-card">
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <Link href={`/orders/${order.orderId}`} className="mono text-sm text-primary hover:underline">
                    {order.orderId}
                  </Link>
                  <Badge variant="secondary" className={cn("border-0 text-[10px] uppercase", STATUS_TONE[order.status])}>
                    {order.status}
                  </Badge>
                </div>
                <CardTitle className="section-header">{order.product}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {order.client} · {order.qty.toLocaleString()} pieces
                </p>
              </div>
              <Link href={`/orders/${order.orderId}`}>
                <Button variant="outline" size="sm" className="border-border bg-surface-2 gap-1.5">
                  Open order <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <MaterialStepper steps={STEPS} current={currentStep} onSelect={setStepOverride} />
              <p className="mt-3 text-[11px] text-muted-foreground">
                Showing <span className="text-foreground">{STEPS[currentStep].label}</span> view ·
                actual order status: <span className="text-foreground">{STEPS[baseStep].label}</span>
              </p>
            </CardContent>
          </Card>

          {/* Step content */}
          {currentStep === 0 && <DefineStep order={order} />}
          {currentStep === 1 && <EvaluateStep order={order} />}
          {currentStep === 2 && <UtilizedStep order={order} />}
          {currentStep === 3 && <LeftoverStep order={order} />}
        </div>
      </div>
    </div>
  );
};

/* ------------------------- Step 1: Define ------------------------- */
function DefineStep({ order }: { order: MaterialOrderSummary }) {
  const totalCost = order.requirements.reduce((s, r) => s + r.required * r.unitCost, 0);
  const sourceLabel = (key: string) =>
    MATERIAL_SOURCES.find((s) => s.key === key)?.label.replace("Local Supplier · ", "") ?? key;
  return (
    <Card className="border-border bg-card shadow-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="section-header">Define material requirements</CardTitle>
        <Badge variant="secondary" className="border-0 bg-info/15 text-info">
          {formatPKR(totalCost)} estimated
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Material</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead className="text-right">Required</TableHead>
              <TableHead className="text-right">Unit cost</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.requirements.map((r) => {
              const Icon = CATEGORY_ICONS[r.category];
              const isLocal = r.source.startsWith("local-buyer");
              return (
                <TableRow key={r.id} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-3 text-muted-foreground">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="font-medium text-foreground">{r.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs capitalize text-muted-foreground">{r.category}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <Badge variant="secondary" className={cn(
                        "w-fit border-0 text-[10px]",
                        isLocal ? "bg-info/15 text-info" : "bg-violet/15 text-violet",
                      )}>
                        {isLocal ? sourceLabel(r.source) : "Existing Stock"}
                      </Badge>
                      {r.supplier && (
                        <span className="text-[10px] text-muted-foreground">{r.supplier}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={cn(
                      "border-0 text-[10px] capitalize",
                      r.condition === "new" && "bg-primary/15 text-primary",
                      r.condition === "leftover" && "bg-violet/15 text-violet",
                      r.condition === "rejected" && "bg-danger/15 text-danger",
                    )}>
                      {r.condition}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular text-foreground">{fmt(r.required, r.unit)}</TableCell>
                  <TableCell className="text-right tabular text-muted-foreground">{formatPKR(r.unitCost)}</TableCell>
                  <TableCell className="text-right tabular font-medium text-foreground">
                    {formatPKR(r.required * r.unitCost)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* ------------------------- Step 2: Evaluate ------------------------- */
function EvaluateStep({ order }: { order: MaterialOrderSummary }) {
  const [filter, setFilter] = useState<"all" | "gap" | "ok">("all");
  const rows = order.requirements.map((r) => ({ r, ...evaluateRequirement(r) }));
  const filtered = rows.filter(({ gap }) => filter === "all" || (filter === "gap" ? gap > 0 : gap === 0));
  const totalGap = rows.filter(({ gap }) => gap > 0).length;

  return (
    <Card className="border-border bg-card shadow-card">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
        <div>
          <CardTitle className="section-header">Evaluate against inventory</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {totalGap > 0
              ? `${totalGap} item${totalGap > 1 ? "s" : ""} need procurement before production starts.`
              : "All items in stock — ready to issue to floor."}
          </p>
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="bg-surface-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="gap">Gap</TabsTrigger>
            <TabsTrigger value="ok">In stock</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Material</TableHead>
              <TableHead className="text-right">Required</TableHead>
              <TableHead className="text-right">In stock</TableHead>
              <TableHead style={{ width: 200 }}>Fulfillment</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(({ r, gap, surplus, fulfillment }) => {
              const pct = Math.round(fulfillment * 100);
              return (
                <TableRow key={r.id} className="border-border">
                  <TableCell className="font-medium text-foreground">{r.name}</TableCell>
                  <TableCell className="text-right tabular text-muted-foreground">{fmt(r.required, r.unit)}</TableCell>
                  <TableCell className="text-right tabular text-foreground">{fmt(r.inStock, r.unit)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={pct}
                        className={cn(
                          "h-1.5 flex-1 bg-surface-3",
                          pct >= 100 ? "[&>div]:bg-success" : pct >= 50 ? "[&>div]:bg-warning" : "[&>div]:bg-danger",
                        )}
                      />
                      <span className="w-10 text-right text-xs tabular text-muted-foreground">{pct}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {gap > 0 ? (
                      <Badge variant="secondary" className="border-0 bg-danger/15 text-danger">
                        Procure {fmt(gap, r.unit)}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="border-0 bg-success/15 text-success">
                        +{fmt(surplus, r.unit)} spare
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">No items match this filter.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* ------------------------- Step 3: Utilized ------------------------- */
function UtilizedStep({ order }: { order: MaterialOrderSummary }) {
  const totals = order.requirements.reduce(
    (a, r) => ({ util: a.util + r.utilized, waste: a.waste + r.wastage, cost: a.cost + (r.utilized + r.wastage) * r.unitCost }),
    { util: 0, waste: 0, cost: 0 },
  );
  return (
    <Card className="border-border bg-card shadow-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="section-header">Material utilized</CardTitle>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">Consumed: <span className="tabular text-foreground">{fmt(totals.util)}</span></span>
          <span className="text-muted-foreground">Waste: <span className="tabular text-warning">{fmt(totals.waste)}</span></span>
          <span className="text-muted-foreground">Cost: <span className="tabular text-foreground">{formatPKR(totals.cost)}</span></span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Material</TableHead>
              <TableHead className="text-right">Required</TableHead>
              <TableHead className="text-right">Utilized</TableHead>
              <TableHead className="text-right">Wastage</TableHead>
              <TableHead className="text-right">Yield</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.requirements.map((r: MaterialRequirement) => {
              const consumed = r.utilized + r.wastage;
              const yieldPct = consumed > 0 ? Math.round((r.utilized / consumed) * 100) : 0;
              return (
                <TableRow key={r.id} className="border-border">
                  <TableCell className="font-medium text-foreground">{r.name}</TableCell>
                  <TableCell className="text-right tabular text-muted-foreground">{fmt(r.required, r.unit)}</TableCell>
                  <TableCell className="text-right tabular text-foreground">{fmt(r.utilized, r.unit)}</TableCell>
                  <TableCell className="text-right tabular text-warning">{fmt(r.wastage, r.unit)}</TableCell>
                  <TableCell className="text-right">
                    {consumed === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <Badge variant="secondary" className={cn(
                        "border-0",
                        yieldPct >= 95 ? "bg-success/15 text-success"
                        : yieldPct >= 85 ? "bg-warning/15 text-warning"
                        : "bg-danger/15 text-danger",
                      )}>
                        {yieldPct}%
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* ------------------------- Step 4: Leftover ------------------------- */
function LeftoverStep({ order }: { order: MaterialOrderSummary }) {
  const rows = order.requirements.map((r) => ({ r, leftover: computeLeftover(r) }));
  const totalLeftover = rows.reduce((s, x) => s + x.leftover, 0);
  const recoverableValue = rows.reduce((s, x) => s + x.leftover * x.r.unitCost, 0);
  return (
    <Card className="border-border bg-card shadow-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="section-header">Inventory left over</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Returned to global inventory after this order closes.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">Units back: <span className="tabular text-foreground">{fmt(totalLeftover)}</span></span>
          <span className="text-muted-foreground">Recoverable: <span className="tabular text-success">{formatPKR(recoverableValue)}</span></span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Material</TableHead>
              <TableHead className="text-right">Opening stock</TableHead>
              <TableHead className="text-right">Utilized + waste</TableHead>
              <TableHead className="text-right">Leftover</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ r, leftover }) => {
              const consumed = r.utilized + r.wastage;
              const ratio = r.inStock > 0 ? leftover / r.inStock : 0;
              return (
                <TableRow key={r.id} className="border-border">
                  <TableCell className="font-medium text-foreground">{r.name}</TableCell>
                  <TableCell className="text-right tabular text-muted-foreground">{fmt(r.inStock, r.unit)}</TableCell>
                  <TableCell className="text-right tabular text-foreground">{fmt(consumed, r.unit)}</TableCell>
                  <TableCell className="text-right tabular font-medium text-foreground">{fmt(leftover, r.unit)}</TableCell>
                  <TableCell className="text-right">
                    {leftover === 0 ? (
                      <Badge variant="secondary" className="border-0 bg-muted-foreground/15 text-muted-foreground">
                        Depleted
                      </Badge>
                    ) : ratio > 0.3 ? (
                      <Badge variant="secondary" className="border-0 bg-success/15 text-success gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Restock
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="border-0 bg-info/15 text-info">
                        Return
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* ------------------------- KPI tile ------------------------- */
function KpiTile({
  icon: Icon, label, value, sub, tone,
}: {
  icon: typeof Layers; label: string; value: string; sub: string;
  tone: "primary" | "info" | "success" | "warning";
}) {
  const toneMap = {
    primary: "bg-primary/15 text-primary",
    info:    "bg-info/15 text-info",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
  } as const;
  return (
    <Card className="border-border bg-card shadow-card">
      <CardContent className="flex items-start gap-3 p-5">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]", toneMap[tone])}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="label-caption">{label}</p>
          <p className="kpi-value mt-1 truncate">{value}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default MaterialsPage;
