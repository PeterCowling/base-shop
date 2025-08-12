import { NextRequest, NextResponse } from "next/server";
export declare const runtime = "edge";
export declare function POST(req: NextRequest): Promise<
  | NextResponse<{ errors: unknown }>
  | NextResponse<{ error: string }>
  | NextResponse<{ ok: boolean; message?: string }>
>; 
