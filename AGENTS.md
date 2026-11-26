# AGENTS.md — AI Coding Agent Guidelines for `tanawastore_POS`

## 1. Project Overview

`tanawastore_POS` is a full-stack **Cloud Management Console & Front-of-House Point of Sale (POS)** application built with **Next.js (App Router)**, modeled directly after the **Poster POS** interface and workflows so existing staff and owners can operate it with zero retraining.

- **Primary Location / Tenant:** `tanawa` (`tanawastore.pos`)
- **Default Currency & Locale:** Philippine Peso (`₱` / `PHP`), Timezone `(+08:00) — Asia/Manila`
- **Reference Document:** Always consult `docs/project-doc.md` for complete data models, module requirements, and business rules before implementing new features.

---

## 2. Tech Stack & Architectural Conventions

- **Framework:** Next.js 15+ (App Router) with React 19 and TypeScript (`strict: true`).
- **Styling:** Tailwind CSS v4, `Inter` (UI) and `JetBrains Mono` (currency, receipt numbers, stock quantities, PINs), and `lucide-react` icons.
- **Database & ORM:** PostgreSQL with Prisma ORM (`prisma/schema.prisma`).
- **State Management:**
  - **Back-Office Console (`/(console)/manage/*`):** Server Components + TanStack Query / Server Actions for paginated tables, filters, and CRUD forms.
  - **Front-of-House POS (`/(pos)/pos/*`):** Zustand store persisted to **IndexedDB (Dexie.js)** so active checks, floor plan states, and offline sales survive browser reloads and network drops.
- **Authentication:** Credentials login for Management Console (`Owner` / `Manager`) + fast **4-digit PIN** switching (`0000` default owner PIN) for Front-of-House POS cashiers and waiters.

---

## 3. Canonical Directory Structure

```text
tanawastore_POS/
├── agent.md                        # AI agent rules & architectural guardrails
├── docs/
│   └── project-doc.md              # Full product, UI/UX, DB schema & roadmap spec
├── prisma/
│   ├── schema.prisma               # PostgreSQL relational schema
│   └── seed.ts                     # Default tanawa seed (Philip Venje Beronio, Borjomi, Capucino, Croissant, 14 stock items)
├── src/
│   ├── app/
│   │   ├── (console)/
│   │   │   └── manage/
│   │   │       ├── layout.tsx      # Top #0077FF banner + 220px collapsible Poster sidebar + Support widget
│   │   │       ├── welcome/        # Get started onboarding
│   │   │       ├── dash/           # Reports (sales, customers, waiters, workshops, category, products, abc, receipts, feedbacks, payments, taxes)
│   │   │       ├── finance/        # Finances (transactions, cashflow, cash_shift, salary, accounts, categories, pnl)
│   │   │       ├── menu/           # Menu (products, dishes, prepack, ingredients, foodcost_control, categories, workshops)
│   │   │       ├── calculations/   # Inventory (stock, supplies, butcheries, transfers, deductions, movements, checks, suppliers, storages, units)
│   │   │       ├── marketing/      # Marketing (clients, groups, loyalty, exclusions, promotions)
│   │   │       ├── access/         # Access (employees, sessions, positions, tablets, locations, integrations)
│   │   │       ├── applications/   # App Marketplace & Postie AI Assistant
│   │   │       └── settings/       # General, Billing, Orders, Delivery, Security, Receipt
│   │   ├── (pos)/
│   │   │   └── pos/
│   │   │       ├── layout.tsx      # Full-screen touch POS shell (Online/Offline indicator + Staff PIN lock)
│   │   │       └── page.tsx        # Split-screen Register, Floor Plan, and Kitchen Kit (KDS)
│   │   ├── qr/[tableId]/           # Customer-facing Poster QR Menu & Guest Feedback page
│   │   └── api/
│   │       ├── pos/checkout/       # Atomic sale closing, recipe stock deduction & finance ledger sync
│   │       ├── pos/sync/           # Idempotent batch sync for offline POS receipts
│   │       └── ai/parse-invoice/   # Postie AI supplier invoice & bank statement parser
│   ├── components/
│   │   ├── console/                # SidebarAccordion, DataTableToolbar, PageHeader, ThermalReceiptModal
│   │   └── pos/                    # OrderReceiptPanel, MenuTileGrid, FloorPlanCanvas, KitchenKitBoard, CheckoutModal
│   ├── lib/
│   │   ├── format.ts               # Currency formatters (suffix "10.00 ₱" vs prefix "₱215.20")
│   │   ├── inventory-engine.ts     # Recursive recipe & preparation BOM stock deduction engine
│   │   └── offline-queue.ts        # IndexedDB offline receipt queue & background sync worker
│   └── store/
│       ├── useConsoleStore.ts      # Theme ('light' | 'dark'), sidebar collapse state, active filters
│       └── usePosStore.ts          # Active open checks, selected table, KDS tickets, network status
```

---

## 4. UI/UX & Poster POS Visual Parity Rules

Agents modifying UI components **must** preserve the visual language familiar to Poster POS users:

1. **Top Subscription Banner:** `32px` sticky full-width bar in `#0077FF` (`Trial period ends on 7 December 2026 year. To avoid blocking the POS, pay for the subscription. Pay`).
2. **Left Sidebar (`220px` expanded / `56px` collapsed):**
   - **Light Theme:** Sidebar `#F7F8FA`, Canvas `#FFFFFF`, Borders `#E5E8EC`, Active Sub-item `#E8EFF7`, Sub-item Links `#1A73E8`, Top-center warm wooden-amber `Poster` square badge + POS monitor icon.
   - **Dark Theme:** Sidebar `#1D2024`, Canvas `#24272C`, Elevated Cards `#2C3036`, Borders `#33373E`, Top-left `T tanawa` badge.
   - Must contain all **9 expandable accordion sections** (`Get started`, `Reports`, `Finances`, `Menu`, `Inventory`, `Marketing`, `Access`, `Applications`, `Settings`) plus the `Open POS` launcher at the bottom.
3. **Action Buttons & Semantic Colors:**
   - Primary Create/Save CTA: `#1DB954` (Poster Green) or `#2274E0` (Access/Modal Blue).
   - ABC-Analysis C-Tier Row Highlight: `#F8E5E5`.
   - Floor Plan Statuses: Vacant (`Neutral/White`), Current Staff Order (`#1A73E8` Blue), Colleague Order (`Violet`).
4. **Currency Formatting:** Use `src/lib/format.ts` exclusively. Never hardcode `$` or `₱` inside JSX components.

---

## 5. Critical Business Logic Guardrails (Do Not Break)

1. **Atomic Checkout (`POST /api/pos/checkout`):**
   - Every completed POS sale **must** execute inside a single `prisma.$transaction`:
     1. Insert `Receipt` and `ReceiptItem` records with unique `idempotencyKey`.
     2. Traverse each sold item's `RecipeIngredient` (and nested `Preparation` sub-recipes) to decrement `StockItem.stock` and insert negative `StockMovement` audit rows.
     3. Credit the corresponding `FinanceAccount` (`Cash drawer for tanawa` for Cash; `Bank account` for Card/e-Wallet) and insert an `Income` row in `FinanceTransaction` under `POS Sales`.
     4. If a `Customer` is attached, increment `overallSum`, `receiptCount`, and payment-method subtotals.
2. **Offline-First POS Execution:**
   - If the network is offline, `usePosStore` must still close the check, print the thermal receipt, decrement optimistic local stock, and enqueue the payload in IndexedDB. When `online` fires, flush queued receipts to `/api/pos/sync` using `idempotencyKey` to prevent duplicate deductions.
3. **Station-Based Kitchen Routing:**
   - Pressing **To Kitchen** in the POS Register groups unsent items by `Station` (`Bar` vs `Kitchen`) and creates separate `KdsTicket` entries so bartenders and line cooks only see their assigned items.
4. **P&L Category Inclusion:**
   - `Finances -> P&L` must respect `FinanceCategory.includeInPnl` (e.g., `Supplies` has `includeInPnl = false` because ingredient costs are recognized via COGS / Stock deductions upon sale, preventing double-counting expenses).

---

## 6. Agent Workflow & Verification Checklist

- Before creating new database fields or routes, check `docs/project-doc.md` to ensure naming aligns with Poster POS terminology (`workshops` = Stations, `prepack` = Preparations, `clients` = Customers).
- Always provide both **Light** and **Dark** theme utility classes (`dark:...` or theme tokens) for any new console view.
- Run `npx tsc --noEmit` and `npm run lint` after every structural edit to guarantee zero type or lint regressions.

## 7. Phase 3 Notes (Multi-Tenant / Clerk / Offline Sync)

- Tenants resolve via `lib/tenant.ts` (`orgId ?? personal_<userId>`); all `localStorage` keys are namespaced per tenant (`lib/tenant-keys.ts`). Phase 2 e2e specs must look up `tanawa_pos_state_*` keys dynamically instead of the legacy `tanawastore_pos_v1`.
- `proxy.ts` wraps `clerkMiddleware` and skips Clerk's second internal-rewrite pass (Next.js 16.4.6 middleware-loop workaround — do not remove).
- E2E/perf suites need `E2E_TEST_MODE=1` (see `docs/runtest.md`); it disables `auth.protect()` and must never be set in production.
