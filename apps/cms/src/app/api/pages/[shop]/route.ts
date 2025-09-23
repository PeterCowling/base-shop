import { NextResponse, type NextRequest } from "next/server";
import { getPages } from "@platform-core/repositories/pages/index.server";
import type { Page } from "@acme/types";
import { createPage as createPageAction } from "@cms/actions/pages/create";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  try {
    const { shop } = await context.params;
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").toLowerCase().trim();
    const pages = await getPages(shop);
    const filtered = q
      ? pages.filter((p) => {
          const title = (p.seo?.title as any)?.en || Object.values(p.seo?.title || {})[0] || "";
          return String(p.slug).toLowerCase().includes(q) || String(title).toLowerCase().includes(q);
        })
      : pages;
    return NextResponse.json(filtered);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  try {
    const { shop } = await context.params;
    const ct = req.headers.get("content-type") || "";
    let title = "Untitled";
    let slug = "";
    let locale = "en";
    if (ct.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      title = typeof body.title === "string" && body.title ? body.title : title;
      slug = typeof body.slug === "string" ? body.slug : slug;
      locale = typeof body.locale === "string" ? body.locale : locale;
    } else if (ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      const t = fd.get("title");
      const s = fd.get("slug");
      const l = fd.get("locale");
      if (typeof t === "string" && t) title = t;
      if (typeof s === "string") slug = s;
      if (typeof l === "string" && l) locale = l;
    }

    // Reuse existing create action: it expects FormData fields
    const fd = new FormData();
    fd.set("slug", slug);
    fd.set("status", "draft");
    fd.set("components", JSON.stringify([]));
    fd.set(`title_${locale}`, title);
    fd.set(`desc_${locale}`, "");
    const result = await createPageAction(shop, fd);
    if (result.errors) return NextResponse.json({ errors: result.errors }, { status: 400 });
    return NextResponse.json(result.page as Page, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
