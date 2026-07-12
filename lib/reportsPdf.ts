import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatPKR } from "@/lib/currency";
import { ORDERS } from "@/data/orders";
import { getExpenseTotals } from "@/data/expenses";
import { INVENTORY, inventoryValue } from "@/data/inventory";

export function generateReportsPdf() {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Operations Report", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString()}`, pageWidth - margin, y, { align: "right" });
  y += 22;
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 16;

  // Orders by status
  const byStatus: Record<string, { count: number; value: number }> = {};
  ORDERS.forEach((o) => {
    byStatus[o.status] = byStatus[o.status] ?? { count: 0, value: 0 };
    byStatus[o.status].count += 1;
    byStatus[o.status].value += o.value;
  });

  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Orders summary", margin, y);
  y += 6;
  autoTable(doc, {
    startY: y,
    head: [["Status", "Orders", "Value"]],
    body: Object.entries(byStatus).map(([s, v]) => [s.replace("-", " "), v.count.toString(), formatPKR(v.value)]),
    foot: [[
      "Total",
      ORDERS.length.toString(),
      formatPKR(ORDERS.reduce((s, o) => s + o.value, 0)),
    ]],
    headStyles: { fillColor: [40, 50, 70], textColor: 255, fontSize: 9 },
    footStyles: { fontStyle: "bold", fillColor: [240, 240, 245] },
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
    margin: { left: margin, right: margin },
  });
  // @ts-expect-error
  y = doc.lastAutoTable.finalY + 20;

  // Expense totals
  const t = getExpenseTotals();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Expense breakdown", margin, y);
  y += 6;
  autoTable(doc, {
    startY: y,
    head: [["Category", "Amount"]],
    body: [
      ["Local Supplier", formatPKR(t.buyer)],
      ["Cutting",     formatPKR(t.cutting)],
      ["Stitching",   formatPKR(t.stitching)],
      ["Finishing",   formatPKR(t.finishing)],
      ["Fixed",       formatPKR(t.fixed)],
      ["Admin",       formatPKR(t.admin)],
    ],
    foot: [["Grand total", formatPKR(t.grand)]],
    headStyles: { fillColor: [40, 50, 70], textColor: 255, fontSize: 9 },
    footStyles: { fontStyle: "bold", fillColor: [240, 240, 245] },
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: { 1: { halign: "right" } },
    margin: { left: margin, right: margin },
  });
  // @ts-expect-error
  y = doc.lastAutoTable.finalY + 20;

  if (y > doc.internal.pageSize.getHeight() - 220) { doc.addPage(); y = margin; }

  // Inventory snapshot
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Inventory snapshot", margin, y);
  y += 6;
  autoTable(doc, {
    startY: y,
    head: [["SKU", "Name", "Category", "In Stock", "Reorder", "Value"]],
    body: INVENTORY.map((i) => [
      i.sku, i.name, i.category, `${i.inStock} ${i.unit}`, `${i.reorderLevel} ${i.unit}`,
      formatPKR(i.inStock * i.unitCost),
    ]),
    foot: [["", "", "", "", "Total value", formatPKR(inventoryValue(INVENTORY))]],
    headStyles: { fillColor: [40, 50, 70], textColor: 255, fontSize: 9 },
    footStyles: { fontStyle: "bold", fillColor: [240, 240, 245] },
    styles: { fontSize: 8, cellPadding: 4 },
    columnStyles: { 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" } },
    margin: { left: margin, right: margin },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `TextileERP · Operations Report · Page ${i} / ${pageCount}`,
      pageWidth / 2, doc.internal.pageSize.getHeight() - 20, { align: "center" },
    );
  }

  doc.save(`textileerp-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
