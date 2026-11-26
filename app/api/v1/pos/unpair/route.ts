import { NextResponse } from "next/server";
import { REGISTER_COOKIE } from "@/lib/tenant";

/** Forget the tablet pairing cookie. */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(REGISTER_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
