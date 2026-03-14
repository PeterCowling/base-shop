import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  getRequesterIpFromHeaders,
  isPmIpAllowed,
  pmAccessDeniedResponse,
} from "./lib/auth/accessControl";
import { pmLog } from "./lib/auth/pmLog";

/**
 * Timing-safe string comparison that works in both edge and node runtimes.
 * Both strings must have the same length to be timing-safe (length is checked first).
 */
function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

const BASE_SECURITY_HEADERS = {
  "Content-Security-Policy":
    // i18n-exempt -- PM-0001 HTTP security header value, not UI copy [ttl=2027-12-31]
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: blob: https:; font-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()", // i18n-exempt -- PM-0001 HTTP security header value, not UI copy [ttl=2027-12-31]
  "Strict-Transport-Security": "max-age=31536000", // i18n-exempt -- PM-0001 HTTP security header value, not UI copy [ttl=2027-12-31]
} as const;

function applySecurityHeaders(response: Response): Response {
  for (const [name, value] of Object.entries(BASE_SECURITY_HEADERS)) {
    response.headers.set(name, value);
  }
  return response;
}

function deniedResponseFor(request: NextRequest): Response {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return applySecurityHeaders(pmAccessDeniedResponse());
  }
  return applySecurityHeaders(new NextResponse(null, { status: 404 }));
}

/**
 * Check whether the request carries a valid Caryina-PM bearer token.
 * This exempts Caryina proxy calls to /api/refunds from the session gate.
 * The token must be present and match CARYINA_PM_TOKEN exactly.
 */
function hasCaryinaPmBearerToken(request: NextRequest): boolean {
  const caryinaPmToken = process.env.CARYINA_PM_TOKEN?.trim();
  if (!caryinaPmToken) return false;

  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;

  // Expected format: "Bearer <CARYINA_PM_TOKEN>"
  if (!authHeader.startsWith("Bearer ")) return false;
  const candidate = authHeader.slice("Bearer ".length).trim();
  if (!candidate) return false;

  // Constant-time comparison to prevent timing attacks.
  return timingSafeStringEqual(candidate, caryinaPmToken);
}

export function middleware(request: NextRequest) {
  // IP allowlist check — deny all when PAYMENT_MANAGER_ALLOWED_IPS is unset or empty.
  if (!isPmIpAllowed(request.headers)) {
    pmLog("warn", "ip_denied", {
      ip: getRequesterIpFromHeaders(request.headers),
      path: request.nextUrl.pathname,
    });
    return deniedResponseFor(request);
  }

  // Apply security headers to all allowed responses.
  const response = NextResponse.next();
  applySecurityHeaders(response);

  const pathname = request.nextUrl.pathname;

  // /api/internal/* routes use their own token-based auth — exempt from session gate.
  if (pathname.startsWith("/api/internal/")) {
    return response;
  }

  // /api/refunds — allow Caryina proxy calls via bearer token (Phase 2 dual-write).
  if ((pathname === "/api/refunds" || pathname.startsWith("/api/refunds/")) && hasCaryinaPmBearerToken(request)) {
    return response;
  }

  // Cookie-based auth redirect for UI paths (exclude login and API).
  if (
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/api/auth/login") &&
    !pathname.startsWith("/_next/") &&
    pathname !== "/favicon.ico"
  ) {
    const cookie = request.cookies.get("payment_manager_admin");
    if (!cookie?.value) {
      const loginUrl = new URL("/login", request.url);
      const redirect = NextResponse.redirect(loginUrl);
      applySecurityHeaders(redirect);
      return redirect;
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
