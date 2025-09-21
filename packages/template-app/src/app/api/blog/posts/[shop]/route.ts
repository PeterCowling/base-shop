import { NextResponse, type NextRequest } from "next/server";
import { fetchPublishedPosts } from "@acme/sanity";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: any,
) {
  const shop = ctx?.params?.shop as string | undefined;
  if (!shop) {
    return NextResponse.json({ error: "Missing shop param" }, { status: 400 });
  }
  try {
    const posts = await fetchPublishedPosts(shop);
    return NextResponse.json(posts);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
