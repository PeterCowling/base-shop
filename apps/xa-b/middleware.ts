import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { verifyAccessToken } from "./src/lib/accessTokens";
import { ACCESS_COOKIE_NAME, resolveAccessCookieSecret } from "./src/lib/stealth";
import { xaI18n } from "./src/lib/xaI18n";

function buildContentSecurityPolicy() {
  const isProd = process.env.NODE_ENV === "production";
  const scriptSrc = [
    xaI18n.t("xaB.middleware.l10c5"),
    xaI18n.t("xaB.middleware.l11c5"),
    ...(isProd ? [] : [xaI18n.t("xaB.middleware.l12c24")]),
  ].join(" ");
  const connectSrc = [
    xaI18n.t("xaB.middleware.l15c5"),
    ...(isProd ? ["wss:"] : ["ws:", "wss:"]),
  ].join(" ");
  return [
    xaI18n.t("xaB.middleware.l19c5"),
    xaI18n.t("xaB.middleware.l20c5"),
    xaI18n.t("xaB.middleware.l21c5"),
    xaI18n.t("xaB.middleware.l22c5"),
    xaI18n.t("xaB.middleware.l23c5"),
    xaI18n.t("xaB.middleware.l24c5"),
    xaI18n.t("xaB.middleware.l25c5"),
    xaI18n.t("xaB.middleware.l26c5"),
    scriptSrc,
    connectSrc,
  ].join("; ");
}

function parseBool(value: string | undefined) {
  if (!value) return null;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function isStealthEnabled() {
  const raw =
    process.env.XA_STEALTH_MODE ??
    process.env.STEALTH_MODE ??
    process.env.NEXT_PUBLIC_STEALTH_MODE;
  const parsed = parseBool(raw);
  if (typeof parsed === "boolean") return parsed;
  return process.env.NODE_ENV === "production";
}

function isStrictStealth() {
  return (
    parseBool(process.env.XA_STRICT_STEALTH ?? process.env.STEALTH_STRICT) ===
    true
  );
}

function resolveAllowedHosts() {
  const raw = process.env.XA_ALLOWED_HOSTS ?? process.env.STEALTH_ALLOWED_HOSTS ?? "";
  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeHost(value?: string | null) {
  if (!value) return "";
  const host = value.split(",")[0]?.trim() ?? "";
  return host.split(":")[0]?.toLowerCase() ?? "";
}

function isHostAllowed(request: NextRequest) {
  const allowed = resolveAllowedHosts();
  if (!allowed.length) return true;
  if (process.env.NODE_ENV !== "production") return true;
  const host =
    normalizeHost(request.headers.get("x-forwarded-host")) ||
    normalizeHost(request.headers.get("host")) ||
    request.nextUrl.hostname.toLowerCase();
  return allowed.includes(host);
}

function requiresCfAccess() {
  const parsed = parseBool(
    process.env.XA_REQUIRE_CF_ACCESS ?? process.env.STEALTH_REQUIRE_CF_ACCESS,
  );
  return Boolean(parsed);
}

function hasCfAccessHeader(request: NextRequest) {
  return Boolean(
    request.headers.get("cf-access-jwt-assertion") ||
      request.headers.get("cf-access-authenticated-user-email"),
  );
}

function guardTokenConfig() {
  const token = process.env.XA_GUARD_TOKEN ?? "";
  return token.trim();
}

function hasValidGuardToken(request: NextRequest, token: string) {
  if (!token) return true;
  return request.headers.get("x-xa-guard") === token;
}

async function hasInviteCookie(request: NextRequest, secret: string) {
  const cookie = request.cookies.get(ACCESS_COOKIE_NAME)?.value ?? "";
  if (!cookie || !secret) return false;
  try {
    const payload = await verifyAccessToken(cookie, secret);
    return payload?.kind === "invite";
  } catch {
    return false;
  }
}

function isAdminPath(pathname: string) {
  return pathname.startsWith("/access/admin") || pathname.startsWith("/api/access-admin");
}

function isGatePath(pathname: string) {
  if (isAdminPath(pathname)) return false;
  if (pathname === "/access") return true;
  return pathname.startsWith("/api/access");
}

function buildSecurityHeaders(): Record<string, string> {
  const stealthEnabled = isStealthEnabled();
  return {
    "Content-Security-Policy": buildContentSecurityPolicy(),
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()", // i18n-exempt -- XA-0015 [ttl=2026-12-31] technical HTTP header value
    ...(stealthEnabled
      ? {
          "X-Robots-Tag": xaI18n.t("xaB.middleware.l134c27"),
          "Cache-Control": xaI18n.t("xaB.middleware.l135c28"),
        }
      : {}),
  };
}

function applyHeaders(response: NextResponse) {
  const headers = buildSecurityHeaders();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const stealthEnabled = isStealthEnabled();
  if (stealthEnabled) {
    const strict = isStrictStealth();
    const hiddenResponse = () => applyHeaders(new NextResponse(null, { status: 404 }));
    const pathname = request.nextUrl.pathname;
    const isGateRoute = isGatePath(pathname);
    const isAdminRoute = isAdminPath(pathname);

    if (!isHostAllowed(request)) {
      return hiddenResponse();
    }

    const guardToken = guardTokenConfig();
    const accessRequired = requiresCfAccess();
    const secret = resolveAccessCookieSecret();
    const hasInvite = await hasInviteCookie(request, secret);

    if (!isGateRoute && !isAdminRoute && !hasInvite) {
      if (strict) return hiddenResponse();
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/access";
      redirectUrl.searchParams.set(
        "next",
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
      );
      return applyHeaders(NextResponse.redirect(redirectUrl));
    }

    if (!isGateRoute) {
      if (accessRequired && !hasCfAccessHeader(request)) {
        return hiddenResponse();
      }

      if (!hasValidGuardToken(request, guardToken)) {
        return hiddenResponse();
      }
    }
  }

  return applyHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/|.*\\.[\\w]+$).*)"],
};
