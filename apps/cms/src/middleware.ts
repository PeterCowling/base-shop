// apps/cms/src/middleware.ts

import type { Role } from "@auth/types";
import { canRead, canWrite } from "@auth/rbac";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authSecret } from "./auth/secret";
import { logger } from "@acme/shared-utils";
import { createHeadersObject } from "next-secure-headers";
import helmet from "helmet";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { validateCsrfToken } from "@auth";

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

const securityHeaders = (() => {
  const base = createHeadersObject({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: "'self'",
        baseUri: "'self'",
        objectSrc: "'none'",
        formAction: "'self'",
        frameAncestors: "'none'",
      },
    },
    forceHTTPSRedirect: [
      true,
      { maxAge: 60 * 60 * 24 * 365, includeSubDomains: true, preload: true },
    ],
    frameGuard: "deny",
    referrerPolicy: "no-referrer",
    nosniff: "nosniff",
    noopen: "noopen",
  });

  const helmetHeaders: Record<string, string> = {};
  const helmetRes = {
    setHeader(key: string, value: unknown) {
      helmetHeaders[key] = Array.isArray(value)
        ? value.join("; ")
        : String(value);
    },
  };

  helmet.crossOriginOpenerPolicy()(undefined as any, helmetRes as any, () => {});
  helmet.crossOriginEmbedderPolicy()(undefined as any, helmetRes as any, () => {});
  helmetHeaders["Permissions-Policy"] =
    "camera=(), microphone=(), geolocation=()";

  return { ...base, ...helmetHeaders } as Record<string, string>;
})();

const loginLimiter = new RateLimiterMemory({ points: 5, duration: 60 });

function applySecurityHeaders(res: NextResponse) {
  for (const [key, value] of Object.entries(securityHeaders)) {
    res.headers.set(key, value);
  }
  return res;
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  logger.info("request", { path: pathname });

  const method = req.method?.toUpperCase() ?? "GET";

  /* Rate limit login/signin endpoints */
  if (pathname === "/api/login" || pathname === "/api/auth/signin") {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    try {
      await loginLimiter.consume(ip);
    } catch {
      logger.warn("rate limit", { ip });
      return applySecurityHeaders(
        new NextResponse("Too Many Requests", { status: 429 })
      );
    }
  }

  /* CSRF protection for mutating API routes */
  if (
    pathname.startsWith("/api") &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(method)
  ) {
    const csrfToken = req.headers.get("x-csrf-token");
    if (!(await validateCsrfToken(csrfToken))) {
      logger.warn("csrf failed", { path: pathname });
      return applySecurityHeaders(
        new NextResponse("Forbidden", { status: 403 })
      );
    }
  }

  /* Skip static assets, auth endpoints, and login/signup pages */
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/favicon.ico"
  ) {
    logger.debug("skip", { path: pathname });
    return applySecurityHeaders(NextResponse.next());
  }

  /* Decode JWT */
  const token = (await getToken({
    req,
    // Ensure the secret is treated as a string for JWT decoding
    secret: authSecret as string,
  })) as CmsToken | null;
  const role: Role | null = token?.role ?? null;
  logger.debug("role", { role });

  /* Redirect unauthenticated users to /login */
  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    logger.info("redirect to login", { path: url.pathname });
    return applySecurityHeaders(NextResponse.redirect(url));
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
    return applySecurityHeaders(NextResponse.rewrite(url, { status: 403 }));
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
    return applySecurityHeaders(NextResponse.rewrite(url, { status: 403 }));
  }

  logger.info("allow", { path: pathname });
  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next|.*\\.[\\w]+$|favicon.ico).*)"],
};
