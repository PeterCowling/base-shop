// middleware.ts

import { NextResponse, type NextRequest } from "next/server";
import { createHeadersObject } from "next-secure-headers";

export function middleware(request: NextRequest) {
  const headers = createHeadersObject({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: "'self'",
        baseUri: "'self'",
        objectSrc: "'none'",
        formAction: "'self'",
        frameAncestors: "'none'",
      },
    },
    forceHTTPSRedirect: [
      true,
      { maxAge: 60 * 60 * 24 * 365, includeSubDomains: true, preload: true },
    ],
    frameGuard: "deny",
    referrerPolicy: "no-referrer",
    nosniff: "nosniff",
    noopen: "noopen",
  });

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: "/:path*",
};
