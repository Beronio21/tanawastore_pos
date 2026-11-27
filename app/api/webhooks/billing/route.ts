import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { applyPaidPlan, isPlanId } from "@/lib/billing-server";
import { planForAmount, verifyPaymongoSignature } from "@/lib/paymongo";
import type { TenantPlan } from "@/db/schema";

type LegacyBillingEvent = {
  tenantId?: string;
  plan?: TenantPlan;
  invoiceId?: string;
  status?: "paid" | "failed";
};

type PaymongoEvent = {
  data?: {
    id?: string;
    attributes?: {
      type?: string;
      data?: {
        id?: string;
        attributes?: {
          reference_number?: string;
          amount?: number;
          metadata?: Record<string, string>;
          payments?: { id?: string; attributes?: { amount?: number; status?: string } }[];
        };
      };
    };
  };
};

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function legacySecretValid(request: Request): boolean {
  const expected = process.env.BILLING_WEBHOOK_SECRET;
  if (!expected) return false;
  const given =
    request.headers.get("x-billing-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";
  return safeEqual(given, expected);
}

function paymongoSignatureValid(rawBody: string, request: Request): boolean {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET ?? process.env.BILLING_WEBHOOK_SECRET;
  return verifyPaymongoSignature(rawBody, request.headers.get("paymongo-signature"), secret);
}

function tenantFromPaymongo(event: PaymongoEvent): string | null {
  const resource = event.data?.attributes?.data;
  const attributes = resource?.attributes;
  if (attributes?.reference_number) return attributes.reference_number;
  const metadata = attributes?.metadata ?? {};
  return metadata.tenant_id ?? metadata.tenantId ?? null;
}

/** PayMongo payment confirmation → mark invoice paid and update the tenant plan. */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signed = paymongoSignatureValid(rawBody, request);
  const legacy = !signed && legacySecretValid(request);
  if (!signed && !legacy) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  let parsed: LegacyBillingEvent & PaymongoEvent;
  try {
    parsed = JSON.parse(rawBody) as LegacyBillingEvent & PaymongoEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (legacy) {
    if (!parsed.tenantId) return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    if (parsed.status === "failed") return NextResponse.json({ ok: true, status: "failed" });
    const plan = isPlanId(parsed.plan) ? parsed.plan : "pro";
    const result = await applyPaidPlan({
      tenantId: parsed.tenantId,
      plan,
      invoiceNumber: parsed.invoiceId,
    });
    return NextResponse.json({ ...result, status: "paid" });
  }

  const eventType = parsed.data?.attributes?.type ?? "";
  if (eventType !== "checkout_session.payment.paid" && eventType !== "payment.paid") {
    return NextResponse.json({ ok: true, ignored: eventType || "unknown" });
  }

  const tenantId = tenantFromPaymongo(parsed);
  if (!tenantId) {
    return NextResponse.json({ error: "Unable to resolve tenant reference" }, { status: 400 });
  }

  const resource = parsed.data?.attributes?.data;
  const attributes = resource?.attributes;
  const paidPayment = attributes?.payments?.find((payment) => payment.attributes?.status === "paid");
  const centavos = paidPayment?.attributes?.amount ?? attributes?.amount ?? 0;
  const plan = planForAmount(centavos) ?? "pro";
  const result = await applyPaidPlan({
    tenantId,
    plan,
    amount: centavos / 100,
    invoiceNumber: resource?.id ? `INV-${resource.id}` : undefined,
    reference: resource?.id ?? parsed.data?.id ?? null,
  });
  return NextResponse.json({ ...result, status: "paid", event: eventType });
}
