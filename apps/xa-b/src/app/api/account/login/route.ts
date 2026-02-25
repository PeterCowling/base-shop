import { NextResponse } from "next/server";

import { issueAccountSession, setAccountCookie } from "../../../../lib/accountAuth";
import { authenticateAccountUser, normalizeAccountEmail } from "../../../../lib/accountStore";
import { applyRateLimitHeaders, getRequestIp, rateLimit } from "../../../../lib/rateLimit";
import { PayloadTooLargeError, readJsonBodyWithLimit } from "../../../../lib/requestBody";
import { resolveAccessCookieSecret } from "../../../../lib/stealth";

export const runtime = "nodejs";
const ACCOUNT_LOGIN_PAYLOAD_MAX_BYTES = 8 * 1024;

export async function POST(request: Request) {
  const requestIp = getRequestIp(request);
  const limit = rateLimit({
    key: `account-login:${requestIp || "unknown"}`,
    windowMs: 15 * 60 * 1000,
    max: 10,
  });
  if (!limit.allowed) {
    const headers = new Headers();
    applyRateLimitHeaders(headers, limit);
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429, headers });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await readJsonBodyWithLimit(request, ACCOUNT_LOGIN_PAYLOAD_MAX_BYTES)) as Record<
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
  if (!email || !password) {
    const response = NextResponse.json({ ok: false, error: "missing" }, { status: 400 });
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

  const authenticated = await authenticateAccountUser({ email, password });
  if (!authenticated.user) {
    const response = NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
    applyRateLimitHeaders(response.headers, limit);
    return response;
  }

  const sessionToken = await issueAccountSession(
    authenticated.user.id,
    authenticated.user.email,
    secret,
  );
  const response = NextResponse.json({
    ok: true,
    email: authenticated.user.email,
    storeMode: authenticated.storeMode,
  });
  setAccountCookie(response, sessionToken);
  applyRateLimitHeaders(response.headers, limit);
  return response;
}
