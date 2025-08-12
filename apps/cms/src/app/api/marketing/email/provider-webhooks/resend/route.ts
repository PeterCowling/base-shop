import { NextRequest, NextResponse } from "next/server";
import { trackEvent } from "@platform-core/analytics";
import { env } from "@acme/config";
import crypto from "node:crypto";

const EVENT_MAP: Record<string, string> = {
  delivered: "email_delivered",
  opened: "email_open",
  open: "email_open",
  clicked: "email_click",
  click: "email_click",
  unsubscribed: "email_unsubscribed",
  bounce: "email_bounced",
  bounced: "email_bounced",
};

function verifySignature(body: string, req: NextRequest): boolean {
  const signature = req.headers.get("x-resend-signature");
  const secret = env.RESEND_WEBHOOK_SECRET;
  if (!signature || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature),
    );
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
    const type = EVENT_MAP[(ev as any).type || (ev as any).event];
    if (type) await trackEvent(shop, { type });
  }
  return NextResponse.json({ ok: true });
}
