# TextileERP — Full-Stack Textile Industry Management System

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [System Architecture](#system-architecture)
4. [Module Breakdown & Pages](#module-breakdown--pages)
   - [Module 1: Order Sheet (Client-Side)](#module-1-order-sheet-client-side)
   - [Module 2: Material Management](#module-2-material-management)
   - [Module 3: Expenses Phase](#module-3-expenses-phase)
     - [3A: Local Buyer Sheet](#3a-local-buyer-sheet)
     - [3B: Cutting Material](#3b-cutting-material)
     - [3C: Stitching](#3c-stitching)
     - [3D: Finishing & Quality](#3d-finishing--quality)
     - [3E: Fixed Expenses](#3e-fixed-expenses)
     - [3F: Admin Expenses](#3f-admin-expenses)
5. [Database Schema](#database-schema)
6. [Workflow & Process Flow](#workflow--process-flow)
7. [API Endpoints](#api-endpoints)
8. [Frontend Components](#frontend-components)
9. [Cloud & Storage Setup](#cloud--storage-setup)
10. [History & Reporting](#history--reporting)
11. [Project Folder Structure](#project-folder-structure)
12. [Getting Started](#getting-started)

---

## Project Overview

TextileERP is a full-stack web application designed for the textile manufacturing industry. It digitizes the entire production lifecycle — from receiving a client order to tracking material usage, managing production expenses, and maintaining historical records. The system covers:

- **Client order management** with product specifications
- **Material tracking** through a 4-step pipeline: Order → Evaluate → Material Utilized → Inventory Left Over
- **Production expense tracking** across cutting, stitching, finishing, fixed costs, and admin costs
- **Quality inspection** at the finishing stage
- **Cloud-backed persistent storage** with full history and reporting

---

## Tech Stack

### Recommendation: **MERN Stack** (MongoDB + Express + React + Node.js)

**Why MERN over Next.js for this use case:**

| Factor | MERN | Next.js |
|--------|------|---------|
| API flexibility | Full control via Express | API routes are simpler but limited |
| MongoDB integration | Mongoose ODM — natural fit | Same, but config heavier |
| Role-based auth | Passport.js / JWT — straightforward | Same, but more boilerplate |
| Mobile readiness | React can power a future React Native app | SSR not needed for internal dashboards |
| Team familiarity | Separate backend is easier to hand off | Full-stack in one repo — steeper learning curve |

> **Use Next.js only if** you plan to do SEO-heavy public pages. For an internal ERP/dashboard tool, MERN is cleaner.

### Full Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, TailwindCSS, React Router v6 |
| State Management | Zustand (lightweight) or Redux Toolkit |
| UI Components | shadcn/ui or Ant Design |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas (cloud) |
| ODM | Mongoose |
| Authentication | JWT + bcrypt |
| File Storage | Cloudinary or AWS S3 (for attachments) |
| Hosting (Frontend) | Vercel or Netlify |
| Hosting (Backend) | Railway, Render, or AWS EC2 |
| API Testing | Postman / Thunder Client |
| Version Control | Git + GitHub |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                       │
│    (Vite + React Router + TailwindCSS + Zustand)        │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP / REST API (Axios)
┌────────────────────▼────────────────────────────────────┐
│                   Express.js Backend                     │
│           (Routes → Controllers → Services)             │
└────────────────────┬────────────────────────────────────┘
                     │ Mongoose ODM
┌────────────────────▼────────────────────────────────────┐
│              MongoDB Atlas (Cloud DB)                    │
│     Collections: Orders, Materials, Expenses,           │
│     Inventory, LocalBuyer, Cutting, Stitching,          │
│     Finishing, FixedExpenses, AdminExpenses, Users       │
└─────────────────────────────────────────────────────────┘
```

---

## Module Breakdown & Pages

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

## Database Schema

### MongoDB Collections & Mongoose Models

---

#### `Orders` Collection

```js
{
  _id: ObjectId,
  orderNumber: String,          // "ORD-2026-001"
  clientName: String,
  clientContact: String,
  orderDate: Date,
  deliveryDate: Date,
  qty: Number,
  pricePerUnit: Number,
  sizes: [{ size: String, qty: Number }],
  color: String,
  material: String,
  gsm: Number,
  description: String,
  status: { type: String, enum: ["draft","active","in_production","completed","cancelled"] },
  createdBy: ObjectId,          // ref: User
  createdAt: Date,
  updatedAt: Date
}
```

---

#### `Materials` Collection

```js
{
  _id: ObjectId,
  orderId: ObjectId,            // ref: Order
  materialType: String,
  condition: { type: String, enum: ["processing","bought","from_stock"] },
  qty: Number,
  unit: String,                 // "kg" | "meters"
  kgPrice: Number,
  labelDetails: String,
  tags: String,
  accessories: String,

  // Step 2 - Evaluation
  requiredMaterial: Number,
  availableInStock: Number,
  materialGap: Number,
  evaluationNotes: String,
  evaluationStatus: { type: String, enum: ["approved","needs_sourcing"] },

  // Step 3 - Utilized
  materialUsed: Number,
  wastage: Number,
  utilizationDate: Date,

  // Step 4 - Inventory Left Over
  remainingMaterial: Number,
  returnedToStock: Number,
  disposed: Number,

  createdAt: Date,
  updatedAt: Date
}
```

---

#### `Inventory` Collection

```js
{
  _id: ObjectId,
  materialName: String,
  materialType: String,
  currentStock: Number,
  unit: String,
  reorderLevel: Number,
  lastUpdated: Date,
  history: [
    {
      date: Date,
      change: Number,           // positive = added, negative = used
      reason: String,
      orderId: ObjectId
    }
  ]
}
```

---

#### `LocalBuyerSheet` Collection

```js
{
  _id: ObjectId,
  orderId: ObjectId,
  items: [
    {
      supplierName: String,
      itemName: String,
      qty: Number,
      unit: String,
      ratePerUnit: Number,
      totalAmount: Number,
      purchaseDate: Date,
      invoiceNumber: String,
      notes: String
    }
  ],
  grandTotal: Number,
  createdAt: Date
}
```

---

#### `CuttingSheet` Collection

```js
{
  _id: ObjectId,
  orderId: ObjectId,
  totalMaterialReceived: Number,
  cutBreakdown: [{ size: String, qtyCut: Number }],
  totalCut: Number,
  wastage: Number,
  materialLeft: Number,
  cutterName: String,
  date: Date,
  wages: Number,
  notes: String
}
```

---

#### `StitchingSheet` Collection

```js
{
  _id: ObjectId,
  orderId: ObjectId,
  piecesReceived: Number,
  piecesStitched: Number,
  piecesRejected: Number,
  ratePerPiece: Number,
  totalWages: Number,
  workerName: String,
  startDate: Date,
  endDate: Date,
  notes: String
}
```

---

#### `FinishingSheet` Collection

```js
{
  _id: ObjectId,
  orderId: ObjectId,
  piecesReceived: Number,
  ironingDone: Boolean,
  ironingCount: Number,
  taggingDone: Boolean,
  taggingCount: Number,
  packingDone: Boolean,
  packingCount: Number,
  qcPass: Number,
  qcFail: Number,
  defectTypes: [String],
  wages: Number,
  qcInspector: String,
  dateFinished: Date,
  notes: String
}
```

---

#### `FixedExpenses` Collection

```js
{
  _id: ObjectId,
  month: String,                // "2026-03"
  rent: Number,
  fuel: Number,
  electricity: Number,
  gas: Number,
  depreciation: Number,
  other: [{ label: String, amount: Number }],
  total: Number,
  // Per-order allocations
  orderAllocations: [
    { orderId: ObjectId, allocatedAmount: Number, allocationBasis: String }
  ],
  createdAt: Date
}
```

---

#### `AdminExpenses` Collection

```js
{
  _id: ObjectId,
  orderId: ObjectId,            // optional — can be global or order-specific
  month: String,
  salaries: Number,
  communication: Number,
  stationery: Number,
  bankCharges: Number,
  transport: Number,
  misc: [{ label: String, amount: Number }],
  total: Number,
  createdAt: Date
}
```

---

#### `Users` Collection

```js
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String,             // bcrypt hashed
  role: { type: String, enum: ["admin","manager","production","viewer"] },
  createdAt: Date
}
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List all orders (with filters) |
| POST | `/api/orders` | Create new order |
| GET | `/api/orders/:id` | Get order detail |
| PUT | `/api/orders/:id` | Update order |
| DELETE | `/api/orders/:id` | Delete order |
| GET | `/api/orders/:id/summary` | Full order summary (all phases) |

### Materials
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders/:orderId/material` | Get material record |
| POST | `/api/orders/:orderId/material` | Create material record |
| PUT | `/api/orders/:orderId/material` | Update any step |

### Expenses (repeat pattern per sub-module)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders/:orderId/expenses/local-buyer` | Get local buyer sheet |
| POST | `/api/orders/:orderId/expenses/local-buyer` | Save local buyer sheet |
| PUT | `/api/orders/:orderId/expenses/local-buyer` | Update |
| GET/POST/PUT | `/api/orders/:orderId/expenses/cutting` | Cutting sheet |
| GET/POST/PUT | `/api/orders/:orderId/expenses/stitching` | Stitching sheet |
| GET/POST/PUT | `/api/orders/:orderId/expenses/finishing` | Finishing & QC |
| GET/POST/PUT | `/api/expenses/fixed/:month` | Fixed expenses by month |
| GET/POST/PUT | `/api/orders/:orderId/expenses/admin` | Admin expenses |

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | List all inventory items |
| GET | `/api/inventory/:id` | Single item with history |
| PUT | `/api/inventory/:id` | Update stock level |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/order/:id` | Full P&L for one order |
| GET | `/api/reports/monthly` | Monthly summary |
| GET | `/api/reports/inventory` | Inventory status report |

---


## Cloud & Storage Setup

### MongoDB Atlas
1. Create free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create database: `textile_erp`
3. Create collections per schema above
4. Whitelist IP and get connection string
5. Store in `.env` as `MONGODB_URI`

### Environment Variables

```env
# Backend (.env)
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/textile_erp
JWT_SECRET=your_jwt_secret_here
CLOUDINARY_URL=cloudinary://...   # for file uploads
CLIENT_URL=http://localhost:3000

# Frontend (.env)
VITE_API_URL=http://localhost:5000/api
```

### File Uploads (Cloudinary)
- Used for attaching invoices, images, or PDFs to expenses
- Store Cloudinary public_id in DB, reconstruct URL on frontend

---

## History & Reporting

Every module write operation stores:
- `createdAt` and `updatedAt` timestamps
- `createdBy` user reference
- Soft deletes (add `isDeleted: Boolean` flag, never hard delete)

### History Features
- **Order Timeline:** View all changes to an order over time
- **Inventory Log:** Full in/out history per material item
- **Monthly P&L Report:** Total income (order value) vs total expenses per month
- **Per-Order Cost Summary:** Local purchases + cutting wages + stitching wages + finishing wages + allocated fixed + admin = total cost; profit = order price − total cost
- **Export:** Each report page has "Export to PDF" and "Export to CSV" buttons

---

## Project Folder Structure

```
textile-erp/
├── client/                        # React frontend
│   ├── src/
│   │   ├── api/                   # Axios API calls
│   │   ├── components/            # Reusable UI components
│   │   ├── pages/
│   │   │   ├── orders/
│   │   │   ├── material/
│   │   │   ├── expenses/
│   │   │   │   ├── LocalBuyerPage.jsx
│   │   │   │   ├── CuttingPage.jsx
│   │   │   │   ├── StitchingPage.jsx
│   │   │   │   ├── FinishingPage.jsx
│   │   │   │   ├── FixedExpensesPage.jsx
│   │   │   │   └── AdminExpensesPage.jsx
│   │   │   ├── inventory/
│   │   │   └── reports/
│   │   ├── store/                 # Zustand state
│   │   ├── utils/
│   │   └── App.jsx
│   └── package.json
│
├── server/                        # Express backend
│   ├── controllers/
│   │   ├── orderController.js
│   │   ├── materialController.js
│   │   ├── expenseController.js
│   │   └── reportController.js
│   ├── models/
│   │   ├── Order.js
│   │   ├── Material.js
│   │   ├── Inventory.js
│   │   ├── LocalBuyerSheet.js
│   │   ├── CuttingSheet.js
│   │   ├── StitchingSheet.js
│   │   ├── FinishingSheet.js
│   │   ├── FixedExpenses.js
│   │   ├── AdminExpenses.js
│   │   └── User.js
│   ├── routes/
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   └── roleCheck.js
│   ├── utils/
│   ├── .env
│   └── index.js
│
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/textile-erp.git
cd textile-erp

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install

# Set up environment variables
cp server/.env.example server/.env
# Fill in MONGODB_URI, JWT_SECRET, etc.

# Run development
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

### Build for Production

```bash
cd client && npm run build
cd server && npm start
```

---

## Development Phases (Suggested Build Order)

| Phase | Tasks |
|-------|-------|
| Phase 1 | Auth (register/login), User roles, basic layout |
| Phase 2 | Order Sheet CRUD — full form + list page |
| Phase 3 | Material Module — 4-step stepper |
| Phase 4 | Inventory system linked to material steps |
| Phase 5 | Expenses — Local Buyer Sheet + Cutting |
| Phase 6 | Expenses — Stitching + Finishing/QC |
| Phase 7 | Fixed Expenses + Admin Expenses |
| Phase 8 | Reports & History dashboard |
| Phase 9 | PDF/CSV export, file upload (invoices) |
| Phase 10 | Cloud deploy (Vercel + Railway + MongoDB Atlas) |

---

*Generated for TextileERP Project*