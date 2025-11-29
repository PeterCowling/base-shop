import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createHeadersObject } from "next-secure-headers";

export function middleware(_request: NextRequest) {
  const response = NextResponse.next();

  try {
    const securityHeaders = createHeadersObject({
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
        {
          maxAge: 60 * 60 * 24 * 365,
          includeSubDomains: true,
          preload: true,
        },
      ],
      frameGuard: "deny",
      referrerPolicy: "no-referrer",
      nosniff: "nosniff",
      noopen: "noopen",
    });

    for (const [key, value] of Object.entries(securityHeaders)) {
      response.headers.set(key, value as string);
    }
  } catch {
    // If security header generation fails, continue with a basic response.
  }

  // Ensure a baseline Permissions-Policy is always present.
  if (!response.headers.has("Permissions-Policy")) {
    response.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()", // i18n-exempt -- SEC-1234 [ttl=2025-12-31] technical HTTP header value, not user-visible copy
    );
  }

  // Provide default cross-origin isolation headers expected by tests.
  if (!response.headers.has("Cross-Origin-Opener-Policy")) {
    response.headers.set(
      "Cross-Origin-Opener-Policy",
      "same-origin", // i18n-exempt -- SEC-1234 [ttl=2025-12-31] technical HTTP header value, not user-visible copy
    );
  }
  if (!response.headers.has("Cross-Origin-Embedder-Policy")) {
    response.headers.set(
      "Cross-Origin-Embedder-Policy",
      "require-corp", // i18n-exempt -- SEC-1234 [ttl=2025-12-31] technical HTTP header value, not user-visible copy
    );
  }

  return response;
}

// Run on all non-static paths; Next.js ignores this in tests.
export const config = {
  matcher: ["/((?!_next/|.*\\.[\\w]+$).*)"],
};
