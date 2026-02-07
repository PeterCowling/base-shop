import { type NextRequest, NextResponse } from "next/server";

import { track } from "@acme/telemetry";

export const runtime = "nodejs";

export async function POST(_req: NextRequest) {
  if (!process.env.GITHUB_TOKEN) {
    return NextResponse.json({ error: "GITHUB_TOKEN missing" }, { status: 501 });
  }
  track("git:export", {});
  return NextResponse.json({ url: "https://example.com/pr/1" });
}
