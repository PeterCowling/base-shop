// apps/cms/src/middleware.ts
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ADMIN_PATH_REGEX = /^\/products(\/|$)/;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /* --------------------------------------------------------------- */
  /*  Decode JWT session cookie                                      */
  /* --------------------------------------------------------------- */
  const token = await getToken(
    process.env.NEXTAUTH_SECRET
      ? { req, secret: process.env.NEXTAUTH_SECRET } // <- secret is string
      : { req } // <- omit field entirely
  );
  const role = token?.role;

  /* 1. Skip static assets, Next internals, and /login */
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/login" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  /* 2. Redirect unauthenticated users to login */
  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  /* 3. Block viewer from write routes */
  if (role === "viewer" && ADMIN_PATH_REGEX.test(pathname)) {
    return NextResponse.rewrite(new URL("/403", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\.[\\w]+$|favicon.ico).*)"],
};
