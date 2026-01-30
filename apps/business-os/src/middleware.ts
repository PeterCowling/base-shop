/**
 * Auth Middleware
 * MVP-B1: Invite-only auth system
 *
 * Protects all routes except /login and /api/auth/*
 * Redirects unauthenticated users to /login when BUSINESS_OS_AUTH_ENABLED=true
 *
 * IMPORTANT: Auth is currently DISABLED by default (see below).
 *
 * Known limitation: iron-session requires Node.js crypto module which is not
 * available in Next.js middleware edge runtime. Solutions:
 * 1. Upgrade to Next.js canary + experimental.nodeMiddleware (unstable)
 * 2. Replace iron-session with edge-compatible session library
 * 3. Move auth to API route handlers instead of middleware
 *
 * For MVP, auth remains disabled (AUTH_ENABLED=false) to avoid runtime errors.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSession, getSessionUser } from "./lib/auth";

// Feature flag - auth is DISABLED by default due to edge runtime limitation
// DO NOT enable until iron-session edge compatibility is resolved
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
