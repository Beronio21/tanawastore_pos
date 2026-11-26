import { clerkMiddleware } from "@clerk/nextjs/server";

/** Routes that require a signed-in Clerk session: the console and the POS terminal. */
function isProtectedPath(pathname: string) {
  return (
    pathname === "/manage" ||
    pathname.startsWith("/manage/") ||
    pathname === "/pos" ||
    pathname.startsWith("/pos/")
  );
}

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedPath(req.nextUrl.pathname)) await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
