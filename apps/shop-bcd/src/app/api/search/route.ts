// apps/shop-bcd/src/app/api/search/route.ts
import { NextResponse } from "next/server";
import { PRODUCTS } from "@/lib/products";
import { fetchPublishedPosts } from "@acme/sanity";
import { env } from "@acme/config";
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
  try {
    const luxury = JSON.parse(env.NEXT_PUBLIC_LUXURY_FEATURES ?? "{}");
    if (luxury.contentMerchandising) {
      const fetched = await fetchPublishedPosts(shop.id);
      posts = fetched
        .filter((p) => p.title.toLowerCase().includes(q))
        .map((p) => ({ type: "post" as const, title: p.title, slug: p.slug }));
    }
  } catch {
    /* ignore malformed feature flags */
  }

  return NextResponse.json({ results: [...products, ...posts] });
}

