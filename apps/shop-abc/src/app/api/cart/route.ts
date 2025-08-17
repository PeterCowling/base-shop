// apps/shop-abc/src/app/api/cart/route.ts
import { requirePermission } from "@auth";
import {
  runtime,
  DELETE as coreDELETE,
  GET as coreGET,
  PATCH as corePATCH,
  POST as corePOST,
  PUT as corePUT,
} from "@platform-core/cartApi";
import { NextResponse, type NextRequest } from "next/server";

async function guard(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    await requirePermission("manage_cart");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return handler(req);
}

export { runtime };
export const GET = (req: NextRequest) => guard(req, coreGET);
export const POST = (req: NextRequest) => guard(req, corePOST);
export const PATCH = (req: NextRequest) => guard(req, corePATCH);
export const PUT = (req: NextRequest) => guard(req, corePUT);
export const DELETE = (req: NextRequest) => guard(req, coreDELETE);
