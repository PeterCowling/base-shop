import { NextRequest, NextResponse } from "next/server";
import { onClick } from "@acme/email";
import { emitClick } from "@acme/email/hooks";
import { trackEvent } from "@platform-core/analytics";

onClick(({ shop, campaign }) =>
  trackEvent(shop, { type: "email_click", campaign })
);

export async function GET(req: NextRequest): Promise<NextResponse> {
  const shop = req.nextUrl.searchParams.get("shop");
  const campaign = req.nextUrl.searchParams.get("campaign");
  const url = req.nextUrl.searchParams.get("url") || "/";
  if (shop && campaign) {
    await emitClick({ shop, campaign, url });
  }
  return NextResponse.redirect(url);
}
