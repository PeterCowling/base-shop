import type { Locale, ProductPublication,SKU as BaseSKU } from "@acme/types";

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
export declare function getProducts(shop?: string): Promise<SKU[]>;
export declare function searchProducts(query: string): Promise<SKU[]>;
export declare function searchProducts(shop: string, query: string): Promise<SKU[]>;
export declare const MAX_LIMIT: number;
export declare const ALLOWED_SORTS: readonly ["title", "price"];
export interface ProductQueryOptions {
    sort?: string;
    filter?: Record<string, unknown>;
    page?: number;
    limit?: number;
}
export declare function validateQuery(opts?: ProductQueryOptions): {
    sort: typeof ALLOWED_SORTS[number];
    filter: Record<string, unknown>;
    page: number;
    limit: number;
};
