import crypto from "node:crypto";

import type { NextResponse } from "next/server";

const COOKIE_NAME = "inventory_admin";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

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
  return requireEnv("INVENTORY_SESSION_SECRET");
}

function adminToken(): string {
  return requireEnv("INVENTORY_ADMIN_TOKEN").trim();
}

function issueSessionToken(secret: string): string {
  const issuedAt = Date.now();
  const nonce = crypto.randomBytes(16).toString("base64url");
  const payload = `v1.${issuedAt}.${nonce}`;
  return `${payload}.${sign(payload, secret)}`;
}

function verifySessionToken(token: string, secret: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 4) return false;
  const [version, issuedAtRaw, nonce, signature] = parts;
  if (version !== "v1" || !issuedAtRaw || !nonce || !signature) return false;

  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt)) return false;

  const ageSeconds = (Date.now() - issuedAt) / 1000;
  if (ageSeconds < 0 || ageSeconds > SESSION_MAX_AGE_SECONDS) return false;

  const payload = `v1.${issuedAtRaw}.${nonce}`;
  return timingSafeEqual(signature, sign(payload, secret));
}

export async function validateInventoryAdminToken(token: string): Promise<boolean> {
  const expected = adminToken();
  const trimmed = token.trim();
  if (!trimmed) return false;
  return timingSafeEqual(trimmed, expected);
}

export async function hasInventorySession(request: Request): Promise<boolean> {
  return hasInventorySessionFromCookieHeader(request.headers.get("cookie"));
}

export async function hasInventorySessionFromCookieHeader(
  cookieHeader: string | null,
): Promise<boolean> {
  const token = getCookieValue(cookieHeader, COOKIE_NAME);
  if (!token) return false;
  return verifySessionToken(token, sessionSecret());
}

export async function issueInventorySession(): Promise<string> {
  return issueSessionToken(sessionSecret());
}

export function setInventoryCookie(response: NextResponse, sessionToken: string) {
  response.cookies.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearInventoryCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
