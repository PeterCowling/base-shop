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
 * Cart entries are keyed by SKU ID optionally suffixed with a size
 * (e.g. "sku123" or "sku123:M").
 */
export type CartLineKey = `${NonNullable<SKU["id"]>}${"" | `:${string}`}`;
export type CartState = Record<CartLineKey, CartLine>;
//# sourceMappingURL=Cart.d.ts.map