// i18n-exempt file -- ABC-123 ttl=2025-06-30
import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { LOCALES } from "@acme/i18n";

// Helper: check locale prefix without using dynamic RegExp
const hasLocalePrefix = (path: string): boolean =>
  LOCALES.some((l) => path === `/${l}` || path.startsWith(`/${l}/`));

export function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url);

  // Skip Next internals + static files
  if (pathname.startsWith("/_next/") || /\.[\w]+$/.test(pathname)) {
    return NextResponse.next();
  }

  // Allow known locale prefixes
  if (hasLocalePrefix(pathname)) {
    const res = NextResponse.next();
    try {
      const consent = request.cookies.get("consent.analytics")?.value === "true";
      const id = process.env.NEXT_PUBLIC_GA4_ID;
      if (consent && id) {
        const inline = `window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', '${id}');`;
        const hash = crypto.createHash('sha256').update(inline).digest('base64');
        const connectExtra: string[] = [
          "https://api.cloudflare.com",
          "https://gateway.ai.cloudflare.com",
        ];
        try {
          const r2 = process.env.R2_PUBLIC_BASE_URL;
          if (r2) {
            const { origin } = new URL(r2);
            if (origin) connectExtra.push(origin);
          }
          const acct = process.env.CLOUDFLARE_ACCOUNT_ID;
          if (acct) connectExtra.push(`https://${acct}.r2.cloudflarestorage.com`);
        } catch {}

        const imgExtra: string[] = [];
        try {
          const r2o = process.env.R2_PUBLIC_BASE_URL;
          if (r2o) imgExtra.push(new URL(r2o).origin);
        } catch {}

        const scriptExtra: string[] = [];
        try {
          const mv = process.env.NEXT_PUBLIC_MODEL_VIEWER_SRC;
          if (mv && /^https?:\/\//.test(mv)) scriptExtra.push(new URL(mv).origin);
          else if (!mv) scriptExtra.push("https://unpkg.com");
        } catch {}
        const csp = [
          "default-src 'self'", // i18n-exempt -- ABC-123 HTTP header policy value, not user-facing copy [ttl=2025-06-30]
          "base-uri 'self'", // i18n-exempt
          "object-src 'none'", // i18n-exempt
          "form-action 'self'", // i18n-exempt
          "frame-ancestors 'none'", // i18n-exempt
          `script-src 'self' 'sha256-${hash}' https://www.googletagmanager.com https://www.google-analytics.com ${scriptExtra.join(' ')}`,
          `img-src 'self' data: blob: https://www.google-analytics.com ${imgExtra.join(' ')}`,
          `connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com ${connectExtra.join(' ')}`,
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // i18n-exempt -- ABC-123 HTTP header policy value, not user-facing copy [ttl=2025-06-30]
          "font-src 'self' data: https://fonts.gstatic.com", // i18n-exempt
        ].join('; ');
        res.headers.set('Content-Security-Policy', csp);
      }
    } catch {}
    return res;
  }

  // Default: redirect “/” or unknown prefixes to default locale (first in LOCALES)
  return NextResponse.redirect(new URL(`/${LOCALES[0]}`, request.url));
}

/** Run on every non-static path */
export const config = {
  matcher: ["/", "/((?!api/|_next/|.*\\.[\\w]+$).*)"],
};
