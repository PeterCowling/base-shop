import { NextResponse, type NextRequest } from "next/server";
import { fetchPublishedPosts } from "@acme/sanity";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  ctx: { params?: { shop?: string } | Promise<{ shop?: string }> },
) {
  const p = ctx?.params;
  const params = p instanceof Promise ? await p : p;
  const shop = params?.shop;
  try {
    const posts = await fetchPublishedPosts(shop);
    return NextResponse.json(posts);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
