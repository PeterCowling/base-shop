// packages/platform-core/src/cartCookie.ts
import { z } from "zod";
import { createHmac } from "node:crypto";

import type { CartState } from "@types";
import { skuSchema } from "@types";

/* ------------------------------------------------------------------
 * Cookie constants
 * ------------------------------------------------------------------ */
export const CART_COOKIE = "CART_STATE";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/* ------------------------------------------------------------------
 * Zod schemas
 * ------------------------------------------------------------------ */

/**
 * Schema for one cart line.  We keep the schema definition simple and
 * let Zod infer its own TS type; later we cast the parsed output to
 * `CartLine` / `CartState` so the rest of the codebase stays strongly
 * typed without running into “required vs optional” variance issues.
 */
export const cartLineSchema = z.object({
  sku: skuSchema, // full SKU object
  qty: z.number().int().min(0), // quantity validated by API schemas
  size: z.string().optional(),
});

/**
 * Schema for the full cart, keyed by SKU ID (string).
 */
export const cartStateSchema = z.record(z.string(), cartLineSchema);

/* ------------------------------------------------------------------
 * Helper functions
 * ------------------------------------------------------------------ */

/** Serialize cart state into a cookie-safe string.
 * If `CART_COOKIE_SECRET` is set, the payload is signed with HMAC-SHA256
 * to guard against tampering. The result is `payload.signature` where
 * `payload` is URL-encoded JSON and `signature` is the hex digest.
 */
export function encodeCartCookie(state: CartState): string {
  const payload = encodeURIComponent(JSON.stringify(state));
  const secret = process.env.CART_COOKIE_SECRET;
  if (!secret) return payload;

  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

/**
 * Parse a cookie string back into cart state.
 *
 * – Always returns a value of type `CartState`
 * – Catches and logs malformed cookies instead of throwing
 */
export function decodeCartCookie(raw?: string | null): CartState {
  if (!raw) return {};

  const secret = process.env.CART_COOKIE_SECRET;
  let payload = raw;

  if (secret) {
    const idx = raw.lastIndexOf(".");
    if (idx === -1) {
      console.warn("Invalid cart cookie format");
      return {};
    }
    const body = raw.slice(0, idx);
    const signature = raw.slice(idx + 1);
    if (!body || !signature) {
      console.warn("Invalid cart cookie format");
      return {};
    }
    const expected = createHmac("sha256", secret).update(body).digest("hex");
    if (signature !== expected) {
      console.warn("Invalid cart cookie signature");
      return {};
    }
    payload = body;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(payload));
    // Cast is safe because the schema has validated the structure.
    return cartStateSchema.parse(parsed) as CartState;
  } catch (err) {
    console.warn("Invalid cart cookie", err);
    return {};
  }
}

/** Build the Set-Cookie header value for HTTP responses. */
export function asSetCookieHeader(value: string): string {
  return `${CART_COOKIE}=${value}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax; Secure; HttpOnly`;
}
