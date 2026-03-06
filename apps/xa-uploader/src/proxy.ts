import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isUploaderIpAllowedByHeaders, uploaderAccessDeniedJsonResponse } from "./lib/accessControl";

/* eslint-disable ds/no-hardcoded-copy -- XAUP-0001 [ttl=2026-12-31] protocol security header literals */
const BASE_SECURITY_HEADERS = {
  // i18n-exempt -- XAUP-0001 [ttl=2026-12-31] protocol security header value
  "Content-Security-Policy":
    // i18n-exempt -- XAUP-0001 [ttl=2026-12-31] protocol security header value
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: blob: https:; font-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000", // i18n-exempt -- XAUP-0001 [ttl=2026-12-31] protocol security header value
} as const;
/* eslint-enable ds/no-hardcoded-copy */

function applySecurityHeaders(response: Response): Response {
  for (const [name, value] of Object.entries(BASE_SECURITY_HEADERS)) {
    response.headers.set(name, value);
  }
  return response;
}

function deniedResponseFor(request: NextRequest): Response {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return applySecurityHeaders(uploaderAccessDeniedJsonResponse());
  }
  return applySecurityHeaders(new NextResponse(null, { status: 404 }));
}

export function proxy(request: NextRequest) {
  if (!isUploaderIpAllowedByHeaders(request.headers)) {
    return deniedResponseFor(request);
  }
  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
