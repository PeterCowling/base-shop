import { type NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import {
  mapResendEvent,
  type ResendWebhookEvent,
} from "@acme/email/analytics";
import { trackEvent } from "@acme/platform-core/analytics";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const shop = req.nextUrl.searchParams.get("shop");
  if (!shop) {
    return NextResponse.json({ error: "Missing shop" }, { status: 400 });
  }
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const signature = req.headers.get("x-resend-signature") || "";
  const body = await req.text();
  if (!secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  try {
    if (
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  let event: ResendWebhookEvent;
  try {
    event = JSON.parse(body) as ResendWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const mapped = mapResendEvent(event);
  if (mapped) {
    await trackEvent(shop, mapped);
  }
  return NextResponse.json({ ok: true });
}
