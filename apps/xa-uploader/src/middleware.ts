import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isUploaderIpAllowedByHeaders, uploaderAccessDeniedJsonResponse } from "./lib/accessControl";

function deniedResponseFor(request: NextRequest): NextResponse {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return uploaderAccessDeniedJsonResponse();
  }
  return new NextResponse(null, { status: 404 });
}

export function middleware(request: NextRequest) {
  if (!isUploaderIpAllowedByHeaders(request.headers)) {
    return deniedResponseFor(request);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
