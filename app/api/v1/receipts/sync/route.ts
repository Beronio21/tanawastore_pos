import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/db";
import {
  REGISTER_COOKIE,
  cookieFromRequest,
  getRequestTenantContext,
} from "@/lib/tenant";
import type { QueuedMutation, ReceiptMutationPayload } from "@/lib/offline-sync";

type SyncBody = { mutations?: QueuedMutation[] };

/** Idempotent batch sync for offline/online POS receipt mutations. */
export async function POST(request: Request) {
  let body: SyncBody;
  try {
    body = (await request.json()) as SyncBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const tenant = await getRequestTenantContext(cookieFromRequest(request, REGISTER_COOKIE));
  if (!tenant) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const mutations = (body.mutations ?? []).filter((mutation) => mutation?.clientMutationId);
  if (mutations.length === 0) {
    return NextResponse.json({ accepted: [], skipped: [], mode: "local" });
  }

  const db = getDb();
  if (!db) {
    // Local/CI mode: the browser already applied these optimistically.
    return NextResponse.json({
      accepted: mutations.map((mutation) => mutation.clientMutationId),
      skipped: [],
      mode: "local",
    });
  }

  const ids = mutations.map((mutation) => mutation.clientMutationId);
  const existing = await db
    .select({ clientMutationId: schema.receipts.clientMutationId })
    .from(schema.receipts)
    .where(and(eq(schema.receipts.tenantId, tenant.tenantId), inArray(schema.receipts.clientMutationId, ids)));
  const processed = new Set(existing.map((row) => row.clientMutationId).filter(Boolean) as string[]);
  const accepted: string[] = [];
  const skipped: string[] = [];

  for (const mutation of mutations) {
    if (processed.has(mutation.clientMutationId)) {
      skipped.push(mutation.clientMutationId);
      continue;
    }

    await db.transaction(async (tx) => {
      const payload = mutation.payload as ReceiptMutationPayload;

      if (mutation.type === "refund") {
        if (payload.receiptNum !== undefined) {
          await tx.update(schema.receipts)
            .set({ status: "refunded" })
            .where(and(
              eq(schema.receipts.tenantId, tenant.tenantId),
              eq(schema.receipts.receiptNumber, payload.receiptNum),
            ));
        }
        accepted.push(mutation.clientMutationId);
        return;
      }

      const receiptId = randomUUID();
      await tx.insert(schema.receipts).values({
        id: receiptId,
        tenantId: tenant.tenantId,
        locationId: tenant.registerSession?.locationId ?? null,
        registerId: tenant.registerSession?.registerId ?? null,
        receiptNumber: payload.receiptNum,
        clientMutationId: mutation.clientMutationId,
        status: "closed",
        tableLabel: payload.tableName ?? null,
        employeeId: payload.staffId ?? null,
        subtotal: String(payload.subtotal ?? 0),
        discountTotal: String(payload.discountAmt ?? 0),
        taxTotal: String(payload.tax ?? 0),
        total: String(payload.total ?? 0),
        profit: String(payload.profit ?? 0),
        paymentMethod: payload.paymentMethod,
        closedAt: payload.closedAt ? new Date(payload.closedAt) : new Date(mutation.timestamp),
      });

      if (payload.items?.length) {
        await tx.insert(schema.receiptItems).values(
          payload.items.map((line) => ({
            id: randomUUID(),
            tenantId: tenant.tenantId,
            receiptId,
            itemId: line.menuId,
            name: line.name,
            quantity: String(line.qty),
            unitPrice: String(line.unitPrice),
            subtotal: String(line.qty * line.unitPrice),
          })),
        );
      }

      const accountType = payload.paymentMethod === "Cash" ? "cash" : "bank";
      const account = await tx
        .select()
        .from(schema.financeAccounts)
        .where(and(eq(schema.financeAccounts.tenantId, tenant.tenantId), eq(schema.financeAccounts.type, accountType)))
        .limit(1);
      if (account[0]) {
        const balance = Number(account[0].balance) + Number(payload.total ?? 0);
        await tx.update(schema.financeAccounts)
          .set({ balance: String(balance) })
          .where(eq(schema.financeAccounts.id, account[0].id));
        await tx.insert(schema.financeTransactions).values({
          id: randomUUID(),
          tenantId: tenant.tenantId,
          accountId: account[0].id,
          type: "income",
          category: "POS Sales",
          amount: String(payload.total ?? 0),
          description: `Receipt #${payload.receiptNum} (${payload.tableName ?? "Takeaway"})`,
          receiptId,
        });
      }

      // Best-effort recipe stock deduction for catalog items stored in Postgres.
      for (const line of payload.items ?? []) {
        const [item] = await tx
          .select()
          .from(schema.catalogItems)
          .where(and(eq(schema.catalogItems.tenantId, tenant.tenantId), eq(schema.catalogItems.id, line.menuId)))
          .limit(1);
        const recipe = (item?.recipe ?? []) as { stockId?: string; qty?: number }[];
        for (const ingredient of recipe) {
          if (!ingredient.stockId || !ingredient.qty) continue;
          const [balance] = await tx
            .select()
            .from(schema.stockBalances)
            .where(and(
              eq(schema.stockBalances.tenantId, tenant.tenantId),
              eq(schema.stockBalances.itemId, ingredient.stockId),
            ))
            .limit(1);
          if (!balance) continue;
          const delta = ingredient.qty * line.qty;
          await tx.update(schema.stockBalances)
            .set({ quantity: String(Math.max(0, Number(balance.quantity) - delta)) })
            .where(eq(schema.stockBalances.id, balance.id));
          await tx.insert(schema.stockMovements).values({
            id: randomUUID(),
            tenantId: tenant.tenantId,
            storageId: balance.storageId,
            itemId: ingredient.stockId,
            movementType: "sale_deduction",
            quantityDelta: String(-delta),
            unitCost: balance.avgCost,
            referenceId: receiptId,
          });
        }
      }

      accepted.push(mutation.clientMutationId);
    });
  }

  return NextResponse.json({ accepted, skipped, mode: "postgres" });
}
