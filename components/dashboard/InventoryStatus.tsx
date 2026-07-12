import { Progress } from "@/components/ui/progress";

type Item = {
  name: string;
  stock: number;
  total: number;
  unit: string;
  tone: "success" | "warning" | "danger" | "primary";
};

const DEFAULT_ITEMS: Item[] = [
  { name: "Cotton 180 GSM", stock: 78, total: 100, unit: "rolls", tone: "success" },
  { name: "Polyester Blend", stock: 42, total: 100, unit: "rolls", tone: "warning" },
  { name: "Buttons (assorted)", stock: 18, total: 100, unit: "k pcs", tone: "danger" },
];

const colorMap = {
  success: "[&>div]:bg-success",
  warning: "[&>div]:bg-warning",
  danger: "[&>div]:bg-danger",
  primary: "[&>div]:bg-primary",
};

export function InventoryStatus({ items }: { items?: Item[] }) {
  const list = items?.length ? items : DEFAULT_ITEMS;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="section-header">Inventory Status</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Top-tracked materials</p>
        </div>
      </div>
      <ul className="space-y-3.5">
        {list.map((it) => (
          <li key={it.name} className="space-y-1.5">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-foreground">{it.name}</span>
              <span className="tabular text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{it.stock}</span> / {it.total} {it.unit}
              </span>
            </div>
            <Progress value={it.stock} className={`h-1.5 bg-surface-3 ${colorMap[it.tone]}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}
