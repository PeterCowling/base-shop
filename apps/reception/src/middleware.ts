import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(_request: NextRequest) {
  const response = NextResponse.next();

  // Override Next.js strict default CSP to allow Firebase and inline scripts
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      // Firebase Auth loads scripts from gstatic.com and apis.google.com
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://www.gstatic.com https://apis.google.com https://*.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://www.gstatic.com",
      // Firebase Realtime DB uses *.firebasedatabase.app (not *.firebaseio.com)
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebase.com https://*.firebasedatabase.app wss://*.firebasedatabase.app https://cloudflareinsights.com",
      "img-src 'self' data: blob: https://www.gstatic.com",
      "font-src 'self' data: https://www.gstatic.com",
      "worker-src 'self' blob:",
      // Firebase Auth uses a popup/iframe from accounts.google.com
      "frame-src https://accounts.google.com https://*.firebaseapp.com",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; ")
  );

  // Remove COEP — Firebase resources don't send CORP headers
  response.headers.set("Cross-Origin-Embedder-Policy", "unsafe-none");

  return response;
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
