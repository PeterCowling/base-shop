// packages/platform-core/src/cartCookie.ts
import { createHmac, randomUUID } from "crypto";
import { z } from "zod";

import { skuSchema } from "@types";
import { getCart, setCart } from "./cartStore";

/* ------------------------------------------------------------------
 * Cookie constants
 * ------------------------------------------------------------------ */
export const CART_COOKIE = "CART_ID";
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

/** Serialize cart state into a cookie-safe string. */
export function encodeCartCookie(id: string): string {
  const sig = createHmac("sha256", SECRET).update(id).digest("hex");
  return encodeURIComponent(`${id}.${sig}`);
}

/**
 * Validate and extract the cart ID from a cookie value.
 * Returns `null` when the cookie is missing or has an invalid signature.
 */
export function decodeCartCookie(raw?: string | null): string | null {
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    const [id, sig] = decoded.split(".");
    const expected = createHmac("sha256", SECRET).update(id).digest("hex");
    if (sig !== expected) return null;
    return id;
  } catch (err) {
    console.warn("Invalid cart cookie", err);
    return null;
  }
}

/** Convenience to fetch cart state for a given cookie value. */
export function cartFromCookie(raw?: string | null): CartState {
  const id = decodeCartCookie(raw);
  return id ? getCart(id) : {};
}

/** Persist cart and return a signed cookie value. */
export function persistCart(cart: CartState, id?: string): { id: string; cookie: string } {
  const cartId = id ?? randomUUID();
  setCart(cartId, cart);
  return { id: cartId, cookie: encodeCartCookie(cartId) };
}

/** Build the Set-Cookie header value for HTTP responses. */
export function asSetCookieHeader(value: string): string {
  return `${CART_COOKIE}=${value}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax`;
}
