/** Server-side plan activation shared by the PayMongo webhook and sandbox confirm. */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { BILLING_PLANS, type PlanId } from "./billing-plans";

export type PaidPlanResult = {
  ok: boolean;
  mode: "postgres" | "local";
  tenantId: string;
  plan: PlanId;
  invoiceNumber: string;
  trialEndsAt: string;
};

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && Object.hasOwn(BILLING_PLANS, value);
}

/**
 * Activate `plan` for a tenant, extend the trial/subscription by 30 days and
 * record a Paid invoice. Safe to call twice for the same webhook reference.
 */
export async function applyPaidPlan(input: {
  tenantId: string;
  plan: PlanId;
  amount?: number;
  invoiceNumber?: string;
  reference?: string | null;
}): Promise<PaidPlanResult> {
  const invoiceNumber = input.invoiceNumber ?? `INV-${Date.now()}`;
  const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const db = getDb();
  if (!db) {
    return {
      ok: true,
      mode: "local",
      tenantId: input.tenantId,
      plan: input.plan,
      invoiceNumber,
      trialEndsAt: trialEndsAt.toISOString(),
    };
  }

  await db
    .update(schema.tenants)
    .set({ plan: input.plan, trialEndsAt, onboardingCompleted: true })
    .where(eq(schema.tenants.id, input.tenantId));

  await db
    .insert(schema.invoices)
    .values({
      id: randomUUID(),
      tenantId: input.tenantId,
      number: invoiceNumber,
      plan: input.plan,
      amount: String(input.amount ?? BILLING_PLANS[input.plan].price),
      currency: "PHP",
      status: "paid",
      provider: "paymongo",
      providerReference: input.reference ?? null,
      paidAt: new Date(),
    })
    .onConflictDoNothing();

  return {
    ok: true,
    mode: "postgres",
    tenantId: input.tenantId,
    plan: input.plan,
    invoiceNumber,
    trialEndsAt: trialEndsAt.toISOString(),
  };
}
