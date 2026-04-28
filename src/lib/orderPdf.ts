import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { OrderDetail } from "@/data/orders";
import { getCurrentStep } from "@/data/orders";
import { formatPKR, formatPKRDecimal } from "@/lib/currency";

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtMoney = (n: number) => formatPKR(n);

export function generateOrderPdf(order: OrderDetail) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  // ---------- Header ----------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Order Summary", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString()}`, pageWidth - margin, y, { align: "right" });
  y += 24;

  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;

  // ---------- Order header block ----------
  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(order.client, margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(order.product, margin, y);
  y += 18;

  const headerRows: [string, string][] = [
    ["Order ID", order.id],
    ["PO Number", order.poNumber],
    ["Status", order.status.replace(/-/g, " ").toUpperCase()],
    ["Order date", fmtDate(order.orderDate)],
    ["Delivery due", fmtDate(order.deliveryDate)],
    ["Quantity", `${order.qty.toLocaleString()} pcs`],
    ["Order value", fmtMoney(order.value)],
    ["Unit rate", formatPKRDecimal(order.value / order.qty)],
    ["Ship to", order.shipTo],
    ["Contact", `${order.contact.name} · ${order.contact.email} · ${order.contact.phone}`],
  ];

  autoTable(doc, {
    startY: y,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 4, textColor: 30 },
    columnStyles: {
      0: { fontStyle: "bold", textColor: 100, cellWidth: 110 },
      1: { textColor: 30 },
    },
    body: headerRows,
    margin: { left: margin, right: margin },
  });
  // @ts-expect-error lastAutoTable is added by autoTable plugin
  y = doc.lastAutoTable.finalY + 20;

  // ---------- Breakdown ----------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20);
  doc.text("Size & Color Breakdown", margin, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["Color", "Size", "Qty", "Rate", "Subtotal"]],
    body: order.breakdown.map((b) => [
      b.color,
      b.size,
      b.qty.toLocaleString(),
      formatPKRDecimal(b.rate),
      fmtMoney(+(b.qty * b.rate).toFixed(0)),
    ]),
    foot: [[
      "Total",
      "",
      order.qty.toLocaleString(),
      "",
      fmtMoney(order.value),
    ]],
    headStyles: { fillColor: [40, 50, 70], textColor: 255, fontSize: 9 },
    footStyles: { fillColor: [240, 240, 245], textColor: 20, fontStyle: "bold", fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
    margin: { left: margin, right: margin },
  });
  // @ts-expect-error lastAutoTable plugin
  y = doc.lastAutoTable.finalY + 20;

  // ---------- Delivery overview ----------
  if (y > doc.internal.pageSize.getHeight() - 200) {
    doc.addPage();
    y = margin;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Delivery Overview", margin, y);
  y += 8;

  const currentStep = getCurrentStep(order);
  autoTable(doc, {
    startY: y,
    head: [["Stage", "Planned", "Actual", "Variance", "Status"]],
    body: order.timeline.map((ev, i) => {
      const done = i < currentStep;
      const active = i === currentStep;
      const variance =
        ev.actualDate && ev.date
          ? Math.round(
              (new Date(ev.actualDate).getTime() - new Date(ev.date).getTime()) / 86_400_000,
            )
          : null;
      const status = done
        ? "Completed"
        : active
          ? order.status === "overdue" ? "Overdue" : "In progress"
          : "Upcoming";
      const varText =
        variance === null
          ? "—"
          : variance === 0
            ? "On time"
            : variance > 0
              ? `+${variance}d`
              : `${variance}d`;
      return [ev.label, fmtDate(ev.date), ev.actualDate ? fmtDate(ev.actualDate) : "—", varText, status];
    }),
    headStyles: { fillColor: [40, 50, 70], textColor: 255, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: {
      3: { halign: "right" },
      4: { halign: "right" },
    },
    margin: { left: margin, right: margin },
  });

  // ---------- Footer ----------
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `${order.id} · ${order.client}  ·  Page ${i} / ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 20,
      { align: "center" },
    );
  }

  doc.save(`${order.id}-summary.pdf`);
}