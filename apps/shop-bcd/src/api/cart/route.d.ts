import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
export declare const runtime = "edge";
export declare function POST(req: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    ok: boolean;
    cart: import("@platform-core/cartCookie").CartState;
}>>;
export declare function PATCH(req: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    ok: boolean;
    cart: import("@platform-core/cartCookie").CartState;
}>>;
