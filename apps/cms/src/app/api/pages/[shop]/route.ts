import { getPages } from "@platform-core/repositories/pages/index.server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { shop: string } }
) {
  try {
    const pages = await getPages(params.shop);
    return NextResponse.json(pages);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
