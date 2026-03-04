// apps/brikette/src/app/api/recovery/quote/send/route.ts
// Server-side recovery quote email send endpoint.
// Accepts a POST with booking context + guest email, computes a deterministic
// quote, and dispatches via the configured API email provider.
//
// Constraints:
// - Cloudflare free tier compatible (API-provider-first; no SMTP primary path).
// - export const dynamic = "force-dynamic" — prevents static prerendering.
// - Idempotency: module-level Map provides best-effort per-instance dedup.
//   Cross-instance dedup is NOT guaranteed (no KV store on free tier).

import { NextResponse } from "next/server";
import { z } from "zod";

import { getProviderOrder, sendCampaignEmail } from "@acme/email/send";

import type { RecoveryQuoteContext } from "@/utils/recoveryQuote";
import { buildQuoteIdempotencyKey, buildRecoveryQuote } from "@/utils/recoveryQuoteCalc";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Idempotency store (per-instance; best-effort within a single Worker instance)
// ---------------------------------------------------------------------------

const seenIdempotencyKeys = new Map<string, true>();

// ---------------------------------------------------------------------------
// Request schema
// ---------------------------------------------------------------------------

const recoveryContextSchema = z.object({
  checkin: z.string().min(1),
  checkout: z.string().min(1),
  pax: z.number().int().positive(),
  source_route: z.string().min(1),
  room_id: z.string().optional(),
  rate_plan: z.enum(["nr", "flex"]).optional(),
});

const requestBodySchema = z.object({
  context: recoveryContextSchema,
  guestEmail: z.string().trim().email(),
  consentVersion: z.string().min(1),
  leadCaptureId: z.string().min(1),
  resumeLink: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Email body builder
// ---------------------------------------------------------------------------

type RecoveryEmailBodyInput = {
  context: RecoveryQuoteContext;
  nights: number;
  pricePerNight: number | null;
  priceSource: string;
  resumeLink: string | undefined;
  totalFrom: number | null;
};

function buildEmailBody(input: RecoveryEmailBodyInput): string {
  const { context, pricePerNight, totalFrom, priceSource, nights, resumeLink } = input;

  const priceLabel =
    priceSource === "indicative" && totalFrom !== null
      ? `From EUR ${totalFrom} total (approx. EUR ${pricePerNight}/night x ${nights} nights - indicative)`
      : "Price not yet calculated. Please reply and we will confirm an exact quote."; // i18n-exempt -- BRIK-RQ-1 [ttl=2027-03-02] transactional email body

  const lines: string[] = [
    "Thanks for checking rates with Hostel Brikette.", // i18n-exempt -- BRIK-RQ-1 [ttl=2027-03-02] transactional email body
    "",
    "Here is your quote summary:",
    `Check-in:  ${context.checkin}`,
    `Check-out: ${context.checkout}`,
    `Guests:    ${context.pax}`,
  ];

  if (context.room_id) lines.push(`Room:      ${context.room_id}`);
  if (context.rate_plan) lines.push(`Rate plan: ${context.rate_plan}`);
  lines.push(`Quote:     ${priceLabel}`);
  if (resumeLink) lines.push(`Resume:    ${resumeLink}`);
  lines.push("");
  lines.push("This resume link expires after 7 days.");
  lines.push("Indicative prices are non-binding until confirmed.");
  lines.push("");
  lines.push("If you need help, reply to this email.");

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<NextResponse> {
  // Startup guard: enforce API-provider-first (no SMTP primary path on Cloudflare)
  const providerOrder = getProviderOrder();
  if (providerOrder[0] === "smtp") {
    console.error("[recovery/quote/send] provider_not_configured: EMAIL_PROVIDER=smtp is not permitted as primary provider"); // i18n-exempt -- BRIK-RQ-1 [ttl=2027-03-02] operational server log
    return NextResponse.json({ error: "provider_not_configured" }, { status: 503 });
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const parsed = requestBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { context, guestEmail, leadCaptureId, resumeLink } = parsed.data;

  // Compute deterministic idempotency key
  const idempotencyKey = buildQuoteIdempotencyKey(context);

  // Check for duplicate submission (best-effort within this Worker instance)
  if (seenIdempotencyKeys.has(idempotencyKey)) {
    console.info("[recovery/quote/send] duplicate idempotency key", { campaignId: idempotencyKey }); // i18n-exempt -- BRIK-RQ-1 [ttl=2027-03-02] operational server log
    return NextResponse.json({ status: "duplicate", idempotencyKey }, { status: 200 });
  }

  // Compute quote
  const quote = buildRecoveryQuote(context);

  // Build email
  const subject = `Your Brikette quote: ${context.checkin} to ${context.checkout} (${context.pax} guest${context.pax !== 1 ? "s" : ""})`;
  const text = buildEmailBody({
    context,
    pricePerNight: quote.pricePerNight,
    totalFrom: quote.totalFrom,
    priceSource: quote.priceSource,
    nights: quote.nights,
    resumeLink,
  });

  // Attempt send
  console.info("[recovery/quote/send] send attempted", { campaignId: idempotencyKey, leadCaptureId, priceSource: quote.priceSource }); // i18n-exempt -- BRIK-RQ-1 [ttl=2027-03-02] operational server log
  try {
    await sendCampaignEmail({
      to: guestEmail,
      bcc: "hostelpositano@gmail.com",
      subject,
      text,
      campaignId: idempotencyKey,
    });
  } catch (err) {
    console.error("[recovery/quote/send] send failed", { campaignId: idempotencyKey, error: err }); // i18n-exempt -- BRIK-RQ-1 [ttl=2027-03-02] operational server log
    return NextResponse.json({ error: "send_failed" }, { status: 500 });
  }

  // Mark as seen after successful send
  seenIdempotencyKeys.set(idempotencyKey, true);
  console.info("[recovery/quote/send] send accepted", { campaignId: idempotencyKey, priceSource: quote.priceSource }); // i18n-exempt -- BRIK-RQ-1 [ttl=2027-03-02] operational server log

  return NextResponse.json({ status: "accepted", idempotencyKey }, { status: 200 });
}
