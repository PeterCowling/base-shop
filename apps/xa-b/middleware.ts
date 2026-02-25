import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { verifyAccessToken } from "./src/lib/accessTokens";
import { ACCESS_COOKIE_NAME, resolveAccessCookieSecret } from "./src/lib/stealth";
import { xaI18n } from "./src/lib/xaI18n";

type CfAccessJwtHeader = {
  alg?: string;
  kid?: string;
};

type CfAccessJwtPayload = {
  exp?: number;
  nbf?: number;
  iss?: string;
  aud?: string | string[];
};

type ParsedCfAccessAssertion = {
  headerPart: string;
  payloadPart: string;
  signaturePart: string;
  payload: CfAccessJwtPayload;
  issuer: string;
  kid: string;
};

declare global {
  var __xaCfAccessKeyCache: Map<string, CryptoKey> | undefined;
}

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

function shouldTrustForwardedHostHeader() {
  return parseBool(process.env.XA_TRUST_FORWARDED_HOST_HEADER) === true;
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
    (shouldTrustForwardedHostHeader()
      ? normalizeHost(request.headers.get("x-forwarded-host"))
      : "") ||
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
  return Boolean(request.headers.get("cf-access-jwt-assertion"));
}

function decodeBase64Url(value: string): Uint8Array | null {
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "===".slice((base64.length + 3) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

function decodeJwtJson<T>(value: string): T | null {
  const bytes = decodeBase64Url(value);
  if (!bytes) return null;
  try {
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

function getCfAccessKeyCache() {
  if (!globalThis.__xaCfAccessKeyCache) {
    globalThis.__xaCfAccessKeyCache = new Map<string, CryptoKey>();
  }
  return globalThis.__xaCfAccessKeyCache;
}

function resolveExpectedCfAudiences(): string[] {
  return (process.env.XA_CF_ACCESS_AUDIENCE ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function hasExpectedAudience(payload: CfAccessJwtPayload): boolean {
  const expected = resolveExpectedCfAudiences();
  if (!expected.length) return false;
  const audiences = Array.isArray(payload.aud) ? payload.aud : payload.aud ? [payload.aud] : [];
  return audiences.some((aud) => expected.includes(aud));
}

function normalizeIssuerOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    if (url.pathname && url.pathname !== "/") return null;
    url.pathname = "/";
    url.search = "";
    url.hash = "";
    return url.origin;
  } catch {
    return null;
  }
}

function resolveExpectedCfIssuers(): string[] {
  return [process.env.XA_CF_ACCESS_ISSUER ?? "", process.env.XA_CF_ACCESS_ISSUERS ?? ""]
    .join(",")
    .split(",")
    .map((entry) => normalizeIssuerOrigin(entry.trim()))
    .filter((entry): entry is string => Boolean(entry));
}

function hasExpectedIssuer(issuer: string): boolean {
  const expected = resolveExpectedCfIssuers();
  if (!expected.length) return false;
  return expected.includes(issuer);
}

function resolveIssuerCertsUrl(issuer: string): string | null {
  try {
    const url = new URL(issuer);
    if (url.protocol !== "https:") return null;
    url.pathname = "/cdn-cgi/access/certs";
    url.search = "";
    return url.toString();
  } catch {
    return null;
  }
}

async function resolveCfAccessKey(issuer: string, kid: string): Promise<CryptoKey | null> {
  const cacheKey = `${issuer}|${kid}`;
  const cache = getCfAccessKeyCache();
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const certsUrl = resolveIssuerCertsUrl(issuer);
  if (!certsUrl) return null;

  let response: Response;
  try {
    response = await fetch(certsUrl, { cache: "no-store" });
  } catch {
    return null;
  }
  if (!response.ok) return null;

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return null;
  }
  const keys = Array.isArray((payload as { keys?: unknown[] })?.keys)
    ? ((payload as { keys: JsonWebKey[] }).keys ?? [])
    : [];
  const jwk = keys.find((candidate) => (candidate as { kid?: string }).kid === kid);
  if (!jwk) return null;

  try {
    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    cache.set(cacheKey, key);
    return key;
  } catch {
    return null;
  }
}

function parseCfAccessAssertion(assertion: string): ParsedCfAccessAssertion | null {
  const parts = assertion.split(".");
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, signaturePart] = parts;
  if (!headerPart || !payloadPart || !signaturePart) return null;

  const header = decodeJwtJson<CfAccessJwtHeader>(headerPart);
  const payload = decodeJwtJson<CfAccessJwtPayload>(payloadPart);
  if (!header || !payload) return null;

  const kid = typeof header.kid === "string" ? header.kid.trim() : "";
  if (header.alg !== "RS256" || !kid) return null;

  const issuer = normalizeIssuerOrigin(payload.iss ?? "");
  if (!issuer || !hasExpectedIssuer(issuer) || !hasExpectedAudience(payload)) return null;

  return {
    headerPart,
    payloadPart,
    signaturePart,
    payload,
    issuer,
    kid,
  };
}

async function hasValidCfAccessJwt(request: NextRequest): Promise<boolean> {
  const assertion = request.headers.get("cf-access-jwt-assertion")?.trim();
  if (!assertion) return false;

  const parsed = parseCfAccessAssertion(assertion);
  if (!parsed) return false;
  const { headerPart, payloadPart, signaturePart, payload, issuer, kid } = parsed;

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp <= now) return false;
  if (typeof payload.nbf === "number" && payload.nbf > now) return false;

  const key = await resolveCfAccessKey(issuer, kid);
  if (!key) return false;

  const signature = decodeBase64Url(signaturePart);
  if (!signature) return false;
  const data = new TextEncoder().encode(`${headerPart}.${payloadPart}`);
  try {
    return await crypto.subtle.verify(
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      key,
      signature,
      data,
    );
  } catch {
    return false;
  }
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
      if (accessRequired && (!hasCfAccessHeader(request) || !(await hasValidCfAccessJwt(request)))) {
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
