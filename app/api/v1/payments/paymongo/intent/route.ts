import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createPaymongoCheckout, toCentavos } from "@/lib/paymongo";
import { REGISTER_COOKIE, cookieFromRequest, getRequestTenantContext } from "@/lib/tenant";

const METHODS = ["GCash", "Maya", "QR Ph", "Card"];

/** POST /api/v1/payments/paymongo/intent — create a PHP payment intent/checkout. */
export async function POST(request: Request) {
  const tenant = await getRequestTenantContext(cookieFromRequest(request, REGISTER_COOKIE));
  if (!tenant) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  let body: { amount?: number; method?: string; reference?: string; description?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const amount = Number(body.amount ?? 0);
  const method = body.method ?? "QR Ph";
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount must be greater than zero" }, { status: 400 });
  }
  if (!METHODS.includes(method)) {
    return NextResponse.json({ error: `method must be one of ${METHODS.join(", ")}` }, { status: 400 });
  }

  if (!process.env.PAYMONGO_SECRET_KEY) {
    const paymentIntentId = `pi_sandbox_${randomUUID()}`;
    return NextResponse.json({
      paymentIntentId,
      checkoutUrl: null,
      qrCodeData: `https://sandbox.paymongo.test/qr/${paymentIntentId}`,
      mode: "sandbox",
      method,
      amount,
      centavos: toCentavos(amount),
    });
  }

  try {
    const intent = await createPaymongoCheckout({
      amount,
      method,
      description: body.description ?? `TanAwa POS ${method} payment`,
      reference: body.reference ?? tenant.tenantId,
      successUrl: new URL("/pos", request.url).toString(),
      cancelUrl: new URL("/pos", request.url).toString(),
    });
    return NextResponse.json({ ...intent, centavos: toCentavos(amount) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PayMongo request failed" },
      { status: 502 },
    );
  }
}
