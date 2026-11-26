# Phase 3: Multi-Tenant SaaS Architecture, PostgreSQL Persistence & Offline-First POS Sync

> **Agent Execution Directive:** Implement this entire Phase 3 specification end-to-end across `tanawastore_POS` without pausing for confirmation unless a required secret cannot be generated. Preserve all existing Management Console (`/manage/*`), POS Terminal (`/pos`), Clerk authentication (`proxy.ts`), and Phase 2 Vitest/Playwright test suites.

---

## 1. Architecture & Compatibility Guardrails

- **Framework:** Next.js `16.4.6` App Router (`app/` root directory, `proxy.ts` for request/auth middleware).
- **Auth & Tenant Provider:** `@clerk/nextjs` (already installed and configured in `app/layout.tsx` and `proxy.ts`).
- **Dual-Mode Persistence (Zero Regression Guarantee):**
  - When `process.env.DATABASE_URL` is configured, persist all tenant data in **PostgreSQL** via **Drizzle ORM** (`db/schema.ts`), with an offline-first local queue on `/pos`.
  - When `process.env.DATABASE_URL` is unset (such as during local CI or Phase 2 test runs), automatically fall back to the tenant-namespaced `localStorage` store in `lib/console-data.ts` so `pnpm run build` and all Phase 2 tests pass without requiring a live database connection.
- **Currency & Locale Defaults:** Philippine Peso (`₱`, `PHP`), timezone `(+08:00) — Asia/Manila`.

---

## 2. Milestone 1 — Multi-Tenant Workspace Isolation (Clerk Organizations)

### 2.1 Tenant Context Resolver (`lib/tenant.ts`)
Create a server and client-compatible tenant resolver:
- **Server (`getServerTenantContext()`):**
  - Reads `auth()` from `@clerk/nextjs/server`.
  - Resolves `tenantId = orgId ?? \`personal_${userId}\`` so every signed-in owner has an isolated workspace immediately, and switching Clerk Organizations switches tenants cleanly.
  - Resolves `orgRole` (`org:admin` -> `owner`, `org:member` -> `manager`, or paired register session -> `cashier`).
- **Storage Namespace Isolation:**
  - Namespace all `localStorage` / IndexedDB keys by `tenantId` (`tanawa_pos_state_${tenantId}` and `tanawa_pos_queue_${tenantId}`) so switching workspaces never leaks state across tenants.

### 2.2 Workspace Switcher in Sidebar (`components/Sidebar.tsx`)
- Integrate Clerk's `<OrganizationSwitcher/>` (styled to match the `#F7F8FA` / `#1D2024` sidebar theme) directly beneath the `TanAwa POS` brand header in `components/Sidebar.tsx`.
- Trigger a clean store re-hydration whenever the active `tenantId` changes.

---

## 3. Milestone 2 — Industry-Preset Onboarding Wizard (`/onboarding`)

Create `app/onboarding/page.tsx` and `POST /api/v1/onboarding/complete` for first-time tenants (`onboardingCompleted === false`). Redirect newly authenticated users with incomplete onboarding to `/onboarding` via `proxy.ts` (allowing `/onboarding` and `/api/v1/onboarding/*` when signed in).

### 3.1 Three-Step Wizard UI
1. **Step 1 — Business Profile & Industry Preset:**
   - Inputs: **Business / Store Name**, **Currency** (`Philippine peso, ₱` default), **Timezone** (`(+08:00) — Asia/Manila` default).
   - Selectable **Business Type Cards** (clicking a card previews and applies its operational preset):
     - **`cafe` — Café, Coffee Shop & Milk Tea Bar:** `showFloorPlan: false`, stations: `["Bar"]`, categories: `["Coffee", "Milk Tea & Non-Coffee", "Pastries"]`, ordering units: `Box (12 pcs)`, `Pack (1 kg)`.
     - **`restaurant` — Full-Service Restaurant & Casual Dining:** `showFloorPlan: true`, stations: `["Kitchen", "Bar"]`, categories: `["Mains", "Appetizers", "Beverages"]`, `serviceCharge: "10%"`.
     - **`bakery` — Bakery, Pastry Shop & Commissary:** `showFloorPlan: false`, `useManufacturing: true`, `lowStockAlert: "Daily digest"`, stations: `["Bakery"]`, categories: `["Breads", "Cakes & Pastries", "Raw Ingredients"]`.
     - **`fast_casual` — Fast-Casual, Food Park & Cloud Kitchen:** `showFloorPlan: false`, `deliveryEnabled: true`, stations: `["Kitchen"]`, order sources: `Dine-in`, `Takeout`, `Delivery`.
     - **`bar` — Bar, Pub & KTV Lounge:** `showFloorPlan: true`, `enablePartialServing: true`, `shiftEndTime: "04:00 am"`, stations: `["Bar"]`, categories: `["Cocktails", "Beer & Spirits", "Bar Chow"]`.
     - **`retail` — Mini-Mart, Vape Shop & Specialty Retail:** `showFloorPlan: false`, barcode quick-scan mode enabled by default, stations: `["Counter"]`, categories: `["Beverages", "Snacks", "Essentials"]`.
     - **`service` — Barbershop, Salon & Auto Detailing:** `showFloorPlan: false`, commission-based payroll preset enabled, stations: `["Service Bay"]`, categories: `["Services", "Care Products"]`.
2. **Step 2 — First Location & POS Register:**
   - Inputs: **Location Name** (defaults to Business Name), **Address**, **Opening Cash Float (`₱`)**, and **Register Name** (defaults to `Register 1`).
   - Auto-generates a unique register `login` slug and 8-character pairing `password` displayed with a copy button.
3. **Step 3 — Launch Store:**
   - Submits to `POST /api/v1/onboarding/complete`, creates the tenant, default finance accounts (`Cash drawer`, `Bank account`, `Safe deposit`), default storage (`Storage 1`), preset stations/categories/units, owner employee record (default PIN `0000`), and redirects to `/manage/dash/stat`.

---

## 4. Milestone 3 — PostgreSQL + Drizzle ORM Schema & Tenant API

### 4.1 Dependencies & Configuration
- Install `drizzle-orm`, `@neondatabase/serverless`, and `drizzle-kit` via `pnpm`.
- Create `drizzle.config.ts` pointing to `./db/schema.ts` and `process.env.DATABASE_URL`.
- Add scripts to `package.json`:
  - `"db:generate": "drizzle-kit generate"`
  - `"db:push": "drizzle-kit push"`
  - `"db:studio": "drizzle-kit studio"`

### 4.2 Database Schema (`db/schema.ts`)
Define PostgreSQL tables with `tenantId` (`text("tenant_id").notNull()`) indexed on every multi-tenant table:
- **`tenants`:** `id` (PK), `clerkOrgId`, `ownerUserId`, `name`, `businessType`, `currency`, `timezone`, `onboardingCompleted` (boolean), `plan` (`starter` | `pro` | `enterprise`), `trialEndsAt`, `createdAt`.
- **`locations`:** `id` (PK), `tenantId`, `name`, `address`, `registerLogin`, `workingTimeStart`, `workingTimeEnd`, `is247` (boolean), `bankAccountId`, `cashAccountId`, `safeAccountId`, `storageLocationIds` (jsonb).
- **`registers`:** `id` (PK), `tenantId`, `locationId`, `title`, `type`, `login` (unique), `passwordHash`, `deviceTokenHash`, `lastSeenAt`, `createdAt`.
- **`positions` & `employees`:**
  - `positions`: `id` (PK), `tenantId`, `title`, `permissions` (jsonb).
  - `employees`: `id` (PK), `tenantId`, `clerkUserId`, `name`, `pin`, `positionId`, `hourlyRate`, `shiftRate`, `monthlySalary`, `commissionRules` (jsonb).
- **`catalog_items` & `categories`:**
  - `categories`: `id` (PK), `tenantId`, `type` (`product` | `ingredient`), `name`, `parentId`.
  - `catalog_items`: `id` (PK), `tenantId`, `itemType` (`product` | `dish` | `preparation` | `ingredient`), `categoryId`, `stationId`, `name`, `sku`, `barcode`, `unit`, `price` (numeric), `cost` (numeric), `recipe` (jsonb), `trackStock` (boolean).
- **`stock_balances` & `stock_movements`:**
  - `stock_balances`: `id` (PK), `tenantId`, `storageId`, `itemId`, `quantity` (numeric), `avgCost` (numeric), `minLimit` (numeric).
  - `stock_movements`: `id` (PK), `tenantId`, `storageId`, `itemId`, `movementType` (`supply` | `sale_deduction` | `refund_restore` | `write_off` | `transfer` | `inventory_check`), `quantityDelta` (numeric), `unitCost` (numeric), `referenceId`, `createdAt`.
- **`customers` & `customer_groups`:**
  - `customer_groups`: `id` (PK), `tenantId`, `name`, `discountPercent` (numeric), `cashbackPercent` (numeric), `thresholdAmount` (numeric).
  - `customers`: `id` (PK), `tenantId`, `name`, `phone`, `email`, `gender`, `groupId`, `bonusBalance` (numeric), `totalSpent` (numeric).
- **`receipts` & `receipt_items`:**
  - `receipts`: `id` (PK), `tenantId`, `locationId`, `registerId`, `receiptNumber` (integer), `clientMutationId` (text, unique per tenant for idempotency), `status` (`open` | `closed` | `refunded`), `orderSource`, `tableLabel`, `customerId`, `employeeId`, `subtotal` (numeric), `discountTotal` (numeric), `serviceCharge` (numeric), `taxTotal` (numeric), `total` (numeric), `profit` (numeric), `paymentMethod`, `comment`, `openedAt`, `closedAt`.
  - `receipt_items`: `id` (PK), `tenantId`, `receiptId`, `itemId`, `name`, `quantity` (numeric), `unitPrice` (numeric), `unitCost` (numeric), `discountAmount` (numeric), `subtotal` (numeric).
- **`finance_accounts` & `finance_transactions`:**
  - `finance_accounts`: `id` (PK), `tenantId`, `name`, `type` (`cash` | `bank` | `safe`), `balance` (numeric).
  - `finance_transactions`: `id` (PK), `tenantId`, `accountId`, `type` (`income` | `expense` | `transfer`), `category`, `amount` (numeric), `description`, `receiptId`, `createdAt`.
- **`tenant_settings`:** `tenantId` (PK), `general` (jsonb), `delivery` (jsonb), `security` (jsonb), `receipt` (jsonb), `loyalty` (jsonb), `updatedAt`.

### 4.3 Tenant-Scoped API Routes (`app/api/v1/...`)
Every API route must resolve `tenantId` via `getServerTenantContext()` (or a valid register device cookie) and filter every database query by `eq(table.tenantId, tenantId)`:
- `GET /api/v1/bootstrap` — Returns complete hydrated state for `/manage` and `/pos`.
- `POST /api/v1/receipts/sync` — Accepts an array of offline/online receipt mutations (`clientMutationId`), executes inside a database transaction, skips already-processed `clientMutationId` entries (idempotent), deducts/restores stock, updates customer spend/bonuses, and records finance transactions.
- `POST /api/v1/state/sync` — Persists console mutations (menu, inventory, marketing, access, settings, finances) scoped to `tenantId`.

---

## 5. Milestone 4 — Offline-First `/pos` Sync Queue & Register Device Pairing

### 5.1 Offline-First Sync Queue (`lib/offline-sync.ts` & `app/pos/page.tsx`)
- Wrap POS receipt closures, refunds, and quick stock movements in an idempotent mutation queue stored in `localStorage` (`tanawa_pos_queue_${tenantId}`).
- Each queued mutation carries a UUID `clientMutationId`, `timestamp`, `type`, and `payload`.
- Display a live connection & sync pill in the `/pos` top-left header next to the register name:
  - **Green (`Online • Synced`):** Queue is empty and last sync succeeded.
  - **Amber (`Syncing (N)...`):** Actively flushing queued mutations to `POST /api/v1/receipts/sync`.
  - **Red/Slate (`Offline • N queued`):** `navigator.onLine === false` or network unreachable; cashier can continue taking orders, printing checks, and closing cash/card sales uninterrupted.
- Automatically flush the queue on `window.addEventListener("online", ...)` and on a 15-second background interval.

### 5.2 Dedicated Tablet / Register Pairing (`/pos/pair`)
Allow restaurant/store tablets to run `/pos` without logging into a manager's personal Clerk account:
- Create `app/pos/pair/page.tsx` and `POST /api/v1/pos/pair` + `POST /api/v1/pos/unpair`.
- Form accepts **Register Login** and **Register Password** (matching `Access -> Tablets` credentials).
- On valid match, sets an `HttpOnly`, `SameSite=Lax` signed cookie (`tanawa_register_session`) containing `{ tenantId, locationId, registerId, registerTitle }`, updates `registers.lastSeenAt`, and redirects to `/pos` locked on the 4-digit staff PIN screen (`PinLockScreen.tsx`).
- Update `proxy.ts` so `/pos(.*)` and `/api/v1/receipts/sync` allow access when **either** a Clerk user session **or** a valid `tanawa_register_session` cookie is present.

---

## 6. Milestone 5 — Role-Based Access Control (RBAC) & Subscription Plan Gating

### 6.1 Position-Based RBAC (`lib/rbac.ts`)
- Map `Access -> Positions` permission flags (`canViewReports`, `canViewFinances`, `canEditMenu`, `canManageInventory`, `canManageMarketing`, `canManageAccess`, `canEditSettings`, `canRefundOrders`, `canApplyDiscounts`).
- Filter navigation sections in `components/Sidebar.tsx` based on the active user/employee's position permissions (Owners always retain full access).
- Enforce permission checks on `/pos` refund and discount actions when a cashier PIN is active (prompting for Manager/Admin PIN or Admin password if restricted).

### 6.2 Plan Limits & Billing Integration (`Settings -> Billing`)
- Define 3 subscription tiers in `lib/billing-plans.ts`:
  - **`starter` (`₱1,490.00/mo`):** Up to **1 location**, **1 register**, **5 employees**.
  - **`pro` (`₱3,795.00/mo` — Trial default):** Up to **3 locations**, **5 registers**, **25 employees**.
  - **`enterprise` (`₱7,990.00/mo`):** Unlimited locations, registers, and employees.
- Enforce plan limits in `Access -> Locations` and `Access -> Tablets`: if the tenant reaches their tier cap when clicking `Add`, open an **Upgrade Plan** modal showing current usage vs. limit and a button linking directly to `/manage/settings/billing`.
- Add `POST /api/webhooks/billing` (verifying `BILLING_WEBHOOK_SECRET` header) to process PayMongo/Stripe payment confirmations, mark the tenant's open invoice as `Paid`, and update `tenants.plan`.

---

## 7. Milestone 6 — Verification & Phase 3 Automated Tests

1. **Preserve All Phase 2 Tests:**
   - Run `pnpm run test:unit` and `pnpm run test:integration` and confirm 100% pass rate with zero regressions.
2. **Add Phase 3 Test Suites:**
   - **`tests/unit/offline-sync-and-rbac.test.ts`:**
     - Verify `clientMutationId` idempotency (replaying the same receipt sync payload twice applies stock deductions and revenue only once).
     - Verify `lib/rbac.ts` permission evaluation and `lib/billing-plans.ts` location/register cap checks.
   - **`tests/integration/multi-tenant-isolation.test.tsx`:**
     - Verify switching `tenantId` isolates `localStorage` state, catalog items, receipts, and settings completely between Tenant A and Tenant B.
   - **`tests/e2e/onboarding-and-pairing.spec.ts`:**
     - Verify `/onboarding` preset selection (`Restaurant` enables floor plan + `Kitchen` & `Bar` stations; `Café` keeps counter mode + `Bar` station) and `/pos/pair` tablet pairing flow.
3. **Final Build & Type Check:**
   - Run `pnpm exec tsc --noEmit` and `pnpm run build` to verify zero TypeScript or Next.js production build errors.
