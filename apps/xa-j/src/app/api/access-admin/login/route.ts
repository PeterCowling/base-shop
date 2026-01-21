import { NextResponse } from "next/server";

import {
  issueAdminSession,
  setAdminCookie,
  validateAdminToken,
} from "../../../../lib/accessAdmin";
import { resolveAccessCookieSecret } from "../../../../lib/stealth";
import { applyRateLimitHeaders, getRequestIp, rateLimit } from "../../../../lib/rateLimit";

export const runtime = "edge";

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
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
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
