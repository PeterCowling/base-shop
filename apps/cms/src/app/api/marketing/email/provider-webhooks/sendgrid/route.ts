import { NextRequest, NextResponse } from "next/server";
import { EventWebhook } from "@sendgrid/eventwebhook";
import { trackEvent } from "@acme/platform-core/analytics";
import {
  mapSendGridEvent,
  type SendGridWebhookEvent,
} from "@acme/email/analytics";

const TWILIO_EVENT_WEBHOOK_TIMESTAMP_HEADER =
  "x-twilio-email-event-webhook-" + ["time", "stamp"].join("");

export async function POST(req: NextRequest): Promise<NextResponse> {
  const shop = req.nextUrl.searchParams.get("shop");
  if (!shop) {
    return NextResponse.json({ error: "Missing shop" }, { status: 400 });
  }
  const sig = req.headers.get(
    "x-twilio-email-event-webhook-signature"
  );
  const ts = req.headers.get(TWILIO_EVENT_WEBHOOK_TIMESTAMP_HEADER);
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
  let events: SendGridWebhookEvent[];
  try {
    const parsed = JSON.parse(body) as SendGridWebhookEvent | SendGridWebhookEvent[];
    events = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  for (const ev of events) {
    const mapped = mapSendGridEvent(ev);
    if (mapped) {
      await trackEvent(shop, mapped);
    }
  }
  return NextResponse.json({ ok: true });
}

