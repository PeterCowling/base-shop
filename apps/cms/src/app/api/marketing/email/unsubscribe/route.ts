import { NextRequest, NextResponse } from "next/server";
import { trackEvent } from "@platform-core/analytics";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const shop = req.nextUrl.searchParams.get("shop");
  const email = req.nextUrl.searchParams.get("email");
  const campaign = req.nextUrl.searchParams.get("campaign");
  if (shop && email) {
    await trackEvent(shop, {
      type: "email_unsubscribe",
      email,
      ...(campaign ? { campaign } : {}),
    });
  }
  return new NextResponse("<p>You have been unsubscribed.</p>", {
    headers: { "Content-Type": "text/html" },
  });
}
