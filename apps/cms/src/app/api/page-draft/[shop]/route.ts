import { type NextRequest,NextResponse } from "next/server";
import { ensureRole } from "@cms/actions/common/auth";
import { savePageDraft } from "@cms/actions/pages/draft";

import { getPages } from "@acme/platform-core/repositories/pages/index.server";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  try {
    await ensureRole(["admin", "ShopAdmin"]);
    const { shop } = await context.params;
    const pages = await getPages(shop);
    const draft = pages.find((p) => p.status === "draft");
    if (!draft) {
      return NextResponse.json({}, { status: 404 });
    }
    return NextResponse.json(draft);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  try {
    const fd = await req.formData();
    const { shop } = await context.params;
    const result = await savePageDraft(shop, fd);
    if (result.errors) {
      return NextResponse.json({ errors: result.errors }, { status: 400 });
    }
    return NextResponse.json({ id: result.page!.id });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
