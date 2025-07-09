import { getPages } from "@platform-core/repositories/pages/index.server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  try {
    const { shop } = await context.params;
    const pages = await getPages(shop);
    return NextResponse.json(pages);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
