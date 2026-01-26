import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const dynamic = "force-static";

export function GET(req: NextRequest) {
  // Delegate to the standard Next.js robots.txt route
  return NextResponse.redirect(new URL("/robots.txt", req.url));
}
