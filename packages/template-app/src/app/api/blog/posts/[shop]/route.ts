import { NextResponse, type NextRequest } from "next/server";
import { fetchPublishedPosts } from "@acme/sanity";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  ctx: any,
) {
  const p = (ctx && typeof ctx === 'object' && 'params' in ctx) ? (ctx as any).params : undefined;
  const shop = (p && typeof p === 'object') ? (await p).shop : undefined;
  try {
    const posts = await fetchPublishedPosts(shop);
    return NextResponse.json(posts);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
