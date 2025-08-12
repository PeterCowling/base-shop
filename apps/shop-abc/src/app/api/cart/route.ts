// apps/shop-abc/src/app/api/cart/route.ts
import { getCustomerSession, hasPermission } from "@auth";
import {
  runtime,
  DELETE as coreDELETE,
  GET as coreGET,
  PATCH as corePATCH,
  POST as corePOST,
  PUT as corePUT,
} from "@platform-core/src/cartApi";
import { NextResponse, type NextRequest } from "next/server";

async function guard(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const session = await getCustomerSession();
  if (!session || !hasPermission(session.role, "manage_cart")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return handler(req);
}

export { runtime };
export const GET = (req: NextRequest) => guard(req, coreGET);
export const POST = (req: NextRequest) => guard(req, corePOST);
export const PATCH = (req: NextRequest) => guard(req, corePATCH);
export const PUT = (req: NextRequest) => guard(req, corePUT);
export const DELETE = (req: NextRequest) => guard(req, coreDELETE);
