/**
 * Auth Middleware
 * MVP-B1: Invite-only auth system
 *
 * Protects all routes except /login and /api/auth/*
 * Redirects unauthenticated users to /login when BUSINESS_OS_AUTH_ENABLED=true
 *
 * Runtime: Node.js (required for iron-session crypto operations)
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSession, getSessionUser } from "./lib/auth";

// Configure middleware to run in Node.js runtime (iron-session requires crypto module)
export const runtime = "nodejs";

// Feature flag - auth is disabled by default for backward compatibility
const AUTH_ENABLED = process.env.BUSINESS_OS_AUTH_ENABLED === "true";

// Public paths that don't require authentication
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout"];

export async function middleware(request: NextRequest) {
  // Skip auth check if feature flag is disabled
  if (!AUTH_ENABLED) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check session
  const response = NextResponse.next();
  const session = await getSession(request, response);
  const user = getSessionUser(session);

  // Redirect to login if not authenticated
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

// Apply middleware to all routes except static files and Next.js internals
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
