import { NextRequest, NextResponse } from "next/server";
import { trackEvent } from "@platform-core/analytics";
import { addUnsubscribed } from "@acme/email/unsubscribe";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const shop = req.nextUrl.searchParams.get("shop");
  const email = req.nextUrl.searchParams.get("email");
  const campaign = req.nextUrl.searchParams.get("campaign") || undefined;
  const redirect = req.nextUrl.searchParams.get("redirect") || "/";
  if (!shop || !email) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }
  await addUnsubscribed(shop, email);
  await trackEvent(shop, {
    type: "email_unsubscribe",
    ...(campaign ? { campaign } : {}),
  });
  const url = new URL(redirect, req.nextUrl);
  return NextResponse.redirect(url);
}
