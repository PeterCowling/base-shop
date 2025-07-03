import { savePageDraft } from "@cms/actions/pages.server";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { shop: string } }
) {
  try {
    const fd = await req.formData();
    const { page } = await savePageDraft(params.shop, fd);
    return NextResponse.json({ id: page.id });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
