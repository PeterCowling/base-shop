// apps/shop-abc/src/app/api/search/route.ts
import { NextResponse } from "next/server";
import { PRODUCTS } from "@/lib/products";
import { getPublishedPosts } from "@acme/blog";
import shop from "../../../../shop.json";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase() ?? "";

  const products = PRODUCTS.filter((p) =>
    p.title.toLowerCase().includes(q)
  ).map((p) => ({
    type: "product" as const,
    title: p.title,
    slug: p.slug,
  }));

  let posts: { type: "post"; title: string; slug: string }[] = [];
  if (shop.luxuryFeatures?.blog) {
    try {
      const fetched = getPublishedPosts();
      posts = fetched
        .filter((p) => p.title.toLowerCase().includes(q))
        .map((p) => ({ type: "post" as const, title: p.title, slug: p.slug }));
    } catch {
      /* ignore failed blog fetch */
    }
  }

  return NextResponse.json({ results: [...products, ...posts] });
}

