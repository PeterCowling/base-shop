// apps/cms/src/middleware.ts
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** Matches write-routes like /cms/{shop}/products/{id}/edit and captures the shop slug */
const ADMIN_PATH_REGEX = /^\/cms\/([^/]+)\/products\/[^/]+\/edit/;

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  /* Decode JWT (include secret only if present) */
  const token = await getToken(
    process.env.NEXTAUTH_SECRET
      ? { req, secret: process.env.NEXTAUTH_SECRET }
      : { req }
  );
  const role = token?.role;

  /* Skip static assets, auth endpoints, and login page */
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/login" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  /* Redirect unauthenticated users to /login */
  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  /* Block viewers from write routes */
  const match = ADMIN_PATH_REGEX.exec(pathname);
  if (role === "viewer" && match) {
    const url = new URL("/403", req.url);
    url.searchParams.set("shop", match[1]);
    return NextResponse.rewrite(url, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\.[\\w]+$|favicon.ico).*)"],
};
