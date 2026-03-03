import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/adminAuth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public admin paths — pass through without auth check.
  if (pathname === "/admin/login" || pathname.startsWith("/admin/api/auth")) {
    return NextResponse.next();
  }

  const adminKey = process.env.CARYINA_ADMIN_KEY;
  if (!adminKey) {
    // Fail-safe: env var absent → deny all access (never silently open the admin).
    return new NextResponse("Server configuration error", { status: 500 });
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const valid = await verifyAdminSession(token, adminKey);
  if (!valid) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
