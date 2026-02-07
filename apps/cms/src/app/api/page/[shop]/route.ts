import { type NextRequest,NextResponse } from "next/server";

import { getPages, updatePage as updatePageInRepo } from "@acme/platform-core/repositories/pages/index.server";
import { type PageComponent,pageComponentSchema } from "@acme/types";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  try {
    const fd = await req.formData();
    const { shop } = await context.params;
    const id = fd.get("id");
    if (typeof id !== "string" || !id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const pages = await getPages(shop);
    const existing = pages.find((p) => p.id === id);
    if (!existing) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    let components: PageComponent[] = existing.components;
    const compStr = fd.get("components");
    if (typeof compStr === "string") {
      try {
        const parsed = JSON.parse(compStr);
        if (Array.isArray(parsed)) {
          components = parsed.map((c) => pageComponentSchema.parse(c));
        }
      } catch {
        /* ignore invalid components */
      }
    }

    await updatePageInRepo(
      shop,
      {
        id: existing.id,
        updatedAt: existing.updatedAt,
        status: "published",
        components,
      },
      existing,
    );

    return NextResponse.json({ id: existing.id });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
