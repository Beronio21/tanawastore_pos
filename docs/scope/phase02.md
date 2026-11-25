# Phase 02 Execution Blueprint — Quality Assurance & Testing (`tanawastore_POS`)

> **AGENT EXECUTION DIRECTIVE:**
> When instructed to build `docs/scope/phase02.md`, execute the steps below in this existing repository (`tanawastore_pos`).
>
> - **Source of Truth:** `./AGENTS.md`, `./docs/project-doc.md`, `./docs/scope/phase-01.md`, and the Phase 01 implementation under `app/`, `components/`, and `lib/`.
> - **Workspace Layout:** Root-level `app/`, `components/`, `lib/`, `tests/`, `playwright.config.ts`, and `vitest.config.ts` (do **NOT** create a `src/` folder, do **NOT** introduce a second test runner, and do **NOT** mock the database — Phase 01 persists all state client-side to `localStorage`).
> - **Testing Philosophy:** Phase 01 state lives in a single `PosStoreProvider` context hydrated from `localStorage` (`key: "tanawastore_pos_v1"`). All tests — unit, integration, E2E, and performance — must exercise **that real store**, never a parallel mock, so a passing suite proves the shipped app behavior.

---

## Step 1 — Tooling & `package.json` Scripts

1. Install the test toolchain (already present in `package.json`):
   ```bash
   npm install -D vitest @vitejs/plugin-react jsdom \
     @testing-library/react @testing-library/dom @testing-library/jest-dom \
     @testing-library/user-event @playwright/test
   ```
2. **`vitest.config.ts`** — jsdom environment, React plugin, `@` path alias to repo root, `setupFiles: ["./tests/setup.ts"]`, includes `tests/unit/**` and `tests/integration/**`.
3. **`playwright.config.ts`** — `testDir: "./tests"`, single `chromium` project, `workers: 1`, `fullyParallel: false`, `baseURL: http://127.0.0.1:3000`, and a `webServer` block that auto-starts `npm run dev` (reusing an already-running server).
4. **`tests/setup.ts`** — registers `@testing-library/jest-dom` matchers and polyfills `matchMedia` / pointer APIs needed by jsdom.
5. **`package.json` scripts:**
   ```json
   "test:unit":        "vitest run tests/unit",
   "test:integration": "vitest run tests/integration",
   "test:e2e":         "playwright test tests/e2e",
   "test:perf":        "playwright test tests/performance",
   "test:all":         "npm run test:unit && npm run test:integration && npm run test:e2e && npm run test:perf"
   ```

---

## Step 2 — Unit Testing (`tests/unit/`)

Pure-function coverage over `lib/console-data.ts` and `lib/business-math.ts` — no React, no DOM:

### `tests/unit/pos-calculations.test.ts`
- Line-item subtotals and **partial servings** (`0.5`, `1.25`) via `calcOrderTotals`.
- 12% **VAT breakdown** on the discounted subtotal.
- **`Round the order price`** (`settings.roundOrderPrice`) flooring `total` to an integer.
- **`Service charge fee`** at `5%` and `10%`.
- **Customer group discount %** via `customerGroupDiscountRate`.
- **Loyalty cash-back redemption cap** via `maxCashBack` (`Maximum %` of order total, never exceeding balance, never negative).
- **Registration bonus** credited verbatim from `loyaltySettings.registrationBonus`.
- **Automatic group transition** via `resolveLoyaltyGroup` — highest qualifying group once `overallSum` crosses configured thresholds.
- **`Marketing -> Exclusions`** enforcement via `getExcludedMenuItemIds` + `calcOrderTotals`: excluded products/categories bypass group discounts and bonus redemptions (`cashBackEligibleTotal = 0` for fully-excluded orders) while remaining eligible for active `Promotions`.

### `tests/unit/inventory-math.test.ts`
- **Ordering units** pack-to-base conversion (`packs × packQuantity`).
- **Weighted average cost** update when a `Supply` restocks an existing `StockItem`.
- **Recipe ingredient deduction** on dish sale, including nested `Preparation` sub-recipes.
- **Inventory check** discrepancy `(actual - expected) × cost`.
- **Transfers** and **Stock deductions** balance updates and movement logging.

### `tests/unit/reports-and-payroll.test.ts`
- `Reports -> Sales` KPI formulas: `revenue`, `profit = revenue - COGS`, `average receipt`, `By Hour` / `By Day` grouping.
- `Reports -> Receipts` summary bar totals: `Net revenue`, `Discounts`, `Gross profits`.
- `Finances -> Payroll`: `Per hour`, `Per shift`, `Per month` + category sales commission %.

---

## Step 3 — Integration Testing (`tests/integration/`)

React Testing Library + jsdom tests that mount the **real** `PosStoreProvider` and console views, proving cross-module synchronization through `localStorage` persistence and context updates.

### `tests/integration/checkout-sync.test.tsx`
Simulates closing a paid order on `/pos` and asserts:
1. `Inventory -> Stock` decreases by exact recipe/product quantities and `Ingredients movements` logs the deduction.
2. `Finances -> Transactions` and the location's `Cash account` / `Bank account` reflect the payment.
3. `Reports -> Sales` and `Reports -> Receipts` update live counts, revenue, and profit.
4. Issuing a refund restores stock and logs a refund transaction.

### `tests/integration/settings-to-pos-sync.test.tsx`
Toggles `Show floor plan`, `Order sources`, `Order payment methods`, `Delivery areas`, and `Security` rules (`Require admin password`) in `Settings`, then asserts `/pos` immediately updates its UI controls, security prompts, and receipt output — including `Print receipt comments` and `Print predictions` behavior in both states.

---

## Step 4 — End-to-End Testing (`tests/e2e/`)

Playwright browser flows against the dev server. Tests wait on `document.documentElement.dataset.storeHydrated === "true"` so assertions never race the `localStorage` hydration.

### `tests/e2e/pos-order-lifecycle.spec.ts`
Full cashier journey: `/manage/settings/security` → `/pos` → **Lock** → PIN keypad `0000` unlock → `Receipt #1` + `+ New` `Receipt #2` (unique tabs, zero console errors) → `Customer` tab create + apply → add items → `To Kitchen` → verify ticket in `Kitchen Kit` → cash payment → verify sale in POS `Order history` and `/manage/reports/receipts`. Captures all `console.error` / `pageerror` events and asserts none occurred.

### `tests/e2e/inventory-and-menu-flow.spec.ts`
Management journey: create an `Ordering unit` → record a `Supply` using that pack unit → run an `Inventory check` with a stock shortage → confirm `Stock` balances and `Ingredients movements` reflect both transactions.

### `tests/e2e/security-and-access.spec.ts`
Enable `Require admin password when deleting an item -> After a check is printed` in `Settings -> Security` → print a check on `/pos` → attempt item removal / `Clear order` → verify the admin-password modal blocks a wrong password and succeeds with the configured password.

---

## Step 5 — Performance Testing (`tests/performance/`)

### `tests/performance/seed-large-store.ts`
Deterministic synthetic dataset injected via `page.addInitScript` into `localStorage["tanawastore_pos_v1"]` before app boot:
- **1,000** closed receipts spread over the last 30 days (`receiptNum` 1–1000, mixed Cash/Card)
- **500** stock movement rows (supply deliveries + receipt deductions)
- **300** customers, **200** menu products, **286** additional stock items (~300 total)
- One pre-open POS order (`Receipt #1001`) with 3 line items so the register renders populated

### `tests/performance/pos-and-reports.perf.spec.ts`
Measures real interactions with `performance.now()` sampled across two `requestAnimationFrame` frames:

- **Terminal responsiveness (`/pos`) — threshold 100 ms per interaction:**
  - Add item, `Receipt ↔ Customer` tab switches, `Kitchen Kit` switch, open `Order history`.
  - Rapid-fire stress: 20 consecutive receipts × ~2–3 line items each (21 unique receipt tabs) with zero duplicate-key warnings and zero console errors.
- **Console report aggregation — threshold 300 ms input→paint:**
  - Initial render and date/search filtering on `/manage/dash/stat` (alias → Sales Report), `/manage/reports/receipts`, `/manage/inventory/stock` across the 1,000-receipt dataset.
- **Benchmark summary:** `test.afterAll` prints a `console.table` with columns `Metric | Measured (ms) | Threshold (ms) | Status` at the end of `npm run test:perf`.

---

## Step 6 — Verification Checklist

```bash
npx tsc --noEmit
npm run lint
npm run test:unit          # 29 tests — vitest
npm run test:integration   # 10 tests — vitest + RTL
npm run test:e2e           # playwright tests/e2e (auto-starts dev server)
npm run test:perf          # playwright tests/performance
npm run test:all           # full suite
```

Every suite must pass with **zero console errors, zero duplicate-key warnings, and zero type/lint regressions** before Phase 02 is considered complete.
