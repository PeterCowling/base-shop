import { type NextRequest, NextResponse } from "next/server";

import { trackEvent } from "@acme/platform-core/analytics";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const shop = req.nextUrl.searchParams.get("shop");
  const email = req.nextUrl.searchParams.get("email");
  const campaign = req.nextUrl.searchParams.get("campaign") || undefined;
  if (!shop || !email) {
    return NextResponse.json({ error: "Missing shop or email" }, { status: 400 });
  }
  await trackEvent(shop, { type: "email_unsubscribe", email, campaign });
  return NextResponse.json({ ok: true });
}
