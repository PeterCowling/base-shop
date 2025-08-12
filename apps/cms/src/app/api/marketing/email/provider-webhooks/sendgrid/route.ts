import { NextRequest, NextResponse } from "next/server";
import { trackEvent } from "@platform-core/analytics";
import { env } from "@acme/config";
import crypto from "node:crypto";

const EVENT_MAP: Record<string, string> = {
  delivered: "email_delivered",
  open: "email_open",
  click: "email_click",
  unsubscribe: "email_unsubscribed",
  bounce: "email_bounced",
};

function verifySignature(body: string, req: NextRequest): boolean {
  const signature = req.headers.get(
    "x-twilio-email-event-webhook-signature"
  );
  const timestamp = req.headers.get(
    "x-twilio-email-event-webhook-timestamp"
  );
  const publicKey = env.SENDGRID_WEBHOOK_PUBLIC_KEY;
  if (!signature || !timestamp || !publicKey) return false;
  const verifier = crypto.createVerify("sha256");
  verifier.update(timestamp + body);
  try {
    return verifier.verify(publicKey, signature, "base64");
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const shop = req.nextUrl.searchParams.get("shop");
  if (!shop)
    return NextResponse.json({ error: "Missing shop" }, { status: 400 });
  const raw = await req.text();
  if (!verifySignature(raw, req)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  let events: unknown = [];
  try {
    events = JSON.parse(raw);
  } catch {
    // ignore
  }
  const list = Array.isArray(events) ? events : [events];
  for (const ev of list) {
    const type = EVENT_MAP[(ev as any).event];
    if (type) await trackEvent(shop, { type });
  }
  return NextResponse.json({ ok: true });
}
