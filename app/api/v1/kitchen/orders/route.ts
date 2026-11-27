import { NextResponse } from "next/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb, schema } from "@/db";
import { normalizeTicket, type KitchenTicketInput } from "@/lib/kitchen";
import type { KdsTicket } from "@/lib/console-data";
import { REGISTER_COOKIE, cookieFromRequest, getRequestTenantContext } from "@/lib/tenant";

/** GET /api/v1/kitchen/orders — active tickets grouped by station. */
export async function GET(request: Request) {
  const tenant = await getRequestTenantContext(cookieFromRequest(request, REGISTER_COOKIE));
  if (!tenant) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const db = getDb();
  if (!db) {
    // Local/CI: the browser syncs tabs through BroadcastChannel/localStorage.
    return NextResponse.json({ mode: "local", tenantId: tenant.tenantId, stations: [], tickets: [] });
  }

  const rows = await db
    .select()
    .from(schema.kitchenTickets)
    .where(
      and(
        eq(schema.kitchenTickets.tenantId, tenant.tenantId),
        inArray(schema.kitchenTickets.status, ["queued", "preparing", "ready"]),
      ),
    )
    .orderBy(asc(schema.kitchenTickets.createdAt));

  const tickets: KdsTicket[] = rows.map((row) => ({
    id: row.id,
    receiptNum: row.receiptNumber,
    tableName: row.tableLabel,
    station: row.station,
    status: row.status,
    source: row.orderSource ?? undefined,
    comment: row.comment ?? undefined,
    items: row.items ?? [],
    time: row.createdAt.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }),
    openedAtMs: row.createdAt.getTime(),
    startedAt: row.startedAt?.toISOString(),
    completedAt: row.completedAt?.toISOString(),
  }));

  const byStation = new Map<string, KdsTicket[]>();
  for (const ticket of tickets) {
    byStation.set(ticket.station, [...(byStation.get(ticket.station) ?? []), ticket]);
  }

  return NextResponse.json({
    mode: "postgres",
    tenantId: tenant.tenantId,
    tickets,
    stations: [...byStation.entries()].map(([station, stationTickets]) => ({
      station,
      count: stationTickets.length,
      tickets: stationTickets,
    })),
  });
}

/** POST /api/v1/kitchen/orders — register `To Kitchen` creates station tickets. */
export async function POST(request: Request) {
  const tenant = await getRequestTenantContext(cookieFromRequest(request, REGISTER_COOKIE));
  if (!tenant) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  let body: { tickets?: KitchenTicketInput[] };
  try {
    body = (await request.json()) as { tickets?: KitchenTicketInput[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const incoming = (body.tickets ?? []).filter((ticket) => ticket?.station && ticket.items?.length);
  if (incoming.length === 0) {
    return NextResponse.json({ mode: "local", accepted: [] });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({
      mode: "local",
      accepted: incoming.map((ticket) => ticket.id ?? randomUUID()),
    });
  }

  const values = incoming.map((ticket) => {
    const normalized = normalizeTicket(ticket);
    return {
      id: normalized.id,
      tenantId: tenant.tenantId,
      receiptNumber: normalized.receiptNum,
      tableLabel: normalized.tableName,
      station: normalized.station,
      status: normalized.status ?? "queued",
      orderSource: normalized.source ?? null,
      comment: normalized.comment ?? null,
      items: normalized.items,
      createdAt: new Date(normalized.openedAtMs ?? Date.now()),
    };
  });

  await db.insert(schema.kitchenTickets).values(values).onConflictDoNothing();
  return NextResponse.json({ mode: "postgres", accepted: values.map((value) => value.id) });
}
