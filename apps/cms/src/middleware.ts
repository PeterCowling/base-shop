// apps/cms/src/middleware.ts

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createHeadersObject } from "next-secure-headers";
import helmet from "helmet";
import type { IncomingMessage, ServerResponse } from "http";

import { canRead, canWrite } from "@acme/auth/rbac";
import type { Role } from "@acme/auth/types";
import { logger } from "@acme/lib/logger";
import {
  type RequestContext,
  withRequestContext,
} from "@acme/lib/context";

import { authSecret } from "./auth/secret";
// Avoid importing @acme/auth/session in middleware (Edge) because it pulls in
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
  /^\/cms\/shop\/([^/]+)\/(?:products\/[^/]+\/edit|settings|media(?:\/|$)|uploads(?:\/|$))/;

const SERVICE_NAME = "cms";
const ENV_LABEL: "dev" | "stage" | "prod" =
  process.env.NODE_ENV === "production" ? "prod" : "dev";

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
    directives.scriptSrc = [
      "'self'",
      "'unsafe-inline'", // i18n-exempt -- security directive keyword; not user-facing; CMS-1010
      "'unsafe-eval'", // i18n-exempt -- security directive keyword; not user-facing; CMS-1010
    ];
    directives.connectSrc = ["'self'", "ws:", "wss:"]; // i18n-exempt -- scheme keywords; not user-facing; CMS-1010
    directives.styleSrc = [
      "'self'",
      "'unsafe-inline'", // i18n-exempt -- security directive keyword; not user-facing; CMS-1010
    ];
    directives.imgSrc = ["'self'", "data:", "blob:"]; // i18n-exempt -- scheme keywords; not user-facing; CMS-1010
    directives.fontSrc = ["'self'", "data:"]; // i18n-exempt -- scheme keyword; not user-facing; CMS-1010
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
    "camera=(), microphone=(), geolocation=()"; // i18n-exempt -- HTTP header value; not user-facing; CMS-1010

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
  const shopMatch = /\/cms\/shop\/([^/]+)/.exec(pathname);
  const requestId =
    req.headers.get("x-request-id") ??
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`);

  const ctx: RequestContext = {
    requestId,
    env: ENV_LABEL,
    service: SERVICE_NAME,
    shopId: shopMatch?.[1],
  };

  return withRequestContext(ctx, () => handleRequest(req, pathname));
}

async function handleRequest(req: NextRequest, pathname: string) {
  logger.info("request", { path: pathname, service: SERVICE_NAME, env: ENV_LABEL });

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
      logger.warn("csrf failed", { path: pathname, service: SERVICE_NAME, env: ENV_LABEL });
      return applySecurityHeaders(
        new NextResponse("Forbidden", { status: 403 }) // i18n-exempt -- minimal error body for API clients; not UI copy; CMS-1010
      );
    }
  }

  /* Allow API routes to handle authentication and authorization */
  if (pathname.startsWith("/api")) {
    logger.debug("api route", { path: pathname, service: SERVICE_NAME, env: ENV_LABEL });
    return applySecurityHeaders(NextResponse.next());
  }

  /* Skip static assets, auth endpoints, and login/signup pages */
  if (
    pathname.startsWith("/_next") ||
    pathname === "/uploads" ||
    pathname.startsWith("/uploads/") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/favicon.ico"
  ) {
    logger.debug("skip", { path: pathname, service: SERVICE_NAME, env: ENV_LABEL });
    return applySecurityHeaders(NextResponse.next());
  }

  /* Decode JWT */
  const token = (await getToken({
    req,
    // Ensure the secret is treated as a string for JWT decoding
    secret: authSecret as string,
  })) as CmsToken | null;
  const role: Role | null = token?.role ?? null;
  logger.debug("role", { role, service: SERVICE_NAME, env: ENV_LABEL });

  /* Redirect unauthenticated users to /login */
  if (!role) {
    const url = new URL(req.url);
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    logger.info("redirect to login", { path: url.pathname, service: SERVICE_NAME, env: ENV_LABEL }); // i18n-exempt -- structured log label; not user-facing; CMS-1010
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
      service: SERVICE_NAME,
      env: ENV_LABEL,
    });
    // In some Jest/node environments NextResponse.rewrite may not be available.
    // Fall back to crafting a middleware rewrite response manually.
    const rewritten = (() => {
      const api = NextResponse as unknown as {
        rewrite?: (input: URL, init?: ResponseInit & { status?: number }) => NextResponse;
      };
      if (typeof api.rewrite === "function") {
        return api.rewrite(url, { status: 403 });
      }
      return new Response(null, {
        status: 403,
        headers: { "x-middleware-rewrite": url.toString() },
      }) as unknown as NextResponse;
    })();
    return applySecurityHeaders(rewritten);
  }

  /* Block viewers from write routes */
  const match = ADMIN_PATH_REGEX.exec(pathname);
  if (!canWrite(role) && match) {
    const url = new URL("/403", req.url);
    url.searchParams.set("shop", match[1]);
    logger.info("viewer blocked", { // i18n-exempt -- structured log label; not user-facing; CMS-1010
      path: url.pathname,
      shop: match[1],
      service: SERVICE_NAME,
      env: ENV_LABEL,
    });
    const rewritten = (() => {
      const api = NextResponse as unknown as {
        rewrite?: (input: URL, init?: ResponseInit & { status?: number }) => NextResponse;
      };
      if (typeof api.rewrite === "function") {
        return api.rewrite(url, { status: 403 });
      }
      return new Response(null, {
        status: 403,
        headers: { "x-middleware-rewrite": url.toString() },
      }) as unknown as NextResponse;
    })();
    return applySecurityHeaders(rewritten);
  }

  logger.info("allow", { path: pathname, service: SERVICE_NAME, env: ENV_LABEL });
  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next|.*\\.[\\w]+$|favicon.ico).*)"],
};
