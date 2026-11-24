# Phase 01 Execution Blueprint — Direct HTML-to-Next.js Port (`tanawastore_POS`)

> **AGENT EXECUTION DIRECTIVE:**
> When instructed to build `docs/scope/phase01.md`, execute **Steps 1 through 7** below autonomously in this existing repository (`tanawastore_pos`).
>
> - **Source of Truth:** `./poster_pos_management_console_terminal (2).html`, `./AGENTS.md`, and `./docs/project-doc.md`.
> - **Workspace Layout:** Root-level `app/`, `components/`, `lib/`, and `public/` (do **NOT** create a `src/` folder, do **NOT** run `create-next-app`, and do **NOT** install Prisma/databases in Phase 01).
> - **Persistence:** Use a shared client-side React Context / Zustand store synced to `localStorage` so all POS sales, stock deductions, supply restocks, finance transactions, and menu edits update live across all routes.

---

## Step 1 — Dependencies, Fonts & Global Styles

1. Check `package.json` and install `lucide-react` (and `zustand` if helpful) if not already installed:
   ```bash
   npm install lucide-react
   ```
2. Update `app/layout.tsx`:
   - Load `Inter` (`--font-sans`) and `JetBrains_Mono` (`--font-mono`) via `next/font/google`.
   - Set `<title>Poster POS – Management Console (tanawa.joinposter.com) & POS Terminal</title>`.
   - Wrap `{children}` in `<PosStoreProvider>` (created in Step 3).
3. Update `app/globals.css`:
   - Remove any reliance on `<script src="https://cdn.tailwindcss.com">` from the HTML file.
   - Port custom scrollbar rules, `.thermal-receipt` serrated edge styling, and print media queries (`@media print`) from `poster_pos_management_console_terminal (2).html` into `app/globals.css`.

---

## Step 2 — Extract Helpers & Seed Data (`lib/format.ts` & `lib/console-data.ts`)

Inspect `poster_pos_management_console_terminal (2).html` and port all pure formatting utilities and initial `state` seed data into `lib/`:

1. **`lib/format.ts`:**
   - Export `formatMoney(value: number, symbol?: string): string` (suffix format: `"10.00 ₱"`).
   - Export `formatMoneyPrefix(value: number, symbol?: string): string` (prefix format: `"₱215.20"`).
   - Export `formatQty(value: number, unit?: string): string` and date/time formatting helpers matching the HTML prototype.
2. **`lib/console-data.ts`:**
   - Define strict TypeScript interfaces for `LocationSettings`, `Employee`, `Station`, `MenuCategory`, `MenuItem`, `PreparationItem`, `StockItem`, `RecipeIngredient`, `Customer`, `Receipt`, `ReceiptItem`, `FinanceAccount`, `FinanceCategory`, `FinanceTransaction`, `StockMovement`, `GuestFeedback`, `PosOrderTab`, and `KdsTicket`.
   - Export `INITIAL_CONSOLE_STATE` containing the exact default records from `poster_pos_management_console_terminal (2).html`:
     - **Location:** `companyName: "tanawa"`, `subdomain: "tanawa.joinposter.com"`, `currencySymbol: "₱"`, `timezone: "(+08:00) — Asia/Manila"`, `vatRate: 0.12`.
     - **Owner / Staff:** `Philip Venje Beronio` (`pin: "0000"`, `phone: "00639758868962"`, `email: "2201107938@student.buksu.edu.ph"`, `position: "Owner"`), plus any seeded staff in the HTML file.
     - **Menu Items & Recipes:** `Borjomi 0.5l` (`10.00 ₱`), `Capucino 250ml` (`120.00 ₱`), `Croissant with chocolate` (`95.00 ₱`), preparations (`Pastry for croissants`), categories (`Cold drinks`, `Coffee`, `Bakery`), and stations (`Bar`, `Kitchen`).
     - **Inventory Stock (14 items totaling `₱215.20`):** `Borjomi 0.5l`, `Coffee`, `Coffee stirrer`, `Cover 250ml`, `Dark chocolate`, `Egg`, `Flour`, `Milk`, `Oil`, `Paper cup 250ml`, `Salt`, `Sugar`, `Water`, `Yeast`.
     - **Finances:** 3 Accounts (`Bank account`, `Cash drawer for tanawa`, `Safe deposit`), 13 Categories (`Adjustment` through `Tips` with `displayOnPos` & `includeInPnl` flags), and sample/initial transactions & cash flow figures.

---

## Step 3 — Unified Reactive State Provider (`lib/pos-store.tsx`)

Create `lib/pos-store.tsx` exporting `<PosStoreProvider>` and `usePosStore()` with `localStorage` persistence (`key: "tanawastore_pos_v1"`) and a `"Reset Demo Data"` helper. Port every state mutation function from `poster_pos_management_console_terminal (2).html`:

- **UI & Theme Actions:** `toggleTheme()` (`'light'` `#F7F8FA` / `'dark'` `#1D2024`), `toggleSidebar()`, `setActiveEmployee(id)`, `lockPosTerminal()`, `unlockPosWithPin(pin)`.
- **POS Register & KDS Actions:**
  - `createOrderTab(tableName?)`, `selectOrderTab(tabId)`, `closeOrderTab(tabId)`, `assignTableToOrder(tabId, tableName)`, `attachCustomerToOrder(tabId, customerId)`, `setOrderDiscount(tabId, pct)`.
  - `addItemToOrder(menuItemId)`, `updateOrderItemQty(menuItemId, delta)`.
  - `sendOrderToKitchen(tabId)` — groups unsent items by `Station` (`Bar` / `Kitchen`) and creates `KdsTicket` entries; `bumpKdsTicket(ticketId)`.
  - `completePosSale(tabId, paymentMethod, amountTendered)` — atomically:
    1. Creates a numbered `Receipt` (`#1001+`) with subtotal, discount, 12% VAT, profit, and total.
    2. Deducts recipe ingredients (and nested preparations) from `StockItem.stock` and appends negative `StockMovement` logs.
    3. Credits `Cash drawer for tanawa` (for Cash) or `Bank account` (for Card/e-Wallet) and appends an `Income` entry to `FinanceTransaction` under `POS Sales`.
    4. Updates attached `Customer` spend & receipt count.
- **Back-Office CRUD Actions:**
  - `createMenuItem(...)`, `deleteMenuItem(id)`, `createSupply(...)` (increments stock, updates unit cost, logs expense transaction), `createStockDeduction(...)`, `createFinanceTx(...)`, `toggleFinanceCategoryFlag(id, 'displayOnPos' | 'includeInPnl')`, `createCustomer(...)`, `createEmployee(...)`, `updateSettings(...)`, `submitGuestFeedback(...)`, and `runPostieAiImport(...)`.

---

## Step 4 — Management Console Shell (`components/console/*` & `app/manage/layout.tsx`)

1. **`app/page.tsx`:** Redirect `/` immediately to `/manage/welcome` via `redirect('/manage/welcome')`.
2. **`components/console/TopTrialBanner.tsx`:**
   - Sticky `32px` `#0077FF` bar (`Trial period ends on 7 December 2026 year. To avoid blocking the POS, pay for the subscription. Pay`) with interactive `Mini / Business / Pro` subscription modal.
3. **`components/console/Sidebar.tsx`:**
   - Collapsible `220px` / `56px` sidebar matching Light (`#F7F8FA` / `#E8EFF7`) and Dark (`#1D2024` / `#24272C`) tokens from `poster_pos_management_console_terminal (2).html`.
   - Top brand header (`Poster` amber square in Light Mode / `T tanawa` badge in Dark Mode) + quick monitor button linking to `/pos`.
   - All **9 expandable accordion sections** (`Get started`, `Reports`, `Finances`, `Menu`, `Inventory`, `Marketing`, `Access`, `Applications`, `Settings`) + `Open POS` link (`/pos`).
   - Bottom profile switcher (`Philip Venje Beronio`) + Light/Dark theme toggle button.
4. **`components/console/SupportWidget.tsx`:**
   - Floating bottom-right `#4A5BD6` Poster Support & Postie AI chat drawer.
5. **`components/console/Modals.tsx`:**
   - Reusable modals ported from the HTML file: Serrated **Thermal Receipt Modal** (with `window.print()`), **Add Menu Item Modal**, **Add Supply Modal**, **Add Finance Transaction Modal**, and **Postie AI Import Modal**.
6. **`app/manage/layout.tsx`:**
   - Renders `TopTrialBanner`, `Sidebar`, mobile header drawer, main content container, `SupportWidget`, and active modals.

---

## Step 5 — Port All 9 Management Console Modules (`app/manage/**`)

Port every view renderer from `poster_pos_management_console_terminal (2).html` into Next.js App Router pages (using `lucide-react` icons instead of `<i data-lucide="...">`):

1. **`app/manage/welcome/page.tsx`:** Onboarding progress cards (`Create a menu item`, `Try to make a sale`, `View sales reports`), QR Menu preview trigger, and Install POS info.
2. **`app/manage/dash/[slug]/page.tsx`:** Handles all **11 Reports** sub-routes (`sales`, `customers`, `waiters`, `workshops`, `category`, `products`, `abc` with `#F8E5E5` C-tier row highlights, `receipts` with clickable `#1001` thermal receipt modal & sticky totals footer, `feedbacks`, `payments`, `taxes`). Include fallback redirect from `/manage/dash` to `/manage/dash/sales`.
3. **`app/manage/finance/[slug]/page.tsx`:** Handles all **7 Finances** sub-routes (`transactions` with `Import with AI ✨` & `+ Add`, `cashflow` monthly matrix, `cash_shift`, `salary`, `accounts`, `categories` with live `Display on POS` & `Include in P&L` toggles, `pnl` interactive statement).
4. **`app/manage/menu/[slug]/page.tsx`:** Handles all **8 Menu** sub-routes (`products`, `dishes`, `prepack`, `ingredients`, `foodcost_control` with `New` badge, `categories_products`, `categories_ingredients`, `workshops`).
5. **`app/manage/calculations/[slug]/page.tsx`:** Handles all **10 Inventory** sub-routes (`stock` showing `₱215.20` valuation, `supplies`, `butcheries`, `transfers`, `deductions`, `movements`, `checks`, `suppliers`, `storages`, `units`).
6. **`app/manage/marketing/[slug]/page.tsx`:** Handles `clients`, `groups`, `loyalty`, `exclusions`, `promotions`.
7. **`app/manage/access/[slug]/page.tsx`:** Handles `employees`, `sessions`, `positions`, `tablets`, `locations`, `integrations`.
8. **`app/manage/applications/[[...slug]]/page.tsx`:** App Marketplace cards (`Postie AI`, `QR Menu`, `Kitchen Kit`, `Website for Orders`, `P&L Report`, `Analytics for Owner`) + interactive Postie AI Assistant view.
9. **`app/manage/settings/[slug]/page.tsx`:** Handles `general`, `billing`, `orders`, `delivery`, `security`, `receipt` wired directly to `LocationSettings` in `usePosStore`.

---

## Step 6 — Front-of-House POS Terminal & Kitchen Kit (`app/pos/page.tsx`)

Port the full-screen POS Terminal from `poster_pos_management_console_terminal (2).html` into `app/pos/page.tsx` (with modular subcomponents in `components/pos/`):

1. **Staff PIN Lock Overlay:** 4-digit keypad (`0000` default for `Philip Venje Beronio`) + quick cashier/waiter switcher.
2. **Top POS Bar:** Mode tabs (**Register**, **Floor Plan**, **Kitchen Kit** with live pending badge), active staff badge, Lock Screen button, and **Back to Console (`/manage/welcome`)** link.
3. **Register View:**
   - Left Receipt Panel: Multi-check tabs (`Table 1 #1001`, `+ New`), Table selector, Customer loyalty selector, Discount buttons (`0%`, `10%`, `20%`), line-item `+/-` controls, **To Kitchen** button (with unsent count badge), and **Pay (`₱...`)** button.
   - Right Menu Grid: Category filter pills (`All`, `Coffee`, `Bakery`, `Cold drinks`), search input, and touch product/dish tiles.
4. **Floor Plan View:** Interactive table cards (`Table 1–6`, `Patio 1–2`) color-coded by Vacant, Current Staff Order (`#1A73E8` Blue), or Colleague Order (Violet); clicking a table opens or resumes its check in Register view.
5. **Kitchen Kit (KDS) View:** Live `Bar` and `Kitchen` station ticket columns with elapsed time and **Bump / Ready** action.
6. **Checkout & Thermal Receipt Flow:** Supports **Cash** (with `Exact`, `₱100`, `₱500`, `₱1000` quick buttons & change calculation), **By card**, and **e-Wallet**, opening the printable serrated Thermal Receipt modal upon completion.

---

## Step 7 — Verification & Cleanup

1. Run TypeScript, ESLint, and production build checks and fix any issues until all three succeed with zero errors:
   ```bash
   npx tsc --noEmit
   npm run lint
   npm run build
   ```
2. Leave `poster_pos_management_console_terminal (2).html` untouched as reference until verified.
