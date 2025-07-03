import { listMedia } from "@cms/actions/media.server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const shop = url.searchParams.get("shop");
  if (!shop) {
    return NextResponse.json({ error: "Missing shop" }, { status: 400 });
  }
  const files = await listMedia(shop);
  return NextResponse.json(files);
}
