import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, hasDatabase, schema } from "@/db";
import { INITIAL_CONSOLE_STATE } from "@/lib/console-data";
import { REGISTER_COOKIE, cookieFromRequest, getRequestTenantContext } from "@/lib/tenant";

/** Hydrated workspace bootstrap for /manage and /pos. */
export async function GET(request: Request) {
  const tenant = await getRequestTenantContext(cookieFromRequest(request, REGISTER_COOKIE));
  if (!tenant) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const db = getDb();
  if (!db) {
    // CI/local mode: the client hydrates from tenant-namespaced localStorage.
    return NextResponse.json({
      mode: "local",
      tenantId: tenant.tenantId,
      role: tenant.role,
      plan: "pro",
      state: INITIAL_CONSOLE_STATE,
    });
  }

  const [tenantRow] = await db.select().from(schema.tenants).where(eq(schema.tenants.id, tenant.tenantId)).limit(1);
  const [settings] = await db.select().from(schema.tenantSettings).where(eq(schema.tenantSettings.tenantId, tenant.tenantId)).limit(1);
  const locationRows = await db.select().from(schema.locations).where(eq(schema.locations.tenantId, tenant.tenantId));
  const registerRows = await db.select().from(schema.registers).where(eq(schema.registers.tenantId, tenant.tenantId));
  const accountRows = await db.select().from(schema.financeAccounts).where(eq(schema.financeAccounts.tenantId, tenant.tenantId));
  const categoryRows = await db.select().from(schema.categories).where(eq(schema.categories.tenantId, tenant.tenantId));
  const itemRows = await db.select().from(schema.catalogItems).where(eq(schema.catalogItems.tenantId, tenant.tenantId));
  const employeeRows = await db.select().from(schema.employees).where(eq(schema.employees.tenantId, tenant.tenantId));

  return NextResponse.json({
    mode: hasDatabase() ? "postgres" : "local",
    tenantId: tenant.tenantId,
    role: tenant.role,
    tenant: tenantRow ?? null,
    plan: tenantRow?.plan ?? "pro",
    onboardingCompleted: tenantRow?.onboardingCompleted ?? false,
    settings: settings ?? null,
    locations: locationRows,
    registers: registerRows,
    accounts: accountRows,
    categories: categoryRows,
    catalogItems: itemRows,
    employees: employeeRows,
  });
}
