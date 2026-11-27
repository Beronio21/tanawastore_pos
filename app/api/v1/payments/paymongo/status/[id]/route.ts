import { NextResponse } from "next/server";
import { PAYMONGO_API, paymongoHeaders } from "@/lib/paymongo";
import { REGISTER_COOKIE, cookieFromRequest, getRequestTenantContext } from "@/lib/tenant";

type PaymentStatus = "paid" | "awaiting_payment" | "failed";

/** GET /api/v1/payments/paymongo/status/[id]?simulate=success */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const tenant = await getRequestTenantContext(cookieFromRequest(request, REGISTER_COOKIE));
  if (!tenant) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { id } = await params;
  const simulate = new URL(request.url).searchParams.get("simulate");

  if (!process.env.PAYMONGO_SECRET_KEY) {
    // Sandbox simulator: E2E/cashier clicks "Simulate Payment Success".
    const status: PaymentStatus = simulate === "success" ? "paid" : simulate === "failed" ? "failed" : "awaiting_payment";
    return NextResponse.json({ paymentIntentId: id, status, mode: "sandbox" });
  }

  try {
    const response = await fetch(`${PAYMONGO_API}/checkout_sessions/${encodeURIComponent(id)}`, {
      headers: paymongoHeaders(process.env.PAYMONGO_SECRET_KEY),
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json({ error: `PayMongo status failed (${response.status})` }, { status: 502 });
    }
    const json = (await response.json()) as {
      data?: { attributes?: { status?: string; payments?: { attributes?: { status?: string } }[] } };
    };
    const attributes = json.data?.attributes;
    const anyPaid = attributes?.payments?.some((payment) => payment.attributes?.status === "paid");
    const raw = (anyPaid ? "paid" : attributes?.status) ?? "awaiting_payment";
    const status: PaymentStatus = raw === "paid" || raw === "succeeded"
      ? "paid"
      : raw === "failed" || raw === "cancelled"
        ? "failed"
        : "awaiting_payment";
    return NextResponse.json({ paymentIntentId: id, status, mode: "live" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PayMongo status request failed" },
      { status: 502 },
    );
  }
}
