import { NextResponse } from "next/server";

import { fetchPublishedPosts } from "@acme/sanity";

export const runtime = "nodejs";

export async function GET(req: Request) {
  // Derive the dynamic segment from the URL to keep the handler signature
  // compatible with Next.js route validation.
  const { pathname } = new URL(req.url);
  const match = pathname.match(/\/api\/blog\/posts\/([^/]+)(?:\/)?$/);
  const shop = (match?.[1] ?? "").trim() || undefined;
  if (!shop) {
    // i18n-exempt -- ABC-123 [ttl=2025-12-31] API error message
    return NextResponse.json({ error: "Missing shop param" }, { status: 400 });
  }
  try {
    const posts = await fetchPublishedPosts(shop);
    return NextResponse.json(posts);
  } catch (err) {
    // i18n-exempt -- ABC-123 [ttl=2025-12-31] API error message
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
