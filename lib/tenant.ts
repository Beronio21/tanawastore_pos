/**
 * Server tenant context resolution and signed register pairing sessions.
 *
 * Tenant naming/storage helpers live in `lib/tenant-keys.ts` so client bundles
 * never import Clerk's server-only modules.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  ONBOARDING_COOKIE,
  REGISTER_COOKIE,
  resolveTenantId,
  resolveTenantRole,
  tenantStorageKeys,
  type RegisterSession,
  type TenantRole,
} from "./tenant-keys";

export {
  ONBOARDING_COOKIE,
  REGISTER_COOKIE,
  resolveTenantId,
  resolveTenantRole,
  tenantStorageKeys,
};
export type { RegisterSession, TenantRole };

export type TenantContext = {
  tenantId: string;
  userId: string | null;
  orgId: string | null;
  orgRole: string | null;
  role: TenantRole;
  /** True when the caller is a paired register device rather than a Clerk user. */
  registerSession: RegisterSession | null;
};

function sessionSecret(): string {
  return process.env.REGISTER_SESSION_SECRET ?? process.env.CLERK_SECRET_KEY ?? "tanawa-dev-register-secret";
}

function base64url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(value: string): string {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

/** Sign a register device payload for the HttpOnly pairing cookie. */
export function signRegisterSession(session: RegisterSession): string {
  const payload = base64url(JSON.stringify(session));
  return `${payload}.${sign(payload)}`;
}

/** Verify and decode a register pairing cookie. Returns null when tampered. */
export function verifyRegisterSession(raw: string | undefined | null): RegisterSession | null {
  if (!raw) return null;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const given = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<RegisterSession>;
    if (!parsed.tenantId || !parsed.locationId || !parsed.registerId) return null;
    return {
      tenantId: parsed.tenantId,
      locationId: parsed.locationId,
      registerId: parsed.registerId,
      registerTitle: parsed.registerTitle ?? "Register",
    };
  } catch {
    return null;
  }
}

/** Resolve the caller's Clerk tenant context on the server. */
export async function getServerTenantContext(): Promise<TenantContext> {
  const { auth } = await import("@clerk/nextjs/server");
  const session = await auth();
  const orgId = session.orgId ?? null;
  const userId = session.userId ?? null;
  return {
    tenantId: resolveTenantId(userId, orgId),
    userId,
    orgId,
    orgRole: session.orgRole ?? null,
    role: resolveTenantRole(session.orgRole),
    registerSession: null,
  };
}

export function cookieFromRequest(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

/** Resolve a tenant for API calls authenticated by either Clerk or a register cookie. */
export async function getRequestTenantContext(rawCookie?: string | null): Promise<TenantContext | null> {
  const registerSession = verifyRegisterSession(rawCookie);
  if (registerSession) {
    return {
      tenantId: registerSession.tenantId,
      userId: null,
      orgId: null,
      orgRole: "register",
      role: "cashier",
      registerSession,
    };
  }
  const context = await getServerTenantContext();
  if (!context.userId) return null;
  return context;
}
