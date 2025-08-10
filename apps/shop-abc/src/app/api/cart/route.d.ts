import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
export declare const runtime = "edge";
export declare function POST(req: NextRequest): Promise<
  | NextResponse<Record<string, string[]>>
  | NextResponse<{
      ok: boolean;
      cart: import("@/lib/cartCookie").CartState;
    }>
>;
export declare function PATCH(req: NextRequest): Promise<
  | NextResponse<Record<string, string[]>>
  | NextResponse<{
      ok: boolean;
      cart: import("@/lib/cartCookie").CartState;
    }>
>;
