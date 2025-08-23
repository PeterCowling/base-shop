// apps/cms/src/middleware.ts

import type { Role } from "@auth/types";
import { canRead, canWrite } from "@auth/rbac";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authSecret } from "./auth/secret";
import { logger } from "@acme/shared-utils";

/**
 * JWT payload shape for this CMS.
 */
interface CmsToken {
  role?: Role;
}

/**
 * Matches CMS write routes of the form `/cms/shop/<shop>/...` and captures the
 * shop slug.
 *
 * Examples:
 *   /cms/shop/{shop}/products/{id}/edit
 *   /cms/shop/{shop}/settings
 *   /cms/shop/{shop}/media (and subpaths)
 */
const ADMIN_PATH_REGEX =
  /^\/cms\/shop\/([^/]+)\/(?:products\/[^/]+\/edit|settings|media(?:\/|$))/;

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  logger.info("request", { path: pathname });

  /* Decode JWT */
  const token = (await getToken({
    req,
    // Ensure the secret is treated as a string for JWT decoding
    secret: authSecret as string,
  })) as CmsToken | null;
  const role: Role | null = token?.role ?? null;
  logger.debug("role", { role });

  /* Skip static assets, auth endpoints, and login/signup pages */
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/favicon.ico"
  ) {
    logger.debug("skip", { path: pathname });
    return NextResponse.next();
  }

  /* Redirect unauthenticated users to /login */
  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    logger.info("redirect to login", { path: url.pathname });
    return NextResponse.redirect(url);
  }

  /* Enforce read access for CMS routes */
  if (pathname.startsWith("/cms") && !canRead(role)) {
    const matchShop = /\/cms\/([^/]+)/.exec(pathname);
    const url = new URL("/403", req.url);
    if (matchShop) url.searchParams.set("shop", matchShop[1]);
    logger.info("forbidden", {
      path: url.pathname,
      shop: matchShop ? matchShop[1] : undefined,
    });
    return NextResponse.rewrite(url, { status: 403 });
  }

  /* Block viewers from write routes */
  const match = ADMIN_PATH_REGEX.exec(pathname);
  if (!canWrite(role) && match) {
    const url = new URL("/403", req.url);
    url.searchParams.set("shop", match[1]);
    logger.info("viewer blocked", {
      path: url.pathname,
      shop: match[1],
    });
    return NextResponse.rewrite(url, { status: 403 });
  }

  logger.info("allow", { path: pathname });
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\.[\\w]+$|favicon.ico).*)"],
};
