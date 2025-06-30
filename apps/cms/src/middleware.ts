// apps/cms/src/middleware.ts
import { canRead, canWrite } from "@auth";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authSecret } from "./auth/secret";

/**
 * Matches CMS write routes of the form `/cms/shop/<shop>/...` and captures the
 * shop slug.
 * Examples:
 *   /cms/shop/{shop}/products/{id}/edit
 *   /cms/shop/{shop}/settings
 *   /cms/shop/{shop}/media (and subpaths)
 */
const ADMIN_PATH_REGEX =
  /^\/cms\/shop\/([^/]+)\/(?:products\/[^/]+\/edit|settings|media(?:\/|$))/;

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  console.log("[middleware] request", pathname);

  /* Decode JWT (include secret only if present) */
  const token = await getToken({ req, secret: authSecret });

  const role = token?.role;
  console.log("[middleware] role", role);

  /* Skip static assets, auth endpoints, and login page */
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/favicon.ico"
  ) {
    console.log("[middleware] skip", pathname);

    return NextResponse.next();
  }

  /* Redirect unauthenticated users to /login */
  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    console.log("[middleware] redirect to login", url.toString());

    return NextResponse.redirect(url);
  }

  /* Enforce read access for CMS routes */
  if (pathname.startsWith("/cms") && !canRead(role)) {
    const matchShop = /\/cms\/([^/]+)/.exec(pathname);
    const url = new URL("/403", req.url);
    if (matchShop) url.searchParams.set("shop", matchShop[1]);
    console.log("[middleware] forbidden", url.toString());

    return NextResponse.rewrite(url, { status: 403 });
  }

  /* Block viewers from write routes */
  const match = ADMIN_PATH_REGEX.exec(pathname);
  if (!canWrite(role) && match) {
    const url = new URL("/403", req.url);
    url.searchParams.set("shop", match[1]);
    console.log("[middleware] viewer blocked", url.toString());

    return NextResponse.rewrite(url, { status: 403 });
  }
  console.log("[middleware] allow", pathname);

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\.[\\w]+$|favicon.ico).*)"],
};
