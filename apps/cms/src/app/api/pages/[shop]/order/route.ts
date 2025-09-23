import { NextResponse, type NextRequest } from "next/server";
import { reorderPages } from "@platform-core/repositories/pages/index.server";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  try {
    const { shop } = await context.params;
    const body = await req.json().catch(() => ({}));
    const ids = Array.isArray(body?.ids) ? (body.ids as string[]) : [];
    if (!ids.length) return NextResponse.json({ error: "ids required" }, { status: 400 });
    await reorderPages(shop, ids);
    return NextResponse.json({ ok: true }, { status: 204 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
