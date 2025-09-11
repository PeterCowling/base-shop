import { type Locale, type SKU } from "@acme/types";
/** Mock catalogue (3 items) */
export declare const PRODUCTS: readonly SKU[];
/**
 * Runtime validator for {@link SKU} objects.
 */
export declare function isSKU(data: unknown): data is SKU;
/** Helper to fetch one product (could be remote PIM later) */
export declare function getProductBySlug(slug: string): SKU | undefined;
/** Lookup a product by SKU id */
export declare function getProductById(id: string): SKU | undefined;
export type { Locale, ProductCore, ProductPublication, PublicationStatus, SKU, } from "@acme/types";
/**
 * Exhaustiveness helper for switch statements on {@link Locale}.
 * (Compile-time only; returns the value unchanged.)
 */
export declare function assertLocale(l: Locale): Locale;
