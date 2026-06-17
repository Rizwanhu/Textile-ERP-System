# TextileERP — Project README

> Full-stack textile manufacturing ERP. This document summarizes the existing project and specifies the **Client Invoice & Payment Ledger** feature for the `/orders` module (`http://localhost:8080/orders`).

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Current Implementation Status](#current-implementation-status)
3. [Tech Stack](#tech-stack)
4. [Existing Modules Summary](#existing-modules-summary)
5. [New Feature: Client Invoice & Payment Ledger](#new-feature-client-invoice--payment-ledger)
6. [Business Rules & Calculations](#business-rules--calculations)
7. [Data Model (Proposed)](#data-model-proposed)
8. [UI / UX Specification](#ui--ux-specification)
9. [PDF Outputs](#pdf-outputs)
10. [API Endpoints (Proposed)](#api-endpoints-proposed)
11. [File Structure (Planned Additions)](#file-structure-planned-additions)
12. [Implementation Task List](#implementation-task-list)
13. [Open Questions](#open-questions)
14. [Getting Started](#getting-started)

---

## Project Overview

**TextileERP** digitizes the full textile production lifecycle — from receiving a client order through material sourcing, production expenses, quality control, inventory, and reporting.

### Core capabilities (planned / partially built)

| Area | Description |
|------|-------------|
| **Orders** | Client PO capture, size/color breakdown, production status, delivery timeline |
| **Materials** | 4-step pipeline: Order → Evaluate → Material Utilized → Inventory Left Over |
| **Inventory** | Stock levels with in/out history |
| **Expenses** | Local buyer, cutting, stitching, finishing/QC, fixed, and admin costs per order |
| **Reports** | P&L, monthly summaries, PDF/CSV export |
| **Auth** | JWT login/signup with role-based access |

### Production workflow (high level)

```
Client Order → Material Evaluation → Cutting → Stitching → Finishing/QC → Dispatch
                     ↓
              Expense tracking at each stage
                     ↓
              Reports & P&L per order
```

For full architectural detail, database schemas, and API design for all modules, see [`guide.md`](./guide.md).

---

## Current Implementation Status

| Layer | Status | Notes |
|-------|--------|-------|
| **Frontend** | ✅ Running | React 18 + Vite on **port 8080** |
| **UI** | ✅ Built | shadcn/ui, dark theme, responsive layout |
| **Orders list** | ✅ Mock data | `OrdersPage.tsx` — filter, sort, search |
| **Order detail** | ✅ Mock data | `OrderDetailPage.tsx` — breakdown, timeline, workflow |
| **PDF export** | ✅ Partial | `orderPdf.ts`, `expensePdf.ts`, `inventoryPdf.ts`, `reportsPdf.ts` via jsPDF |
| **Backend** | ❌ Not wired | No Express/MongoDB connected yet — all data in `src/data/*.ts` |
| **Auth** | ✅ UI only | Login/signup pages exist; no real API |
| **Invoice / payments** | ❌ Not built | "Invoice" button on order detail is a placeholder |

**Currency today:** PKR (`Rs`) via `src/lib/currency.ts`.  
**Manual process reference (screenshots):** GBP (£) CNF pricing per piece for export clients.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TypeScript, TailwindCSS, shadcn/ui |
| Routing | React Router v7 |
| State | React Query (installed), local state + mock data files |
| PDF | jsPDF + jspdf-autotable |
| Backend (planned) | Node.js, Express, Mongoose, MongoDB Atlas |
| Auth (planned) | JWT + bcrypt |

---

## Existing Modules Summary

### `/orders` — Order management

- **List** (`/orders`): searchable table with status pills, date filters, sortable columns
- **Detail** (`/orders/:id`): client info, size/color breakdown, production progress, delivery overview, workflow stepper
- **Actions**: Print order summary PDF, placeholder Invoice button, New Order dialog
- **Statuses**: `draft`, `active`, `in-production`, `qc-hold`, `completed`, `dispatched`, `overdue`

### `/materials` — Material pipeline per order

4-step stepper: Order overview → Evaluate → Material utilized → Inventory leftover

### `/inventory` — Stock management

Material stock levels, reorder alerts, PDF export

### `/expenses` — Production costs (per order)

Tabs: Local Buyer, Cutting, Stitching, Finishing, Fixed, Admin — each with line items and totals

### `/reports` — Analytics dashboard

KPIs, charts, PDF export

### `/settings` — Workspace profile

Factory name, address (used in PDF headers)

---

## New Feature: Client Invoice & Payment Ledger

### Problem (manual process today)

Your company currently tracks **export/client billing** in spreadsheets:

1. **Sheet 1 — Order line items per client**  
   All products and charges for one client in a running list: description, qty, CNF price/pc, invoice value, color-coded fulfillment status. Includes a **previous outstanding amount** row and a **total amount of goods** footer.

2. **Sheet 2 — Payment ledger per client**  
   Running account: total goods value, individual payments received (dated), total received, and **balance outstanding**.

This must be replicated professionally inside the app — **only on the Orders side** — with PDF download, credit/debit handling, and batch invoicing.

### Goals

| Goal | Description |
|------|-------------|
| **Client-centric ledger** | One client can have many order line items; view and manage them together |
| **Fulfillment tracking** | Status per line (delivered, in process, partial, waiting design, etc.) with color coding |
| **Debit / credit accounting** | Proper ledger entries: invoices (debit client), payments (credit), credit notes (cancel/adjust) |
| **Payment recording** | Add payments as client sends money; auto-update balance |
| **Batch invoicing** | Select delivered/uninvoiced lines → bundle into one invoice → download PDF |
| **Opening balance** | Carry forward prior outstanding (e.g. £4,110.00) when onboarding a client |
| **Audit trail** | Every invoice, payment, and adjustment is dated, numbered, and immutable once issued |

### Scope

| In scope | Out of scope (for now) |
|----------|------------------------|
| `/orders` list — client filter / client account entry point | Materials, inventory, expenses modules |
| Client account view (ledger + line items) | Multi-currency FX conversion |
| Invoice PDF generation | Bank reconciliation / payment gateway |
| Credit notes for cancellations | Tax/VAT engine (unless specified later) |
| Payment input form | Email invoice to client (future) |

### Reference: manual spreadsheet mapping

**Image 1 — Order tracking sheet**

| Column | App field |
|--------|-----------|
| Sr. # | Auto serial / line number |
| Product Description | `description` (hoodies, patches, courier charges, etc.) |
| Quantity (Pcs) | `quantity` |
| CNF Price/Pc (GBP) | `unitPrice` + `currency` |
| Invoice Value (GBP) | `quantity × unitPrice` (computed) |
| Row color | `fulfillmentStatus` |

**Status legend (from screenshot)**

| Color | Status |
|-------|--------|
| Green | Goods Delivered |
| Blue | Waiting Sticker Design |
| Orange | In Process |
| Yellow | Partial Delivered |

**Special rows**

| Row type | Treatment |
|----------|-----------|
| Previous outstanding amount | `openingBalance` on client account (one-time or imported) |
| Courier / service charges | Regular line item with `type: "service"` |
| Total Amount of Goods | Computed: `openingBalance + sum(active line items)` |

**Image 2 — Payment ledger**

| Row | App field |
|-----|-----------|
| Total Amount of Goods | `totalDebits` (ledger summary) |
| Received Payment [date] | `Payment` entry with `type: "payment_received"` |
| Total Amount received | `sum(payments)` |
| Total Balance Payment | `totalDebits - totalReceived` (negative = client owes) |

---

## Business Rules & Calculations

### Ledger principles (standard AR accounting)

```
Client Account Balance = Total Debits − Total Credits

Where:
  Debits  = Invoices issued + opening balance + debit adjustments
  Credits = Payments received + credit notes (cancellations, returns, discounts)
```

| Transaction type | Effect on balance | Example |
|------------------|-------------------|---------|
| **Opening balance** | Increases what client owes (debit) | £4,110 prior outstanding |
| **Invoice issued** | Increases balance (debit) | Batch invoice for 5 delivered lines = £12,400 |
| **Payment received** | Decreases balance (credit) | £2,000 on 09-Oct-2025 |
| **Credit note** | Decreases balance (credit) | Order cancelled — reverse £3,500 |
| **Debit note** | Increases balance (debit) | Extra courier charge added after dispatch |

### Line item lifecycle

```
Created → In Process → Partial Delivered → Delivered
                    ↘ Waiting Design ↗
                    ↘ Cancelled (triggers credit note option)
```

**Invoicing rule (default):** Only lines with status `delivered` or `partial-delivered` (configurable qty) can be added to an invoice batch. Lines already on a finalized invoice cannot be re-invoiced.

### Invoice batch workflow

```
1. User opens Client Account from /orders
2. Filters line items (e.g. status = Delivered, not yet invoiced)
3. Selects lines → "Create Invoice"
4. System generates:
   - Invoice number (INV-2026-001)
   - Line items with qty, unit price, subtotals
   - Invoice total
   - Ledger debit entry linked to invoice
5. User downloads PDF
6. Invoice status = Issued (locked)
```

### Payment workflow

```
1. User clicks "Record Payment"
2. Enters: date, amount, reference/note, payment method (optional)
3. System creates credit ledger entry
4. Balance updates immediately
5. Optional: allocate payment to specific invoice(s) — see Open Questions
```

### Cancellation workflow

```
1. User marks line item as Cancelled (or reduces qty on partial cancel)
2. System prompts: "Issue credit note?"
3. Credit note created:
   - CN-2026-001
   - References original line / invoice if applicable
   - Reduces client balance
4. Credit note PDF available for download
```

---

## Data Model (Proposed)

### `Client` (or extend orders with `clientId`)

```ts
type Client = {
  id: string;
  name: string;                    // e.g. "Scotland Print Client"
  contact?: { name; email; phone };
  billingAddress?: string;
  currency: "GBP" | "PKR" | "USD";  // per-client currency
  openingBalance: number;          // debit carried forward
  openingBalanceDate?: string;
  openingBalanceNote?: string;     // e.g. "Imported from spreadsheet"
  createdAt: string;
};
```

### `ClientLineItem` (billable row — maps to spreadsheet rows)

```ts
type FulfillmentStatus =
  | "in-process"
  | "waiting-design"
  | "partial-delivered"
  | "delivered"
  | "cancelled";

type LineItemType = "product" | "service" | "adjustment";

type ClientLineItem = {
  id: string;
  clientId: string;
  orderId?: string;               // link to production order if exists
  serialNumber: number;           // Sr. # in sheet
  description: string;
  quantity: number;
  unitPrice: number;
  invoiceValue: number;           // computed: qty × unitPrice
  currency: string;
  type: LineItemType;
  fulfillmentStatus: FulfillmentStatus;
  invoiced: boolean;
  invoiceId?: string;             // set when included in issued invoice
  creditNoteId?: string;          // if cancelled / credited
  orderDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
```

### `Invoice`

```ts
type InvoiceStatus = "draft" | "issued" | "void";

type Invoice = {
  id: string;
  invoiceNumber: string;          // INV-2026-001
  clientId: string;
  lineItemIds: string[];
  subtotal: number;
  openingBalanceIncluded: number; // if first invoice includes opening balance
  total: number;
  currency: string;
  status: InvoiceStatus;
  issuedAt?: string;
  dueDate?: string;
  notes?: string;
  pdfUrl?: string;                // if stored in cloud later
  createdBy?: string;
};
```

### `CreditNote`

```ts
type CreditNote = {
  id: string;
  creditNoteNumber: string;       // CN-2026-001
  clientId: string;
  lineItemId?: string;
  invoiceId?: string;             // original invoice if partial cancel
  amount: number;
  reason: string;                 // "Order cancelled", "Qty reduction", etc.
  currency: string;
  issuedAt: string;
};
```

### `LedgerEntry` (unified account transactions)

```ts
type LedgerEntryType =
  | "opening_balance"
  | "invoice"
  | "payment"
  | "credit_note"
  | "debit_note";

type LedgerEntry = {
  id: string;
  clientId: string;
  type: LedgerEntryType;
  date: string;
  description: string;            // "Received Payment 09-Oct-2025"
  debit: number;                  // increases client owes
  credit: number;                 // decreases client owes
  balance: number;                // running balance after entry
  referenceId?: string;           // invoiceId, paymentId, creditNoteId
  createdAt: string;
};
```

### `Payment`

```ts
type Payment = {
  id: string;
  clientId: string;
  date: string;
  amount: number;
  currency: string;
  description: string;            // "Payment received 11-Jun-2026"
  method?: "bank_transfer" | "cash" | "other";
  reference?: string;             // bank ref / cheque no.
  allocatedInvoiceIds?: string[]; // optional payment allocation
};
```

### Computed summary (per client)

```ts
type ClientAccountSummary = {
  clientId: string;
  totalAmountOfGoods: number;     // opening + all active line items (or ledger debits)
  totalAmountReceived: number;    // sum of payments + credit notes
  balanceOutstanding: number;     // totalDebits - totalCredits (negative = client owes)
  lineItemCount: number;
  uninvoicedDeliveredCount: number;
};
```

---

## UI / UX Specification

### Entry points (all under `/orders`)

| Route | Page | Purpose |
|-------|------|---------|
| `/orders` | Orders list (existing) | Add **"Client Accounts"** tab or toggle; group/filter by client |
| `/orders/clients/:clientId` | **Client Account** (new) | Main ledger + line items view |
| `/orders/clients/:clientId/invoices/:invoiceId` | Invoice detail (new) | View issued invoice, re-download PDF |

### Client Account page layout

```
┌─────────────────────────────────────────────────────────────┐
│  ← Orders    CLIENT NAME                    [Record Payment] │
│              Balance: -£15,021.02 (outstanding)  [New Invoice]│
├─────────────────────────────────────────────────────────────┤
│  Summary cards:                                              │
│  Total Goods £94,021 │ Received £79,000 │ Outstanding £15,021│
├──────────────────────────┬──────────────────────────────────┤
│  LINE ITEMS (tab)        │  PAYMENT LEDGER (tab)            │
│  ┌──┬──────────┬───┬────┐│  ┌────────────────┬──────────┐ │
│  │☐ │ Product  │Qty│ £  ││  │ Description    │ Amount   │ │
│  │☐ │ Hoodies  │800│3.4k││  │ Total Goods    │ 94,021   │ │
│  │☐ │ Courier  │ 1 │450 ││  │ Payment 09-Oct │  2,000   │ │
│  └──┴──────────┴───┴────┘│  │ ...            │          │ │
│  Status filter pills     │  │ Total Received │ 79,000   │ │
│  Color-coded rows        │  │ Balance        │-15,021   │ │
│  [+ Add line item]       │  │ [+ Add payment]│          │ │
└──────────────────────────┴──────────────────────────────────┘
```

### Line items table columns

| Column | Notes |
|--------|-------|
| Checkbox | For batch invoice selection |
| Sr. # | Serial |
| Description | Full product/service text |
| Qty (Pcs) | Editable until invoiced |
| CNF Price/Pc | Unit price in client currency |
| Invoice Value | Computed, read-only |
| Status | Badge with color (green/blue/orange/yellow) |
| Invoiced | Yes/No + invoice link |

### Status badge colors (match manual sheet)

| Status | Tailwind / CSS token |
|--------|---------------------|
| Delivered | `bg-success/15 text-success` (green) |
| Waiting Sticker Design | `bg-info/15 text-info` (blue) |
| In Process | `bg-warning/15 text-warning` (orange) |
| Partial Delivered | `bg-yellow-500/15 text-yellow-600` (yellow) |
| Cancelled | `bg-muted text-muted-foreground` (grey, strikethrough) |

### Actions

| Action | Who / when |
|--------|------------|
| Add line item | New product row or service charge |
| Update status | Production/dispatch team as goods move |
| Select + Create Invoice | Finance — bundle delivered lines |
| Record Payment | Finance — when client pays |
| Issue Credit Note | On cancel or dispute |
| Set opening balance | Once per client onboarding |
| Download Statement PDF | Full ledger export |
| Download Invoice PDF | Per issued invoice |

### Orders list enhancement

- Add **view mode**: `All Orders` | `By Client`
- In `By Client` mode: show one row per client with order count, total goods, balance, last payment date
- Click client row → `/orders/clients/:clientId`

---

## PDF Outputs

Reuse existing jsPDF + autotable pattern (`src/lib/orderPdf.ts`).

### 1. Client Invoice PDF (`generateClientInvoicePdf`)

**Filename:** `INV-2026-001-{ClientName}.pdf`

**Sections:**

1. Company header (from Settings)
2. Client billing details
3. Invoice number, date, due date
4. Line items table: Sr., Description, Qty, CNF Price/Pc, Amount
5. Subtotal
6. Optional: opening balance line
7. **Invoice Total**
8. Footer: payment terms, bank details

**Style:** Match professional export invoice — clean table, GBP formatting (`£ 4,350.00`).

### 2. Statement of Account PDF (`generateClientStatementPdf`)

**Filename:** `{ClientName}-statement-{date}.pdf`

**Sections:**

1. Client name + period
2. Total Amount of Goods (blue header row)
3. All payment rows (yellow-style alternating rows)
4. Total Amount Received
5. Balance Outstanding

### 3. Credit Note PDF (`generateCreditNotePdf`)

**Filename:** `CN-2026-001-{ClientName}.pdf`

- References original invoice/line
- Credit amount and reason

### Currency formatting

Add `formatGBP()` alongside `formatPKR()` in `src/lib/currency.ts`, or a generic `formatMoney(amount, currency)` helper.

---

## API Endpoints (Proposed)

When backend is connected:

### Clients

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients` | List clients with account summaries |
| POST | `/api/clients` | Create client |
| GET | `/api/clients/:id` | Client detail + summary |
| PUT | `/api/clients/:id` | Update client / opening balance |

### Line items

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients/:id/line-items` | All line items for client |
| POST | `/api/clients/:id/line-items` | Add line item |
| PUT | `/api/clients/:id/line-items/:lineId` | Update qty, price, status |
| DELETE | `/api/clients/:id/line-items/:lineId` | Soft delete (only if not invoiced) |

### Invoices

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients/:id/invoices` | List invoices |
| POST | `/api/clients/:id/invoices` | Create invoice from selected line IDs |
| GET | `/api/invoices/:invoiceId` | Invoice detail |
| POST | `/api/invoices/:invoiceId/void` | Void draft / issued (with rules) |
| GET | `/api/invoices/:invoiceId/pdf` | Generate / return PDF |

### Payments & ledger

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients/:id/ledger` | Full ledger with running balance |
| POST | `/api/clients/:id/payments` | Record payment |
| POST | `/api/clients/:id/credit-notes` | Issue credit note |
| GET | `/api/clients/:id/statement/pdf` | Statement PDF |

---

## File Structure (Planned Additions)

```
erp/src/
├── data/
│   ├── clients.ts              # Mock clients + line items + ledger
│   └── clientAccounts.ts       # Summary helpers, balance calculations
├── lib/
│   ├── currency.ts             # + formatGBP / formatMoney
│   ├── clientInvoicePdf.ts     # Invoice PDF generator
│   ├── clientStatementPdf.ts   # Statement / ledger PDF
│   └── creditNotePdf.ts        # Credit note PDF
├── components/orders/
│   ├── ClientAccountSummary.tsx
│   ├── ClientLineItemsTable.tsx
│   ├── ClientLedgerTable.tsx
│   ├── RecordPaymentDialog.tsx
│   ├── CreateInvoiceDialog.tsx
│   ├── CreditNoteDialog.tsx
│   ├── AddLineItemDialog.tsx
│   └── FulfillmentStatusBadge.tsx
└── pages/orders/
    ├── OrdersPage.tsx            # + client view mode
    └── ClientAccountPage.tsx     # NEW — main feature page
```

---

## Implementation Task List

### Phase A — Foundation (mock data, no backend)

- [ ] **A1.** Create `src/data/clients.ts` with sample client matching screenshot data (GBP, ~46 line items, opening balance £4,110, payments ledger)
- [ ] **A2.** Add `formatGBP()` / `formatMoney(currency)` to `src/lib/currency.ts`
- [ ] **A3.** Implement `computeClientSummary()` — total goods, received, balance
- [ ] **A4.** Implement `buildLedger()` — running balance from opening balance, lines, invoices, payments, credit notes
- [ ] **A5.** Add `FulfillmentStatusBadge` component with color coding from manual sheet

### Phase B — Client Account UI

- [ ] **B1.** Create `ClientAccountPage.tsx` at route `/orders/clients/:clientId`
- [ ] **B2.** Build summary KPI cards (Total Goods, Received, Outstanding)
- [ ] **B3.** Build line items table with status filters, checkbox selection, color-coded rows
- [ ] **B4.** Build payment ledger tab/table (mirror screenshot 2 layout)
- [ ] **B5.** `RecordPaymentDialog` — date, amount, description, optional reference
- [ ] **B6.** `AddLineItemDialog` — description, qty, unit price, type, initial status
- [ ] **B7.** `CreateInvoiceDialog` — preview selected lines, confirm, assign invoice number
- [ ] **B8.** `CreditNoteDialog` — trigger from cancelled line or manual adjustment
- [ ] **B9.** Wire routes in `App.tsx`

### Phase C — Orders list integration

- [ ] **C1.** Add "By Client" view toggle on `OrdersPage.tsx`
- [ ] **C2.** Client grouped rows: name, # orders, total goods, balance, last payment
- [ ] **C3.** Link each client row to `ClientAccountPage`
- [ ] **C4.** Keep existing per-order table as "All Orders" view

### Phase D — PDF generation

- [ ] **D1.** `generateClientInvoicePdf()` — professional invoice layout
- [ ] **D2.** `generateClientStatementPdf()` — ledger statement (image 2 style)
- [ ] **D3.** `generateCreditNotePdf()` — credit note document
- [ ] **D4.** Hook PDF buttons on Client Account and Invoice detail views
- [ ] **D5.** Use Settings workspace details in PDF header

### Phase E — Business logic & validation

- [ ] **E1.** Prevent invoicing already-invoiced lines
- [ ] **E2.** On invoice issue: mark lines invoiced, create ledger debit entry
- [ ] **E3.** On payment: create ledger credit entry, update balance
- [ ] **E4.** On credit note: reduce balance, link to line/invoice
- [ ] **E5.** Cancellation flow: status → cancelled, prompt credit note
- [ ] **E6.** Opening balance: editable once on client setup
- [ ] **E7.** Partial delivery: allow invoicing delivered qty only (if confirmed — see Open Questions)

### Phase F — Order detail integration (light touch)

- [ ] **F1.** On `OrderDetailPage`, link "Invoice" button to client account (not standalone)
- [ ] **F2.** Show invoice status on order if line item is linked
- [ ] **F3.** Optionally auto-create client line item when production order reaches `dispatched`

### Phase G — Backend (when API is ready)

- [ ] **G1.** Mongoose models: Client, ClientLineItem, Invoice, Payment, CreditNote, LedgerEntry
- [ ] **G2.** REST endpoints per API table above
- [ ] **G3.** Replace mock data with React Query hooks
- [ ] **G4.** Persist PDFs to Cloudinary/S3 (optional)
- [ ] **G5.** Auth guards — finance role for payments/invoices

### Phase H — Polish & QA

- [ ] **H1.** Empty states (no clients, no payments, no delivered lines)
- [ ] **H2.** Confirm dialogs for void invoice / large credit note
- [ ] **H3.** Toast notifications on payment / invoice / credit note
- [ ] **H4.** Export ledger CSV
- [ ] **H5.** Manual test against spreadsheet numbers (totals must match £94,021.02 / £79,000 / £15,021.02)
- [ ] **H6.** Responsive layout for tablet/desktop

---

## Open Questions

Please confirm these before implementation starts:

1. **Currency** — Screenshots use **GBP**. Rest of app uses **PKR**. Should export clients use GBP per client while local orders stay PKR? Or convert everything to one currency?

2. **Line items vs production orders** — Should each spreadsheet row map 1:1 to an existing `Order` in the app, or can finance add standalone rows (courier, patches) without a production order?

3. **Opening balance** — Is it a one-time import per client, or can it be adjusted later with a debit/credit note?

4. **Payment allocation** — Are payments applied to the **general client account** (as in the screenshot), or must each payment be linked to a specific invoice?

5. **Partial delivery invoicing** — Invoice full line qty or only the delivered portion?

6. **Invoice numbering** — Preferred format? e.g. `INV-2026-001`, or client-specific prefix?

7. **Company details for PDF** — Business name, address, bank details for GBP receipts — should these live in Settings?

8. **First client to seed** — Should we use the exact Scotland/export client from the screenshot as demo data?

---

## Getting Started

```bash
cd erp
npm install
npm run dev
# → http://localhost:8080
```

| Route | Description |
|-------|-------------|
| `/orders` | Orders list (feature will extend this) |
| `/orders/:id` | Single order detail |
| `/orders/clients/:clientId` | **(planned)** Client account & invoicing |

### Related docs

| File | Contents |
|------|----------|
| [`guide.md`](./guide.md) | Full system spec, DB schemas, all modules, dev phases |
| [`frontend.md`](./frontend.md) | Frontend module notes |
| [`DESIGN.md`](./DESIGN.md) | UI design tokens and patterns |

---

*Last updated: June 2026 — Client Invoice & Payment Ledger feature spec added.*
