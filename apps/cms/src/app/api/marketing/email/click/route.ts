import { NextRequest, NextResponse } from "next/server";
import { triggerClick } from "@acme/email";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const shop = req.nextUrl.searchParams.get("shop");
  const campaign = req.nextUrl.searchParams.get("campaign");
  const url = req.nextUrl.searchParams.get("url") || "/";
  if (shop && campaign) {
    await triggerClick(shop, { campaign, url });
  }
  return NextResponse.redirect(url);
}
