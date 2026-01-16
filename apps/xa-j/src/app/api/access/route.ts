import { NextResponse } from "next/server";

import {
  ACCESS_COOKIE_NAME,
  normalizeInviteCode,
  resolveInviteCodes,
  resolveAccessCookieSecret,
} from "../../../lib/stealth";
import { createAccessToken } from "../../../lib/accessTokens";
import {
  findValidInvite,
  isInviteActive,
  listInvites,
  registerInviteUse,
} from "../../../lib/accessStore";
import { applyRateLimitHeaders, getRequestIp, rateLimit } from "../../../lib/rateLimit";

export const runtime = "edge";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function resolveNextPath(value: string | null) {
  if (!value) return "/";
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return "/";
  if (trimmed.startsWith("//")) return "/";
  return trimmed;
}

export async function POST(request: Request) {
  const requestIp = getRequestIp(request);
  const limit = rateLimit({
    key: `access-code:${requestIp || "unknown"}`,
    windowMs: 5 * 60 * 1000,
    max: 10,
  });
  if (!limit.allowed) {
    const url = new URL("/access", request.url);
    url.searchParams.set("error", "rate_limited");
    const response = NextResponse.redirect(url, 303);
    applyRateLimitHeaders(response.headers, limit);
    return response;
  }

  const form = await request.formData();
  const code = String(form.get("code") ?? "").trim();
  const next = resolveNextPath(String(form.get("next") ?? ""));
  const codes = resolveInviteCodes();
  const secret = resolveAccessCookieSecret();
  const normalizedCode = normalizeInviteCode(code);

  if (!code) {
    const url = new URL("/access", request.url);
    url.searchParams.set("error", "missing");
    if (next && next !== "/") url.searchParams.set("next", next);
    const response = NextResponse.redirect(url, 303);
    applyRateLimitHeaders(response.headers, limit);
    return response;
  }

  if (!secret) {
    return NextResponse.json({ ok: false, error: "missing_secret" }, { status: 500 });
  }

  let valid = false;
  let inviteId: string | undefined;
  let inviteExpiresAt: string | undefined;
  if (codes.length && codes.includes(normalizedCode)) {
    valid = true;
  } else {
    const { invite } = await findValidInvite(normalizedCode);
    if (invite) {
      valid = true;
      inviteId = invite.id;
      inviteExpiresAt = invite.expiresAt;
      await registerInviteUse(invite.id);
    }
  }

  if (!valid) {
    const { invites } = await listInvites();
    const hasActiveInvites = invites.some(isInviteActive) || codes.length > 0;
    const url = new URL("/access", request.url);
    url.searchParams.set("error", hasActiveInvites ? "invalid" : "closed");
    if (next && next !== "/") url.searchParams.set("next", next);
    const response = NextResponse.redirect(url, 303);
    applyRateLimitHeaders(response.headers, limit);
    return response;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const defaultExpiry = nowSeconds + MAX_AGE_SECONDS;
  const inviteExpiry = inviteExpiresAt ? Math.floor(Date.parse(inviteExpiresAt) / 1000) : null;
  const exp = inviteExpiry ? Math.min(inviteExpiry, defaultExpiry) : defaultExpiry;
  if (exp <= nowSeconds) {
    const url = new URL("/access", request.url);
    url.searchParams.set("error", "invalid");
    if (next && next !== "/") url.searchParams.set("next", next);
    const response = NextResponse.redirect(url, 303);
    applyRateLimitHeaders(response.headers, limit);
    return response;
  }

  const token = await createAccessToken(
    { kind: "invite", exp, iat: nowSeconds, inviteId },
    secret,
  );
  const response = NextResponse.redirect(new URL(next, request.url), 303);
  response.cookies.set(ACCESS_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: exp - nowSeconds,
    path: "/",
  });
  applyRateLimitHeaders(response.headers, limit);
  return response;
}
