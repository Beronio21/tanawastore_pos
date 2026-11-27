import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { KdsTicketStatus } from "@/lib/console-data";
import { REGISTER_COOKIE, cookieFromRequest, getRequestTenantContext } from "@/lib/tenant";

const STATUSES: KdsTicketStatus[] = ["queued", "preparing", "ready", "served"];

/** PATCH /api/v1/kitchen/orders/[ticketId] — advance the ticket workflow. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  const tenant = await getRequestTenantContext(cookieFromRequest(request, REGISTER_COOKIE));
  if (!tenant) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { ticketId } = await params;
  let body: { status?: KdsTicketStatus };
  try {
    body = (await request.json()) as { status?: KdsTicketStatus };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.status || !STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "status must be queued, preparing, ready or served" }, { status: 400 });
  }

  const now = new Date();
  const db = getDb();
  if (!db) {
    // Local/CI: the client already applied the transition optimistically.
    return NextResponse.json({ mode: "local", ticketId, status: body.status });
  }

  const [updated] = await db
    .update(schema.kitchenTickets)
    .set({
      status: body.status,
      ...(body.status === "preparing" ? { startedAt: now } : {}),
      ...(body.status === "ready" || body.status === "served" ? { completedAt: now } : {}),
    })
    .where(
      and(
        eq(schema.kitchenTickets.tenantId, tenant.tenantId),
        eq(schema.kitchenTickets.id, ticketId),
      ),
    )
    .returning();

  if (!updated) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  return NextResponse.json({
    mode: "postgres",
    ticket: {
      id: updated.id,
      status: updated.status,
      startedAt: updated.startedAt?.toISOString(),
      completedAt: updated.completedAt?.toISOString(),
    },
  });
}
