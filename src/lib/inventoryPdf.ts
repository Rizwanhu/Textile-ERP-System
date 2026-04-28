import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatPKR } from "@/lib/currency";
import {
  INVENTORY, STOCK_HISTORY, inventoryValue, stockStatusLabel,
  type InventoryItem,
} from "@/data/inventory";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });

export function generateInventoryPdf(items: InventoryItem[] = INVENTORY) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Inventory Report", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString()}`, pageWidth - margin, y, { align: "right" });
  y += 22;
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 16;

  // Totals
  const totalValue = inventoryValue(items);
  const lowCount = items.filter((i) => i.inStock < i.reorderLevel).length;
  const outCount = items.filter((i) => i.inStock <= 0).length;

  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Stock totals", margin, y);
  y += 6;
  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: [
      ["Total inventory value", formatPKR(totalValue)],
      ["SKUs tracked",          items.length.toString()],
      ["Items in stock",        items.filter((i) => i.inStock > 0).length.toString()],
      ["Low stock SKUs",        lowCount.toString()],
      ["Out of stock SKUs",     outCount.toString()],
    ],
    headStyles: { fillColor: [40, 50, 70], textColor: 255, fontSize: 9 },
    styles: { fontSize: 10, cellPadding: 6 },
    columnStyles: { 1: { halign: "right" } },
    margin: { left: margin, right: margin },
  });
  // @ts-expect-error plugin
  y = doc.lastAutoTable.finalY + 22;

  // Current stock table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Current stock", margin, y);
  y += 6;
  autoTable(doc, {
    startY: y,
    head: [["SKU", "Name", "Cat", "In Stock", "Reorder", "Unit Cost", "Value", "Status"]],
    body: items.map((i) => [
      i.sku, i.name, i.category,
      `${i.inStock.toLocaleString()} ${i.unit}`,
      `${i.reorderLevel.toLocaleString()} ${i.unit}`,
      formatPKR(i.unitCost),
      formatPKR(i.unitCost * i.inStock),
      stockStatusLabel(i),
    ]),
    foot: [["", "", "", "", "", "Total", formatPKR(totalValue), ""]],
    headStyles: { fillColor: [40, 50, 70], textColor: 255, fontSize: 9 },
    footStyles: { fontStyle: "bold", fillColor: [240, 240, 245] },
    styles: { fontSize: 8, cellPadding: 4 },
    columnStyles: { 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" } },
    margin: { left: margin, right: margin },
  });
  // @ts-expect-error
  y = doc.lastAutoTable.finalY + 18;

  if (y > doc.internal.pageSize.getHeight() - 200) { doc.addPage(); y = margin; }

  // Stock history
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Stock movement history", margin, y);
  y += 6;
  const TYPE_LABEL: Record<string, string> = { in: "Stock In", out: "Stock Out", adjust: "Adjusted", return: "Returned" };
  autoTable(doc, {
    startY: y,
    head: [["Date", "SKU", "Item", "Type", "Qty", "Reference", "User", "Notes"]],
    body: STOCK_HISTORY.map((m) => {
      const it = items.find((i) => i.id === m.itemId);
      const sign = (m.type === "in" || m.type === "return") ? "+" : "-";
      return [
        fmtDate(m.date),
        it?.sku ?? "—",
        it?.name ?? "—",
        TYPE_LABEL[m.type] ?? m.type,
        `${sign}${m.qty.toLocaleString()} ${it?.unit ?? ""}`,
        m.reference,
        m.user,
        m.notes ?? "",
      ];
    }),
    headStyles: { fillColor: [40, 50, 70], textColor: 255, fontSize: 9 },
    styles: { fontSize: 8, cellPadding: 4 },
    columnStyles: { 4: { halign: "right" } },
    margin: { left: margin, right: margin },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Inventory Report · all amounts in PKR  ·  Page ${i} / ${pageCount}`,
      pageWidth / 2, doc.internal.pageSize.getHeight() - 20, { align: "center" },
    );
  }

  doc.save(`inventory-${new Date().toISOString().slice(0, 10)}.pdf`);
}
