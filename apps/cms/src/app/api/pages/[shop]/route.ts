import { getPages } from "@platform-core/repositories/pages/index.server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { shop: string } }
) {
  const pages = await getPages(params.shop);
  return NextResponse.json(pages);
}
