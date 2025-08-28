import { NextRequest, NextResponse } from "next/server";
import { emitClick } from "@acme/email";

export const runtime = "edge";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const shop = req.nextUrl.searchParams.get("shop");
  const campaign = req.nextUrl.searchParams.get("campaign");
  const url = req.nextUrl.searchParams.get("url") || "/";

  let redirectUrl: URL;
  try {
    redirectUrl = new URL(url, req.url);
    if (redirectUrl.origin !== req.nextUrl.origin) {
      return new NextResponse("Invalid redirect URL", { status: 400 });
    }
  } catch {
    return new NextResponse("Invalid redirect URL", { status: 400 });
  }

  if (shop && campaign) {
    await emitClick(shop, { campaign });
  }

  return NextResponse.redirect(redirectUrl);
}
