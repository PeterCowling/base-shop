// apps/shop-abc/middleware.ts

import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  console.log("[middleware] bundle loaded");
  const { pathname } = new URL(request.url);

  // 1. Skip obvious static assets and Next internals
  if (pathname.startsWith("/_next/") || /\.[\w]+$/.test(pathname)) {
    return NextResponse.next();
  }

  // 2. Allow known locales to pass through
  if (/^\/(en|de|it)(\/|$)/.test(pathname)) {
    return NextResponse.next();
  }

  // 3. Everything else → default locale
  return NextResponse.redirect(new URL("/en", request.url));
}

/** Match every pathname except API routes, Next internals and static files */
export const config = {
  matcher: ["/((?!api/|_next/|.*\\.[\\w]+$).*)"],
};
