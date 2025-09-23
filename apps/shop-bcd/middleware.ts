import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";

export function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url);

  // Skip Next internals + static files
  if (pathname.startsWith("/_next/") || /\.[\w]+$/.test(pathname)) {
    return NextResponse.next();
  }

  // Allow known locale prefixes
  if (/^\/(en|de|it)(\/|$)/.test(pathname)) {
    const res = NextResponse.next();
    try {
      const consent = request.cookies.get("consent.analytics")?.value === "true";
      const id = process.env.NEXT_PUBLIC_GA4_ID;
      if (consent && id) {
        const inline = `window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', '${id}');`;
        const hash = crypto.createHash('sha256').update(inline).digest('base64');
        const csp = [
          "default-src 'self'",
          `script-src 'self' 'sha256-${hash}' https://www.googletagmanager.com https://www.google-analytics.com`,
          "img-src 'self' data: https://www.google-analytics.com",
          "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com",
          "style-src 'self' 'unsafe-inline'",
        ].join('; ');
        res.headers.set('Content-Security-Policy', csp);
      }
    } catch {}
    return res;
  }

  // Default: redirect “/” or unknown prefixes to English
  return NextResponse.redirect(new URL("/en", request.url));
}

/** Run on every non-static path */
export const config = {
  matcher: ["/", "/((?!api/|_next/|.*\\.[\\w]+$).*)"],
};
