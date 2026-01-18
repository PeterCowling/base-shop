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
 * The entire cart state keyed by SKU ID.
 *
 * `SKU["id"]` is declared as `string | undefined` in the product typings,
 * which violates the constraint that a `Record` key must be a concrete
 * string.  Wrapping it in `NonNullable<>` narrows the key to `string`,
 * preserving type-safety while still documenting intent.
 */
export type CartState = Record<NonNullable<SKU["id"]>, CartLine>;
//# sourceMappingURL=Cart.d.ts.map