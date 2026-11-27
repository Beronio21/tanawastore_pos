import { NextResponse } from "next/server";
import { applyPaidPlan, isPlanId } from "@/lib/billing-server";
import { paymongoMode } from "@/lib/paymongo";
import { REGISTER_COOKIE, cookieFromRequest, getRequestTenantContext } from "@/lib/tenant";

/**
 * POST /api/v1/payments/paymongo/confirm
 * Instant sandbox activation for Settings → Billing (live checkouts complete
 * through the signed `/api/webhooks/billing` webhook instead).
 */
export async function POST(request: Request) {
  const tenant = await getRequestTenantContext(cookieFromRequest(request, REGISTER_COOKIE));
  if (!tenant) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  let body: { plan?: string; reference?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isPlanId(body.plan)) {
    return NextResponse.json({ error: "plan must be starter, pro or enterprise" }, { status: 400 });
  }

  if (paymongoMode() === "live") {
    return NextResponse.json(
      { error: "Live PayMongo mode: complete checkout and wait for the billing webhook." },
      { status: 409 },
    );
  }

  const result = await applyPaidPlan({
    tenantId: tenant.tenantId,
    plan: body.plan,
    invoiceNumber: `INV-SB-${Date.now()}`,
    reference: body.reference ?? null,
  });
  return NextResponse.json(result);
}
