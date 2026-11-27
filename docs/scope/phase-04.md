# Phase 4: Live PostgreSQL Persistence, Multi-Device Kitchen Kit, PayMongo Philippine Payments, Cloudflare R2 Media & Thermal Printing

> **Agent Execution Directive:** Implement this entire Phase 4 specification end-to-end across `tanawastore_POS` without pausing for confirmation. Preserve all existing Management Console (`/manage/*`), POS Terminal (`/pos`), Clerk authentication + Next.js `16.4.6` `proxy.ts` second-pass `x-clerk-*` rewrite guard, Drizzle schema (`db/schema.ts`), and Phase 2 & Phase 3 Vitest/Playwright test suites.

---

## 1. Architecture, Security & Triple-Fallback Guardrails

- **Next.js `16.4.6` `proxy.ts` Preservation:**
  - Do **not** remove or alter the second-pass `x-clerk-*` header guard in `proxy.ts` (prevents the `vercel/next.js#95598` rewrite loop).
  - Ensure `proxy.ts` permits `/api/v1/kitchen/(.*)` and `/api/v1/uploads` for authenticated Clerk sessions **and** valid `tanawa_register_session` cookies, while keeping `/api/webhooks/billing` public (verified via webhook signature).
  - Harden `E2E_TEST_MODE`: ignore `E2E_TEST_MODE === "1"` whenever `process.env.NODE_ENV === "production"` so production deployments always enforce `auth.protect()`.
- **Environment-Driven Graceful Fallbacks (Zero-Config CI/Test Guarantee):**
  - **PostgreSQL (`DATABASE_URL`):** Use Drizzle ORM (`db/schema.ts`) against Neon PostgreSQL whenever `process.env.DATABASE_URL` is set; fall back to tenant-namespaced `localStorage` (`tanawa_pos_state_${tenantId}`) when unset so all offline tests pass.
  - **PayMongo (`PAYMONGO_SECRET_KEY`):** Call PayMongo REST APIs (`[https://api.paymongo.com/v1](https://api.paymongo.com/v1)`) whenever `process.env.PAYMONGO_SECRET_KEY` is set; fall back to an interactive **PayMongo Sandbox Simulator** modal when unset.
  - **Cloudflare R2 (`CLOUDFLARE_R2_ACCOUNT_ID`):** Upload tenant-prefixed media (`pos/${tenantId}/...`) to Cloudflare R2 via `@aws-sdk/client-s3` whenever R2 credentials are set; fall back to resized client-side data URLs when unset.

---

## 2. Milestone 1 — Live Neon PostgreSQL Hydration, Schema Update & Seeding

### 2.1 Schema Additions (`db/schema.ts`)
- Add `imageUrl: text("image_url")` to `catalog_items` so products and dishes store their uploaded R2 photo URL.
- Ensure `tenant_settings.general` JSONB shape supports `logoUrl?: string` and `tin?: string`, and `tenant_settings.receipt` supports `paperWidth?: "58mm" | "80mm"`.
- If `process.env.DATABASE_URL` is configured in `.env.local`, run `pnpm run db:push` after updating `db/schema.ts` to sync all tables to the `tanawa_pos` Neon database.

### 2.2 Complete Drizzle Hydration (`app/api/v1/bootstrap/route.ts` & `lib/pos-store.tsx`)
- Upgrade `GET /api/v1/bootstrap`:
  - Resolve `tenantId` via `getServerTenantContext()`.
  - When `DATABASE_URL` is set, query all tenant-scoped tables (`tenants`, `locations`, `registers`, `positions`, `employees`, `categories`, `catalog_items`, `stock_balances`, `stock_movements`, `customers`, `customer_groups`, `receipts`, `receipt_items`, `finance_accounts`, `finance_transactions`, `tenant_settings`) filtered by `tenantId`.
  - If a signed-in Clerk user has no `tenants` row yet and has not completed onboarding, return `{ onboardingRequired: true }`.
- Upgrade `lib/pos-store.tsx` / `lib/console-data.ts`:
  - Hydrate from `GET /api/v1/bootstrap` on mount when `DATABASE_URL` is active, merging any un-flushed mutations in `tanawa_pos_queue_${tenantId}` so offline POS sales are never overwritten.
  - Debounce console mutations (500 ms) to `POST /api/v1/state/sync` and display a subtle sync status pill (`Saved` / `Saving...` / `Offline`) in the Management Console header.

### 2.3 Idempotent Demo Seeder (`db/seed.ts`)
- Install `tsx` as a dev dependency if not present and add `"db:seed": "tsx db/seed.ts"` to `package.json`.
- Create `db/seed.ts` to idempotently upsert a demo tenant (`tenant_demo_tanawa`) with a Malaybalay City café/restaurant location, `Register 1`, owner employee (PIN `0000`), starter categories, menu items with recipes, stock balances, and customer groups.

---

## 3. Milestone 2 — Multi-Device Real-Time Kitchen Kit & Station Routing

Enable dedicated kitchen/bar display tablets (`Kitchen Kit`) to stay synchronized across devices and browser tabs in real time.

### 3.1 Kitchen Orders API (`app/api/v1/kitchen/orders/route.ts` & `[ticketId]/route.ts`)
- **`GET /api/v1/kitchen/orders`:**
  - Authenticates via Clerk session or paired `tanawa_register_session` cookie.
  - Returns active kitchen tickets (`status` in `["queued", "preparing", "ready"]`) grouped by station (`Kitchen`, `Bar`, `Bakery`, or custom stations from `Menu -> Stations`).
  - When `DATABASE_URL` is unset, syncs across browser tabs via `BroadcastChannel("tanawa_kitchen_sync")` + `localStorage`.
- **`PATCH /api/v1/kitchen/orders/[ticketId]`:**
  - Advances ticket status (`queued` -> `preparing` -> `ready` -> `served`) and records `startedAt` / `completedAt` timestamps.

### 3.2 Dedicated Kitchen Display Screen (`/pos/kitchen`) & `Kitchen Kit` Upgrade
- Create `app/pos/kitchen/page.tsx` and share its upgraded board component with the `Kitchen Kit` tab inside `app/pos/page.tsx`:
  - **Station Filter Pills:** `All stations` plus dynamic pills for every configured station (`Bar`, `Kitchen`, etc.) with live active ticket count badges.
  - **Order Ticket Cards:** Show order number (`Receipt #12` or `Table 3`), order source badge (`Dine-in`, `Takeout`, `Delivery`), live elapsed timer (turning amber at `> 8 min` and red at `> 15 min`), order comment banner, itemized quantities, and a one-tap status action button (`Start Prep` -> `Mark Ready` -> `Bump / Served`).
  - **New-Ticket Audio Chime:** Play a subtle Web Audio API chime (with a `Mute / Unmute` toggle in the header) whenever a new ticket arrives from any register.
  - **Real-Time Sync:** Poll `GET /api/v1/kitchen/orders` every 5 seconds when online and broadcast local changes immediately via `BroadcastChannel("tanawa_kitchen_sync")`.

---

## 4. Milestone 3 — PayMongo Philippine Digital Payments & SaaS Billing

Use existing environment variables (`PAYMONGO_SECRET_KEY`, `NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY` with fallback to `EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY`, and `PAYMONGO_WEBHOOK_SECRET`).

### 4.1 POS Digital Checkout (`POST /api/v1/payments/paymongo/intent` & `status/[id]`)
- Create `app/api/v1/payments/paymongo/intent/route.ts` and `app/api/v1/payments/paymongo/status/[id]/route.ts`:
  - Supports Philippine payment methods configured in `Settings -> Payment methods`: **`GCash`**, **`Maya`**, **`QR Ph`**, and **`Card`**.
  - When `PAYMONGO_SECRET_KEY` is set: calls PayMongo's Payment Intent / Checkout Session API (`amount` in centavos, `currency: "PHP"`) and returns `{ paymentIntentId, checkoutUrl, qrCodeData, mode: "live" }`.
  - When `PAYMONGO_SECRET_KEY` is unset: returns `{ paymentIntentId, qrCodeData, mode: "sandbox" }`.
- Update the `/pos` **Pay** modal (`app/pos/page.tsx`):
  - `Cash` keeps instant tender & change calculation.
  - `GCash`, `Maya`, `QR Ph`, and `Card` create a PayMongo intent, render the QR code / checkout link and live polling status badge, and provide a **`Simulate Payment Success`** button in test/sandbox mode so cashiers and E2E tests can complete digital payments cleanly.

### 4.2 PayMongo Billing Webhook & Plan Upgrades (`POST /api/webhooks/billing` & `Settings -> Billing`)
- Upgrade `app/api/webhooks/billing/route.ts`:
  - Verify PayMongo's `Paymongo-Signature` header using `PAYMONGO_WEBHOOK_SECRET` (with `BILLING_WEBHOOK_SECRET` fallback for automated tests).
  - On `checkout_session.payment.paid` or `payment.paid`, update `tenants.plan` (`starter`, `pro`, or `enterprise`), extend `trialEndsAt` by 30 days, and record a `Paid` invoice.
- Upgrade `Settings -> Billing` (`app/manage/settings/billing/page.tsx`):
  - Wire **`Upgrade / Subscribe`** buttons on the `Starter (₱1,490/mo)`, `Pro (₱3,795/mo)`, and `Enterprise (₱7,990/mo)` cards to initiate a PayMongo checkout session (or instant sandbox confirmation) and update the active tenant tier immediately.

---

## 5. Milestone 4 — Cloudflare R2 Tenant-Isolated Media Storage

Reuse the configured Cloudflare R2 credentials (`CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_BUCKET_NAME`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `NEXT_PUBLIC_R2_PUBLIC_URL`).

### 5.1 Server-Side Upload Endpoint (`POST /api/v1/uploads`)
- Install `@aws-sdk/client-s3` via `pnpm`.
- Create `lib/r2.ts` configuring `S3Client` (`region: "auto"`, `endpoint: \`https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com\``).
- Create `app/api/v1/uploads/route.ts` accepting `multipart/form-data` (`file` + `folder` in `["products", "logos", "attachments"]`):
  - Resolve `tenantId` via `getServerTenantContext()`.
  - Validate MIME type (`image/jpeg`, `image/png`, `image/webp`) and max file size (`5 MB`).
  - Upload to `pos/${tenantId}/${folder}/${crypto.randomUUID()}-${sanitizedFilename}` in `CLOUDFLARE_R2_BUCKET_NAME` and return `{ url: \`${NEXT_PUBLIC_R2_PUBLIC_URL}/${key}\`, key, mode: "r2" }`.
  - When R2 env vars are absent, return `{ url: dataUrl, key: "local", mode: "local" }` so uploads work offline and in tests without CORS or network dependencies.

### 5.2 Menu Item Photos & Store Logo UI
- **Menu -> Products & Menu -> Dishes:** Add an image upload dropzone/button with preview thumbnail; render uploaded product images on `/pos` item cards (falling back to the existing emoji/color badge when `imageUrl` is empty).
- **Settings -> General:** Add a **Store Logo** uploader (`logoUrl`) and optional **TIN / Business Registration No.** field (`tin`), displaying the store logo in the `/pos` top header and on thermal receipts.

---

## 6. Milestone 5 — 58mm / 80mm Thermal Receipt & Kitchen Ticket Print Engine

Create `components/pos/ThermalReceiptPrint.tsx` and dedicated `@media print` stylesheet rules in `app/globals.css`:

1. **Paper Width Setting (`Settings -> Receipt`):**
   - Add a `Thermal paper width` selector (`58mm` or `80mm`, defaulting to `80mm`) in `app/manage/settings/receipt/page.tsx`.
2. **Dynamic Receipt Template (Driven by `Settings -> Receipt` & `Settings -> General`):**
   - **Header:** Store logo (if `logoUrl` is set), `Company name` or `Business name`, store address (when `Print address` is enabled), TIN line (if set), and `Receipt #` (when `Print receipt number` is enabled).
   - **Order Details:** Timestamp (`Asia/Manila`), cashier name, table/order source, itemized lines (`Qty × Name`, unit price, line discount, subtotal), and order comment (when `Print receipt comments` is enabled).
   - **Philippine VAT & Totals Breakdown:**
     - `VATable Sales`, `VAT Amount (12%)`, `VAT-Exempt Sales`, `Service Charge`, `Discounts`, `TOTAL (₱)`, `Payment Method`, `Amount Tendered`, and `Change`.
   - **Footer:**
     - Customer name, phone, and address (when `Add phone number and address of the customer in receipt` is enabled).
     - Wi-Fi SSID and password box (when `Print Wi-Fi` is enabled).
     - Random active fortune/prediction line (when `Print predictions` is enabled).
3. **One-Click & Auto-Print Triggers:**
   - Wire `Print check`, `Auto-print receipt on order close` (when toggled on in `Settings -> Receipt`), and `Reprint receipt` in `Order history` / `Reports -> Receipts` to render `ThermalReceiptPrint` and call `window.print()`.

---

## 7. Milestone 6 — BIR-Ready VAT Breakdown & Accounting CSV / Print Exports

Create `lib/export-utils.ts` and connect all `Export` and `Print` buttons across the Management Console:

1. **UTF-8 BOM CSV Export Utility (`exportToCsv(filename, headers, rows)`):**
   - Prepends UTF-8 BOM (`\uFEFF`) so Philippine Peso symbols (`₱`) open cleanly in Microsoft Excel and Google Sheets without character corruption.
2. **Connected Report & Ledger Exports:**
   - **`Reports -> Sales` (`app/manage/reports/sales/page.tsx`):** `Export` downloads `tanawa-sales-report-YYYY-MM-DD.csv` (daily revenue, COGS, gross profit, discounts, 12% VAT, receipt count, and payment method totals); `Print` triggers a clean print stylesheet.
   - **`Reports -> Receipts` (`app/manage/reports/receipts/page.tsx`):** `Export` downloads itemized receipt ledger CSV with `Receipt #`, `Opened`, `Closed`, `Waiter`, `Customer`, `VATable Sales`, `12% VAT`, `Discounts`, `Total`, `Profit`, and `Status`.
   - **`Finances -> Transactions` & `Finances -> P&L`:** `Export` downloads ledger transactions and P&L category totals.
   - **`Inventory -> Stock` & `Inventory -> Ingredients movements`:** `Export` downloads current stock valuation (`Quantity`, `Unit`, `Avg Cost`, `Total Value`).

---

## 8. Milestone 7 — Phase 4 Verification & Automated Tests

1. **Preserve All Phase 2 & Phase 3 Tests:**
   - Run `pnpm run test:unit`, `pnpm run test:integration`, and `pnpm run test:e2e` and confirm 100% pass rate with zero regressions.
2. **Add Phase 4 Test Suites:**
   - **`tests/unit/vat-r2-and-exports.test.ts`:**
     - Verify Philippine 12% VAT math (`VATable Sales = total / 1.12`, `VAT = total - VATable Sales`), R2 tenant-scoped key generation (`pos/${tenantId}/...`), thermal receipt conditional sections, and UTF-8 BOM CSV output with `₱` symbols.
   - **`tests/integration/kitchen-and-paymongo.test.tsx`:**
     - Verify sending an order `To Kitchen` creates a station ticket transitioning `queued -> preparing -> ready -> served`.
     - Verify PayMongo sandbox checkout confirmation marks a receipt `Paid` and updates `tenants.plan` via `POST /api/webhooks/billing`.
   - **`tests/e2e/kitchen-and-receipt-print.spec.ts`:**
     - Verify `/pos` -> `To Kitchen` -> `Kitchen Kit` status progression, `Reports -> Receipts` CSV download trigger, and thermal receipt preview rendering.
3. **Final Type Check, Lint, Schema Push & Build:**
   - Run `pnpm exec tsc --noEmit`, `pnpm run lint`, `pnpm run db:push` (when `DATABASE_URL` is configured), and `pnpm run build` and verify zero errors.
