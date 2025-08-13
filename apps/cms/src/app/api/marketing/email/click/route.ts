import { NextRequest, NextResponse } from "next/server";
import { emitClick } from "@acme/email";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const shop = req.nextUrl.searchParams.get("shop");
  const campaign = req.nextUrl.searchParams.get("campaign");
  const url = req.nextUrl.searchParams.get("url") || "/";
  if (shop && campaign) {
    await emitClick(shop, { campaign });
  }
  return NextResponse.redirect(url);
}
