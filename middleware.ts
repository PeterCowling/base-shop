// middleware.ts

import { NextResponse, type NextRequest } from "next/server";
import { createHeadersObject } from "next-secure-headers";
import helmet from "helmet";

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

  const helmetHeaders: Record<string, string> = {};
  const helmetRes = {
    setHeader(key: string, value: unknown) {
      helmetHeaders[key] = Array.isArray(value) ? value.join("; ") : String(value);
    },
  };

  helmet.crossOriginOpenerPolicy()(undefined as any, helmetRes as any, () => {});
  helmet.crossOriginEmbedderPolicy()(undefined as any, helmetRes as any, () => {});
  helmetHeaders["Permissions-Policy"] =
    "camera=(), microphone=(), geolocation=()";

  const response = NextResponse.next();
  for (const [key, value] of Object.entries({ ...headers, ...helmetHeaders })) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: "/:path*",
};
