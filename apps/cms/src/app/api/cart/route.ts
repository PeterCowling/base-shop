// apps/cms/src/app/api/cart/route.ts
import type { NextRequest } from "next/server";

import { DELETE as deleteHandler } from "./handlers/delete";
import { GET as getHandler } from "./handlers/get";
import { PATCH as patchHandler } from "./handlers/patch";
import { POST as postHandler } from "./handlers/post";
import { PUT as putHandler } from "./handlers/put";

export const runtime = "nodejs";

export function GET(req: NextRequest) {
  return getHandler(req);
}

export function POST(req: NextRequest) {
  return postHandler(req);
}

export function PATCH(req: NextRequest) {
  return patchHandler(req);
}

export function PUT(req: NextRequest) {
  return putHandler(req);
}

export function DELETE(req: NextRequest) {
  return deleteHandler(req);
}
