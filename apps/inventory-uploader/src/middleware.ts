import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  getRequesterIpFromHeaders,
  inventoryAccessDeniedResponse,
  isInventoryIpAllowed,
} from "./lib/auth/accessControl";
import { inventoryLog } from "./lib/auth/inventoryLog";

const BASE_SECURITY_HEADERS = {
  "Content-Security-Policy":
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: blob: https:; font-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000",
} as const;

function applySecurityHeaders(response: Response): Response {
  for (const [name, value] of Object.entries(BASE_SECURITY_HEADERS)) {
    response.headers.set(name, value);
  }
  return response;
}

function deniedResponseFor(request: NextRequest): Response {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return applySecurityHeaders(inventoryAccessDeniedResponse());
  }
  return applySecurityHeaders(new NextResponse(null, { status: 404 }));
}

export function middleware(request: NextRequest) {
  // IP allowlist check — deny all when INVENTORY_ALLOWED_IPS is unset or empty.
  if (!isInventoryIpAllowed(request.headers)) {
    inventoryLog("warn", "ip_denied", {
      ip: getRequesterIpFromHeaders(request.headers),
      path: request.nextUrl.pathname,
    });
    return deniedResponseFor(request);
  }

  // Apply security headers to all allowed responses.
  const response = NextResponse.next();
  applySecurityHeaders(response);

  // Cookie-based auth redirect for UI paths (exclude login and API).
  if (
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/api/inventory/login") &&
    !request.nextUrl.pathname.startsWith("/_next/") &&
    request.nextUrl.pathname !== "/favicon.ico"
  ) {
    const cookie = request.cookies.get("inventory_admin");
    if (!cookie?.value) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
