// Web Crypto HMAC-based admin session utilities.
// Uses globalThis.crypto.subtle — compatible with Cloudflare Workers, Edge Runtime,
// and Node.js 18+ (no node:crypto dependency).

import type { NextResponse } from "next/server";

export const ADMIN_COOKIE_NAME = "admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60; // 1 hour

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(`${padded}${padding}`);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Returns the SubtleCrypto instance for this runtime.
 * - Cloudflare Worker / Edge: globalThis.crypto.subtle (always available)
 * - Node.js 18+: globalThis.crypto.subtle (available)
 * - jsdom (Jest): falls back to node:crypto webcrypto (globalThis.crypto.subtle missing in jsdom)
 */
function getSubtle(): SubtleCrypto {
  if (globalThis.crypto?.subtle) return globalThis.crypto.subtle;
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- CARYINA-AUTH-01: dynamic require used only in jsdom (no globalThis.crypto.subtle); dead path in Worker/Node 18+
  const { webcrypto } = require("node:crypto") as typeof import("node:crypto");
  return webcrypto.subtle as SubtleCrypto;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return getSubtle().importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let i = 0; i < left.length; i++) {
    result |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return result === 0;
}

/** Constant-time comparison for the plain admin key (password check). */
export function compareAdminKey(submitted: string, expected: string): boolean {
  return constantTimeEqual(submitted.trim(), expected.trim());
}

/** Signs a new admin session token using HMAC-SHA256. Returns `header.signature` format. */
export async function signAdminSession(adminKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify({ kind: "admin", iat: now, exp: now + ADMIN_SESSION_MAX_AGE });
  const encodedPayload = base64UrlEncode(encoder.encode(payload));
  const key = await importHmacKey(adminKey);
  const sigBytes = await getSubtle().sign("HMAC", key, encoder.encode(encodedPayload));
  const signature = base64UrlEncode(new Uint8Array(sigBytes));
  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies an admin session token.
 * Returns `true` only when the HMAC is valid and the token has not expired.
 */
export async function verifyAdminSession(token: string, adminKey: string): Promise<boolean> {
  const dot = token.indexOf(".");
  if (dot === -1) return false;
  const encodedPayload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!encodedPayload || !signature) return false;
  try {
    const key = await importHmacKey(adminKey);
    const expectedSigBytes = await getSubtle().sign(
      "HMAC",
      key,
      encoder.encode(encodedPayload),
    );
    const expectedSignature = base64UrlEncode(new Uint8Array(expectedSigBytes));
    if (!constantTimeEqual(expectedSignature, signature)) return false;
    const parsed = JSON.parse(decoder.decode(base64UrlDecode(encodedPayload))) as Record<
      string,
      unknown
    >;
    const now = Math.floor(Date.now() / 1000);
    return parsed?.kind === "admin" && typeof parsed.exp === "number" && parsed.exp > now;
  } catch {
    return false;
  }
}

/** Sets the HttpOnly admin_session cookie on a NextResponse. */
export function setAdminCookie(response: NextResponse, token: string): void {
  response.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: ADMIN_SESSION_MAX_AGE,
    path: "/",
  });
}

/** Clears the admin_session cookie (immediate expiry). */
export function clearAdminCookie(response: NextResponse): void {
  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}
