// packages/platform-core/src/cartCookie.ts

import { loadCoreEnv } from "@acme/config/env/core";
import { skuSchema } from "@acme/types";
import crypto from "crypto";
import { z } from "zod";

export type { CartLine, CartState } from "./cart";

/* ------------------------------------------------------------------
 * Cookie constants
 * ------------------------------------------------------------------ */
export const CART_COOKIE = "__Host-CART_ID";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Lazy secret accessor to avoid import‑time throws */
let _secret: string | null = null;
function getSecret(): string {
  if (_secret) return _secret;
  const { CART_COOKIE_SECRET: secret } = loadCoreEnv();
  if (!secret) throw new Error("env.CART_COOKIE_SECRET is required"); // i18n-exempt -- CORE-2422: developer-facing error message only
  _secret = secret as string;
  return _secret!; // non‑null assertion to satisfy the string return type
}

/* ------------------------------------------------------------------
 * Zod schemas
 * ------------------------------------------------------------------ */

/** Schema for one cart line */
export const cartLineSchema = z
  .object({
    sku: skuSchema, // full SKU object
    qty: z.number().int().min(0),
    size: z.string().optional(),
  })
  .strict();

/** Schema for full cart state */
export const cartStateSchema = z.record(z.string(), cartLineSchema);

/* ------------------------------------------------------------------
 * Helper functions
 * ------------------------------------------------------------------ */

/** Serialize arbitrary data into a signed cookie value. */
export function encodeCartCookie(value: string): string {
  const encoded = Buffer.from(value, "utf8").toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("hex");
  return `${encoded}.${sig}`;
}

/**
 * Verify and extract the payload from a signed cookie value.
 * Returns `null` when the cookie is missing or invalid.
 */
export function decodeCartCookie(raw?: string | null): unknown {
  if (!raw) return null;
  const [encoded, sig] = raw.split(".");
  if (!encoded || !sig) return null;
  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("hex");
  try {
    if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      const decoded = Buffer.from(encoded, "base64url").toString("utf8");
      try {
        return JSON.parse(decoded);
      } catch {
        return decoded;
      }
    }
  } catch {
    /* fall through */
  }
  console.warn("Invalid cart cookie"); // i18n-exempt -- CORE-2422: diagnostic log, not user-facing
  return null;
}

/** Build the Set‑Cookie header value for HTTP responses. */
export function asSetCookieHeader(
  value: string,
  maxAge: number | null = MAX_AGE,
  options: { domain?: string } = {}
): string {
  const parts = [`${CART_COOKIE}=${value}`, "Path=/"];
  if (maxAge !== null) parts.push(`Max-Age=${maxAge}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);
  parts.push("SameSite=Lax", "Secure", "HttpOnly");
  return parts.join("; ");
}

/** @internal - exposed for testing */
export const __test = { getSecret };
