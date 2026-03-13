// Validate required environment variables at module load time.
import "./env";

import crypto from "node:crypto";

import type { NextResponse } from "next/server";

import { getPmKv } from "./pmKv";
import { pmLog } from "./pmLog";

const COOKIE_NAME = "payment_manager_admin";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/** KV key for session revocation — stores minimum issuedAt timestamp (ms). */
const REVOCATION_KV_KEY = "pm:revocation:min_issued_at";

export function timingSafeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function sign(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

function getCookieValue(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    if (trimmed.slice(0, eq) !== name) continue;
    return decodeURIComponent(trimmed.slice(eq + 1));
  }
  return null;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function sessionSecret(): string {
  return requireEnv("PAYMENT_MANAGER_SESSION_SECRET");
}

function adminToken(): string {
  // Allow E2E token override in non-production environments only.
  if (process.env.NODE_ENV !== "production") {
    const e2eOverride = process.env.PAYMENT_MANAGER_E2E_ADMIN_TOKEN?.trim();
    if (e2eOverride) return e2eOverride;
  }
  return requireEnv("PAYMENT_MANAGER_ADMIN_TOKEN").trim();
}

function issueSessionToken(secret: string): string {
  const issuedAt = Date.now();
  const nonce = crypto.randomBytes(16).toString("base64url");
  const payload = `v1.${issuedAt}.${nonce}`;
  return `${payload}.${sign(payload, secret)}`;
}

/**
 * Pure comparison: is the token's issuedAt before the revocation threshold?
 * Returns true if the token is revoked (issued before the minimum timestamp).
 */
export function isTokenRevokedByTimestamp(
  issuedAt: number,
  minIssuedAt: number | null,
): boolean {
  if (minIssuedAt === null) return false;
  if (!Number.isFinite(minIssuedAt)) return false;
  return issuedAt < minIssuedAt;
}

/**
 * Check session revocation status via KV-backed minimum-issuedAt.
 *
 * Fails CLOSED on KV unavailability (returns true = revoked) — unlike inventory-uploader
 * which fails open. Payment-manager is a financial tool; denying access on KV failure
 * is the safer default.
 */
async function isSessionRevoked(issuedAt: number): Promise<boolean> {
  try {
    const kv = await getPmKv();
    if (!kv) {
      // KV not bound — fail closed (treat as revoked to deny access).
      pmLog("warn", "revocation_kv_not_bound", {
        message: "PAYMENT_MANAGER_KV not bound — failing closed (session denied)", // i18n-exempt -- PM-0001 internal server log, not UI copy [ttl=2027-12-31]
      });
      return true;
    }

    const raw = await kv.get(REVOCATION_KV_KEY);
    if (!raw) return false; // No revocation timestamp set — session is valid

    const minIssuedAt = Number(raw);
    if (!Number.isFinite(minIssuedAt)) {
      pmLog("warn", "revocation_invalid_timestamp", {
        message: "Non-numeric value in revocation KV key",
        raw,
      });
      return true; // Corrupt revocation state — fail closed
    }

    if (isTokenRevokedByTimestamp(issuedAt, minIssuedAt)) {
      pmLog("warn", "session_revoked", { issuedAt, minIssuedAt });
      return true;
    }

    return false;
  } catch (err) {
    pmLog("warn", "revocation_kv_unavailable", {
      message: "KV read failed during revocation check — failing closed", // i18n-exempt -- PM-0001 internal server log, not UI copy [ttl=2027-12-31]
      error: err instanceof Error ? err.message : String(err),
    });
    return true; // Fail closed — KV error = treat session as revoked
  }
}

async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 4) return false;
  const [version, issuedAtRaw, nonce, signature] = parts;

  // Timing-safe version check.
  if (!timingSafeEqual(version ?? "", "v1")) return false;
  if (!issuedAtRaw || !nonce || !signature) return false;

  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt)) return false;

  const ageSeconds = (Date.now() - issuedAt) / 1000;
  if (ageSeconds < 0 || ageSeconds > SESSION_MAX_AGE_SECONDS) return false;

  const payload = `v1.${issuedAtRaw}.${nonce}`;
  const expected = sign(payload, secret);
  if (!timingSafeEqual(signature, expected)) return false;

  // KV-backed session revocation check.
  const revoked = await isSessionRevoked(issuedAt);
  if (revoked) return false;

  return true;
}

/**
 * Revoke all sessions issued before the current timestamp.
 * Writes the current time (ms) to the KV revocation key.
 * After this call, all existing session tokens become invalid.
 */
export async function revokeAllPmSessions(): Promise<void> {
  const kv = await getPmKv();
  if (!kv) {
    throw new Error("KV namespace not available — cannot revoke sessions");
  }
  const now = String(Date.now());
  await kv.put(REVOCATION_KV_KEY, now);
  pmLog("info", "sessions_revoked", { minIssuedAt: now });
}

export async function validatePmAdminToken(token: string): Promise<boolean> {
  const expected = adminToken();
  const trimmed = token.trim();
  if (!trimmed) return false;
  return timingSafeEqual(trimmed, expected);
}

export async function hasPmSession(request: Request): Promise<boolean> {
  return hasPmSessionFromCookieHeader(request.headers.get("cookie"));
}

export async function hasPmSessionFromCookieHeader(
  cookieHeader: string | null,
): Promise<boolean> {
  const token = getCookieValue(cookieHeader, COOKIE_NAME);
  if (!token) return false;
  return verifySessionToken(token, sessionSecret());
}

export async function issuePmSession(): Promise<string> {
  return issueSessionToken(sessionSecret());
}

export function setPmCookie(response: NextResponse, sessionToken: string) {
  response.cookies.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearPmCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
