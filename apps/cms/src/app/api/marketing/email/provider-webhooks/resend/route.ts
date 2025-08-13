import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { trackEvent } from "@platform-core/analytics";
import { mapResendEvent } from "@acme/email/analytics";
import { triggerOpen, triggerClick } from "@acme/email";

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
  const mapped = mapResendEvent(event);
  if (mapped) {
    if (mapped.type === "email_open") {
      await triggerOpen(shop, {
        campaign: mapped.campaign || "",
        recipient: mapped.recipient,
        messageId: mapped.messageId,
      });
    } else if (mapped.type === "email_click") {
      await triggerClick(shop, {
        campaign: mapped.campaign || "",
        recipient: mapped.recipient,
        messageId: mapped.messageId,
      });
    } else {
      await trackEvent(shop, mapped);
    }
  }
  return NextResponse.json({ ok: true });
}

