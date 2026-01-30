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

// Feature flag - auth is DISABLED by default due to edge runtime limitation
// DO NOT enable until iron-session edge compatibility is resolved
const AUTH_ENABLED = process.env.BUSINESS_OS_AUTH_ENABLED === "true";

export async function middleware(_request: NextRequest) {
  // Auth is disabled - iron-session incompatible with edge runtime
  // To enable auth, must first resolve edge runtime limitation (see file header)
  if (!AUTH_ENABLED) {
    return NextResponse.next();
  }

  // Auth is not currently functional due to iron-session edge runtime incompatibility
  // This code path should not be reached unless AUTH_ENABLED is explicitly set to true
  throw new Error(
    "Auth middleware is not supported in edge runtime. " +
    "Set BUSINESS_OS_AUTH_ENABLED=false or upgrade to Next.js canary with experimental.nodeMiddleware. " +
    "See middleware.ts header for details."
  );
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
