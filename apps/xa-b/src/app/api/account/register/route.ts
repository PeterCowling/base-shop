import { NextResponse } from "next/server";

import { issueAccountSession, setAccountCookie } from "../../../../lib/accountAuth";
import {
  type AccountPreferredChannel,
  createAccountUser,
  isStrongAccountPassword,
  isValidAccountEmail,
  normalizeAccountEmail,
} from "../../../../lib/accountStore";
import { applyRateLimitHeaders, getRequestIp, rateLimit } from "../../../../lib/rateLimit";
import { PayloadTooLargeError, readJsonBodyWithLimit } from "../../../../lib/requestBody";
import { resolveAccessCookieSecret } from "../../../../lib/stealth";

export const runtime = "nodejs";
const ACCOUNT_REGISTER_PAYLOAD_MAX_BYTES = 16 * 1024;

function normalizeChannel(value: unknown): AccountPreferredChannel {
  if (value === "email" || value === "wechat") return value;
  return "whatsapp";
}

function sanitizeOptional(value: unknown, maxLength: number) {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().slice(0, maxLength);
  return normalized || undefined;
}

export async function POST(request: Request) {
  const requestIp = getRequestIp(request);
  const limit = rateLimit({
    key: `account-register:${requestIp || "unknown"}`,
    windowMs: 60 * 60 * 1000,
    max: 8,
  });
  if (!limit.allowed) {
    const headers = new Headers();
    applyRateLimitHeaders(headers, limit);
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429, headers });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await readJsonBodyWithLimit(request, ACCOUNT_REGISTER_PAYLOAD_MAX_BYTES)) as Record<
      string,
      unknown
    >;
  } catch (error) {
    const status = error instanceof PayloadTooLargeError ? 413 : 400;
    const response = NextResponse.json(
      { ok: false, error: status === 413 ? "payload_too_large" : "invalid" },
      { status },
    );
    applyRateLimitHeaders(response.headers, limit);
    return response;
  }

  const email = normalizeAccountEmail(typeof payload.email === "string" ? payload.email : "");
  const password = typeof payload.password === "string" ? payload.password : "";
  const whatsapp = sanitizeOptional(payload.whatsapp, 80);
  const skype = sanitizeOptional(payload.skype, 80);
  const preferredChannel = normalizeChannel(payload.preferredChannel);

  if (!isValidAccountEmail(email) || !isStrongAccountPassword(password)) {
    const response = NextResponse.json(
      { ok: false, error: "invalid_credentials" },
      { status: 400 },
    );
    applyRateLimitHeaders(response.headers, limit);
    return response;
  }

  const secret = resolveAccessCookieSecret();
  if (!secret) {
    const response = NextResponse.json(
      { ok: false, error: "missing_secret" },
      { status: 500 },
    );
    applyRateLimitHeaders(response.headers, limit);
    return response;
  }

  const created = await createAccountUser({
    email,
    password,
    whatsapp,
    skype,
    preferredChannel,
  });

  if (!created.user) {
    const response = NextResponse.json({ ok: false, error: "exists" }, { status: 409 });
    applyRateLimitHeaders(response.headers, limit);
    return response;
  }

  const sessionToken = await issueAccountSession(created.user.id, created.user.email, secret);
  const response = NextResponse.json({
    ok: true,
    email: created.user.email,
    storeMode: created.storeMode,
  });
  setAccountCookie(response, sessionToken);
  applyRateLimitHeaders(response.headers, limit);
  return response;
}
