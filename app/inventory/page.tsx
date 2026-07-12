"use client";

import { useMemo, useState } from "react";
import {
  Boxes, AlertTriangle, Layers, Search, Plus, ArrowDownToLine, ArrowUpFromLine, Wrench, Undo2, Printer,
  Pencil, ArrowLeftRight, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/currency";
import { useInventory } from "@/context/InventoryContext";
import {
  createInventoryItem,
  deleteInventoryItem,
  updateInventoryItem,
  updateInventoryStock,
} from "@/actions/inventory";
import {
  stockTone, stockStatusLabel, inventoryValue,
  type InventoryItem, type StockMovementType,
} from "@/data/inventory";
import { NewInventoryDialog } from "@/components/inventory/NewInventoryDialog";
import { EditInventoryDialog } from "@/components/inventory/EditInventoryDialog";
import { StockMovementDialog } from "@/components/inventory/StockMovementDialog";
import { generateInventoryPdf } from "@/lib/inventoryPdf";
import { toast } from "@/hooks/use-toast";

const TONE_BG: Record<ReturnType<typeof stockTone>, string> = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger:  "bg-danger/15 text-danger",
  info:    "bg-info/15 text-info",
};

const TONE_BAR: Record<ReturnType<typeof stockTone>, string> = {
  success: "[&>div]:bg-success",
  warning: "[&>div]:bg-warning",
  danger:  "[&>div]:bg-danger",
  info:    "[&>div]:bg-info",
};

const MOVE_META: Record<StockMovementType, { label: string; tone: string; icon: typeof ArrowDownToLine; sign: 1 | -1 }> = {
  in:     { label: "Stock In",  tone: "bg-success/15 text-success", icon: ArrowDownToLine, sign:  1 },
  out:    { label: "Stock Out", tone: "bg-info/15 text-info",       icon: ArrowUpFromLine, sign: -1 },
  adjust: { label: "Adjusted",  tone: "bg-warning/15 text-warning", icon: Wrench,          sign: -1 },
  return: { label: "Returned",  tone: "bg-violet/15 text-violet",   icon: Undo2,           sign:  1 },
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });

export default function InventoryPage() {
  const { items, history, isLoading, source, refresh } = useInventory();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | InventoryItem["category"]>("all");
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [moveItem, setMoveItem] = useState<InventoryItem | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (category !== "all" && it.category !== category) return false;
      if (q && !`${it.sku} ${it.name} ${it.location}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, query, category]);

  const totalValue = useMemo(() => inventoryValue(items), [items]);
  const lowCount = items.filter((i) => i.inStock < i.reorderLevel).length;
  const outCount = items.filter((i) => i.inStock <= 0).length;

  const handleAdd = async (it: InventoryItem) => {
    if (source === "mock") {
      toast({ title: "Sign in to save inventory", variant: "destructive" });
      return;
    }
    const result = await createInventoryItem({
      sku: it.sku,
      name: it.name,
      category: it.category,
      unit: it.unit,
      inStock: it.inStock,
      reorderLevel: it.reorderLevel,
      unitCost: it.unitCost,
      location: it.location,
    });
    if ("error" in result) {
      toast({ title: "Could not save item", description: result.error, variant: "destructive" });
      return;
    }
    await refresh();
    toast({ title: "Item added", description: `${it.name} added to inventory.` });
  };

  const handleEdit = async (patch: {
    sku: string;
    name: string;
    category: InventoryItem["category"];
    unit: InventoryItem["unit"];
    reorderLevel: number;
    unitCost: number;
    location: string;
  }) => {
    if (!editItem) return { error: "No item selected" };
    if (source === "mock") return { error: "Sign in to edit inventory" };
    const result = await updateInventoryItem(editItem.id, patch);
    if ("error" in result) return { error: result.error };
    await refresh();
    return {};
  };

  const handleMovement = async (input: {
    type: StockMovementType;
    qty: number;
    reference: string;
    notes?: string;
    orderId?: string;
  }) => {
    if (!moveItem) return { error: "No item selected" };
    if (source === "mock") return { error: "Sign in to record stock movements" };
    const result = await updateInventoryStock({
      itemId: moveItem.id,
      ...input,
    });
    if ("error" in result) return { error: result.error };
    await refresh();
    return {};
  };

  const handleDelete = async (item: InventoryItem) => {
    if (source === "mock") {
      toast({ title: "Sign in to delete items", variant: "destructive" });
      return;
    }
    if (!window.confirm(`Delete ${item.name} (${item.sku})? This cannot be undone.`)) return;
    const result = await deleteInventoryItem(item.id);
    if ("error" in result) {
      toast({ title: "Could not delete item", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Item deleted", description: item.name });
    await refresh();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Loading inventory…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto animate-fade-in space-y-6 p-4 lg:p-6" style={{ maxWidth: 1440 }}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Inventory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live stock across fabric, trims, accessories &amp; packaging — with full movement history.
            {source === "supabase" ? (
              <span className="ml-2 text-success">· Connected to database</span>
            ) : (
              <span className="ml-2 text-warning">· Demo data (sign in to save)</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm" className="gap-2 border-border bg-card"
            onClick={() => generateInventoryPdf(items)}
          >
            <Printer className="h-4 w-4" /> Print / PDF
          </Button>
          <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary-hover" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New Item
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="Inventory value" value={formatPKR(totalValue)} icon={Boxes} tone="primary" sub={`${items.length} SKUs tracked`} />
        <Tile label="Items in stock" value={items.filter((i) => i.inStock > 0).length.toString()} icon={Layers} tone="success" sub="Available now" />
        <Tile label="Low stock" value={lowCount.toString()} icon={AlertTriangle} tone="warning" sub="Below reorder level" />
        <Tile label="Out of stock" value={outCount.toString()} icon={AlertTriangle} tone="danger" sub="Reorder immediately" />
      </div>

      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="stock">Current Stock</TabsTrigger>
          <TabsTrigger value="history">Stock History</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1" style={{ minWidth: 260 }}>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search SKU, name, or location"
                className="pl-9 bg-card border-border"
              />
            </div>
            <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
              <SelectTrigger className="bg-card border-border" style={{ width: 180 }}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="fabric">Fabric</SelectItem>
                <SelectItem value="thread">Thread</SelectItem>
                <SelectItem value="trim">Trim</SelectItem>
                <SelectItem value="accessory">Accessory</SelectItem>
                <SelectItem value="packaging">Packaging</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-surface-1 hover:bg-surface-1">
                    <TableHead className="label-caption">SKU</TableHead>
                    <TableHead className="label-caption">Name</TableHead>
                    <TableHead className="label-caption">Category</TableHead>
                    <TableHead className="label-caption text-right">In Stock</TableHead>
                    <TableHead className="label-caption">Level</TableHead>
                    <TableHead className="label-caption text-right">Unit Cost</TableHead>
                    <TableHead className="label-caption text-right">Value</TableHead>
                    <TableHead className="label-caption">Status</TableHead>
                    <TableHead className="label-caption">Updated</TableHead>
                    <TableHead className="label-caption text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((it) => {
                    const tone = stockTone(it);
                    const pct = Math.min(100, Math.round((it.inStock / Math.max(1, it.reorderLevel * 2)) * 100));
                    return (
                      <TableRow key={it.id} className="border-border">
                        <TableCell className="mono text-xs text-muted-foreground">{it.sku}</TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground">{it.name}</div>
                          <div className="text-xs text-muted-foreground">{it.location}</div>
                        </TableCell>
                        <TableCell className="capitalize text-muted-foreground">{it.category}</TableCell>
                        <TableCell className="text-right tabular text-foreground">
                          {it.inStock.toLocaleString()} <span className="text-xs text-muted-foreground">{it.unit}</span>
                        </TableCell>
                        <TableCell style={{ width: 200 }}>
                          <div className="flex items-center gap-2">
                            <Progress value={pct} className={cn("h-1.5 w-32 bg-surface-3", TONE_BAR[tone])} />
                            <span className="text-[11px] tabular text-muted-foreground">≥{it.reorderLevel.toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular text-muted-foreground">{formatPKR(it.unitCost)}</TableCell>
                        <TableCell className="text-right tabular font-medium text-foreground">{formatPKR(it.unitCost * it.inStock)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cn("border-0", TONE_BG[tone])}>
                            {stockStatusLabel(it)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtDate(it.lastUpdated)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit item" onClick={() => setEditItem(it)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Stock movement" onClick={() => setMoveItem(it)}>
                              <ArrowLeftRight className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-danger hover:text-danger" title="Delete" onClick={() => void handleDelete(it)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={10} className="py-12 text-center text-sm text-muted-foreground">No items match your filters.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="history">
          <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <header className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Stock movement history</h3>
                <p className="text-xs text-muted-foreground">{history.length} recent events across all SKUs</p>
              </div>
            </header>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-surface-1 hover:bg-surface-1">
                    <TableHead className="label-caption">Date</TableHead>
                    <TableHead className="label-caption">Item</TableHead>
                    <TableHead className="label-caption">Type</TableHead>
                    <TableHead className="label-caption text-right">Qty</TableHead>
                    <TableHead className="label-caption">Reference</TableHead>
                    <TableHead className="label-caption">User</TableHead>
                    <TableHead className="label-caption">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((m) => {
                    const item = items.find((i) => i.id === m.itemId);
                    const meta = MOVE_META[m.type];
                    const Icon = meta.icon;
                    return (
                      <TableRow key={m.id} className="border-border">
                        <TableCell className="text-muted-foreground">{fmtDate(m.date)}</TableCell>
                        <TableCell>
                          <div className="text-foreground">{item?.name ?? "—"}</div>
                          <div className="mono text-xs text-muted-foreground">{item?.sku}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cn("border-0 gap-1", meta.tone)}>
                            <Icon className="h-3 w-3" /> {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className={cn("text-right tabular font-medium", meta.sign > 0 ? "text-success" : "text-danger")}>
                          {meta.sign > 0 ? "+" : "−"}{m.qty.toLocaleString()} <span className="text-xs text-muted-foreground">{item?.unit}</span>
                        </TableCell>
                        <TableCell className="mono text-xs text-muted-foreground">{m.reference}</TableCell>
                        <TableCell className="text-muted-foreground">{m.user}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{m.notes ?? "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </section>
        </TabsContent>
      </Tabs>

      <NewInventoryDialog open={open} onOpenChange={setOpen} onCreate={handleAdd} />
      {editItem && (
        <EditInventoryDialog
          open={!!editItem}
          onOpenChange={(v) => !v && setEditItem(null)}
          item={editItem}
          onSave={handleEdit}
        />
      )}
      {moveItem && (
        <StockMovementDialog
          open={!!moveItem}
          onOpenChange={(v) => !v && setMoveItem(null)}
          item={moveItem}
          onSubmit={handleMovement}
        />
      )}
    </div>
  );
}

function Tile({ label, value, sub, icon: Icon, tone }: {
  label: string; value: string; sub?: string;
  icon: typeof Boxes; tone: "primary" | "success" | "warning" | "danger";
}) {
  const map = {
    primary: "bg-primary/15 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    danger:  "bg-danger/15 text-danger",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", map[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 label-caption">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular text-foreground">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
