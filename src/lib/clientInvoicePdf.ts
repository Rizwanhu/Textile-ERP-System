import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatMoney, formatMoneyDecimal } from "@/lib/currency";
import type {
  Client,
  ClientAccountSummary,
  ClientLineItem,
  CreditNote,
  Invoice,
  LedgerEntry,
  Payment,
} from "@/types/clientAccount";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const COMPANY = {
  name: "TextileERP — Demo Factory",
  legal: "Demo Apparel Pvt. Ltd.",
  address: "Plot 22, MIDC Industrial Area, Faisalabad, Pakistan",
  bank: "Habib Bank Ltd · IBAN PK00HABB0000001123456701",
};

export type ClientInvoicePdfInput = {
  client: Client;
  lineItems: ClientLineItem[];
  allLineItems: ClientLineItem[];
  payments: Payment[];
  creditNotes: CreditNote[];
  summary: ClientAccountSummary;
  ledger: LedgerEntry[];
  invoice: Invoice;
};

export function generateClientInvoicePdf(input: ClientInvoicePdfInput) {
  const { client, lineItems, allLineItems, payments, summary, invoice } = input;
  const cur = client.billingCurrency;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(COMPANY.name, margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(COMPANY.address, margin, y + 14);
  doc.text(COMPANY.bank, margin, y + 26);

  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("INVOICE", pageWidth - margin, y, { align: "right" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.invoiceNumber, pageWidth - margin, y + 18, { align: "right" });
  doc.text(`Date: ${fmtDate(invoice.issuedAt ?? invoice.createdAt)}`, pageWidth - margin, y + 32, { align: "right" });
  y += 52;

  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Bill To", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(client.name, margin, y);
  y += 12;
  if (client.billingAddress) {
    doc.setTextColor(90);
    doc.text(client.billingAddress, margin, y, { maxWidth: 260 });
    y += 24;
  }
  doc.setTextColor(20);

  // Invoice line items (this batch)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Invoice line items", margin, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["Sr.", "Product / Service", "Qty", `CNF Price/Pc (${cur})`, `Amount (${cur})`]],
    body: lineItems
      .sort((a, b) => a.serialNumber - b.serialNumber)
      .map((l) => [
        String(l.serialNumber),
        l.description,
        l.quantity.toLocaleString(),
        formatMoneyDecimal(l.unitPrice, cur),
        formatMoney(l.invoiceValue, cur),
      ]),
    foot: [["", "Invoice subtotal", "", "", formatMoney(invoice.subtotal, cur)]],
    headStyles: { fillColor: [30, 64, 120], textColor: 255, fontSize: 8 },
    footStyles: { fillColor: [230, 235, 245], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 4 },
    columnStyles: { 0: { cellWidth: 28 }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
    margin: { left: margin, right: margin },
  });
  // @ts-expect-error jspdf autotable plugin
  y = doc.lastAutoTable.finalY + 18;

  // All client orders (full account)
  if (y > doc.internal.pageSize.getHeight() - 220) {
    doc.addPage();
    y = margin;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("All orders for client (account summary)", margin, y);
  y += 8;

  const activeLines = allLineItems
    .filter((l) => l.fulfillmentStatus !== "cancelled")
    .sort((a, b) => a.serialNumber - b.serialNumber);

  autoTable(doc, {
    startY: y,
    head: [["Sr.", "Description", "Qty", `Price/Pc`, `Value (${cur})`, "Status"]],
    body: activeLines.map((l) => [
      String(l.serialNumber),
      l.description.length > 42 ? l.description.slice(0, 40) + "…" : l.description,
      l.quantity.toLocaleString(),
      formatMoneyDecimal(l.unitPrice, cur),
      formatMoney(l.invoiceValue, cur),
      l.fulfillmentStatus.replace(/-/g, " "),
    ]),
    foot: client.openingBalance > 0
      ? [
          ["", "Previous outstanding amount", "", "", formatMoney(client.openingBalance, cur), ""],
          ["", "Total amount of goods", "", "", formatMoney(summary.totalAmountOfGoods, cur), ""],
        ]
      : [["", "Total amount of goods", "", "", formatMoney(summary.totalAmountOfGoods, cur), ""]],
    headStyles: { fillColor: [30, 64, 120], textColor: 255, fontSize: 7 },
    footStyles: { fillColor: [30, 64, 120], textColor: 255, fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 3 },
    columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
    margin: { left: margin, right: margin },
  });
  // @ts-expect-error jspdf autotable plugin
  y = doc.lastAutoTable.finalY + 18;

  // Payment history (batch payments)
  if (y > doc.internal.pageSize.getHeight() - 180) {
    doc.addPage();
    y = margin;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Payment history (batch payments received)", margin, y);
  y += 8;

  const paymentRows = payments
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((p) => {
      const fx =
        p.inputCurrency !== p.billingCurrency
          ? `${formatMoney(p.inputAmount, p.inputCurrency)} @ ${p.exchangeRate} PKR/${p.billingCurrency}`
          : "";
      return [p.description, fmtDate(p.date), formatMoney(p.amount, cur), fx];
    });

  autoTable(doc, {
    startY: y,
    head: [["Description", "Date", `Amount (${cur})`, "FX detail"]],
    body: paymentRows.length ? paymentRows : [["No payments recorded", "—", "—", ""]],
    foot: [
      ["Total amount received", "", formatMoney(summary.totalAmountReceived, cur), ""],
      ["Balance outstanding", "", formatMoney(summary.balanceOutstanding, cur), ""],
    ],
    headStyles: { fillColor: [255, 200, 0], textColor: 20, fontSize: 8 },
    footStyles: { fillColor: [30, 64, 120], textColor: 255, fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 4 },
    columnStyles: { 2: { halign: "right" } },
    margin: { left: margin, right: margin },
  });
  // @ts-expect-error jspdf autotable plugin
  y = doc.lastAutoTable.finalY + 16;

  if (invoice.notes) {
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(`Notes: ${invoice.notes}`, margin, y);
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(
      `${invoice.invoiceNumber} · ${client.name} · Page ${i}/${pages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 20,
      { align: "center" },
    );
  }

  doc.save(`${invoice.invoiceNumber}-${client.name.replace(/\s+/g, "-")}.pdf`);
}

export function generateClientStatementPdf(input: Omit<ClientInvoicePdfInput, "invoice" | "lineItems">) {
  const { client, allLineItems, payments, summary } = input;
  const cur = client.billingCurrency;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Statement of Account", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(client.name, margin, y + 18);
  doc.text(`Generated ${new Date().toLocaleString()}`, pageWidth - margin, y, { align: "right" });
  y += 36;

  autoTable(doc, {
    startY: y,
    head: [["Description", `Amount (${cur})`]],
    body: [
      ["Total amount of goods", formatMoney(summary.totalAmountOfGoods, cur)],
      ...payments
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((p) => [p.description, formatMoney(p.amount, cur)]),
    ],
    foot: [
      ["Total amount received", formatMoney(summary.totalAmountReceived, cur)],
      ["Balance outstanding", formatMoney(summary.balanceOutstanding, cur)],
    ],
    headStyles: { fillColor: [30, 64, 120], textColor: 255 },
    footStyles: { fillColor: [255, 200, 0], textColor: 20, fontStyle: "bold" },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: "right" } },
    margin: { left: margin, right: margin },
  });
  // @ts-expect-error jspdf autotable plugin
  y = doc.lastAutoTable.finalY + 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Order detail", margin, y);
  y += 8;
  autoTable(doc, {
    startY: y,
    head: [["Sr.", "Description", "Qty", "Value", "Status"]],
    body: allLineItems
      .filter((l) => l.fulfillmentStatus !== "cancelled")
      .sort((a, b) => a.serialNumber - b.serialNumber)
      .map((l) => [
        String(l.serialNumber),
        l.description,
        l.quantity.toLocaleString(),
        formatMoney(l.invoiceValue, cur),
        l.fulfillmentStatus,
      ]),
    styles: { fontSize: 8 },
    margin: { left: margin, right: margin },
  });

  doc.save(`${client.name.replace(/\s+/g, "-")}-statement-${new Date().toISOString().slice(0, 10)}.pdf`);
}
