// packages/platform-core/src/cartCookie.ts
import { createHmac, randomUUID } from "crypto";
import { z } from "zod";

import { skuSchema } from "@types";

/* ------------------------------------------------------------------
 * Cookie constants
 * ------------------------------------------------------------------ */
export const CART_COOKIE = "CART_STATE";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const SECRET = process.env.CART_COOKIE_SECRET ?? "dev-secret";

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

/** Create a new random cart ID. */
export function createCartId(): string {
  return randomUUID();
}

/** Sign a cart ID so it can be safely stored on the client. */
export function encodeCartCookie(id: string): string {
  const sig = createHmac("sha256", SECRET).update(id).digest("hex");
  return `${id}.${sig}`;
}

/** Verify a signed cart ID from the cookie. Returns the ID or `null`. */
export function decodeCartCookie(raw?: string | null): string | null {
  if (!raw) return null;
  const [id, sig] = raw.split(".");
  if (!id || !sig) return null;
  const expected = createHmac("sha256", SECRET).update(id).digest("hex");
  return sig === expected ? id : null;
}

/** Build the Set-Cookie header value for HTTP responses. */
export function asSetCookieHeader(value: string): string {
  return `${CART_COOKIE}=${value}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax; Secure; HttpOnly`;
}
