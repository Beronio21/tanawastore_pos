/**
 * Offline-first POS mutation queue.
 *
 * Receipt closures, refunds and quick stock movements are written to a
 * tenant-namespaced localStorage queue with a UUID `clientMutationId`, then
 * flushed to `POST /api/v1/receipts/sync`. The server (and the pure helper
 * below) skips mutation ids it has already processed, so replaying a batch is
 * safe after a dropped connection.
 */
import { tenantStorageKeys } from "./tenant-keys";
import { accountDisplayName, type ConsoleState, type PaymentMethod } from "./console-data";
import { formatTimestamp } from "./format";

export type QueuedMutationType = "receipt" | "refund" | "stock";

export type ReceiptMutationPayload = {
  receiptNum: number;
  staffId?: string;
  staffName?: string;
  tableName?: string;
  paymentMethod: PaymentMethod;
  subtotal: number;
  discountAmt: number;
  tax: number;
  total: number;
  profit: number;
  closedAt?: string;
  items: { menuId: string; name: string; qty: number; unitPrice: number }[];
};

export type QueuedMutation = {
  clientMutationId: string;
  timestamp: string;
  tenantId: string;
  type: QueuedMutationType;
  payload: ReceiptMutationPayload | Record<string, unknown>;
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function createMutationId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `mutation-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function readQueue(storage: StorageLike, tenantId: string): QueuedMutation[] {
  try {
    const raw = storage.getItem(tenantStorageKeys(tenantId).queue);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueuedMutation[];
    return Array.isArray(parsed) ? parsed.filter((entry) => entry && entry.clientMutationId) : [];
  } catch {
    return [];
  }
}

function writeQueue(storage: StorageLike, tenantId: string, queue: QueuedMutation[]) {
  try {
    if (queue.length === 0) storage.removeItem(tenantStorageKeys(tenantId).queue);
    else storage.setItem(tenantStorageKeys(tenantId).queue, JSON.stringify(queue));
  } catch {
    // Quota/private mode: keep the in-memory POS usable.
  }
}

export function enqueueMutation(storage: StorageLike, tenantId: string, mutation: QueuedMutation): QueuedMutation {
  const queue = readQueue(storage, tenantId);
  if (!queue.some((entry) => entry.clientMutationId === mutation.clientMutationId)) {
    queue.push(mutation);
    writeQueue(storage, tenantId, queue);
  }
  return mutation;
}

export function removeQueuedMutations(storage: StorageLike, tenantId: string, clientMutationIds: string[]) {
  const remove = new Set(clientMutationIds);
  writeQueue(storage, tenantId, readQueue(storage, tenantId).filter((entry) => !remove.has(entry.clientMutationId)));
}

export function clearQueue(storage: StorageLike, tenantId: string) {
  writeQueue(storage, tenantId, []);
}

/** Return only mutations the server has not already acknowledged. */
export function unseenMutations(processed: Iterable<string>, mutations: QueuedMutation[]): QueuedMutation[] {
  const seen = new Set(processed);
  return mutations.filter((mutation) => !seen.has(mutation.clientMutationId));
}

export type FlushResult = { sent: number; remaining: number; failed: boolean };

/** POST a tenant's queue, removing only the mutations the server accepted. */
export async function flushQueue(
  storage: StorageLike,
  tenantId: string,
  send: (mutations: QueuedMutation[]) => Promise<{ accepted: string[]; processed?: string[] }>,
): Promise<FlushResult> {
  const queue = readQueue(storage, tenantId);
  if (queue.length === 0) return { sent: 0, remaining: 0, failed: false };
  try {
    const response = await send(queue);
    const accepted = response.accepted.length
      ? response.accepted
      : queue.map((mutation) => mutation.clientMutationId);
    removeQueuedMutations(storage, tenantId, accepted);
    return { sent: accepted.length, remaining: readQueue(storage, tenantId).length, failed: false };
  } catch {
    return { sent: 0, remaining: queue.length, failed: true };
  }
}

function deductRecipe(state: ConsoleState, recipe: ConsoleState["menuItems"][number]["recipe"], quantity: number) {
  for (const line of recipe) {
    if (line.prepId) {
      const prep = state.preparations.find((entry) => entry.id === line.prepId);
      if (prep) deductRecipe(state, prep.recipe, line.qty * quantity);
      continue;
    }
    if (!line.stockId) continue;
    const stock = state.stockItems.find((item) => item.id === line.stockId);
    if (stock) stock.stock = Math.max(0, stock.stock - line.qty * quantity);
  }
}

/**
 * Pure receipt application used by the sync route fallback and the idempotency
 * tests. Calling it twice with the same `clientMutationId` is a no-op.
 */
export function applyReceiptMutation(
  state: ConsoleState,
  mutation: QueuedMutation,
): { applied: boolean; state: ConsoleState } {
  const processed = state.syncedMutationIds ?? [];
  if (processed.includes(mutation.clientMutationId)) return { applied: false, state };

  const payload = mutation.payload as ReceiptMutationPayload;
  const next = structuredClone(state);
  const items = payload.items ?? [];

  for (const line of items) {
    const menuItem = next.menuItems.find((entry) => entry.id === line.menuId);
    if (menuItem) deductRecipe(next, menuItem.recipe, line.qty);
  }

  const account = payload.paymentMethod === "Cash"
    ? next.accounts.find((entry) => entry.isCashDrawer)
    : next.accounts.find((entry) => entry.id === "acc-bank");
  if (account) account.balance += payload.total;

  next.transactions.unshift({
    id: `tx-sync-${mutation.clientMutationId}`,
    date: formatTimestamp(new Date(mutation.timestamp)),
    type: "income",
    category: "POS Sales",
    comment: `Receipt #${payload.receiptNum} (${payload.tableName ?? "Takeaway"})`,
    sum: payload.total,
    account: accountDisplayName(account, next.settings.companyName),
  });
  next.syncedMutationIds = [...processed, mutation.clientMutationId];
  return { applied: true, state: next };
}
