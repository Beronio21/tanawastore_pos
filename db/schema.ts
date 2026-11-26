/**
 * Phase 3 multi-tenant PostgreSQL schema (Drizzle ORM).
 *
 * Every tenant-owned table carries `tenantId` and is indexed on it. The
 * application falls back to tenant-namespaced localStorage when
 * `DATABASE_URL` is unset, so this schema is only exercised when a database
 * connection is configured.
 */
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export type TenantPlan = "starter" | "pro" | "enterprise";

export type TenantSettingsPayload = Record<string, unknown>;

export type CategoryType = "product" | "ingredient";
export type CatalogItemType = "product" | "dish" | "preparation" | "ingredient";
export type StockMovementType =
  | "supply"
  | "sale_deduction"
  | "refund_restore"
  | "write_off"
  | "transfer"
  | "inventory_check";
export type FinanceAccountType = "cash" | "bank" | "safe";
export type FinanceTransactionType = "income" | "expense" | "transfer";
export type ReceiptStatus = "open" | "closed" | "refunded";

export const tenants = pgTable(
  "tenants",
  {
    id: text("id").primaryKey(),
    clerkOrgId: text("clerk_org_id"),
    ownerUserId: text("owner_user_id"),
    name: text("name").notNull(),
    businessType: text("business_type").notNull().default("cafe"),
    currency: text("currency").notNull().default("PHP"),
    timezone: text("timezone").notNull().default("(+08:00) — Asia/Manila"),
    onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
    plan: text("plan").$type<TenantPlan>().notNull().default("pro"),
    trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("tenants_clerk_org_idx").on(table.clerkOrgId)],
);

export const locations = pgTable(
  "locations",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    name: text("name").notNull(),
    address: text("address").notNull().default(""),
    registerLogin: text("register_login"),
    workingTimeStart: text("working_time_start").notNull().default("10:00"),
    workingTimeEnd: text("working_time_end").notNull().default("23:00"),
    is247: boolean("is_247").notNull().default(false),
    bankAccountId: text("bank_account_id"),
    cashAccountId: text("cash_account_id"),
    safeAccountId: text("safe_account_id"),
    storageLocationIds: jsonb("storage_location_ids").$type<string[]>().notNull().default([]),
  },
  (table) => [index("locations_tenant_idx").on(table.tenantId)],
);

export const registers = pgTable(
  "registers",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    locationId: text("location_id").notNull(),
    title: text("title").notNull(),
    type: text("type").notNull().default("Standard"),
    login: text("login").notNull(),
    passwordHash: text("password_hash").notNull(),
    deviceTokenHash: text("device_token_hash"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("registers_login_idx").on(table.login),
    index("registers_tenant_idx").on(table.tenantId),
  ],
);

export const positions = pgTable(
  "positions",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    title: text("title").notNull(),
    permissions: jsonb("permissions").$type<Record<string, boolean>>().notNull().default({}),
  },
  (table) => [index("positions_tenant_idx").on(table.tenantId)],
);

export const employees = pgTable(
  "employees",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    clerkUserId: text("clerk_user_id"),
    name: text("name").notNull(),
    pin: text("pin").notNull().default("0000"),
    positionId: text("position_id"),
    hourlyRate: numeric("hourly_rate", { precision: 12, scale: 2 }),
    shiftRate: numeric("shift_rate", { precision: 12, scale: 2 }),
    monthlySalary: numeric("monthly_salary", { precision: 12, scale: 2 }),
    commissionRules: jsonb("commission_rules").$type<Record<string, unknown>>().notNull().default({}),
  },
  (table) => [index("employees_tenant_idx").on(table.tenantId)],
);

export const categories = pgTable(
  "categories",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    type: text("type").$type<CategoryType>().notNull().default("product"),
    name: text("name").notNull(),
    parentId: text("parent_id"),
  },
  (table) => [index("categories_tenant_idx").on(table.tenantId)],
);

export const catalogItems = pgTable(
  "catalog_items",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    itemType: text("item_type").$type<CatalogItemType>().notNull().default("product"),
    categoryId: text("category_id"),
    stationId: text("station_id"),
    name: text("name").notNull(),
    sku: text("sku"),
    barcode: text("barcode"),
    unit: text("unit").notNull().default("pcs"),
    price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
    cost: numeric("cost", { precision: 12, scale: 2 }).notNull().default("0"),
    recipe: jsonb("recipe").$type<Record<string, unknown>[]>().notNull().default([]),
    trackStock: boolean("track_stock").notNull().default(false),
  },
  (table) => [index("catalog_items_tenant_idx").on(table.tenantId)],
);

export const stockBalances = pgTable(
  "stock_balances",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    storageId: text("storage_id").notNull(),
    itemId: text("item_id").notNull(),
    quantity: numeric("quantity", { precision: 14, scale: 4 }).notNull().default("0"),
    avgCost: numeric("avg_cost", { precision: 14, scale: 4 }).notNull().default("0"),
    minLimit: numeric("min_limit", { precision: 14, scale: 4 }).notNull().default("0"),
  },
  (table) => [index("stock_balances_tenant_idx").on(table.tenantId)],
);

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    storageId: text("storage_id"),
    itemId: text("item_id").notNull(),
    movementType: text("movement_type").$type<StockMovementType>().notNull(),
    quantityDelta: numeric("quantity_delta", { precision: 14, scale: 4 }).notNull(),
    unitCost: numeric("unit_cost", { precision: 14, scale: 4 }).notNull().default("0"),
    referenceId: text("reference_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("stock_movements_tenant_idx").on(table.tenantId)],
);

export const customerGroups = pgTable(
  "customer_groups",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    name: text("name").notNull(),
    discountPercent: numeric("discount_percent", { precision: 6, scale: 2 }).notNull().default("0"),
    cashbackPercent: numeric("cashback_percent", { precision: 6, scale: 2 }).notNull().default("0"),
    thresholdAmount: numeric("threshold_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  },
  (table) => [index("customer_groups_tenant_idx").on(table.tenantId)],
);

export const customers = pgTable(
  "customers",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),
    gender: text("gender"),
    groupId: text("group_id"),
    bonusBalance: numeric("bonus_balance", { precision: 12, scale: 2 }).notNull().default("0"),
    totalSpent: numeric("total_spent", { precision: 14, scale: 2 }).notNull().default("0"),
  },
  (table) => [index("customers_tenant_idx").on(table.tenantId)],
);

export const receipts = pgTable(
  "receipts",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    locationId: text("location_id"),
    registerId: text("register_id"),
    receiptNumber: integer("receipt_number").notNull(),
    clientMutationId: text("client_mutation_id"),
    status: text("status").$type<ReceiptStatus>().notNull().default("closed"),
    orderSource: text("order_source"),
    tableLabel: text("table_label"),
    customerId: text("customer_id"),
    employeeId: text("employee_id"),
    subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull().default("0"),
    discountTotal: numeric("discount_total", { precision: 14, scale: 2 }).notNull().default("0"),
    serviceCharge: numeric("service_charge", { precision: 14, scale: 2 }).notNull().default("0"),
    taxTotal: numeric("tax_total", { precision: 14, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),
    profit: numeric("profit", { precision: 14, scale: 2 }).notNull().default("0"),
    paymentMethod: text("payment_method"),
    comment: text("comment"),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
  },
  (table) => [
    index("receipts_tenant_idx").on(table.tenantId),
    uniqueIndex("receipts_tenant_mutation_idx").on(table.tenantId, table.clientMutationId),
  ],
);

export const receiptItems = pgTable(
  "receipt_items",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    receiptId: text("receipt_id").notNull(),
    itemId: text("item_id"),
    name: text("name").notNull(),
    quantity: numeric("quantity", { precision: 14, scale: 4 }).notNull().default("1"),
    unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull().default("0"),
    unitCost: numeric("unit_cost", { precision: 14, scale: 2 }).notNull().default("0"),
    discountAmount: numeric("discount_amount", { precision: 14, scale: 2 }).notNull().default("0"),
    subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull().default("0"),
  },
  (table) => [index("receipt_items_tenant_idx").on(table.tenantId)],
);

export const financeAccounts = pgTable(
  "finance_accounts",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    name: text("name").notNull(),
    type: text("type").$type<FinanceAccountType>().notNull().default("cash"),
    balance: numeric("balance", { precision: 14, scale: 2 }).notNull().default("0"),
  },
  (table) => [index("finance_accounts_tenant_idx").on(table.tenantId)],
);

export const financeTransactions = pgTable(
  "finance_transactions",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    accountId: text("account_id").notNull(),
    type: text("type").$type<FinanceTransactionType>().notNull(),
    category: text("category").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull().default("0"),
    description: text("description"),
    receiptId: text("receipt_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("finance_transactions_tenant_idx").on(table.tenantId)],
);

export const tenantSettings = pgTable("tenant_settings", {
  tenantId: text("tenant_id").primaryKey(),
  general: jsonb("general").$type<TenantSettingsPayload>().notNull().default({}),
  delivery: jsonb("delivery").$type<TenantSettingsPayload>().notNull().default({}),
  security: jsonb("security").$type<TenantSettingsPayload>().notNull().default({}),
  receipt: jsonb("receipt").$type<TenantSettingsPayload>().notNull().default({}),
  loyalty: jsonb("loyalty").$type<TenantSettingsPayload>().notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type LocationRow = typeof locations.$inferSelect;
export type RegisterRow = typeof registers.$inferSelect;
export type ReceiptRow = typeof receipts.$inferSelect;
