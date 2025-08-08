import { savePageDraft } from "@cms/actions/pages.server";
import { NextResponse, type NextRequest } from "next/server";

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
