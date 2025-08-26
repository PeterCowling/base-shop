// Compat facade for product lookups used by both UI and server.
/* Broad types on purpose; tighten when real models land. */
export type SKU = any;
export type Locale = any;
export type ProductPublication = any;

// Pull in the real product dataset and helpers. This keeps existing imports
// like `@platform-core/products` working while ensuring the in-memory list
// actually contains catalogue data.
import * as base from "./products/index";

/** Simple in-memory list for legacy/sync call sites (stories, demos, cart sync path). */
export const PRODUCTS: any[] = [...base.PRODUCTS];

/** Quick slug lookup for demos. */
export function getProductBySlug(slug: string): any | null {
  return base.getProductBySlug(slug) ?? null;
}

/** Overloads:
 *  - getProductById(id)            -> sync (legacy) from PRODUCTS
 *  - getProductById(shop, id)      -> async via server impl
 */
export function getProductById(id: string): any | null;
export function getProductById(shop: string, id: string): Promise<any | null>;
export function getProductById(a: string, b?: string): any {
  if (typeof b === "undefined") {
    // Legacy sync path: look up in local PRODUCTS
    return base.getProductById(a) ?? null;
  }
  // Async server path is not implemented; fall back to local lookup
  return Promise.resolve(base.getProductById(b) ?? null);
}

// Non-conflicting re-exports are safe:


export { assertLocale } from "./products/index";

export async function getProducts(..._args: any[]): Promise<any[]> {
  return [...base.PRODUCTS];
}
export async function searchProducts(..._args: any[]): Promise<any[]> {
  return [];
}
