// middleware.ts (moved from repo root)

import { NextResponse, type NextRequest } from "next/server";
import { createHeadersObject } from "next-secure-headers";
import helmet from "helmet";
import crypto from "crypto";

export function middleware(request: NextRequest) {
  // Per-request CSP nonce (used by analytics loader)
  const nonce = crypto.randomBytes(16).toString("base64");

  let headers: Record<string, string> = {};
  try {
    headers = createHeadersObject({
      // We'll set a custom CSP below to include the nonce and GA domains.
      contentSecurityPolicy: false as any,
      forceHTTPSRedirect: [
        true,
        { maxAge: 60 * 60 * 24 * 365, includeSubDomains: true, preload: true },
      ],
      frameGuard: "deny",
      referrerPolicy: "no-referrer",
      nosniff: "nosniff",
      noopen: "noopen",
    });
  } catch {
    // If next-secure-headers fails, continue with helmet headers only.
    headers = {};
  }

  const helmetHeaders: Record<string, string> = {};
  const helmetRes = {
    setHeader(key: string, value: unknown) {
      helmetHeaders[key] = Array.isArray(value) ? value.join("; ") : String(value);
    },
  };

  helmet.crossOriginOpenerPolicy()(undefined as any, helmetRes as any, () => {});
  helmet.crossOriginEmbedderPolicy()(undefined as any, helmetRes as any, () => {});
  helmetHeaders["Permissions-Policy"] =
    "camera=(), microphone=(), geolocation=(), gyroscope=()";

  const response = NextResponse.next();
  for (const [key, value] of Object.entries({ ...headers, ...helmetHeaders })) {
    response.headers.set(key, value);
  }

  // Compose CSP including nonce and GA domains; avoid unsafe-inline.
  const connectExtra: string[] = [
    "https://api.cloudflare.com",
    "https://gateway.ai.cloudflare.com",
  ];

  // Optionally allow R2 public base URL if cross-origin
  try {
    const r2 = process.env.R2_PUBLIC_BASE_URL;
    if (r2) {
      const { origin } = new URL(r2);
      if (origin && origin !== "self") {
        connectExtra.push(origin);
      }
    }
    const acct = process.env.CLOUDFLARE_ACCOUNT_ID;
    if (acct) {
      connectExtra.push(`https://${acct}.r2.cloudflarestorage.com`);
    }
  } catch {}

  const imgExtra: string[] = [];
  try {
    const r2 = process.env.R2_PUBLIC_BASE_URL;
    if (r2) {
      const { origin } = new URL(r2);
      if (origin) imgExtra.push(origin);
    }
  } catch {}

  const scriptExtra: string[] = [];
  try {
    const mv = process.env.NEXT_PUBLIC_MODEL_VIEWER_SRC;
    if (mv && /^https?:\/\//.test(mv)) scriptExtra.push(new URL(mv).origin);
    else if (!mv) scriptExtra.push("https://unpkg.com");
  } catch {}
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // GA4 script + our inline init guarded by nonce
    `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://www.google-analytics.com ${scriptExtra.join(' ')}`,
    // Allow GA beacons
    `connect-src 'self' https://www.google-analytics.com ${connectExtra.join(" ")}`,
    // Allow GA pixel requests + R2 public origin
    `img-src 'self' data: https://www.google-analytics.com ${imgExtra.join(" ")}`,
  ].join("; ");
  response.headers.set("Content-Security-Policy", csp);

  // Expose nonce to the client via a cookie for next/script usage.
  // Not HttpOnly so client code can read it; short-lived (session).
  response.headers.append(
    "Set-Cookie",
    `csp-nonce=${encodeURIComponent(nonce)}; Path=/; SameSite=Lax`
  );

  return response;
}

export const config = {
  matcher: "/:path*",
};

