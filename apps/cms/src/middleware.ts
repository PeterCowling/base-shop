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
import type { IncomingMessage, ServerResponse } from "http";
// Avoid importing @auth/session in middleware (Edge) because it pulls in
// Node-only dependencies like 'crypto' via iron-session. We'll perform a
// lightweight CSRF check inline using the request cookies instead.

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
  const isDev = process.env.NODE_ENV !== "production";

  type CspDirectiveValue = string | string[];

  const directives: Record<string, CspDirectiveValue> = {
    defaultSrc: "'self'",
    baseUri: "'self'",
    objectSrc: "'none'",
    formAction: "'self'",
    frameAncestors: "'none'",
  };

  // In development, relax CSP to allow Next.js dev client features
  // (react-refresh, eval-based source maps, HMR websockets, etc.).
  if (isDev) {
    directives.scriptSrc = ["'self'", "'unsafe-inline'", "'unsafe-eval'"];
    directives.connectSrc = ["'self'", "ws:", "wss:"];
    directives.styleSrc = ["'self'", "'unsafe-inline'"];
    directives.imgSrc = ["'self'", "data:", "blob:"];
    directives.fontSrc = ["'self'", "data:"];
  }

  const base = createHeadersObject({
    contentSecurityPolicy: { directives },
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

  helmet.crossOriginOpenerPolicy()(
    undefined as unknown as IncomingMessage,
    helmetRes as unknown as ServerResponse,
    () => {}
  );
  helmet.crossOriginEmbedderPolicy()(
    undefined as unknown as IncomingMessage,
    helmetRes as unknown as ServerResponse,
    () => {}
  );
  helmetHeaders["Permissions-Policy"] =
    "camera=(), microphone=(), geolocation=()";

  return { ...base, ...helmetHeaders } as Record<string, string>;
})();

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

  /* CSRF protection for mutating API routes */
  if (
    pathname.startsWith("/api") &&
    !pathname.startsWith("/api/auth") &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(method)
  ) {
    const csrfToken = req.headers.get("x-csrf-token");
    const cookieToken = req.cookies.get("csrf_token")?.value || null;
    if (!csrfToken || !cookieToken || csrfToken !== cookieToken) {
      logger.warn("csrf failed", { path: pathname });
      return applySecurityHeaders(
        new NextResponse("Forbidden", { status: 403 })
      );
    }
  }

  /* Allow API routes to handle authentication and authorization */
  if (pathname.startsWith("/api")) {
    logger.debug("api route", { path: pathname });
    return applySecurityHeaders(NextResponse.next());
  }

  /* Skip static assets, auth endpoints, and login/signup pages */
  if (
    pathname.startsWith("/_next") ||
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
    // In some Jest/node environments NextResponse.rewrite may not be available.
    // Fall back to crafting a middleware rewrite response manually.
    const rewritten =
      typeof (NextResponse as any).rewrite === "function"
        ? NextResponse.rewrite(url, { status: 403 })
        : new Response(null, {
            status: 403,
            headers: { "x-middleware-rewrite": url.toString() },
          });
    return applySecurityHeaders(rewritten as NextResponse);
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
    const rewritten =
      typeof (NextResponse as any).rewrite === "function"
        ? NextResponse.rewrite(url, { status: 403 })
        : new Response(null, {
            status: 403,
            headers: { "x-middleware-rewrite": url.toString() },
          });
    return applySecurityHeaders(rewritten as NextResponse);
  }

  logger.info("allow", { path: pathname });
  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next|.*\\.[\\w]+$|favicon.ico).*)"],
};
