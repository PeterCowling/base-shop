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

function shouldAttachNext(next: string) {
  return Boolean(next && next !== "/");
}

function redirectToAccess({
  request,
  limit,
  error,
  next,
}: {
  request: Request;
  limit: ReturnType<typeof rateLimit>;
  error: string;
  next?: string;
}) {
  const url = new URL("/access", request.url);
  url.searchParams.set("error", error);
  if (next && shouldAttachNext(next)) url.searchParams.set("next", next);
  const response = NextResponse.redirect(url, 303);
  applyRateLimitHeaders(response.headers, limit);
  return response;
}

function resolveExpirySeconds(nowSeconds: number, inviteExpiresAt: string | undefined) {
  const defaultExpiry = nowSeconds + MAX_AGE_SECONDS;
  if (!inviteExpiresAt) return defaultExpiry;
  const parsed = Math.floor(Date.parse(inviteExpiresAt) / 1000);
  if (!Number.isFinite(parsed)) return defaultExpiry;
  return Math.min(parsed, defaultExpiry);
}

export async function POST(request: Request) {
  const requestIp = getRequestIp(request);
  const limit = rateLimit({
    key: `access-code:${requestIp || "unknown"}`,
    windowMs: 5 * 60 * 1000,
    max: 10,
  });
  if (!limit.allowed) {
    return redirectToAccess({ request, limit, error: "rate_limited" });
  }

  const form = await request.formData();
  const code = String(form.get("code") ?? "").trim();
  const next = resolveNextPath(String(form.get("next") ?? ""));
  const codes = resolveInviteCodes();
  const secret = resolveAccessCookieSecret();
  const normalizedCode = normalizeInviteCode(code);

  if (!code) {
    return redirectToAccess({ request, limit, error: "missing", next });
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
    return redirectToAccess({
      request,
      limit,
      error: hasActiveInvites ? "invalid" : "closed",
      next,
    });
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const exp = resolveExpirySeconds(nowSeconds, inviteExpiresAt);
  if (exp <= nowSeconds) {
    return redirectToAccess({ request, limit, error: "invalid", next });
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
