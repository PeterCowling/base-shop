import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login (the login page itself)
     * - /api/inventory/login (login API route)
     * - /_next/... (Next.js internals)
     * - /favicon.ico, static files
     */
    "/((?!login|api/inventory/login|_next/static|_next/image|favicon.ico).*)",
  ],
};

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const cookie = request.cookies.get("inventory_admin");
  if (!cookie?.value) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Cookie is present — let the server component perform full HMAC verification.
  // The middleware only handles the fast-path unauthenticated redirect; full
  // signature verification runs in the auth helpers (Node.js runtime) during SSR.
  return NextResponse.next();
}
