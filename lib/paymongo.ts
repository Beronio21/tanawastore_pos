/**
 * PayMongo (Philippines) helpers.
 *
 * Live calls happen only when `PAYMONGO_SECRET_KEY` is set; otherwise the POS
 * uses the sandbox simulator so CI and offline demos never need network access.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { BILLING_PLANS, type PlanId } from "./billing-plans";

export const PAYMONGO_API = "https://api.paymongo.com/v1";

export type PaymongoMode = "live" | "sandbox";

export type PaymongoIntent = {
  paymentIntentId: string;
  checkoutUrl: string | null;
  qrCodeData: string | null;
  mode: PaymongoMode;
  method: string;
  amount: number;
};

export function paymongoConfigured(): boolean {
  return Boolean(process.env.PAYMONGO_SECRET_KEY);
}

export function paymongoPublicKey(): string {
  return process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY ?? process.env.EXPO_PUBLIC_PAYMONGO_PUBLIC_KEY ?? "";
}

export function paymongoMode(): PaymongoMode {
  return paymongoConfigured() ? "live" : "sandbox";
}

/** PayMongo amounts are integer centavos. */
export function toCentavos(amount: number): number {
  return Math.max(0, Math.round((Number(amount) || 0) * 100));
}

export function paymongoHeaders(secret: string): Record<string, string> {
  return {
    Authorization: `Basic ${Buffer.from(`${secret}:`).toString("base64")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

/**
 * Verify the `Paymongo-Signature` header: `t=<ts>,te=<test sig>,li=<live sig>`.
 * The signed payload is `${timestamp}.${rawBody}` (HMAC-SHA256, hex).
 */
export function verifyPaymongoSignature(
  rawBody: string,
  header: string | null | undefined,
  secret: string | null | undefined,
  options: { toleranceSeconds?: number; now?: number } = {},
): boolean {
  if (!header || !secret) return false;
  const parts = new Map<string, string>();
  for (const segment of header.split(",")) {
    const [key, ...rest] = segment.trim().split("=");
    if (key && rest.length) parts.set(key, rest.join("="));
  }
  const timestamp = parts.get("t");
  const signature = parts.get("te") ?? parts.get("li");
  if (!timestamp || !signature) return false;

  if (options.toleranceSeconds) {
    const sent = Number(timestamp) * 1000;
    const now = options.now ?? Date.now();
    if (!Number.isFinite(sent) || Math.abs(now - sent) > options.toleranceSeconds * 1000) return false;
  }

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const given = Buffer.from(signature, "utf8");
  const wanted = Buffer.from(expected, "utf8");
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

/** Map a subscription amount (centavos) back to a plan tier. */
export function planForAmount(centavos: number): PlanId | null {
  for (const plan of Object.values(BILLING_PLANS)) {
    if (toCentavos(plan.price) === centavos) return plan.id;
  }
  return null;
}

export type CheckoutInput = {
  amount: number;
  method: string;
  description: string;
  reference: string;
  successUrl?: string;
  cancelUrl?: string;
};

/** Create a PayMongo Checkout Session. Throws on non-2xx responses. */
export async function createPaymongoCheckout(input: CheckoutInput): Promise<PaymongoIntent> {
  const secret = process.env.PAYMONGO_SECRET_KEY;
  if (!secret) throw new Error("PAYMONGO_SECRET_KEY is not configured");

  const response = await fetch(`${PAYMONGO_API}/checkout_sessions`, {
    method: "POST",
    headers: paymongoHeaders(secret),
    body: JSON.stringify({
      data: {
        attributes: {
          send_email_receipt: false,
          show_description: true,
          show_line_items: true,
          description: input.description,
          reference_number: input.reference,
          payment_method_types: [input.method.toLowerCase().replace(/\s+/g, "_")],
          line_items: [
            {
              currency: "PHP",
              amount: toCentavos(input.amount),
              name: input.description,
              quantity: 1,
            },
          ],
          success_url: input.successUrl ?? "http://localhost:3000/pos",
          cancel_url: input.cancelUrl ?? "http://localhost:3000/pos",
        },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`PayMongo checkout failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  const json = (await response.json()) as {
    data?: { id?: string; attributes?: { checkout_url?: string } };
  };
  const id = json.data?.id ?? `cs_${Date.now()}`;
  return {
    paymentIntentId: id,
    checkoutUrl: json.data?.attributes?.checkout_url ?? null,
    qrCodeData: null,
    mode: "live",
    method: input.method,
    amount: input.amount,
  };
}
