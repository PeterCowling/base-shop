// apps/cms/src/middleware.ts
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Role } from "./auth/roles";

/**
 * Matches CMS write routes and captures the shop slug.
 * Examples:
 *   /cms/{shop}/products/{id}/edit
 *   /cms/{shop}/settings
 *   /cms/{shop}/media (and subpaths)
 *   /shop/{shop}/products/{id}/edit
 */
const ADMIN_PATH_REGEX =
  /^\/(?:cms|shop)\/([^/]+)\/(?:products\/[^/]+\/edit|settings|media(?:\/|$))/;

/** Allowed CMS paths per role */
const ROLE_PATHS: Record<Role, RegExp[]> = {
  admin: [/^\/cms\//],
  ShopAdmin: [/^\/cms\//],
  CatalogManager: [/^\/cms\/[^/]+\/products/, /^\/cms\/[^/]+\/media/],
  ThemeEditor: [/^\/cms\/[^/]+\/settings/, /^\/cms\/[^/]+\/media/],
  viewer: [/^\/cms\//],
};

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
    pathname === "/signup" ||
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

  /* Enforce role-based access for CMS routes */
  if (pathname.startsWith("/cms")) {
    const allowed = ROLE_PATHS[role as Role] ?? [];
    const isAllowed = allowed.some((re) => re.test(pathname));
    if (!isAllowed) {
      const matchShop = /\/cms\/([^/]+)/.exec(pathname);
      const url = new URL("/403", req.url);
      if (matchShop) url.searchParams.set("shop", matchShop[1]);
      return NextResponse.rewrite(url, { status: 403 });
    }
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
