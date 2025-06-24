export type Locale = "en" | "de" | "it";
/**
 * Convenience list of all supported locales.
 * Use this instead of hard-coding the literals across the code-base.
 */
export declare const LOCALES: readonly Locale[];
/**
 * A translated string (or any other scalar type T) keyed by locale.
 * ```
 * const title: Translated = { en: "Sneaker", de: "Turnschuh", it: "Scarpa" };
 * ```
 */
export type Translated<T extends string = string> = Record<Locale, T>;
export interface SKU {
    id: string;
    slug: string;
    title: string;
    price: number;
    image: string;
    sizes: string[];
    description: string;
}
/** Mock catalogue (3 items) */
export declare const PRODUCTS: readonly SKU[];
/** Helper to fetch one product (could be remote PIM later) */
export declare function getProductBySlug(slug: string): SKU | undefined;
export interface ProductCore {
    id: string;
    sku: string;
    title: Translated;
    description: Translated;
    price: number;
    currency: string;
    images: string[];
    created_at: string;
    updated_at: string;
}
export type PublicationStatus = "draft" | "active" | "archived";
export interface ProductPublication extends ProductCore {
    shop: string;
    status: PublicationStatus;
    row_version: number;
}
/**
 * Exhaustiveness helper for switch statements on {@link Locale}.
 * (Compile-time only; returns the value unchanged.)
 */
export declare function assertLocale(l: Locale): Locale;
