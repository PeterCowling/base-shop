import type { RentalLineItem } from "@acme/types";

/**
 * Secure CartLine format - stores only identifiers, not pricing data
 *
 * SECURITY: This prevents price tampering by storing only SKU ID.
 * Pricing must be fetched fresh from the database at checkout time.
 *
 * Migration from legacy CartLine:
 * - Replace `sku: SKU` with `skuId: string`
 * - All price/stock/deposit data fetched server-side on demand
 */
export interface CartLineSecure {
  /** SKU identifier (not full SKU object with pricing) */
  skuId: string;

  /** Quantity */
  qty: number;

  /** Size variant (if applicable) */
  size?: string;

  /** Metadata for attribution and features */
  meta?: {
    /** Attribution source (e.g., "related-products", "search") */
    source?: string;
    /** Try-on integration metadata */
    tryOn?: {
      idempotencyKey?: string;
      transform?: Record<string, unknown>;
    };
  };

  /** Rental metadata (if rental mode) */
  rental?: RentalLineItem;
}

/**
 * Cart state using secure line format
 * Keys are: `skuId` or `skuId:size`
 */
export type CartStateSecure = Record<string, CartLineSecure>;
