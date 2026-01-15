/* eslint-disable ds/no-hardcoded-copy -- XA-0001 [ttl=2026-12-31] legacy copy in crypto error messages pending i18n overhaul */
type AccessTokenPayload = {
  kind: "invite" | "admin";
  exp: number;
  iat: number;
  inviteId?: string;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getCrypto() {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto is unavailable in this runtime.");
  }
  return globalThis.crypto;
}

function base64UrlEncode(bytes: Uint8Array) {
  if (typeof btoa !== "function") {
    throw new Error("btoa is unavailable in this runtime.");
  }
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  if (typeof atob !== "function") {
    throw new Error("atob is unavailable in this runtime.");
  }
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const base64 = `${padded}${padding}`;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function importKey(secret: string) {
  const crypto = getCrypto();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function signPayload(payload: string, secret: string) {
  const crypto = getCrypto();
  const key = await importKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return base64UrlEncode(new Uint8Array(signature));
}

function isTokenExpired(exp: number) {
  const now = Math.floor(Date.now() / 1000);
  return exp <= now;
}

function safeParsePayload(value: string): AccessTokenPayload | null {
  try {
    const data = JSON.parse(value) as AccessTokenPayload;
    if (!data || typeof data !== "object") return null;
    if (data.kind !== "invite" && data.kind !== "admin") return null;
    if (typeof data.exp !== "number" || typeof data.iat !== "number") return null;
    if (isTokenExpired(data.exp)) return null;
    return data;
  } catch {
    return null;
  }
}

export async function createAccessToken(payload: AccessTokenPayload, secret: string) {
  const encodedPayload = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = await signPayload(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export async function verifyAccessToken(token: string, secret: string) {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  const expected = await signPayload(encodedPayload, secret);
  if (expected !== signature) return null;
  const payloadBytes = base64UrlDecode(encodedPayload);
  return safeParsePayload(decoder.decode(payloadBytes));
}

export type { AccessTokenPayload };
