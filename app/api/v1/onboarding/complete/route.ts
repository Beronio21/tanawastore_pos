import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, hasDatabase, schema } from "@/db";
import { getServerTenantContext } from "@/lib/tenant";
import { presetFor, type BusinessType } from "@/lib/onboarding-presets";

export type OnboardingCompleteBody = {
  businessName: string;
  businessType: BusinessType;
  currency?: string;
  timezone?: string;
  locationName?: string;
  address?: string;
  openingFloat?: number;
  registerName?: string;
  registerLogin: string;
  registerPassword: string;
};

function hashPassword(password: string): string {
  return createHash("sha256").update(`tanawa:${password}`).digest("hex");
}

export async function POST(request: Request) {
  let body: OnboardingCompleteBody;
  try {
    body = (await request.json()) as OnboardingCompleteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.businessName?.trim() || !body?.registerLogin?.trim()) {
    return NextResponse.json({ error: "Business name and register login are required" }, { status: 400 });
  }

  const tenant = await getServerTenantContext();
  if (!tenant.userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const preset = presetFor(body.businessType ?? "cafe");
  const tenantId = tenant.tenantId;
  const locationId = randomUUID();
  const registerId = randomUUID();
  const accountIds = { cash: randomUUID(), bank: randomUUID(), safe: randomUUID() };
  const response = NextResponse.json({
    ok: true,
    mode: hasDatabase() ? "postgres" : "local",
    tenantId,
    locationId,
    registerId,
    preset,
  });
  // Middleware uses this marker to skip the onboarding redirect after launch.
  response.cookies.set("tanawa_onboarding", "complete", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  const db = getDb();
  if (!db) return response;

  await db.transaction(async (tx) => {
    const existing = await tx.select().from(schema.tenants).where(eq(schema.tenants.id, tenantId)).limit(1);
    if (existing.length === 0) {
      await tx.insert(schema.tenants).values({
        id: tenantId,
        clerkOrgId: tenant.orgId,
        ownerUserId: tenant.userId,
        name: body.businessName.trim(),
        businessType: preset.id,
        currency: body.currency ?? "PHP",
        timezone: body.timezone ?? "(+08:00) — Asia/Manila",
        onboardingCompleted: true,
        plan: "pro",
        trialEndsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      });
    } else {
      await tx.update(schema.tenants)
        .set({
          name: body.businessName.trim(),
          businessType: preset.id,
          onboardingCompleted: true,
        })
        .where(eq(schema.tenants.id, tenantId));
    }

    await tx.insert(schema.locations).values({
      id: locationId,
      tenantId,
      name: body.locationName?.trim() || body.businessName.trim(),
      address: body.address ?? "",
      registerLogin: body.registerLogin,
      bankAccountId: accountIds.bank,
      cashAccountId: accountIds.cash,
      safeAccountId: accountIds.safe,
      storageLocationIds: ["Storage 1"],
    });

    await tx.insert(schema.registers).values({
      id: registerId,
      tenantId,
      locationId,
      title: body.registerName?.trim() || "Register 1",
      login: body.registerLogin.trim(),
      passwordHash: hashPassword(body.registerPassword),
    });

    await tx.insert(schema.financeAccounts).values([
      { id: accountIds.cash, tenantId, name: "Cash drawer", type: "cash", balance: String(Math.max(0, body.openingFloat ?? 0)) },
      { id: accountIds.bank, tenantId, name: "Bank account", type: "bank", balance: "0" },
      { id: accountIds.safe, tenantId, name: "Safe deposit", type: "safe", balance: "0" },
    ]);

    const ownerPositionId = randomUUID();
    await tx.insert(schema.positions).values({
      id: ownerPositionId,
      tenantId,
      title: "Owner",
      permissions: {
        canViewReports: true,
        canViewFinances: true,
        canEditMenu: true,
        canManageInventory: true,
        canManageMarketing: true,
        canManageAccess: true,
        canEditSettings: true,
        canRefundOrders: true,
        canApplyDiscounts: true,
      },
    });
    await tx.insert(schema.employees).values({
      id: randomUUID(),
      tenantId,
      clerkUserId: tenant.userId,
      name: body.businessName.trim(),
      pin: "0000",
      positionId: ownerPositionId,
      commissionRules: {},
    });

    if (preset.categories.length) {
      await tx.insert(schema.categories).values(
        preset.categories.map((name) => ({
          id: randomUUID(),
          tenantId,
          type: "product" as const,
          name,
        })),
      );
    }

    await tx.insert(schema.tenantSettings).values({
      tenantId,
      general: {
        companyName: body.businessName.trim(),
        currency: body.currency ?? "PHP",
        timezone: body.timezone ?? "(+08:00) — Asia/Manila",
        showFloorPlan: preset.showFloorPlan,
        stations: preset.stations,
        serviceCharge: preset.serviceCharge ?? "Don't use",
      },
      delivery: { enabled: Boolean(preset.deliveryEnabled), areas: [] },
      security: {},
      receipt: {},
      loyalty: {},
    }).onConflictDoUpdate({
      target: schema.tenantSettings.tenantId,
      set: { updatedAt: new Date() },
    });
  });

  return response;
}
