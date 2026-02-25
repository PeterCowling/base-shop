import { NextResponse } from "next/server";

import {
  issueAdminSession,
  setAdminCookie,
  validateAdminToken,
} from "../../../../lib/accessAdmin";
import { applyRateLimitHeaders, getRequestIp, rateLimit } from "../../../../lib/rateLimit";
import { PayloadTooLargeError, readJsonBodyWithLimit } from "../../../../lib/requestBody";
import { resolveAccessCookieSecret } from "../../../../lib/stealth";

// Uses node:crypto via accessAdmin.
export const runtime = "nodejs";

const LOGIN_PAYLOAD_MAX_BYTES = 8 * 1024;

export async function POST(request: Request) {
  const requestIp = getRequestIp(request);
  const limit = rateLimit({
    key: `access-admin-login:${requestIp || "unknown"}`,
    windowMs: 15 * 60 * 1000,
    max: 5,
  });
  if (!limit.allowed) {
    const headers = new Headers();
    applyRateLimitHeaders(headers, limit);
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429, headers });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await readJsonBodyWithLimit(request, LOGIN_PAYLOAD_MAX_BYTES)) as Record<string, unknown>;
  } catch (error) {
    const status = error instanceof PayloadTooLargeError ? 413 : 400;
    const response = NextResponse.json(
      { ok: false, error: status === 413 ? "payload_too_large" : "invalid" },
      { status },
    );
    applyRateLimitHeaders(response.headers, limit);
    return response;
  }

  const token = typeof payload.token === "string" ? payload.token.trim() : "";
  if (!token) {
    const response = NextResponse.json({ ok: false, error: "missing" }, { status: 400 });
    applyRateLimitHeaders(response.headers, limit);
    return response;
  }

  const secret = resolveAccessCookieSecret();
  if (!secret) {
    const response = NextResponse.json({ ok: false, error: "missing_secret" }, { status: 500 });
    applyRateLimitHeaders(response.headers, limit);
    return response;
  }

  const valid = await validateAdminToken(token);
  if (!valid) {
    const response = NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    applyRateLimitHeaders(response.headers, limit);
    return response;
  }

  const sessionToken = await issueAdminSession(secret);
  const response = NextResponse.json({ ok: true });
  setAdminCookie(response, sessionToken);
  applyRateLimitHeaders(response.headers, limit);
  return response;
}
