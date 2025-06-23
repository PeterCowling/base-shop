// src/middleware.ts  ← replace everything
import { NextResponse } from "next/server";

export function middleware(request: Request) {
  const { pathname } = new URL(request.url);

  /* 1.  Ignore all “obvious” assets:
         - has a dot + extension  (/hero/slide-1.jpg, /fonts/geist.woff2)
         - _next static or image optimizer routes
  */
  if (pathname.startsWith("/_next/") || /\.[\w]+$/.test(pathname)) {
    return NextResponse.next();
  }

  /* 2.  If already under a locale, continue */
  if (/^\/(en|de|it)(\/|$)/.test(pathname)) {
    return NextResponse.next();
  }

  /* 3.  Otherwise redirect root‑relative path to default locale */
  return NextResponse.redirect(new URL("/en", request.url));
}

/* Run only on paths we still care about.
   Anything with a dot gets filtered out earlier, but this reduces invokes. */
export const config = {
  matcher: ["/((?!api|_next|.*\\.[\\w]+$).*)"],
};
