import type { SKU } from "@acme/types";

import type { CartLine } from "./cartLine";
import type { CartLineSecure , CartStateSecure } from "./cartLineSecure";
import type { CartState } from "./cartState";

/**
 * Hydrated cart line with fresh SKU data from database
 *
 * This separates stored data (IDs only) from display data (fresh prices)
 */
export interface HydratedCartLine {
  /** The stored line (may be legacy or secure format) */
  line: CartLine | CartLineSecure;
  /** Fresh SKU data from database for display */
  sku: SKU;
}

/**
 * Cart API response with optional hydrated SKU data
 *
 * The `hydrated` field provides fresh, authoritative SKU data
 * for display purposes while the cart stores only IDs.
 */
export interface CartApiResponse {
  ok: true;
  cart: CartState | CartStateSecure;
  /** Fresh SKU data keyed by cart line key (skuId or skuId:size) */
  hydrated?: Record<string, HydratedCartLine>;
}

/**
 * Helper to check if a cart line is in secure format
 */
export function isSecureCartLine(line: CartLine | CartLineSecure): line is CartLineSecure {
  return 'skuId' in line && typeof line.skuId === 'string';
}

/**
 * Helper to extract SKU ID from either format
 */
export function getLineSkuId(line: CartLine | CartLineSecure): string {
  if (isSecureCartLine(line)) {
    return line.skuId;
  }
  return line.sku.id;
}
