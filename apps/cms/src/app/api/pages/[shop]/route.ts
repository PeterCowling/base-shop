import { getPages } from "@platform-core/repositories/pages/index.server";
import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { shop } = await context.params;
    const pages = await getPages(shop);
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.max(
      1,
      Number.parseInt(searchParams.get("limit") ?? String(pages.length), 10)
    );
    const start = (page - 1) * limit;
    return NextResponse.json(pages.slice(start, start + limit));
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
