import { NextRequest, NextResponse } from "next/server";
import { trackEvent } from "@platform-core/analytics";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const shop = req.nextUrl.searchParams.get("shop");
  const campaign = req.nextUrl.searchParams.get("campaign");
  const url = req.nextUrl.searchParams.get("url") || "/";
  if (shop && campaign) {
    await trackEvent(shop, { type: "email_click", campaign });
  }
  return NextResponse.redirect(url);
}
