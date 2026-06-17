
## Project Overview

TextileERP is a full-stack web application designed for the textile manufacturing industry. It digitizes the entire production lifecycle — from receiving a client order to tracking material usage, managing production expenses, and maintaining historical records. The system covers:

- **Client order management** with product specifications
- **Material tracking** through a 4-step pipeline: Order → Evaluate → Material Utilized → Inventory Left Over
- **Production expense tracking** across cutting, stitching, finishing, fixed costs, and admin costs
- **Quality inspection** at the finishing stage
- **Cloud-backed persistent storage** with full history and reporting

---

## Frontend Components

### Shared Components
- `Navbar` — top nav with logo, user menu, notifications
- `Sidebar` — module navigation
- `Stepper` — 4-step progress for Material module
- `TabBar` — tab navigation for Expenses sub-modules
- `DataTable` — sortable, filterable table (reused everywhere)
- `DynamicRowTable` — add/remove rows (used in Local Buyer Sheet)
- `StatusBadge` — color-coded order/step status
- `SummaryCard` — shows totals per section
- `DatePicker`, `NumberInput`, `SelectInput` — form primitives

### Page Components
- `OrdersListPage` — searchable table of all orders
- `OrderFormPage` — create/edit order
- `OrderDetailPage` — overview of one order with links to all phases
- `MaterialPage` — 4-step stepper for material tracking
- `ExpensesPage` — tabbed layout for all 6 expense sub-modules
- `LocalBuyerSheetPage`
- `CuttingSheetPage`
- `StitchingSheetPage`
- `FinishingQCPage`
- `FixedExpensesPage`
- `AdminExpensesPage`
- `InventoryPage` — stock levels and history
- `ReportsPage` — charts, summaries, export to PDF

---



---

## Workflow & Process Flow

```
[New Client Order]
        │
        ▼
[Order Sheet Created] ─────────────────────────────────► DB: Orders
        │
        ▼
[Material Module Opens]
        │
   ┌────▼─────────────────────────────────────────────┐
   │  Step 1: Define Material (type, condition, qty)   │──► DB: Materials
   │  Step 2: Evaluate Order (stock check, gap)        │──► DB: Inventory (read)
   │  Step 3: Record Material Utilized                 │──► DB: Materials (update)
   │  Step 4: Update Inventory Left Over               │──► DB: Inventory (write)
   └──────────────────────────────────────────────────┘
        │
        ▼
[Expenses Phase]
        │
   ┌────┴───────────────────────────────────────────────────────────┐
   │  3A: Local Buyer Sheet (purchases)       ──► DB: LocalBuyer    │
   │  3B: Cutting (fabric cut, wastage)       ──► DB: Cutting       │
   │  3C: Stitching (production, wages)       ──► DB: Stitching     │
   │  3D: Finishing + QC                      ──► DB: Finishing     │
   │  3E: Fixed Expenses (rent, fuel, etc.)   ──► DB: FixedExpenses │
   │  3F: Admin Expenses (salaries, etc.)     ──► DB: AdminExpenses │
   └────────────────────────────────────────────────────────────────┘
        │
        ▼
[Order Completed / Dispatched]
        │
        ▼
[Reports & History Dashboard]
```

---





---

### Module 1: Order Sheet (Client-Side)

**Route:** `/orders/new` | `/orders/:id`

**Purpose:** Capture a new client order with all garment/product specifications. This is the entry point of the entire workflow.

#### Page: Create / View Order Sheet

**Fields / Form Inputs:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Client Name | Text | Yes | Buyer or brand name |
| Client Contact | Text | No | Phone / email |
| Order Number | Auto-generated | Yes | e.g., ORD-2026-001 |
| Order Date | Date | Yes | |
| Delivery Date | Date | Yes | |
| Qty (Quantity) | Number | Yes | Total pieces |
| Price per Unit | Number | Yes | In PKR or USD |
| Sizes | Multi-select | Yes | XS, S, M, L, XL, XXL or custom |
| Size Breakdown | Table | Yes | Qty per size |
| Color | Text / Color picker | Yes | Color name or hex |
| Material | Text | Yes | Fabric type e.g. Cotton, Polyester |
| Material Weight (GSM) | Number | Yes | Grams per square meter |
| Description (Optional) | Textarea | No | Additional notes, design description |

**UI Behavior:**
- Auto-generate Order Number on form load
- Size breakdown table auto-calculates total qty
- On submit, create an `Order` document in DB and redirect to the Material module for this order
- Order status badge: `Draft → Active → In Production → Completed`

**Linked to:** Material Module (auto-opens after order creation)

---

### Module 2: Material Management

**Route:** `/orders/:orderId/material`

**Purpose:** Track how material is managed for a specific order through a 4-step pipeline.

#### Sub-Step Pipeline (shown as stepper UI):

```
Step 1: Order     →     Step 2: Evaluate Order     →     Step 3: Material Utilized     →     Step 4: Inventory Left Over
```

---

#### Step 1 — Order (Material Overview)

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Material Type | Select | See conditions below |
| Material Condition | Select | Processing / Bought / From Stock |
| Qty (meters or kg) | Number | Total material for this order |
| Kg / Price / Pair metrics | Number | Unit pricing |
| Label details | Text | Brand label info |
| Tags | Text | Hang tags, woven tags |
| Accessories | Text | Buttons, zippers, thread etc. |

**Material Condition options (as noted in diary):**
1. Processing of Fabric Thread — material is being processed/manufactured in-house
2. Processed Bought — material purchased already processed
3. Used from Stock — pulled from existing inventory

---

#### Step 2 — Evaluate Order

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Required Material (kg/meters) | Number | Calculated from order qty × consumption per unit |
| Available in Stock | Number | Auto-fetched from inventory |
| Material Gap | Computed | Required − Available |
| Notes / Evaluation | Textarea | Quality notes, sourcing plan |
| Status | Select | Approved / Needs Sourcing |

---

#### Step 3 — Material Utilized

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Material Used (kg/meters) | Number | Actual consumption |
| Wastage | Number | |
| Date of Utilization | Date | |
| Notes | Textarea | |

---

#### Step 4 — Inventory Left Over

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Remaining Material | Computed | Material received − utilized |
| Returned to Stock | Number | |
| Disposed / Wasted | Number | |
| Final Inventory Update | Auto | Updates global inventory collection |

---

### Module 3: Expenses Phase

**Route:** `/orders/:orderId/expenses`

The expenses phase is split into 6 sub-modules, each as a separate tab or section within the expenses page.

---

#### 3A: Local Buyer Sheet

**Route:** `/orders/:orderId/expenses/local-buyer`

**Purpose:** Track raw material and accessory purchases from local suppliers.

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Supplier Name | Text | |
| Item Name | Text | Fabric, thread, button etc. |
| Qty Purchased | Number | |
| Unit | Select | kg / meters / pieces |
| Rate per Unit | Number | |
| Total Amount | Computed | Qty × Rate |
| Purchase Date | Date | |
| Invoice Number | Text | |
| Notes | Textarea | |

Multiple line items can be added (dynamic row table).

**Totals:** Auto-sum of all purchases for this order shown at bottom.

---

#### 3B: Cutting Material

**Route:** `/orders/:orderId/expenses/cutting`

**Purpose:** Track fabric cutting details — how much was cut, wastage, leftover.

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Total Material Received for Cutting | Number | meters / kg |
| Total Cut (per size) | Table | Rows per size, qty cut |
| Overall Cut Total | Computed | |
| Cutting Wastage | Number | |
| Material Left After Cutting | Computed | Received − Cut − Wastage |
| Cutter Name / Team | Text | |
| Date | Date | |
| Cutting Wages | Number | Cost of cutting labor |
| Notes | Textarea | |

---

#### 3C: Stitching

**Route:** `/orders/:orderId/expenses/stitching`

**Purpose:** Track stitching production details and wages.

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Total Pieces Sent for Stitching | Number | |
| Pieces Stitched | Number | |
| Pieces Rejected / Rework | Number | |
| Stitching Rate per Piece | Number | |
| Total Stitching Wages | Computed | Pieces × Rate |
| Worker / Team Name | Text | |
| Start Date | Date | |
| End Date / Completion Date | Date | |
| Notes | Textarea | |

---

#### 3D: Finishing & Quality

**Route:** `/orders/:orderId/expenses/finishing`

**Purpose:** Track finishing steps and quality testing before dispatch.

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Pieces Received for Finishing | Number | |
| Ironing / Pressing Done | Checkbox + Count | |
| Tagging Done | Checkbox + Count | |
| Packing Done | Checkbox + Count | |
| Quality Check — Pass | Number | Pieces passed QC |
| Quality Check — Fail | Number | Pieces failed QC |
| Defect Types | Multi-select | Stitching issue, measurement, fabric defect etc. |
| Finishing Wages | Number | |
| QC Inspector Name | Text | |
| Date Finished | Date | |
| Notes | Textarea | |

---

#### 3E: Fixed Expenses

**Route:** `/orders/:orderId/expenses/fixed` (also `/settings/fixed-expenses` for global config)

**Purpose:** Record recurring fixed business costs allocated to this order or tracked globally.

**Fixed Expense Categories:**

| Expense | Type | Notes |
|---------|------|-------|
| Rent | Monthly Fixed | Factory / office rent |
| Fuel | Variable-Fixed | Generator, transport |
| Gas / Electricity | Monthly | Utility bills |
| Equipment Depreciation | Monthly | Machines, tools |
| Other | Text + Amount | |

**Per-Order Allocation:**
- Fixed expenses can be split across orders proportionally (by qty or manually)
- Each order stores its allocated share of fixed expenses

---

#### 3F: Admin Expenses

**Route:** `/orders/:orderId/expenses/admin`

**Purpose:** Track overhead and administrative costs.

**Admin Expense Categories:**

| Expense | Type |
|---------|------|
| Salaries (non-production) | Monthly |
| Communication (calls, internet) | Monthly |
| Stationery | As incurred |
| Bank charges | As incurred |
| Transport / Freight | Per order |
| Miscellaneous | Text + Amount |

---