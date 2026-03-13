import { type NextRequest, NextResponse } from "next/server";

import { sendSystemEmail } from "@acme/platform-core/email";

import { checkRateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

// 5 notify-me submissions per IP per 10 minutes
const RL = { max: 5, windowMs: 10 * 60_000 };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function redactEmail(email: string): string {
  const at = email.indexOf("@");
  if (at === -1) return "***";
  return `***${email.slice(at)}`;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!checkRateLimit(clientIp(req), RL)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const { email, productSlug, consent } = body;

  if (consent !== true) {
    return NextResponse.json({ error: "Consent required" }, { status: 400 });
  }

  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  if (!productSlug || typeof productSlug !== "string") {
    return NextResponse.json({ error: "Product slug required" }, { status: 400 });
  }

  const consentAt = new Date().toISOString();
  const emailDomain = redactEmail(email);

  console.info("notify-me: submission", { emailDomain, productSlug, consentAt }); // i18n-exempt -- developer log

  const merchantEmail =
    process.env.MERCHANT_NOTIFY_EMAIL ?? "peter.cowling1976@gmail.com";

  void sendSystemEmail({
    to: email,
    subject: `You asked to be notified about ${productSlug}`,
    html: "<p>Thanks for your interest! We'll be in touch when this product is available or has updates.</p>",
  }).catch((err: unknown) => {
    console.error("notify-me: subscriber email failed", err); // i18n-exempt -- developer log
  });

  void sendSystemEmail({
    to: merchantEmail,
    subject: `New notify-me capture — ${productSlug}`,
    html: `<p>New notify-me submission for <strong>${productSlug}</strong>.</p><p>Email domain: ${emailDomain}</p><p>Consent at: ${consentAt}</p>`,
  }).catch((err: unknown) => {
    console.error("notify-me: merchant email failed", err); // i18n-exempt -- developer log
  });

  return NextResponse.json({ success: true });
}
