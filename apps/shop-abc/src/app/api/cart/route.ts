// apps/shop-abc/src/app/api/cart/route.ts

import {
  runtime,
  DELETE as coreDELETE,
  GET as coreGET,
  PATCH as corePATCH,
  POST as corePOST,
  PUT as corePUT,
} from "@platform-core/src/cartApi";
import { getCustomerSession, hasPermission } from "@auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const REQUIRED_PERMISSION = "manage_cart" as const;

async function withPermission(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<Response>
): Promise<Response> {
  const session = await getCustomerSession();
  if (!session || !hasPermission(session.role, REQUIRED_PERMISSION)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return handler(req);
}

export { runtime };

export async function POST(req: NextRequest) {
  return withPermission(req, corePOST);
}

export async function PATCH(req: NextRequest) {
  return withPermission(req, corePATCH);
}

export async function PUT(req: NextRequest) {
  return withPermission(req, corePUT);
}

export async function DELETE(req: NextRequest) {
  return withPermission(req, coreDELETE);
}

export async function GET(req: NextRequest) {
  return withPermission(req, coreGET);
}

