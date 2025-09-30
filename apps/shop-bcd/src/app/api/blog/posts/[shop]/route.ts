import { NextResponse } from "next/server";
import type { Shop } from "@acme/types";
import shopJson from "../../../../../../shop.json";
import { getBlogProvider } from "../../../../[lang]/blog/provider";

export const runtime = "nodejs";

const shop = shopJson as Pick<Shop, "id" | "sanityBlog" | "editorialBlog">;

export async function GET(req: Request) {
  const { pathname } = new URL(req.url);
  const match = pathname.match(/\/api\/blog\/posts\/([^/]+)(?:\/)?$/);
  const shopParam = (match?.[1] ?? "").trim() || undefined;
  if (!shopParam) {
    return NextResponse.json({ error: "Missing shop param" }, { status: 400 });
  }
  if (shopParam !== shop.id) {
    return NextResponse.json({ error: "Unknown shop" }, { status: 404 });
  }
  try {
    const provider = getBlogProvider(shop);
    const posts = await provider.fetchPublishedPosts(shop.id);
    return NextResponse.json(posts);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
