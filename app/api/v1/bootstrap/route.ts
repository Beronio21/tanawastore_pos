import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, hasDatabase, schema } from "@/db";
import { REGISTER_COOKIE, cookieFromRequest, getRequestTenantContext } from "@/lib/tenant";
import type { BootstrapResponse } from "@/lib/bootstrap";

/** Hydrated workspace bootstrap for /manage, /pos and /pos/kitchen. */
export async function GET(request: Request) {
  const tenant = await getRequestTenantContext(cookieFromRequest(request, REGISTER_COOKIE));
  if (!tenant) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const db = getDb();
  if (!db) {
    // CI/local mode: the client hydrates from tenant-namespaced localStorage.
    return NextResponse.json<BootstrapResponse>({
      mode: "local",
      tenantId: tenant.tenantId,
      role: tenant.role,
      plan: "pro",
      onboardingRequired: false,
      onboardingCompleted: true,
    });
  }

  const [tenantRow] = await db.select().from(schema.tenants).where(eq(schema.tenants.id, tenant.tenantId)).limit(1);
  const onboardingRequired = !tenant.registerSession && !tenantRow?.onboardingCompleted;
  if (onboardingRequired) {
    return NextResponse.json<BootstrapResponse>({
      mode: "postgres",
      tenantId: tenant.tenantId,
      role: tenant.role,
      plan: tenantRow?.plan ?? "starter",
      onboardingRequired: true,
      onboardingCompleted: false,
      tenant: tenantRow ? { name: tenantRow.name, plan: tenantRow.plan, trialEndsAt: tenantRow.trialEndsAt } : null,
    });
  }

  const [
    settings,
    locationRows,
    registerRows,
    positionRows,
    employeeRows,
    categoryRows,
    itemRows,
    balanceRows,
    movementRows,
    customerRows,
    groupRows,
    receiptRows,
    itemRowsForReceipts,
    accountRows,
    transactionRows,
    kitchenRows,
  ] = await Promise.all([
    db.select().from(schema.tenantSettings).where(eq(schema.tenantSettings.tenantId, tenant.tenantId)).limit(1),
    db.select().from(schema.locations).where(eq(schema.locations.tenantId, tenant.tenantId)),
    db.select().from(schema.registers).where(eq(schema.registers.tenantId, tenant.tenantId)),
    db.select().from(schema.positions).where(eq(schema.positions.tenantId, tenant.tenantId)),
    db.select().from(schema.employees).where(eq(schema.employees.tenantId, tenant.tenantId)),
    db.select().from(schema.categories).where(eq(schema.categories.tenantId, tenant.tenantId)),
    db.select().from(schema.catalogItems).where(eq(schema.catalogItems.tenantId, tenant.tenantId)),
    db.select().from(schema.stockBalances).where(eq(schema.stockBalances.tenantId, tenant.tenantId)),
    db.select().from(schema.stockMovements).where(eq(schema.stockMovements.tenantId, tenant.tenantId)),
    db.select().from(schema.customers).where(eq(schema.customers.tenantId, tenant.tenantId)),
    db.select().from(schema.customerGroups).where(eq(schema.customerGroups.tenantId, tenant.tenantId)),
    db.select().from(schema.receipts).where(eq(schema.receipts.tenantId, tenant.tenantId)),
    db.select().from(schema.receiptItems).where(eq(schema.receiptItems.tenantId, tenant.tenantId)),
    db.select().from(schema.financeAccounts).where(eq(schema.financeAccounts.tenantId, tenant.tenantId)),
    db.select().from(schema.financeTransactions).where(eq(schema.financeTransactions.tenantId, tenant.tenantId)),
    db.select().from(schema.kitchenTickets).where(eq(schema.kitchenTickets.tenantId, tenant.tenantId)),
  ]);

  const locationNames = new Map(locationRows.map((location) => [location.id, location.name]));
  const positionTitles = new Map(positionRows.map((position) => [position.id, position.title]));
  const payload: BootstrapResponse = {
    mode: hasDatabase() ? "postgres" : "local",
    tenantId: tenant.tenantId,
    role: tenant.role,
    plan: tenantRow?.plan ?? "pro",
    onboardingCompleted: true,
    tenant: tenantRow ? { name: tenantRow.name, plan: tenantRow.plan, trialEndsAt: tenantRow.trialEndsAt } : null,
    settings: settings[0]
      ? {
          general: settings[0].general,
          delivery: settings[0].delivery,
          security: settings[0].security,
          receipt: settings[0].receipt,
          loyalty: settings[0].loyalty,
        }
      : null,
    locations: locationRows.map((row) => ({
      id: row.id,
      name: row.name,
      address: row.address,
      registerLogin: row.registerLogin,
    })),
    registers: registerRows.map((row) => ({
      id: row.id,
      title: row.title,
      locationId: row.locationId,
      login: row.login,
      locationName: locationNames.get(row.locationId),
    })),
    positions: positionRows.map((row) => ({ id: row.id, title: row.title, permissions: row.permissions })),
    employees: employeeRows.map((row) => ({
      id: row.id,
      name: row.name,
      pin: row.pin,
      positionId: row.positionId,
      positionTitle: row.positionId ? positionTitles.get(row.positionId) ?? null : null,
    })),
    categories: categoryRows.map((row) => ({ id: row.id, name: row.name, type: row.type })),
    catalogItems: itemRows.map((row) => ({
      id: row.id,
      itemType: row.itemType,
      categoryId: row.categoryId,
      stationId: row.stationId,
      name: row.name,
      sku: row.sku,
      unit: row.unit,
      price: row.price,
      cost: row.cost,
      recipe: row.recipe,
      imageUrl: row.imageUrl,
    })),
    stockBalances: balanceRows.map((row) => ({
      id: row.id,
      itemId: row.itemId,
      storageId: row.storageId,
      quantity: row.quantity,
      avgCost: row.avgCost,
      minLimit: row.minLimit,
    })),
    stockMovements: movementRows.map((row) => ({
      id: row.id,
      itemId: row.itemId,
      movementType: row.movementType,
      quantityDelta: row.quantityDelta,
      createdAt: row.createdAt,
      referenceId: row.referenceId,
    })),
    customers: customerRows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      groupId: row.groupId,
      bonusBalance: row.bonusBalance,
      totalSpent: row.totalSpent,
    })),
    customerGroups: groupRows.map((row) => ({
      id: row.id,
      name: row.name,
      discountPercent: row.discountPercent,
      cashbackPercent: row.cashbackPercent,
    })),
    receipts: receiptRows.map((row) => ({
      id: row.id,
      receiptNumber: row.receiptNumber,
      tableLabel: row.tableLabel,
      employeeId: row.employeeId,
      subtotal: row.subtotal,
      discountTotal: row.discountTotal,
      taxTotal: row.taxTotal,
      total: row.total,
      profit: row.profit,
      paymentMethod: row.paymentMethod,
      openedAt: row.openedAt,
      closedAt: row.closedAt,
      status: row.status,
    })),
    receiptItems: itemRowsForReceipts.map((row) => ({
      receiptId: row.receiptId,
      itemId: row.itemId,
      name: row.name,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
    })),
    financeAccounts: accountRows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      balance: row.balance,
    })),
    financeTransactions: transactionRows.map((row) => ({
      id: row.id,
      accountId: row.accountId,
      type: row.type,
      category: row.category,
      amount: row.amount,
      description: row.description,
      createdAt: row.createdAt,
    })),
    kitchenTickets: kitchenRows.map((row) => ({
      id: row.id,
      receiptNum: row.receiptNumber,
      tableName: row.tableLabel,
      station: row.station,
      status: row.status,
      source: row.orderSource ?? undefined,
      comment: row.comment ?? undefined,
      items: row.items,
      time: row.createdAt.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }),
      openedAtMs: row.createdAt.getTime(),
      startedAt: row.startedAt?.toISOString(),
      completedAt: row.completedAt?.toISOString(),
    })),
  };

  return NextResponse.json<BootstrapResponse>(payload);
}
