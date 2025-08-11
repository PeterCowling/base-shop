import type { SKU } from "./Product";
/**
 * A single line in the shopping cart.
 */
export interface CartLine {
    /** The full product SKU being purchased or rented */
    sku: SKU;
    /** Quantity of this SKU */
    qty: number;
    /** Optional size (e.g. “M”, “42”, “10 US”) chosen by the shopper */
    size?: string;
}
/**
 * Composite key combining SKU ID and optional size (e.g. "sku123:M").
 */
export type CartLineKey = string;
/**
 * The entire cart state keyed by cart line key (SKU ID plus size).
 */
export type CartState = Record<CartLineKey, CartLine>;
//# sourceMappingURL=Cart.d.ts.map
