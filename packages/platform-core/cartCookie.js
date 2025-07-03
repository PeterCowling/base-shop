import { skuSchema } from "@types";
import { z } from "zod";

/* -------- constants -------- */
export const CART_COOKIE = "CART_STATE";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export const cartLineSchema = z.object({
  sku: skuSchema,
  qty: z.number(),
  size: z.string().optional(),
});

export const cartStateSchema = z.record(z.string(), cartLineSchema);

/* -------- helpers -------- */
/** Stringify cart → safe cookie/localStorage value */
export function encodeCartCookie(state) {
  return encodeURIComponent(JSON.stringify(state));
}
/** Parse cookie string → typed cart (never throws) */
export function decodeCartCookie(raw) {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    return cartStateSchema.parse(parsed);
  } catch (err) {
    console.warn("Invalid cart cookie", err);
    return {};
  }
}
/** Builds a Set-Cookie header (used client-side via document.cookie too) */
export function asSetCookieHeader(value) {
  return `${CART_COOKIE}=${value}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax`;
}
