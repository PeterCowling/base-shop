import { NextRequest, NextResponse } from "next/server";
import { trackEvent } from "@platform-core/analytics";
import { validateShopName } from "@platform-core/shops";

export async function GET(
  req: NextRequest,
  { params }: { params: { action: string } }
): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const shop = validateShopName(searchParams.get("shop") ?? "abc");
  const campaignId = searchParams.get("campaign") ?? undefined;
  const action = params.action;

  if (action === "open" || action === "click") {
    await trackEvent(shop, { type: `email_${action}`, campaignId });
    const url = searchParams.get("url");
    if (action === "click" && url) {
      return NextResponse.redirect(url);
    }
  }

  return new NextResponse(null, { status: 204 });
}

