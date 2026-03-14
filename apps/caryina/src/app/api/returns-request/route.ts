import { type NextRequest, NextResponse } from "next/server";

import { sendSystemEmail } from "@acme/platform-core/email";

import {
  CONTACT_EMAIL,
  LEGAL_ENTITY_NAME,
  PROPERTY_ADDRESS,
  TRADING_NAME,
} from "@/lib/legalContent";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { returnsRequestSchema } from "@/lib/returnsRequestSchema";

export const runtime = "nodejs";

function escHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  cancellation: "Cancellation request",
  return: "Return request",
  exchange: "Exchange request",
  faulty: "Faulty item report",
};

// 3 returns requests per IP per 10 minutes
const RL = { max: 3, windowMs: 10 * 60_000 };

export async function POST(request: NextRequest) {
  if (!checkRateLimit(clientIp(request), RL)) {
    return NextResponse.json({ ok: false, error: "too_many_requests" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const parsed = returnsRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation_error", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { orderReference, email, requestType, message } = parsed.data;
  const requestLabel = REQUEST_TYPE_LABELS[requestType];

  const merchantHtml = `
    <h2>${escHtml(requestLabel)}</h2>
    <p><strong>Order reference:</strong> ${escHtml(orderReference)}</p>
    <p><strong>Customer email:</strong> ${escHtml(email)}</p>
    <p><strong>Request type:</strong> ${escHtml(requestType)}</p>
    <p><strong>Message:</strong></p>
    <p>${escHtml(message).replace(/\n/g, "<br />")}</p>
  `;

  const customerHtml = `
    <h2>We received your ${escHtml(requestType)} request</h2>
    <p>Thank you for contacting ${escHtml(TRADING_NAME)}.</p>
    <p><strong>Order reference:</strong> ${escHtml(orderReference)}</p>
    <p>We will review your request and reply from ${escHtml(CONTACT_EMAIL)}. Please keep the item and packaging available until you receive instructions.</p>
    <p>Business details: ${escHtml(LEGAL_ENTITY_NAME)}, ${escHtml(PROPERTY_ADDRESS)}.</p>
    <p>Useful links:</p>
    <ul>
      <li><a href="https://caryina.com/en/returns">Returns Policy</a></li>
      <li><a href="https://caryina.com/en/terms">Terms of Sale and Website Use</a></li>
      <li><a href="https://caryina.com/en/privacy">Privacy Policy</a></li>
    </ul>
  `;

  await Promise.all([
    sendSystemEmail({
      to: CONTACT_EMAIL,
      subject: `${requestLabel} — ${orderReference}`,
      html: merchantHtml,
    }),
    sendSystemEmail({
      to: email,
      subject: `We received your ${requestType} request — ${orderReference}`,
      html: customerHtml,
    }),
  ]);

  return NextResponse.json({ ok: true });
}
