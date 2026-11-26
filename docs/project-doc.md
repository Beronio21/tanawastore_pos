# `tanawastore_POS` — Complete Product & System Architecture Specification

## 1. Executive Summary

**`tanawastore_POS`** is a custom-built, cloud-native Point of Sale (POS) and restaurant/retail back-office management platform engineered with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **PostgreSQL**.

The system replicates the layout, navigation hierarchy, and operational workflows of a modern cloud POS console so that owners, managers, cashiers, and kitchen staff can transition onto a self-hosted, customizable Next.js stack with zero learning curve.

### Target Business Profile (Default Tenant)

- **Business Name:** `tanawa`
- **Store URL:** `tanawastore.pos`
- **Owner Account:** `Philip Venje Beronio` (`PIN: 0000`, `00639758868962`)
- **Currency & Tax:** Philippine Peso (`₱`), 12% VAT calculation
- **Timezone:** `(+08:00) — Asia/Manila`

---

## 2. System Modules & Functional Requirements

### 2.1 Management Console Shell & Theme Engine

- **Top Trial / Billing Banner (`32px`):** Sticky full-width `#0077FF` notification bar with an interactive `Pay` trigger opening subscription tier selection (`Mini`, `Business`, `Pro`).
- **Collapsible Left Sidebar (`220px` expanded / `56px` collapsed):**
  - Supports instant switching between **Light Mode** (`#F7F8FA` sidebar, `#FFFFFF` canvas, `#E8EFF7` active row highlight) and **Dark Mode** (`#1D2024` sidebar, `#24272C` canvas, `#2C3036` cards).
  - Top header includes collapse toggle (`<`), brand badge (`Poster` amber square in Light Mode / `T tanawa` badge in Dark Mode), and quick `Open POS` monitor launcher.
  - Bottom footer houses active user profile switcher (`Philip Venje B...`) and Light/Dark theme toggle.
- **Floating Support & Postie AI Widget:** Bottom-right `#4A5BD6` floating chat launcher with dismissible welcome card and interactive assistant drawer.

---

### 2.2 All 9 Back-Office Accordion Modules

#### 1. Get Started (`/manage/welcome`)

- Displays remaining onboarding steps badge (`3` -> `0`) in the sidebar.
- Three interactive onboarding cards:
  1. **Create a menu item** -> Opens Dish/Product creation modal.
  2. **Try to make a sale** -> Launches the Front-of-House POS Terminal (`/pos`).
  3. **View sales reports** -> Navigates to `/manage/dash/sales`.
- Includes **Try QR Menu** live mobile preview and **Install POS** device cards.

#### 2. Reports (`/manage/dash/*`) — 11 Sub-Views

1. **Sales:** KPI summary cards (`Revenue`, `Profit`, `Receipts`, `Average receipt`) + SVG/Canvas revenue trend chart.
2. **Customers:** Customer purchase breakdown (`Without discount`, `Cash`, `By card`, `Profit`, `Receipts`, `Average receipt`).
3. **Employees:** Per-waiter/cashier performance (`Receipts`, `Revenue`, `Profit`, `Average receipt`, `Tips`).
4. **Stations:** Sales & profit split across `Bar` and `Kitchen`.
5. **Categories:** Category-level quantity, cost, revenue, and profit.
6. **Products:** Item-level unit sales, gross revenue, discount, net revenue, and profit.
7. **ABC-Analysis:** Automated A/B/C classification across **Sales Qty**, **Revenue**, and **Profit** with `#F8E5E5` highlighting for C-tier items.
8. **Receipts:** Filterable ledger of all closed checks with clickable receipt numbers (`#1001`) that open a printable serrated thermal receipt modal, plus a sticky summary footer (`Net revenue`, `Cash`, `Cards`, `Gift cards`, `Online payment`, `Discounts`, `Gross profits`).
9. **Feedback:** Star ratings (`1–5 ★`) and guest comments submitted via **Poster QR Menu**.
10. **Payments Count:** Breakdown of transaction count and volume by `Cash`, `Card`, `e-Wallet`, and online channels.
11. **Taxes:** VAT summary table (`Tax name`, `Rate 12%`, `Taxable turnover`, `Tax sum`).

#### 3. Finances (`/manage/finance/*`) — 7 Sub-Views

1. **Transactions:** Full income/expense ledger with `Category ▾`, `Account ▾`, `Full calendar ▾`, `Import with AI ✨`, and `+ Add` modal.
2. **Cash Flow:** Monthly matrix (`September`, `October`, `November`, `Over the Period`) with expandable rows for `Beginning Cash Balance`, `Ending Cash Balance`, and `Net Cash Flow ▾`.
3. **Cash Shifts:** Tracks opening cash float, safe drops, expected cash register balance, and variance (toggled via `Settings -> Cash register shifts`).
4. **Payroll:** Automated shift hours + sales commission calculation per employee when `staff time tracking` is enabled.
5. **Accounts:** Tracks real-time balances across `Bank account`, `Cash drawer for tanawa`, and `Safe deposit`.
6. **Categories:** 13 pre-configured financial categories (`Adjustment`, `Banking services and commission fees`, `e-Wallet top up`, `Household expenses`, `Labour cost`, `Marketing`, `Rent`, `Supplies`, `Utility bills` [expandable], `Cash shifts`, `POS Sales`, `Safe drop`, `Tips`) with live toggle switches for **Display on the POS** and **Include in P&L**.
7. **P&L (Profit and Loss):** Interactive statement showing `Revenue`, `Cost` (COGS + `Stock deductions`), `Margin`, `Expenses`, `Profit before taxation`, `Taxes`, and `Profit after taxation`, switching seamlessly between sample preview mode and live store data.

#### 4. Menu (`/manage/menu/*`) — 8 Sub-Views

1. **Products:** Retail/packaged items sold as-is (e.g., `Borjomi 0.5l` — `10.00 ₱`).
2. **Dishes:** Prepared food/drinks with Bill-of-Materials (BOM) ingredient recipes, total weight, cost without VAT, price, and retail margin % (e.g., `Capucino 250ml` — `120.00 ₱`, `Croissant with chocolate` — `95.00 ₱`).
3. **Preparations:** Semi-finished kitchen batches (e.g., `Pastry for croissants` — `1.490 kg`, `5.25 ₱`) reusable across multiple dishes.
4. **Ingredients:** Raw stock materials (`Coffee`, `Milk`, `Paper cup 250ml`, `Flour`, `Dark chocolate`, `Egg`, etc.) with cold/peeling/boiling loss percentages.
5. **Foodcost Control (`New`):** Tracks item & ingredient cost fluctuations, margin drift, and recipe optimization recommendations.
6. **Categories of Products and Dishes:** POS folder categories (`Coffee`, `Pastry`, `Cold drinks`).
7. **Categories of Ingredients:** Storage groupings for raw ingredients.
8. **Stations:** Production routing targets (`Bar`, `Kitchen`) with ticket printing flags.

#### 5. Inventory (`/manage/calculations/*`) — 10 Sub-Views

- **Stock:** Real-time inventory count, unit cost (`₱`), total valuation (`₱215.20` initial seed across 14 items), and low-stock alert limits.
- **Supplies:** Supplier delivery logging that increments stock levels, updates weighted/latest unit cost, and records an expense in `Finances -> Transactions`.
- **Butcheries, Transfers, Stock Deductions, Ingredients Movements, Inventory Checks, Suppliers, Storage Locations, Ordering Units:** Complete warehouse audit trail logging every positive restock and negative POS sale deduction.

#### 6. Marketing (`/manage/marketing/*`) — 5 Sub-Views

- **Customers, Customer Groups, Loyalty, Exclusions, Promotions:** CRM database storing customer profile numbers, phone numbers, discount groups (`VIP 10%`, `Regular 5%`), and cumulative spend.

#### 7. Access (`/manage/access/*`) — 6 Sub-Views

- **Employees, User Sessions, Positions, Tablets, Locations, Integrations:** Role-based access control (`Owner`, `Manager`, `Cashier`, `Waiter`) with 4-digit PIN codes for rapid POS terminal switching. Locations configure the register login, working hours, bank/cash/safe accounts, and inventory storage locations; POS proceeds and stock deductions use the configured location.

#### 8. Applications (`/manage/applications`)

- **Postie AI Assistant:** Parses supplier invoice photos and bank statements to auto-generate supply deliveries and financial transactions.
- **QR Menu:** Instant digital menu and guest rating portal.
- **Website for Orders, P&L Report, Analytics for Owner, Kitchen Kit (KDS).**

#### 9. Settings (`/manage/settings/*`) — 6 Sub-Views

- **General, Billing, Orders, Delivery, Security, Receipt:** Configures company name (`tanawa`), subdomain, timezone, shift end time, currency symbol (`₱`), floor plan toggle, quick waiter switch, and cash register shift tracking.

---

### 2.3 Front-of-House POS Terminal (`/pos`)

1. **Register View:**
   - Multi-tab open checks (`Table 1 #1001`, `+ New`).
   - Table assignment, customer loyalty attachment, percentage discounts (`10%`, `20%`), kitchen notes, and **To Kitchen** dispatch button with unsent item counter badge.
   - Touch category filter pills, instant search bar, and product/dish tiles.
   - Checkout modal supporting **Cash** (with quick denomination buttons `Exact`, `100`, `500`, `1000` and live change calculation), **By card**, and **e-Wallet / QR**, generating a printable serrated **Thermal Receipt**.
2. **Floor Plan View:**
   - Visual table grid (`Table 1–6`, `Patio 1–2`) color-coded by ownership: **White/Grey** (Vacant), **Blue `#1A73E8`** (Current waiter's open check), **Violet** (Another staff member's open check).
3. **Kitchen Kit (KDS) View:**
   - Live ticket queue for `Bar` and `Kitchen` stations with order timestamps and one-tap **Bump / Ready** completion.

---

## 3. Relational Database Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Location {
  id             String   @id @default(cuid())
  companyName    String   @default("tanawa")
  subdomain      String   @unique @default("tanawastore.pos")
  currencySymbol String   @default("₱")
  timezone       String   @default("Asia/Manila")
  vatRate        Decimal  @default(0.12) @db.Decimal(5, 4)
  showFloorPlan  Boolean  @default(true)
  cashShiftsOn   Boolean  @default(false)
  createdAt      DateTime @default(now())
}

model Employee {
  id          String    @id @default(cuid())
  name        String
  phone       String?
  email       String?   @unique
  pin         String
  position    String    // Owner | Manager | Cashier | Waiter
  hourlyRate  Decimal   @default(120.00) @db.Decimal(10, 2)
  lastLoginAt DateTime?
  receipts    Receipt[]
}

model Station {
  id           String     @id @default(cuid())
  name         String     @unique // Bar | Kitchen
  printTickets Boolean    @default(true)
  menuItems    MenuItem[]
}

model MenuCategory {
  id        String     @id @default(cuid())
  name      String     @unique
  emoji     String     @default("🍽️")
  menuItems MenuItem[]
}

model MenuItem {
  id          String             @id @default(cuid())
  title       String
  itemType    String             // Product | Dish
  cost        Decimal            @default(0) @db.Decimal(10, 2)
  price       Decimal            @db.Decimal(10, 2)
  emoji       String             @default("🍽️")
  categoryId  String
  category    MenuCategory       @relation(fields: [categoryId], references: [id])
  stationId   String
  station     Station            @relation(fields: [stationId], references: [id])
  recipe      RecipeIngredient[]
  saleItems   ReceiptItem[]
}

model StockItem {
  id        String             @id @default(cuid())
  title     String
  stockType String             // Product | Ingredient
  category  String?
  unit      String             // pcs | kg | l
  stock     Decimal            @default(0) @db.Decimal(12, 3)
  cost      Decimal            @default(0) @db.Decimal(10, 2)
  minLimit  Decimal            @default(0) @db.Decimal(12, 3)
  recipes   RecipeIngredient[]
  movements StockMovement[]
}

model RecipeIngredient {
  id          String    @id @default(cuid())
  menuItemId  String
  menuItem    MenuItem  @relation(fields: [menuItemId], references: [id], onDelete: Cascade)
  stockItemId String
  stockItem   StockItem @relation(fields: [stockItemId], references: [id])
  quantity    Decimal   @db.Decimal(12, 3)
}

model Customer {
  id           String    @id @default(cuid())
  name         String
  profileNum   String    @unique
  phone        String?
  groupName    String    @default("Standard")
  discountPct  Int       @default(0)
  overallSum   Decimal   @default(0) @db.Decimal(12, 2)
  receiptCount Int       @default(0)
  receipts     Receipt[]
}

model Receipt {
  id             String        @id @default(cuid())
  idempotencyKey String        @unique
  receiptNum     Int           @unique @default(autoincrement())
  tableName      String
  paymentMethod  String        // Cash | Card | e-Wallet
  subtotal       Decimal       @db.Decimal(10, 2)
  discountAmt    Decimal       @default(0) @db.Decimal(10, 2)
  tax            Decimal       @db.Decimal(10, 2)
  profit         Decimal       @db.Decimal(10, 2)
  total          Decimal       @db.Decimal(10, 2)
  openedAt       DateTime      @default(now())
  closedAt       DateTime      @default(now())
  employeeId     String
  employee       Employee      @relation(fields: [employeeId], references: [id])
  customerId     String?
  customer       Customer?     @relation(fields: [customerId], references: [id])
  items          ReceiptItem[]
}

model ReceiptItem {
  id         String   @id @default(cuid())
  receiptId  String
  receipt    Receipt  @relation(fields: [receiptId], references: [id], onDelete: Cascade)
  menuItemId String
  menuItem   MenuItem @relation(fields: [menuItemId], references: [id])
  name       String
  qty        Int
  unitPrice  Decimal  @db.Decimal(10, 2)
}

model FinanceAccount {
  id           String               @id @default(cuid())
  name         String
  accountType  String               // Bank account | Cash | e-Wallet
  balance      Decimal              @default(0) @db.Decimal(12, 2)
  transactions FinanceTransaction[]
}

model FinanceCategory {
  id            String               @id @default(cuid())
  name          String               @unique
  allowedType   String               // All transactions | Income only | Expenses only
  displayOnPos  Boolean              @default(false)
  includeInPnl  Boolean              @default(true)
  transactions  FinanceTransaction[]
}

model FinanceTransaction {
  id         String          @id @default(cuid())
  txType     String          // income | expense
  sum        Decimal         @db.Decimal(12, 2)
  comment    String
  occurredAt DateTime        @default(now())
  accountId  String
  account    FinanceAccount  @relation(fields: [accountId], references: [id])
  categoryId String
  category   FinanceCategory @relation(fields: [categoryId], references: [id])
}

model StockMovement {
  id          String    @id @default(cuid())
  stockItemId String
  stockItem   StockItem @relation(fields: [stockItemId], references: [id])
  delta       Decimal   @db.Decimal(12, 3)
  reason      String
  createdAt   DateTime  @default(now())
}

model GuestFeedback {
  id        String   @id @default(cuid())
  stars     Int
  comment   String
  createdAt DateTime @default(now())
}
```

---

## 4. API & Server Action Contracts

| Endpoint / Action       | Method | Responsibility                                                                                                                                                                                      |
| :---------------------- | :----- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/pos/checkout`     | `POST` | Validates receipt `idempotencyKey`, creates `Receipt`, deducts recipe `StockItem` quantities, logs `StockMovement`, updates `Customer` totals, and credits `FinanceAccount` + `FinanceTransaction`. |
| `/api/pos/sync`         | `POST` | Replays an array of offline IndexedDB receipts idempotently when the POS terminal regains internet access.                                                                                          |
| `/api/ai/parse-invoice` | `POST` | Accepts an invoice image or bank statement CSV/PDF via Postie AI, extracts line items, and returns structured `Supply` or `FinanceTransaction` drafts.                                              |
| `/api/reports/[slug]`   | `GET`  | Aggregates `Sales`, `ABC-analysis`, `Cash flow`, and `P&L` metrics filtered by date range, employee, station, or account.                                                                           |

---

## 5. Phased Implementation Roadmap

1. **Phase 1 — Next.js App Router Shell & Database Seed:** Initialize Next.js + Prisma + Tailwind, configure Light/Dark console themes, build the collapsible 9-section sidebar, and seed `tanawa` defaults.
2. **Phase 2 — Menu, Recipe BOM & Inventory Engine:** Implement `Products`, `Dishes`, `Preparations`, `Ingredients`, `Supplies`, and the recursive stock deduction engine.
3. **Phase 3 — Front-of-House POS Terminal (`/pos`):** Build the split-screen Register, Floor Plan ownership map, Kitchen Kit (KDS), Cash/Card/e-Wallet checkout modal, and thermal receipt printing.
4. **Phase 4 — Finances, Cash Shifts & Reports:** Connect live receipt data to all 11 `Reports` sub-views, `Cash flow` matrix, `Categories` toggles, and `Profit and Loss (P&L)`.
5. **Phase 5 — Offline IndexedDB Queue, Postie AI & QR Menu:** Add background offline sync, Postie AI invoice parsing, and customer-facing `/qr/[tableId]` menu & feedback submission.
