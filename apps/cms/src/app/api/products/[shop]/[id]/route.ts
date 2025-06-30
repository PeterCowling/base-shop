// apps/cms/src/app/api/products/[shop]/[id]/route.ts

import { getProductById } from "@platform-core/repositories/json.server";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { shop: string; id: string } }
) {
  const product = await getProductById(params.shop, params.id);
  if (!product) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(product);
}
