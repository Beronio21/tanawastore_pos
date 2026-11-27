/**
 * Idempotent demo tenant seeder.
 *
 *   pnpm run db:seed
 *
 * Upserts `tenant_demo_tanawa` with a Malaybalay City café/restaurant,
 * Register 1, the owner PIN 0000, starter menu categories/items with recipes,
 * stock balances and customer groups. Re-running the script is safe.
 */
import { eq } from "drizzle-orm";
import { getDb, schema } from "./index";
import { INITIAL_CONSOLE_STATE } from "@/lib/console-data";

const DEMO_TENANT_ID = "tenant_demo_tanawa";
const DEMO_LOCATION_ID = "loc_demo_malaybalay";
const DEMO_REGISTER_ID = "reg_demo_1";
const DEMO_OWNER_ID = "emp_demo_owner";
const DEMO_BANK_ID = "acc_demo_bank";
const DEMO_CASH_ID = "acc_demo_cash";
const DEMO_SAFE_ID = "acc_demo_safe";
const DEMO_STORAGE_ID = "storage_demo_1";

async function main() {
  // `tsx` does not load Next.js' .env.local automatically.
  try {
    process.loadEnvFile?.(".env.local");
  } catch {
    // A real deployment provides DATABASE_URL directly.
  }

  const db = getDb();
  if (!db) {
    console.error("DATABASE_URL is not set — nothing to seed.");
    process.exitCode = 1;
    return;
  }

  const state = INITIAL_CONSOLE_STATE;
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await db.insert(schema.tenants).values({
    id: DEMO_TENANT_ID,
    name: "TanAwa Store",
    businessType: "cafe",
    currency: "PHP",
    timezone: "(+08:00) — Asia/Manila",
    onboardingCompleted: true,
    plan: "pro",
    trialEndsAt,
  }).onConflictDoUpdate({
    target: schema.tenants.id,
    set: { name: "TanAwa Store", onboardingCompleted: true },
  });

  await db.insert(schema.locations).values({
    id: DEMO_LOCATION_ID,
    tenantId: DEMO_TENANT_ID,
    name: "TanAwa Store — Malaybalay City",
    address: "Fortich Street, Malaybalay City, Bukidnon",
    registerLogin: "tanawastore",
    workingTimeStart: "08:00",
    workingTimeEnd: "22:00",
    bankAccountId: DEMO_BANK_ID,
    cashAccountId: DEMO_CASH_ID,
    safeAccountId: DEMO_SAFE_ID,
    storageLocationIds: ["Storage 1"],
  }).onConflictDoNothing();

  await db.insert(schema.registers).values({
    id: DEMO_REGISTER_ID,
    tenantId: DEMO_TENANT_ID,
    locationId: DEMO_LOCATION_ID,
    title: "Register 1",
    type: "Standard",
    login: "tanawastore",
    passwordHash: "demo-register-password",
  }).onConflictDoNothing();

  for (const account of [
    { id: DEMO_BANK_ID, name: "Bank account", type: "bank" as const, balance: "0" },
    { id: DEMO_CASH_ID, name: "Cash drawer for tanawa", type: "cash" as const, balance: "0" },
    { id: DEMO_SAFE_ID, name: "Safe deposit", type: "safe" as const, balance: "0" },
  ]) {
    await db.insert(schema.financeAccounts).values({
      id: account.id,
      tenantId: DEMO_TENANT_ID,
      name: account.name,
      type: account.type,
      balance: account.balance,
    }).onConflictDoNothing();
  }

  const positions = Array.isArray(state.positions) ? state.positions : [];
  for (const position of positions) {
    await db.insert(schema.positions).values({
      id: position.id,
      tenantId: DEMO_TENANT_ID,
      title: position.title,
      permissions: {
        posAccess: position.posAccess,
        ...Object.fromEntries(
          Object.entries(position.consoleAccess).map(([area, level]) => [area, level === "Full access"]),
        ),
      },
    }).onConflictDoNothing();
  }

  await db.insert(schema.employees).values({
    id: DEMO_OWNER_ID,
    tenantId: DEMO_TENANT_ID,
    name: state.employees[0]?.name ?? "Philip Venje Beronio",
    pin: "0000",
    positionId: positions.find((position) => position.title === "Owner")?.id ?? null,
  }).onConflictDoUpdate({
    target: schema.employees.id,
    set: { pin: "0000", name: state.employees[0]?.name ?? "Philip Venje Beronio" },
  });

  for (const category of state.menuCategories) {
    await db.insert(schema.categories).values({
      id: category.id,
      tenantId: DEMO_TENANT_ID,
      type: "product",
      name: category.name,
    }).onConflictDoNothing();
  }
  for (const ingredient of state.ingredientCategories) {
    await db.insert(schema.categories).values({
      id: ingredient.id,
      tenantId: DEMO_TENANT_ID,
      type: "ingredient",
      name: ingredient.name,
    }).onConflictDoNothing();
  }

  const stationIdByTitle = new Map(state.stations.map((station) => [station.title, station.id]));
  for (const item of state.menuItems) {
    await db.insert(schema.catalogItems).values({
      id: item.id,
      tenantId: DEMO_TENANT_ID,
      itemType: item.type === "Dish" ? "dish" : "product",
      categoryId: state.menuCategories.find((category) => category.name === item.category)?.id ?? null,
      stationId: stationIdByTitle.get(item.station) ?? null,
      name: item.title,
      sku: item.sku ?? null,
      unit: "pcs",
      price: item.price.toFixed(2),
      cost: item.cost.toFixed(2),
      recipe: item.recipe as unknown as Record<string, unknown>[],
      trackStock: item.recipe.length > 0,
      imageUrl: null,
    }).onConflictDoUpdate({
      target: schema.catalogItems.id,
      set: {
        name: item.title,
        price: item.price.toFixed(2),
        cost: item.cost.toFixed(2),
        recipe: item.recipe as unknown as Record<string, unknown>[],
      },
    });
  }

  for (const ingredient of state.stockItems) {
    await db.insert(schema.stockBalances).values({
      id: `${DEMO_STORAGE_ID}_${ingredient.id}`,
      tenantId: DEMO_TENANT_ID,
      storageId: DEMO_STORAGE_ID,
      itemId: ingredient.id,
      quantity: ingredient.stock.toString(),
      avgCost: ingredient.cost.toString(),
      minLimit: (ingredient.limit ?? 0).toString(),
    }).onConflictDoUpdate({
      target: schema.stockBalances.id,
      set: { quantity: ingredient.stock.toString(), avgCost: ingredient.cost.toString() },
    });
  }

  for (const group of state.customerGroups) {
    if (group.deleted) continue;
    await db.insert(schema.customerGroups).values({
      id: group.id,
      tenantId: DEMO_TENANT_ID,
      name: group.title,
      discountPercent: String(group.loyaltyProgram === "Discount system" ? group.rate : 0),
      cashbackPercent: String(group.loyaltyProgram === "Bonus system" ? group.rate : 0),
      thresholdAmount: "0",
    }).onConflictDoNothing();
  }

  await db.insert(schema.tenantSettings).values({
    tenantId: DEMO_TENANT_ID,
    general: {
      companyName: state.settings.companyName,
      logoUrl: "",
      tin: "",
      currencySymbol: state.settings.currencySymbol,
    },
    receipt: { paperWidth: "80mm" },
    security: {},
    delivery: {},
    loyalty: {},
  }).onConflictDoNothing();

  const [tenant] = await db.select().from(schema.tenants).where(eq(schema.tenants.id, DEMO_TENANT_ID)).limit(1);
  console.log(`Seeded demo tenant ${tenant?.id ?? DEMO_TENANT_ID} (${tenant?.plan ?? "pro"}) — Register 1, PIN 0000.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
