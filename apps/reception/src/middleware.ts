import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;
const PERMISSIONS_POLICY = "camera=(), microphone=(), geolocation=()";
const FIREBASE_CONNECT_SOURCES = [
  "https://*.googleapis.com",
  "https://*.firebaseio.com",
  "wss://*.firebaseio.com",
  "https://*.firebase.com",
  "https://*.firebasedatabase.app",
  "wss://*.firebasedatabase.app",
] as const;

function getAlloggiatiScriptSources(): string[] {
  const configuredUrl = process.env.NEXT_PUBLIC_ALLOGGIATI_SCRIPT_URL?.trim();
  if (!configuredUrl) {
    return [];
  }

  try {
    const parsedUrl = new URL(configuredUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return [];
    }

    const allowedSources = new Set([parsedUrl.origin]);
    if (parsedUrl.hostname === "script.google.com") {
      allowedSources.add("https://script.googleusercontent.com");
    }

    return [...allowedSources];
  } catch {
    return [];
  }
}

function buildContentSecurityPolicy(): string {
  const scriptElementSources = ["'self'", "'unsafe-inline'", ...getAlloggiatiScriptSources()];

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "manifest-src 'self'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline'",
    `script-src-elem ${scriptElementSources.join(" ")}`,
    `connect-src 'self' ${FIREBASE_CONNECT_SOURCES.join(" ")}`,
    "worker-src 'self' blob:",
    "frame-src https://accounts.google.com https://*.firebaseapp.com",
  ].join("; ");
}

function isLocalDevelopmentHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function applySecurityHeaders(response: NextResponse, request: NextRequest): NextResponse {
  response.headers.set("Content-Security-Policy", buildContentSecurityPolicy());
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  // Firebase Auth popup/iframe flows do not work under require-corp.
  response.headers.set("Cross-Origin-Embedder-Policy", "unsafe-none");
  response.headers.set("Permissions-Policy", PERMISSIONS_POLICY);
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Download-Options", "noopen");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");

  if (!isLocalDevelopmentHost(request.nextUrl.hostname)) {
    response.headers.set(
      "Strict-Transport-Security",
      `max-age=${ONE_YEAR_IN_SECONDS}; includeSubDomains; preload`
    );
  }

  return response;
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  return applySecurityHeaders(response, request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except Next.js internals and static files.
     * Using array form with explicit negative lookahead avoids path-to-regexp
     * wildcard issues in opennext's routingHandler.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
