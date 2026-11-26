/**
 * Client-safe tenant constants and naming helpers.
 *
 * Kept separate from `lib/tenant.ts` so client components (the POS store and
 * offline queue) never pull Clerk's server-only modules into the browser.
 */
export type TenantRole = "owner" | "manager" | "cashier";

export type RegisterSession = {
  tenantId: string;
  locationId: string;
  registerId: string;
  registerTitle: string;
};

export const REGISTER_COOKIE = "tanawa_register_session";
export const ONBOARDING_COOKIE = "tanawa_onboarding";

export function resolveTenantId(userId: string | null, orgId: string | null): string {
  if (orgId) return orgId;
  if (userId) return `personal_${userId}`;
  return "personal_demo";
}

export function resolveTenantRole(orgRole: string | null | undefined): TenantRole {
  if (orgRole === "org:admin") return "owner";
  if (orgRole === "org:member") return "manager";
  return "owner";
}

/** Namespaced localStorage keys shared by the console and the POS terminal. */
export function tenantStorageKeys(tenantId: string) {
  return {
    state: `tanawa_pos_state_${tenantId}`,
    queue: `tanawa_pos_queue_${tenantId}`,
    tenant: `tanawa_tenant_${tenantId}`,
  };
}
