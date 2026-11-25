Create `docs/scope/phase02.md` and implement **Phase 2: Quality Assurance & Testing** for `tanawastore_POS` covering **Unit Testing**, **Integration Testing**, **End-to-End Testing**, and **Performance Testing**:

### 1. Tooling & `package.json` Scripts
- Install and configure **Vitest** + **React Testing Library** (`jsdom`) for unit/integration tests and **Playwright** for browser E2E and performance benchmarks.
- Add npm scripts in `package.json`:
  - `"test:unit": "vitest run tests/unit"`
  - `"test:integration": "vitest run tests/integration"`
  - `"test:e2e": "playwright test tests/e2e"`
  - `"test:perf": "playwright test tests/performance"`
  - `"test:all": "npm run test:unit && npm run test:integration && npm run test:e2e && npm run test:perf"`

---

### 2. Unit Testing (`tests/unit/`)
Test pure business logic, pricing formulas, inventory math, and state reducers in `lib/console-data.ts`:
- **`pos-calculations.test.ts`:**
  - Verify line-item subtotals, partial servings (`0.5`, `1.25`), `Round the order price` (floor to integer), `Service charge fee` (`5%`, `10%`), and VAT breakdown.
  - Verify customer group discount %, loyalty cash-back redemption cap (`Maximum %`), registration bonus crediting, and automatic group transition thresholds when `Overall sum` crosses configured limits.
  - Verify `Marketing -> Exclusions` enforcement: excluded products and categories bypass group discounts and bonus redemptions while remaining eligible for active `Promotions`.
- **`inventory-math.test.ts`:**
  - Verify `Ordering units` pack-to-base conversion (`packs × packQuantity`), weighted average cost updates on new `Supplies`, recipe ingredient deduction on dish sales, `Inventory check` discrepancy (`(actual - expected) × cost`), and `Transfers` / `Stock deductions` balance updates.
- **`reports-and-payroll.test.ts`:**
  - Verify `Reports -> Sales` KPI formulas (`revenue`, `profit = revenue - COGS`, `average receipt`, `By Hour` / `By Day` grouping), `Reports -> Receipts` summary bar totals (`Net revenue`, `Discounts`, `Gross profits`), and `Finances -> Payroll` (`Per hour`, `Per shift`, `Per month` + category sales commission %).

---

### 3. Integration Testing (`tests/integration/`)
Test cross-module state synchronization (`localStorage` persistence + React context updates) between `/pos` and `/manage/*`:
- **`checkout-sync.test.tsx`:**
  - Simulate closing a paid order on `/pos` and assert that:
    1. `Inventory -> Stock` decreases by exact recipe/product quantities and `Ingredients movements` logs the deduction.
    2. `Finances -> Transactions` and the location's `Cash account` / `Bank account` reflect the payment.
    3. `Reports -> Sales` and `Reports -> Receipts` update live counts, revenue, and profit.
    4. Issuing a refund in `Order History` / `Reports -> Receipts` restores stock and logs a refund transaction.
- **`settings-to-pos-sync.test.tsx`:**
  - Toggle `Show floor plan`, `Order sources`, `Order payment methods`, `Delivery areas`, `Security` rules (`Require admin password`), and `Receipt` settings (`Print receipt comments`, `Print predictions`), and assert `/pos` immediately updates its UI controls, security prompts, and receipt output.

---

### 4. End-to-End Testing (`tests/e2e/`)
Write Playwright browser flows verifying complete user journeys end-to-end:
- **`pos-order-lifecycle.spec.ts`:**
  - Lock `/pos` -> unlock via PIN keypad (`0000`) -> create `Receipt #1` and `+ New` `Receipt #2` (verifying unique tabs and zero console errors) -> search/create customer in the `Customer` tab and click `Apply` -> add items -> send `To Kitchen` -> verify ticket appears in `Kitchen Kit` -> complete payment -> verify receipt in `Order history` and `/manage/dash/receipts`.
- **`inventory-and-menu-flow.spec.ts`:**
  - Create an `Ordering unit` -> record a `Supply` using that pack unit -> run an `Inventory check` with a stock shortage -> confirm `Stock` balances and `Ingredients movements` reflect both transactions accurately.
- **`security-and-access.spec.ts`:**
  - Enable `Require admin password when deleting an item -> After a check is printed` in `Settings -> Security` -> print a check on `/pos` -> attempt to remove an item or `Clear order` -> verify the admin password modal blocks deletion on a wrong password and succeeds when the configured password is entered.

---

### 5. Performance Testing (`tests/performance/`)
Create a synthetic dataset seeder (`tests/performance/seed-large-store.ts`) that populates `localStorage` with **1,000 receipts**, **500 stock/movement entries**, **300 customers**, and **200 menu products**, then measure and assert thresholds in Playwright (`pos-and-reports.perf.spec.ts`):
- **Terminal Responsiveness (`/pos`):**
  - Adding items to an order, switching between `Receipt` / `Customer` / `Kitchen Kit`, and opening `Order history` must complete in **under 100 ms** per interaction with zero frame drops.
  - Rapidly creating 20 consecutive receipts and adding 50 line items must execute cleanly with zero duplicate-key warnings or state corruption.
- **Console Report Aggregation (`/manage/dash/stat`, `/manage/dash/receipts`, `/manage/inventory/stock`):**
  - Initial render and date/search filtering across 1,000 seeded receipts must complete in **under 300 ms** from input change to painted table update.
  - Output a clean console benchmark summary table (`Metric`, `Measured (ms)`, `Threshold (ms)`, `Status`) at the end of `npm run test:perf`.
