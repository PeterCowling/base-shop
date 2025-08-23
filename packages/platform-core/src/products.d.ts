export type SKU = any;
export type Locale = any;
export type ProductPublication = any;
/** Simple in-memory list for legacy/sync call sites (stories, demos, cart sync path). */
export declare const PRODUCTS: any[];
/** Quick slug lookup for demos. */
export declare function getProductBySlug(slug: string): any | null;
/** Overloads:
 *  - getProductById(id)            -> sync (legacy) from PRODUCTS
 *  - getProductById(shop, id)      -> async via server impl
 */
export declare function getProductById(id: string): any | null;
export declare function getProductById(shop: string, id: string): Promise<any | null>;
export declare function getProducts(...args: any[]): Promise<any[]>;
export declare function searchProducts(...args: any[]): Promise<any[]>;
