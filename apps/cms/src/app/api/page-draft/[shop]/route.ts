import { savePageDraft } from "@cms/actions/pages.server";
import { getPages } from "@platform-core/repositories/pages/index.server";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  try {
    const fd = await req.formData();
    const { shop } = await context.params;
    const { page } = await savePageDraft(shop, fd);
    return NextResponse.json({ id: page.id });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  try {
    const { shop } = await context.params;
    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    const pages = await getPages(shop);
    const page = pages.find((p) => p.id === id);
    if (!page) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
    return NextResponse.json(page);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
