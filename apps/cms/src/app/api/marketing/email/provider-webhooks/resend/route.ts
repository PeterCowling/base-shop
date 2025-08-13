import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { onOpen, onClick } from "@acme/email";
import { emitOpen, emitClick } from "@acme/email/hooks";
import { trackEvent } from "@platform-core/analytics";

onOpen(({ shop, campaign }) =>
  trackEvent(shop, { type: "email_open", campaign })
);
onClick(({ shop, campaign }) =>
  trackEvent(shop, { type: "email_click", campaign })
);

const typeMap: Record<string, string> = {
  "email.delivered": "email_delivered",
  "email.opened": "email_open",
  "email.clicked": "email_click",
  "email.unsubscribed": "email_unsubscribe",
  "email.bounced": "email_bounce",
};

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
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  if (signature !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const mapped = typeMap[event.type];
  if (mapped === "email_open") {
    const campaign = event.data?.campaign || event.data?.campaign_id || "";
    await emitOpen({ shop, campaign });
  } else if (mapped === "email_click") {
    const campaign = event.data?.campaign || event.data?.campaign_id || "";
    const url = event.data?.url || "";
    await emitClick({ shop, campaign, url });
  } else if (mapped) {
    const campaign = event.data?.campaign || event.data?.campaign_id;
    await trackEvent(shop, { type: mapped, ...(campaign ? { campaign } : {}) });
  }
  return NextResponse.json({ ok: true });
}

