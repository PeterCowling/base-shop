import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
export declare const runtime = "edge";
export declare function POST(req: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    ok: boolean;
    cart: any;
}>>;
export declare function PATCH(req: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    ok: boolean;
    cart: any;
}>>;
//# sourceMappingURL=route.d.ts.map