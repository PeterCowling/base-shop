// packages/platform-core/src/previewTokens.ts

import crypto from "crypto";

export interface PreviewTokenPayload {
  shopId: string;
  pageId: string;
}

function payloadString(payload: PreviewTokenPayload): string {
  return `${payload.shopId}:${payload.pageId}`;
}

function hmacDigest(payload: PreviewTokenPayload, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payloadString(payload))
    .digest("base64url");
}

function timingSafeEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  try {
    return crypto.timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

function verifyToken(
  token: string | null | undefined,
  payload: PreviewTokenPayload,
  secret: string | undefined,
): boolean {
  if (!token || !secret) return false;
  const expected = hmacDigest(payload, secret);
  return timingSafeEquals(expected, token);
}

/** Generate a preview token for runtime preview routes. */
export function createPreviewToken(
  payload: PreviewTokenPayload,
  secret: string,
): string {
  return hmacDigest(payload, secret);
}

/** Verify a preview token for runtime preview routes. */
export function verifyPreviewToken(
  token: string | null | undefined,
  payload: PreviewTokenPayload,
  secret: string | undefined,
): boolean {
  return verifyToken(token, payload, secret);
}

/** Generate an upgrade preview token for runtime preview routes. */
export function createUpgradePreviewToken(
  payload: PreviewTokenPayload,
  secret: string,
): string {
  return hmacDigest(payload, secret);
}

/** Verify an upgrade preview token for runtime preview routes. */
export function verifyUpgradePreviewToken(
  token: string | null | undefined,
  payload: PreviewTokenPayload,
  secret: string | undefined,
): boolean {
  return verifyToken(token, payload, secret);
}

