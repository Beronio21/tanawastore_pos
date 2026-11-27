import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

// Keep middleware free of node:crypto by inlining the cookie names.
const ONBOARDING_COOKIE = "tanawa_onboarding";
const REGISTER_COOKIE = "tanawa_register_session";

// E2E/perf suites run the server with E2E_TEST_MODE=1 (see .env.local / playwright configs).
// Never set this variable in a real deployment — it disables Clerk route
// protection so unauthenticated browser tests can reach /manage and /pos.
const E2E_TEST_MODE =
  process.env.E2E_TEST_MODE === "1" && process.env.NODE_ENV !== "production";

/** Routes that require a signed-in Clerk session: the console and the POS terminal. */
function isProtectedPath(pathname: string) {
  return (
    pathname === "/manage" ||
    pathname.startsWith("/manage/") ||
    pathname === "/pos" ||
    pathname.startsWith("/pos/")
  );
}

/** Pairing endpoints authenticate with register credentials, not a Clerk session. */
function isPublicPairingPath(pathname: string) {
  return pathname === "/pos/pair" || pathname.startsWith("/api/v1/pos/pair") || pathname.startsWith("/api/v1/pos/unpair");
}

/** Kitchen Kit and media uploads accept paired register cookies as well. */
function isRegisterSessionPath(pathname: string) {
  return (
    pathname === "/pos" ||
    pathname.startsWith("/pos/") ||
    pathname === "/api/v1/receipts/sync" ||
    pathname.startsWith("/api/v1/kitchen/") ||
    pathname === "/api/v1/uploads" ||
    pathname.startsWith("/api/v1/payments/paymongo/")
  );
}

const clerk = clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;

  // Billing webhooks are public but verified by their signature inside the route.
  if (pathname === "/api/webhooks/billing") return NextResponse.next();
  // Onboarding launch endpoint is reachable with a fresh Clerk session.
  if (pathname.startsWith("/api/v1/onboarding")) return NextResponse.next();
  if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) {
    if (!E2E_TEST_MODE) await auth.protect();
    return NextResponse.next();
  }
  if (isPublicPairingPath(pathname)) return NextResponse.next();

  const registerSession = req.cookies.get(REGISTER_COOKIE)?.value;
  if (registerSession && isRegisterSessionPath(pathname)) {
    return NextResponse.next();
  }

  if (isProtectedPath(pathname)) {
    if (!E2E_TEST_MODE) await auth.protect();
    if (
      req.cookies.get(ONBOARDING_COOKIE)?.value === "incomplete" &&
      pathname.startsWith("/manage")
    ) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }
  return NextResponse.next();
});

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  // Second pass of Clerk's internal auth-header rewrite: clerkMiddleware already
  // resolved auth state and injected x-clerk-* headers for this request. Next.js
  // re-enters proxy.ts for the rewrite, so detect that pass and let it through —
  // re-running Clerk here loops forever. Downstream auth() still verifies the
  // token signature, so forged headers cannot impersonate a session.
  if (
    req.headers.has("x-clerk-auth-status") &&
    req.headers.has("x-clerk-auth-reason") &&
    req.headers.has("x-clerk-clerk-url")
  ) {
    return NextResponse.next();
  }
  return clerk(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
