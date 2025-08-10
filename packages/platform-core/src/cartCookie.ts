// packages/platform-core/src/cartCookie.ts
import { z } from "zod";

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

export type CartLine = z.infer<typeof cartLineSchema>;
export type CartState = z.infer<typeof cartStateSchema>;

/* ------------------------------------------------------------------
 * Helper functions
 * ------------------------------------------------------------------ */

/** Serialize cart state into a cookie-safe string. */
export function encodeCartCookie(state: CartState): string {
  return encodeURIComponent(JSON.stringify(state));
}

/**
 * Parse a cookie string back into cart state.
 *
 * – Always returns a value of type `CartState`
 * – Catches and logs malformed cookies instead of throwing
 */
export function decodeCartCookie(raw?: string | null): CartState {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    // Cast is safe because the schema has validated the structure.
    return cartStateSchema.parse(parsed) as CartState;
  } catch (err) {
    console.warn("Invalid cart cookie", err);
    return {};
  }
}

/** Build the Set-Cookie header value for HTTP responses. */
export function asSetCookieHeader(value: string): string {
  return `${CART_COOKIE}=${value}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax`;
}
