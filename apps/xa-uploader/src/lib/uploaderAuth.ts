import crypto from "node:crypto";

import type { NextResponse } from "next/server";

import { getUploaderKv } from "./syncMutex";
import { uploaderLog } from "./uploaderLogger";

const COOKIE_NAME = "xa_uploader_admin";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/** KV key for session revocation — stores minimum issuedAt timestamp (ms). */
const REVOCATION_KV_KEY = "xa:revocation:min_issued_at";

function isVendorMode(): boolean {
  return process.env.XA_UPLOADER_MODE === "vendor";
}

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
  const parts = header.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq);
    if (key !== name) continue;
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
  return requireEnv("XA_UPLOADER_SESSION_SECRET");
}

function adminToken(): string {
  if (process.env.NODE_ENV !== "production") {
    const e2eOverride = process.env.XA_UPLOADER_E2E_ADMIN_TOKEN?.trim();
    if (e2eOverride) return e2eOverride;
  }
  return requireEnv("XA_UPLOADER_ADMIN_TOKEN").trim();
}

function vendorToken(): string {
  const configured = process.env.XA_UPLOADER_VENDOR_TOKEN?.trim();
  return configured || adminToken();
}

function expectedLoginToken(): string {
  return isVendorMode() ? vendorToken() : adminToken();
}

function issueSessionToken(secret: string): string {
  const issuedAt = Date.now();
  const nonce = crypto.randomBytes(16).toString("base64url");
  const payload = `v1.${issuedAt}.${nonce}`;
  const signature = sign(payload, secret);
  return `${payload}.${signature}`;
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
 * Fails open on KV unavailability (returns false = not revoked) with a warning log.
 * This is a deliberate tradeoff: for an admin tool with infrequent use,
 * availability is preferred over hard-blocking on KV failures.
 */
async function isSessionRevoked(issuedAt: number): Promise<boolean> {
  try {
    const kv = await getUploaderKv();
    if (!kv) return false; // KV not bound — fail open

    const raw = await kv.get(REVOCATION_KV_KEY);
    if (!raw) return false; // No revocation timestamp set

    const minIssuedAt = Number(raw);
    if (!Number.isFinite(minIssuedAt)) {
      uploaderLog("warn", "revocation_invalid_timestamp", {
        message: "Non-numeric value in revocation KV key",
        raw,
      });
      return false;
    }

    if (isTokenRevokedByTimestamp(issuedAt, minIssuedAt)) {
      uploaderLog("warn", "session_revoked", { issuedAt, minIssuedAt });
      return true;
    }

    return false;
  } catch (err) {
    uploaderLog("warn", "revocation_kv_unavailable", {
      message: "KV read failed during revocation check — failing open", // i18n-exempt -- XAUP-SEC-001 [ttl=2026-12-31] structured log context, not user-facing
      error: err instanceof Error ? err.message : String(err),
    });
    return false; // Fail open
  }
}

async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 4) return false;
  const [version, issuedAtRaw, nonce, signature] = parts;

  // Timing-safe version check (TASK-04: eliminates timing side-channel).
  if (!timingSafeEqual(version, "v1")) return false;
  if (!issuedAtRaw || !nonce || !signature) return false;

  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt)) return false;

  const ageSeconds = (Date.now() - issuedAt) / 1000;
  if (ageSeconds < 0 || ageSeconds > SESSION_MAX_AGE_SECONDS) return false;

  const payload = `v1.${issuedAtRaw}.${nonce}`;
  const expected = sign(payload, secret);
  if (!timingSafeEqual(signature, expected)) return false;

  // KV-backed session revocation check (TASK-02).
  const revoked = await isSessionRevoked(issuedAt);
  if (revoked) return false;

  return true;
}

/**
 * Revoke all sessions issued before the current timestamp.
 * Writes the current time (ms) to the KV revocation key.
 * After this call, all existing session tokens become invalid
 * (their issuedAt will be before the new minimum).
 */
export async function revokeAllSessions(): Promise<void> {
  const kv = await getUploaderKv();
  if (!kv) {
    // i18n-exempt -- XAUP-SEC-001 [ttl=2026-12-31] internal error message, not user-facing
    throw new Error("KV namespace not available — cannot revoke sessions");
  }
  const now = String(Date.now());
  await kv.put(REVOCATION_KV_KEY, now);
  uploaderLog("info", "sessions_revoked", { minIssuedAt: now });
}

export async function validateUploaderAdminToken(token: string): Promise<boolean> {
  const expected = expectedLoginToken();
  const trimmed = token.trim();
  if (!trimmed) return false;
  return timingSafeEqual(trimmed, expected);
}

export async function hasUploaderSession(request: Request): Promise<boolean> {
  return hasUploaderSessionFromCookieHeader(request.headers.get("cookie"));
}

export async function hasUploaderSessionFromCookieHeader(
  cookieHeader: string | null,
): Promise<boolean> {
  const token = getCookieValue(cookieHeader, COOKIE_NAME);
  if (!token) return false;
  return verifySessionToken(token, sessionSecret());
}

export async function issueUploaderSession(): Promise<string> {
  return issueSessionToken(sessionSecret());
}

export function setUploaderCookie(response: NextResponse, sessionToken: string) {
  response.cookies.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearUploaderCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
