# DESIGN.md — Textile ERP System
## Design Language & Component Specification

> **Aesthetic Reference:** [ERP Dashboard — Dribbble #14430592](https://dribbble.com/shots/14430592-ERP-Dashboard)  
> **Design Philosophy:** Data-dense, dark-mode-first, professional industrial UI with high information hierarchy and vibrant accent data visualizations.

---

## 1. Design Principles

| Principle | Description |
|---|---|
| **Clarity over decoration** | Every pixel earns its place. No ornamentation without function. |
| **Data at a glance** | KPIs, charts, and status indicators must be readable in <2 seconds. |
| **Industrial confidence** | Heavy use of dark surfaces with structured grid layouts — built for factory floors and boardrooms alike. |
| **Consistent density** | Comfortable information density; not sparse, not overwhelming. |
| **Color carries meaning** | Color is reserved for status (success/warning/error) and data series — never decorative. |

---

## 2. Color System

### 2.1 Core Palette

```
Background Layer 0  (App shell)       #0D1117   — Near-black
Background Layer 1  (Page canvas)     #111827   — Dark navy
Background Layer 2  (Card surface)    #1C2535   — Navy card
Background Layer 3  (Input / hover)   #243044   — Elevated card / hover
Border              (Subtle divider)  #2D3E55   — Soft navy border
```

### 2.2 Brand & Primary

```
Primary             #4F8EF7   — Electric blue (CTA, links, active nav)
Primary Hover       #3A78E5
Primary Muted       #4F8EF720  — 12% opacity (ghost states, highlights)
```

### 2.3 Semantic Colors

```
Success             #22C55E   — Green  (produced, fulfilled, in-stock)
Warning             #F59E0B   — Amber  (low stock, delayed, pending)
Danger              #EF4444   — Red    (rejected, overdue, critical)
Info                #38BDF8   — Cyan   (informational badges, tooltips)
Purple Accent       #A78BFA   — Violet (secondary charts, WIP stages)
```

### 2.4 Text Hierarchy

```
Text Primary        #F1F5F9   — Headlines, key values
Text Secondary      #94A3B8   — Labels, metadata
Text Tertiary       #4B6080   — Placeholder, disabled
Text Inverse        #0D1117   — On light accent buttons
```

### 2.5 Chart Color Series (in order)

```
Series 1    #4F8EF7   Blue
Series 2    #22C55E   Green
Series 3    #F59E0B   Amber
Series 4    #A78BFA   Violet
Series 5    #38BDF8   Cyan
Series 6    #FB7185   Rose
```

---

## 3. Typography

### 3.1 Font Stack

```
Primary Font     : "Inter", "SF Pro Display", -apple-system, sans-serif
Monospace Font   : "JetBrains Mono", "Fira Code", monospace  (order IDs, SKUs, serial numbers)
```

### 3.2 Type Scale

| Role | Size | Weight | Line Height | Color |
|---|---|---|---|---|
| Page Title | 24px / 1.5rem | 700 | 1.2 | Text Primary |
| Section Header | 18px / 1.125rem | 600 | 1.3 | Text Primary |
| Card Title | 14px / 0.875rem | 600 | 1.4 | Text Secondary |
| Body / Table Row | 14px / 0.875rem | 400 | 1.5 | Text Primary |
| Caption / Label | 12px / 0.75rem | 500 | 1.4 | Text Secondary |
| Micro / Badge | 11px / 0.6875rem | 600 | 1.2 | Varies |
| KPI Value | 32px / 2rem | 700 | 1.1 | Text Primary |
| KPI Sub-label | 12px / 0.75rem | 400 | 1.4 | Text Secondary |
| Monospace ID | 13px / 0.8125rem | 400 | 1.4 | Text Secondary |

### 3.3 Typography Rules

- All numbers in KPI cards and tables use **tabular-nums** (`font-variant-numeric: tabular-nums`).
- SKU codes, lot numbers, PO IDs → always render in monospace.
- Avoid text longer than 60 characters per line in content areas.

---

## 4. Spacing & Grid

### 4.1 Base Unit

**Base unit = 4px.** All spacing is a multiple of 4.

```
xs    4px
sm    8px
md    12px
lg    16px
xl    24px
2xl   32px
3xl   48px
4xl   64px
```

### 4.2 Layout Grid

```
App Shell Layout     : Fixed left sidebar (240px) + fluid content area
Content Max-Width    : 1440px centered
Content Padding      : 24px (desktop), 16px (tablet)
Column Grid          : 12-column grid, 16px gutters
Card Gap             : 16px between cards
Section Gap          : 32px between sections
```

### 4.3 Sidebar

```
Width (expanded)     : 240px
Width (collapsed)    : 64px
Background           : #0D1117 (Layer 0)
Nav item height      : 44px
Nav icon size        : 20px
Active indicator     : 3px left border, Primary color
```

---

## 5. Component Library

### 5.1 Cards

```
Background      : #1C2535  (Layer 2)
Border          : 1px solid #2D3E55
Border-radius   : 12px
Padding         : 20px 24px
Box-shadow      : 0 1px 3px rgba(0,0,0,0.4)
Hover-shadow    : 0 4px 16px rgba(79,142,247,0.08)
```

**KPI Metric Card layout:**
```
[ Icon (32px, tinted bg) ]  [ Label (caption) ]
[ Value (KPI) ]             [ Δ% trend badge  ]
[ Sparkline or progress ]
```

### 5.2 Buttons

| Variant | Background | Text | Border | Use |
|---|---|---|---|---|
| Primary | `#4F8EF7` | `#fff` | none | Primary CTA |
| Secondary | `#243044` | `#F1F5F9` | `1px #2D3E55` | Secondary action |
| Ghost | transparent | `#4F8EF7` | `1px #4F8EF7` | Tertiary / cancel |
| Danger | `#EF4444` | `#fff` | none | Delete / reject |
| Icon-only | `#243044` | icon | `1px #2D3E55` | Toolbar actions |

Button radius: **8px**. Height: **36px** (default), **32px** (compact), **44px** (large).  
Padding: `0 16px`. Font weight: **600**. Font size: **14px**.

### 5.3 Tables

```
Header row background    : #111827  (Layer 1)
Header text              : Text Secondary, 12px, uppercase, letter-spacing 0.05em
Row background           : #1C2535  (alternating: #1C2535 / #192030)
Row height               : 48px
Row hover background     : #243044
Border                   : 1px solid #2D3E55 (horizontal only)
Cell padding             : 0 16px
Checkbox column          : 40px
Action column            : 80px (right-aligned)
```

**Sticky header** on all tables taller than the viewport.  
Columns should be resizable and sortable (sortable indicated by `↕` icon in header).

### 5.4 Badges & Status Pills

```
Border-radius   : 9999px (full pill)
Font-size       : 11px
Font-weight     : 600
Padding         : 2px 10px
```

| Status | Background | Text |
|---|---|---|
| Active / Produced | `#22C55E20` | `#22C55E` |
| Pending / In-Progress | `#F59E0B20` | `#F59E0B` |
| Critical / Overdue | `#EF444420` | `#EF4444` |
| Dispatched | `#4F8EF720` | `#4F8EF7` |
| Draft | `#4B608040` | `#94A3B8` |
| QC Hold | `#A78BFA20` | `#A78BFA` |

### 5.5 Form Inputs

```
Background      : #111827
Border          : 1px solid #2D3E55
Border-radius   : 8px
Height          : 40px
Padding         : 0 12px
Font-size       : 14px
Color           : Text Primary
Placeholder     : Text Tertiary
Focus border    : #4F8EF7
Focus shadow    : 0 0 0 3px rgba(79,142,247,0.15)
```

### 5.6 Modals & Drawers

```
Modal overlay         : rgba(0,0,0,0.65)
Modal background      : #1C2535
Modal border-radius   : 16px
Modal padding         : 32px
Modal max-width       : 560px (form), 800px (detail view)
Drawer width          : 480px (right-anchored)
Drawer background     : #111827
Drawer shadow         : -8px 0 32px rgba(0,0,0,0.5)
```

### 5.7 Navigation Sidebar — Item States

```
Default       : bg transparent,  text #94A3B8, icon #4B6080
Hover         : bg #243044,       text #F1F5F9, icon #94A3B8
Active        : bg #4F8EF715,     text #4F8EF7, icon #4F8EF7, left-border 3px #4F8EF7
```

### 5.8 Charts & Data Visualizations

- Library: **Recharts** (React) or **ApexCharts** (Vue/vanilla).
- All chart backgrounds: **transparent** (sits on card surface).
- Grid lines: `#2D3E55`, dashed, 1px.
- Axis labels: Text Secondary, 12px.
- Tooltips: `#243044` background, `1px solid #2D3E55`, 8px radius, shadow.
- Area charts: 15% opacity fill under line.
- Bar charts: 6px border-radius on bar tops.
- Donut charts: 60px inner radius, legend right-aligned.

---

## 6. Module-Specific UI Patterns

### 6.1 Production / Manufacturing

- **Gantt-style timeline** for production scheduling (horizontal bars per lot/job).
- **Machine status grid**: icon tiles in a 4–6 column grid showing green/amber/red state per machine.
- **Stage pipeline bar**: horizontal stepper showing `Raw → Dyeing → Weaving → Finishing → QC → Dispatch`.

### 6.2 Inventory Management

- **Stock level bars**: inline progress bars inside table cells (colored by threshold: green >50%, amber 20–50%, red <20%).
- **Bin location chip**: monospace pill showing warehouse rack/bin (e.g., `WH-A / R03 / B12`).
- **Low stock alert banner**: sticky amber banner beneath page header when items below reorder point.

### 6.3 Purchase Orders & Procurement

- **PO timeline card**: vertical timeline of PO lifecycle (Created → Approved → Dispatched → Received → Invoiced).
- **Vendor scorecard chip**: small rating badge (stars or score) next to vendor name in tables.

### 6.4 Sales & Order Management

- **Order funnel chart**: donut or horizontal funnel showing Quote → Confirmed → In Production → Shipped → Invoiced.
- **Delivery calendar mini-widget**: compact month calendar with colored dots per delivery due date.

### 6.5 HR & Payroll

- **Shift roster grid**: rows = employees, columns = days, cells = shift badges (Day/Night/Off).
- **Attendance heatmap**: GitHub-style contribution grid for employee attendance by month.

### 6.6 Finance & Accounts

- **Revenue vs. Cost area chart**: dual-series area chart, monthly granularity.
- **Aging receivables bar chart**: stacked bars grouped by 0-30 / 30-60 / 60-90 / 90+ days.
- **Profit margin KPI ring**: circular gauge (0–100%) with color gradient.

---

## 7. Iconography

- **Library:** Lucide Icons (open-source, consistent stroke style).
- **Stroke width:** 1.5px.
- **Sizes:** 16px (inline/table), 20px (nav), 24px (card headers), 32px (KPI icon boxes).
- **Icon container (KPI cards):** 40×40px rounded square (`border-radius: 10px`), background = icon color at 15% opacity.

---

## 8. Responsive Breakpoints

| Breakpoint | Width | Layout Change |
|---|---|---|
| Desktop | ≥1280px | Full sidebar + 12-col grid |
| Laptop | 1024–1279px | Sidebar collapsible, 8-col |
| Tablet | 768–1023px | Sidebar hidden (hamburger), 4-col |
| Mobile | <768px | Bottom nav, single-col stacked |

---

## 9. Motion & Animation

```
Default transition    : 150ms ease
Card hover lift       : transform translateY(-2px), 150ms ease
Sidebar expand        : width 240ms cubic-bezier(0.4, 0, 0.2, 1)
Modal enter           : opacity 0→1 + scale 0.96→1, 200ms ease-out
Skeleton shimmer      : gradient animation, 1.5s infinite
Chart animate-in      : draw from left, 600ms ease-out (on mount only)
```

No animation should exceed **400ms**. Respect `prefers-reduced-motion`.

---

## 10. Accessibility

- Minimum contrast ratio: **4.5:1** for body text, **3:1** for large text (WCAG AA).
- All interactive elements must have **focus-visible** ring: `outline: 2px solid #4F8EF7; outline-offset: 2px`.
- Color alone must never convey status — pair with icon or label.
- Tables must use `<th scope="col/row">` and `aria-sort`.
- Modals must trap focus and return focus on close.

---

## 11. File & Asset Organization

```
/src
  /components
    /ui           ← Atoms: Button, Badge, Input, Card, Table
    /charts       ← Chart wrappers
    /layout       ← Sidebar, Topbar, PageShell
  /modules
    /production
    /inventory
    /procurement
    /sales
    /hr
    /finance
  /styles
    tokens.css    ← All CSS variables (colors, spacing, radius)
    global.css
  /assets
    /icons        ← Any custom SVG icons not in Lucide
```

---

## 12. CSS Token Reference

```css
:root {
  /* Backgrounds */
  --bg-0: #0D1117;
  --bg-1: #111827;
  --bg-2: #1C2535;
  --bg-3: #243044;
  --border: #2D3E55;

  /* Brand */
  --primary: #4F8EF7;
  --primary-muted: rgba(79,142,247,0.12);

  /* Semantic */
  --success: #22C55E;
  --warning: #F59E0B;
  --danger: #EF4444;
  --info: #38BDF8;
  --accent: #A78BFA;

  /* Text */
  --text-1: #F1F5F9;
  --text-2: #94A3B8;
  --text-3: #4B6080;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;
  --space-2xl: 32px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
}
```

---

*Document version 1.0 — Textile ERP System — Generated April 2026*
