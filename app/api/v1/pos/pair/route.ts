import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { REGISTER_COOKIE, signRegisterSession } from "@/lib/tenant";

type PairBody = { login?: string; password?: string };

function hashPassword(password: string): string {
  return createHash("sha256").update(`tanawa:${password}`).digest("hex");
}

/** Pair a tablet to a register using Access → Tablets credentials. */
export async function POST(request: Request) {
  let body: PairBody;
  try {
    body = (await request.json()) as PairBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const login = body.login?.trim();
  const password = body.password ?? "";
  if (!login || !password) {
    return NextResponse.json({ error: "Register login and password are required" }, { status: 400 });
  }

  const db = getDb();
  let session = null as null | {
    tenantId: string;
    locationId: string;
    registerId: string;
    registerTitle: string;
  };

  if (db) {
    const [register] = await db
      .select()
      .from(schema.registers)
      .where(eq(schema.registers.login, login))
      .limit(1);
    if (register && register.passwordHash === hashPassword(password)) {
      await db.update(schema.registers)
        .set({ lastSeenAt: new Date() })
        .where(and(eq(schema.registers.id, register.id), eq(schema.registers.tenantId, register.tenantId)));
      session = {
        tenantId: register.tenantId,
        locationId: register.locationId,
        registerId: register.id,
        registerTitle: register.title,
      };
    }
  } else if (login === "tanawa" && password === "m8hezbkf") {
    // Local/CI fallback matching the seeded tanawa register.
    session = {
      tenantId: "personal_demo",
      locationId: "loc-1",
      registerId: "register-1",
      registerTitle: "Register in “tanawa”",
    };
  }

  if (!session) {
    return NextResponse.json({ error: "Invalid register login or password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, register: session });
  response.cookies.set(REGISTER_COOKIE, signRegisterSession(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
