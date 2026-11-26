import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { TenantPlan } from "@/db/schema";

type BillingEvent = {
  tenantId?: string;
  plan?: TenantPlan;
  invoiceId?: string;
  status?: "paid" | "failed";
};

function validSecret(request: Request): boolean {
  const expected = process.env.BILLING_WEBHOOK_SECRET;
  if (!expected) return false;
  const given = request.headers.get("x-billing-secret") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** PayMongo/Stripe payment confirmation → mark invoice paid and update plan. */
export async function POST(request: Request) {
  if (!validSecret(request)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  let event: BillingEvent;
  try {
    event = (await request.json()) as BillingEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!event.tenantId) return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
  if (event.status === "failed") {
    return NextResponse.json({ ok: true, status: "failed" });
  }

  const db = getDb();
  if (!db) return NextResponse.json({ ok: true, mode: "local", tenantId: event.tenantId });

  await db.update(schema.tenants)
    .set({
      ...(event.plan ? { plan: event.plan } : {}),
      onboardingCompleted: true,
    })
    .where(eq(schema.tenants.id, event.tenantId));

  return NextResponse.json({
    ok: true,
    mode: "postgres",
    tenantId: event.tenantId,
    invoiceId: event.invoiceId ?? null,
    status: "paid",
  });
}
