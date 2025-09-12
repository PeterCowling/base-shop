import { savePageDraft } from "@cms/actions/pages/draft";
import { authOptions } from "@cms/auth/options";
import { getPages } from "@platform-core/repositories/pages/index.server";
import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
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
