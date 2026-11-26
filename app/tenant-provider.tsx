import type { ReactNode } from "react";
import { PosStoreProvider } from "@/lib/pos-store";
import { getServerTenantContext } from "@/lib/tenant";

/**
 * Resolves the Clerk Organization (or personal workspace) on the server and
 * re-hydrates the POS/console store under that tenant namespace.
 */
export async function TenantProvider({ children }: { children: ReactNode }) {
  const tenant = await getServerTenantContext();
  return <PosStoreProvider tenantId={tenant.tenantId}>{children}</PosStoreProvider>;
}
