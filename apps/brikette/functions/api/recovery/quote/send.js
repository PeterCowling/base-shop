// apps/brikette/functions/api/recovery/quote/send.js
// Cloudflare Pages Function for recovery quote email sends.
// Static Pages deploys do not execute Next.js app router API routes, so this
// endpoint mirrors the server route contract at /api/recovery/quote/send.

const RECOVERY_BCC = "hostelpositano@gmail.com";
const CURRENCY = "EUR";

const INDICATIVE_FROM_PER_NIGHT = {
  room_3: 55,
  room_4: 55,
  room_5: 66.5,
  room_6: 66.5,
  room_9: 66.5,
  room_10: 80,
  room_11: 82,
  room_12: 84,
  double_room: 129,
};

const seenIdempotencyKeys = new Map();

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function countNights(checkin, checkout) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round(
    (new Date(checkout).getTime() - new Date(checkin).getTime()) / msPerDay
  );
}

function buildQuote(context) {
  const nights = countNights(context.checkin, context.checkout);
  const pricePerNight = context.room_id
    ? INDICATIVE_FROM_PER_NIGHT[context.room_id] ?? null
    : null;
  const totalFrom =
    pricePerNight !== null && nights > 0
      ? Math.round(pricePerNight * nights * 100) / 100
      : null;
  return {
    nights,
    pricePerNight,
    totalFrom,
    priceSource: pricePerNight === null ? "none" : "indicative",
  };
}

function buildIdempotencyKey(context) {
  return [
    "rq",
    context.checkin ?? "",
    context.checkout ?? "",
    String(context.pax ?? ""),
    context.room_id ?? "",
    context.rate_plan ?? "",
  ].join("|");
}

function getSender(env) {
  const sender = (env.CAMPAIGN_FROM || env.GMAIL_USER || "").trim().toLowerCase();
  return isValidEmail(sender) ? sender : "";
}

function buildEmailBody({ context, quote, resumeLink }) {
  const priceLabel =
    quote.priceSource === "indicative" && quote.totalFrom !== null
      ? `From ${CURRENCY} ${quote.totalFrom} total (approx. ${CURRENCY} ${quote.pricePerNight}/night x ${quote.nights} nights - indicative)`
      : "Price not yet calculated. Please reply and we will confirm an exact quote."; // i18n-exempt -- BRIK-RQ-2 [ttl=2027-03-04] transactional email body

  const lines = [
    "Thanks for checking rates with Hostel Brikette.", // i18n-exempt -- BRIK-RQ-2 [ttl=2027-03-04] transactional email body
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

async function sendViaResend(env, message) {
  const apiKey = (env.RESEND_API_KEY || "").trim();
  if (!apiKey) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: message.from,
      to: [message.to],
      bcc: [message.bcc],
      subject: message.subject,
      text: message.text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`resend_error_${response.status}:${errorText.slice(0, 256)}`);
  }
  return true;
}

async function sendViaSendgrid(env, message) {
  const apiKey = (env.SENDGRID_API_KEY || "").trim();
  if (!apiKey) return false;

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: message.to }],
          bcc: [{ email: message.bcc }],
        },
      ],
      from: { email: message.from },
      subject: message.subject,
      content: [{ type: "text/plain", value: message.text }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`sendgrid_error_${response.status}:${errorText.slice(0, 256)}`);
  }
  return true;
}

async function dispatchEmail(env, message) {
  const preferred = (env.EMAIL_PROVIDER || "").trim().toLowerCase();
  const order =
    preferred === "sendgrid"
      ? ["sendgrid", "resend"]
      : preferred === "resend"
        ? ["resend", "sendgrid"]
        : ["resend", "sendgrid"];

  for (const provider of order) {
    if (provider === "resend") {
      try {
        if (await sendViaResend(env, message)) return;
      } catch (error) {
        console.error("[recovery/quote/send:function] resend failure", error); // i18n-exempt -- BRIK-RQ-2 [ttl=2027-03-04] operational server log
      }
      continue;
    }
    try {
      if (await sendViaSendgrid(env, message)) return;
    } catch (error) {
      console.error("[recovery/quote/send:function] sendgrid failure", error); // i18n-exempt -- BRIK-RQ-2 [ttl=2027-03-04] operational server log
    }
  }

  throw new Error("no_configured_email_provider");
}

function validateRequestBody(body) {
  if (!body || typeof body !== "object") return false;
  if (!isValidEmail(body.guestEmail)) return false;
  if (!isNonEmptyString(body.consentVersion)) return false;
  if (!isNonEmptyString(body.leadCaptureId)) return false;
  if (!body.context || typeof body.context !== "object") return false;

  const { context } = body;
  if (!isNonEmptyString(context.checkin)) return false;
  if (!isNonEmptyString(context.checkout)) return false;
  if (!Number.isInteger(context.pax) || context.pax <= 0) return false;
  if (!isNonEmptyString(context.source_route)) return false;
  if (typeof context.room_id !== "undefined" && !isNonEmptyString(context.room_id)) return false;
  if (typeof context.rate_plan !== "undefined" && !["nr", "flex"].includes(context.rate_plan)) return false;

  return true;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}

export async function onRequestPost(context) {
  let body;
  try {
    body = await context.request.json();
  } catch {
    return jsonResponse({ error: "invalid_request" }, 400);
  }

  if (!validateRequestBody(body)) {
    return jsonResponse({ error: "invalid_request" }, 400);
  }

  const idempotencyKey = buildIdempotencyKey(body.context);
  if (seenIdempotencyKeys.has(idempotencyKey)) {
    return jsonResponse({ status: "duplicate", idempotencyKey }, 200);
  }

  const sender = getSender(context.env);
  if (!sender) {
    return jsonResponse({ error: "provider_not_configured" }, 503);
  }

  const quote = buildQuote(body.context);
  const subject = `Your Brikette quote: ${body.context.checkin} to ${body.context.checkout} (${body.context.pax} guest${body.context.pax !== 1 ? "s" : ""})`;
  const text = buildEmailBody({
    context: body.context,
    quote,
    resumeLink: typeof body.resumeLink === "string" ? body.resumeLink : undefined,
  });

  try {
    await dispatchEmail(context.env, {
      from: sender,
      to: body.guestEmail.trim().toLowerCase(),
      bcc: RECOVERY_BCC,
      subject,
      text,
    });
  } catch (error) {
    console.error("[recovery/quote/send:function] send failed", error); // i18n-exempt -- BRIK-RQ-2 [ttl=2027-03-04] operational server log
    return jsonResponse({ error: "send_failed" }, 500);
  }

  seenIdempotencyKeys.set(idempotencyKey, true);
  return jsonResponse({ status: "accepted", idempotencyKey }, 200);
}

export async function onRequest() {
  return jsonResponse({ error: "method_not_allowed" }, 405);
}
