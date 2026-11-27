import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { TenantPlan } from "@/db/schema";
import { REGISTER_COOKIE, cookieFromRequest, getRequestTenantContext } from "@/lib/tenant";

type StateSyncBody = {
  general?: Record<string, unknown>;
  delivery?: Record<string, unknown>;
  security?: Record<string, unknown>;
  receipt?: Record<string, unknown>;
  loyalty?: Record<string, unknown>;
  plan?: TenantPlan;
  onboardingCompleted?: boolean;
};

/** Persist console mutations scoped to the resolved tenant. */
export async function POST(request: Request) {
  let body: StateSyncBody;
  try {
    body = (await request.json()) as StateSyncBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const tenant = await getRequestTenantContext(cookieFromRequest(request, REGISTER_COOKIE));
  if (!tenant) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const db = getDb();
  if (!db) {
    return NextResponse.json({ ok: true, mode: "local", tenantId: tenant.tenantId });
  }

  const general = body.general ?? {};
  const delivery = body.delivery ?? {};
  const security = body.security ?? {};
  const receipt = body.receipt ?? {};
  const loyalty = body.loyalty ?? {};

  await db.insert(schema.tenantSettings).values({
    tenantId: tenant.tenantId,
    general,
    delivery,
    security,
    receipt,
    loyalty,
    updatedAt: new Date(),
  }).onConflictDoUpdate({
    target: schema.tenantSettings.tenantId,
    set: {
      ...(body.general ? { general } : {}),
      ...(body.delivery ? { delivery } : {}),
      ...(body.security ? { security } : {}),
      ...(body.receipt ? { receipt } : {}),
      ...(body.loyalty ? { loyalty } : {}),
      updatedAt: new Date(),
    },
  });

  if (body.plan || body.onboardingCompleted !== undefined) {
    await db.update(schema.tenants)
      .set({
        ...(body.plan ? { plan: body.plan } : {}),
        ...(body.onboardingCompleted !== undefined ? { onboardingCompleted: body.onboardingCompleted } : {}),
      })
      .where(eq(schema.tenants.id, tenant.tenantId));
  }

  return NextResponse.json({ ok: true, mode: "postgres", tenantId: tenant.tenantId });
}
