import { NextRequest, NextResponse } from "next/server";
import { EventWebhook } from "@sendgrid/eventwebhook";
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
  delivered: "email_delivered",
  open: "email_open",
  click: "email_click",
  unsubscribe: "email_unsubscribe",
  bounce: "email_bounce",
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  const shop = req.nextUrl.searchParams.get("shop");
  if (!shop) {
    return NextResponse.json({ error: "Missing shop" }, { status: 400 });
  }
  const sig = req.headers.get(
    "x-twilio-email-event-webhook-signature"
  );
  const ts = req.headers.get("x-twilio-email-event-webhook-timestamp");
  const publicKey = process.env.SENDGRID_WEBHOOK_PUBLIC_KEY;
  const body = await req.text();
  if (!sig || !ts || !publicKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ew = new EventWebhook();
  const key = ew.convertPublicKeyToECDSA(publicKey);
  const valid = ew.verifySignature(key, body, sig, ts);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  let events: any[];
  try {
    events = JSON.parse(body);
    if (!Array.isArray(events)) events = [events];
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  for (const ev of events) {
    const mapped = typeMap[ev.event];
    const campaign = Array.isArray(ev.category)
      ? ev.category[0]
      : ev.category;
    if (mapped === "email_open") {
      await emitOpen({ shop, campaign: campaign || "" });
    } else if (mapped === "email_click") {
      const url = ev.url || "";
      await emitClick({ shop, campaign: campaign || "", url });
    } else if (mapped) {
      await trackEvent(shop, { type: mapped, ...(campaign ? { campaign } : {}) });
    }
  }
  return NextResponse.json({ ok: true });
}

