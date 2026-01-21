import crypto from "node:crypto";

import type { NextResponse } from "next/server";

const COOKIE_NAME = "xa_uploader_admin";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function isVendorMode(): boolean {
  return process.env.XA_UPLOADER_MODE === "vendor";
}

function timingSafeEqual(a: string, b: string): boolean {
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
  return requireEnv("XA_UPLOADER_ADMIN_TOKEN").trim();
}

function issueSessionToken(secret: string): string {
  const issuedAt = Date.now();
  const nonce = crypto.randomBytes(16).toString("base64url");
  const payload = `v1.${issuedAt}.${nonce}`;
  const signature = sign(payload, secret);
  return `${payload}.${signature}`;
}

function verifySessionToken(token: string, secret: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 4) return false;
  const [version, issuedAtRaw, nonce, signature] = parts;
  if (version !== "v1") return false;
  if (!issuedAtRaw || !nonce || !signature) return false;

  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt)) return false;

  const ageSeconds = (Date.now() - issuedAt) / 1000;
  if (ageSeconds < 0 || ageSeconds > SESSION_MAX_AGE_SECONDS) return false;

  const payload = `v1.${issuedAtRaw}.${nonce}`;
  const expected = sign(payload, secret);
  return timingSafeEqual(signature, expected);
}

export async function validateUploaderAdminToken(token: string): Promise<boolean> {
  if (isVendorMode()) return true;
  const expected = adminToken();
  const trimmed = token.trim();
  if (!trimmed) return false;
  return timingSafeEqual(trimmed, expected);
}

export async function hasUploaderSession(request: Request): Promise<boolean> {
  if (isVendorMode()) return true;
  const token = getCookieValue(request.headers.get("cookie"), COOKIE_NAME);
  if (!token) return false;
  return verifySessionToken(token, sessionSecret());
}

export async function issueUploaderSession(): Promise<string> {
  if (isVendorMode()) return "vendor";
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
