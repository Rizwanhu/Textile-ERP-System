import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatPKR } from "@/lib/currency";
import {
  LOCAL_BUYER, CUTTING, STITCHING, FINISHING, FIXED_EXPENSES, ADMIN_EXPENSES,
  sumLocalBuyer, stitchingWages, sumFixed, sumAdmin, getExpenseTotals,
} from "@/data/expenses";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });

export function generateExpensesPdf(orderId = "ORD-2026-024", client = "Northwind Apparel") {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Expense Summary", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString()}`, pageWidth - margin, y, { align: "right" });
  y += 22;

  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 16;

  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(client, margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(`Order ${orderId} · all amounts in PKR`, margin, y);
  y += 18;

  // Totals by category
  const t = getExpenseTotals();
  autoTable(doc, {
    startY: y,
    head: [["Category", "Amount"]],
    body: [
      ["Local Buyer (procurement)", formatPKR(t.buyer)],
      ["Cutting (wages)",            formatPKR(t.cutting)],
      ["Stitching (piece wages)",    formatPKR(t.stitching)],
      ["Finishing & QC (wages)",     formatPKR(t.finishing)],
      ["Fixed (allocated)",          formatPKR(t.fixed)],
      ["Admin",                      formatPKR(t.admin)],
    ],
    foot: [["Grand total", formatPKR(t.grand)]],
    headStyles: { fillColor: [40, 50, 70], textColor: 255, fontSize: 9 },
    footStyles: { fillColor: [240, 240, 245], textColor: 20, fontStyle: "bold", fontSize: 10 },
    styles: { fontSize: 10, cellPadding: 6 },
    columnStyles: { 1: { halign: "right" } },
    margin: { left: margin, right: margin },
  });
  // @ts-expect-error plugin
  y = doc.lastAutoTable.finalY + 22;

  // Local Buyer
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Local Buyer purchases", margin, y);
  y += 6;
  autoTable(doc, {
    startY: y,
    head: [["Supplier", "Item", "Qty", "Rate", "Total", "Date", "Invoice"]],
    body: LOCAL_BUYER.map((r) => [
      r.supplier, r.item, `${r.qty} ${r.unit}`, formatPKR(r.rate),
      formatPKR(r.qty * r.rate), fmtDate(r.date), r.invoice,
    ]),
    foot: [["", "Total", "", "", formatPKR(sumLocalBuyer(LOCAL_BUYER)), "", ""]],
    headStyles: { fillColor: [40, 50, 70], textColor: 255, fontSize: 9 },
    footStyles: { fontStyle: "bold", fillColor: [240, 240, 245] },
    styles: { fontSize: 8, cellPadding: 4 },
    columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
    margin: { left: margin, right: margin },
  });
  // @ts-expect-error
  y = doc.lastAutoTable.finalY + 18;

  if (y > doc.internal.pageSize.getHeight() - 220) { doc.addPage(); y = margin; }

  // Labour summary
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Direct labour", margin, y);
  y += 6;
  autoTable(doc, {
    startY: y,
    head: [["Stage", "Detail", "Wages"]],
    body: [
      ["Cutting", `${CUTTING.cutterTeam} · received ${CUTTING.receivedKg} kg, wastage ${CUTTING.wastageKg} kg`, formatPKR(CUTTING.wages)],
      ["Stitching", `${STITCHING.team} · ${STITCHING.stitched} pcs @ ${formatPKR(STITCHING.rate)}`, formatPKR(stitchingWages(STITCHING))],
      ["Finishing & QC", `${FINISHING.inspector} · ${FINISHING.packed} pcs packed, ${FINISHING.qcFail} QC fail`, formatPKR(FINISHING.wages)],
    ],
    headStyles: { fillColor: [40, 50, 70], textColor: 255, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: { 2: { halign: "right" } },
    margin: { left: margin, right: margin },
  });
  // @ts-expect-error
  y = doc.lastAutoTable.finalY + 18;

  if (y > doc.internal.pageSize.getHeight() - 220) { doc.addPage(); y = margin; }

  // Fixed
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Fixed expense allocation", margin, y);
  y += 6;
  autoTable(doc, {
    startY: y,
    head: [["Category", "Monthly", "Allocated"]],
    body: FIXED_EXPENSES.map((r) => [r.category, formatPKR(r.monthly), formatPKR(r.allocated)]),
    foot: [["Total", "", formatPKR(sumFixed(FIXED_EXPENSES))]],
    headStyles: { fillColor: [40, 50, 70], textColor: 255, fontSize: 9 },
    footStyles: { fontStyle: "bold", fillColor: [240, 240, 245] },
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
    margin: { left: margin, right: margin },
  });
  // @ts-expect-error
  y = doc.lastAutoTable.finalY + 18;

  if (y > doc.internal.pageSize.getHeight() - 200) { doc.addPage(); y = margin; }

  // Admin
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Admin expenses", margin, y);
  y += 6;
  autoTable(doc, {
    startY: y,
    head: [["Category", "Date", "Amount"]],
    body: ADMIN_EXPENSES.map((r) => [r.category, fmtDate(r.date), formatPKR(r.amount)]),
    foot: [["Total", "", formatPKR(sumAdmin(ADMIN_EXPENSES))]],
    headStyles: { fillColor: [40, 50, 70], textColor: 255, fontSize: 9 },
    footStyles: { fontStyle: "bold", fillColor: [240, 240, 245] },
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: { 2: { halign: "right" } },
    margin: { left: margin, right: margin },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Expenses · ${orderId} · ${client}  ·  Page ${i} / ${pageCount}`,
      pageWidth / 2, doc.internal.pageSize.getHeight() - 20, { align: "center" },
    );
  }

  doc.save(`${orderId}-expenses.pdf`);
}
