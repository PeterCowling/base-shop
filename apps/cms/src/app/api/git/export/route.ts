import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(_req: NextRequest) {
  if (!process.env.GITHUB_TOKEN) {
    return NextResponse.json({ error: "GITHUB_TOKEN missing" }, { status: 501 });
  }
  return NextResponse.json({ url: "https://example.com/pr/1" });
}
