import { NextResponse } from "next/server";

import {
  findValidInvite,
  isInviteActive,
  listInvites,
  registerInviteUse,
} from "../../../lib/accessStore";
import { createAccessToken } from "../../../lib/accessTokens";
import { applyRateLimitHeaders, getRequestIp, rateLimit } from "../../../lib/rateLimit";
import {
  ACCESS_COOKIE_NAME,
  normalizeInviteCode,
  resolveAccessCookieSecret,
  resolveInviteCodes,
} from "../../../lib/stealth";

export const runtime = "edge";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function resolveNextPath(value: string | null) {
  if (!value) return "/";
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return "/";
  if (trimmed.startsWith("//")) return "/";
  return trimmed;
}

function redirectAccess(args: {
  requestUrl: string;
  error: string;
  next: string;
  limit: ReturnType<typeof rateLimit>;
}) {
  const url = new URL("/access", args.requestUrl);
  url.searchParams.set("error", args.error);
  if (args.next && args.next !== "/") url.searchParams.set("next", args.next);
  const response = NextResponse.redirect(url, 303);
  applyRateLimitHeaders(response.headers, args.limit);
  return response;
}

export async function POST(request: Request) {
  const requestIp = getRequestIp(request);
  const limit = rateLimit({
    key: `access-code:${requestIp || "unknown"}`,
    windowMs: 5 * 60 * 1000,
    max: 10,
  });
  if (!limit.allowed) {
    return redirectAccess({
      requestUrl: request.url,
      error: "rate_limited",
      next: "/",
      limit,
    });
  }

  const form = await request.formData();
  const code = String(form.get("code") ?? "").trim();
  const next = resolveNextPath(String(form.get("next") ?? ""));
  const codes = resolveInviteCodes();
  const secret = resolveAccessCookieSecret();
  const normalizedCode = normalizeInviteCode(code);

  if (!code) {
    return redirectAccess({ requestUrl: request.url, error: "missing", next, limit });
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
    return redirectAccess({
      requestUrl: request.url,
      error: hasActiveInvites ? "invalid" : "closed",
      next,
      limit,
    });
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const defaultExpiry = nowSeconds + MAX_AGE_SECONDS;
  const inviteExpiry = inviteExpiresAt ? Math.floor(Date.parse(inviteExpiresAt) / 1000) : null;
  const exp = inviteExpiry ? Math.min(inviteExpiry, defaultExpiry) : defaultExpiry;
  if (exp <= nowSeconds) {
    return redirectAccess({ requestUrl: request.url, error: "invalid", next, limit });
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
