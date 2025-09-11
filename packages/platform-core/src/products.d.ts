import type { SKU as BaseSKU, Locale, ProductPublication } from "@acme/types";
export type SKU = BaseSKU & { sku?: string };
export type { Locale, ProductPublication };
/** Simple in-memory list for legacy/sync call sites (stories, demos, cart sync path). */
export declare const PRODUCTS: SKU[];
/** Quick slug lookup for demos. */
export declare function getProductBySlug(slug: string): SKU | null;
/** Overloads:
 *  - getProductById(id)            -> sync (legacy) from PRODUCTS
 *  - getProductById(shop, id)      -> async via server impl
 */
export declare function getProductById(id: string): SKU | null;
export declare function getProductById(shop: string, id: string): Promise<SKU | null>;
interface ProductQuery {
    sort?: "title" | "price";
    filter?: Record<string, string>;
    page?: number;
    limit?: number;
}
export declare function getProducts(params?: ProductQuery): Promise<SKU[]>;
export declare function getProducts(shop: string, params?: ProductQuery): Promise<SKU[]>;
export declare function searchProducts(query: string): Promise<SKU[]>;
export declare function searchProducts(shop: string, query: string): Promise<SKU[]>;
