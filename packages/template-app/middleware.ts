// packages/template-app/middleware.ts

import { type NextRequest,NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url);

  // Skip Next internals + static files
  if (pathname.startsWith("/_next/") || /\.[\w]+$/.test(pathname)) {
    return NextResponse.next();
  }

  // Allow known locale prefixes
  if (/^\/(en|de|it)(\/|$)/.test(pathname)) {
    return NextResponse.next();
  }

  // Default: redirect “/” or unknown prefixes to English
  return NextResponse.redirect(new URL("/en", request.url));
}

/** Run on every non-static path */
export const config = {
  matcher: ["/", "/((?!api/|_next/|.*\\.[\\w]+$).*)"],
};
