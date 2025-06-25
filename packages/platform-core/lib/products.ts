/* packages/platform-core/lib/products.ts */

/**
 * Stock-Keeping Unit (SKU)
 *
 * A minimal, language-agnostic description of a single purchasable
 * variant.  Add or tighten fields as requirements evolve.
 */
export interface SKU {
  /** Stable, unique identifier (barcode, slug, UUID …). */
  id: string;

  /** Human-readable name shown in carts, search results, etc. */
  name: string;

  /** Unit price expressed in the storefront’s base currency. */
  price: number;

  /** ISO-4217 currency code, e.g. `"EUR"` or `"USD"`. */
  currency: string;

  /**
   * Optional variant-specific attributes such as size or colour.
   * Keep values primitive so they serialise cleanly.
   */
  attributes?: Record<string, string | number>;

  /** Increment when a breaking change is made to this SKU. */
  row_version?: number;

  /** Mark `true` once the SKU is live and visible to customers. */
  published?: boolean;
}

/**
 * Runtime type-guard so callers can safely narrow unknown data.
 * You can swap this out for Zod, joi, etc. if you prefer schema validation.
 */
export function isSKU(value: unknown): value is SKU {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as Record<string, unknown>).id === "string"
  );
}
