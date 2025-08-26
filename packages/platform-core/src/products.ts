// Compat facade for product lookups used by both UI and server.
/* Broad types on purpose; tighten when real models land. */
export type SKU = any;
export type Locale = any;
export type ProductPublication = any;

/** Simple in-memory list for legacy/sync call sites (stories, demos, cart sync path). */
export const PRODUCTS: any[] = [];

/** Quick slug lookup for demos. */
export function getProductBySlug(slug: string): any | null {
  return PRODUCTS.find((p) => p?.slug === slug) ?? null;
}

// Pull in server helpers if present (do not re-export conflicting names).
import * as server from "./products";

/** Overloads:
 *  - getProductById(id)            -> sync (legacy) from PRODUCTS
 *  - getProductById(shop, id)      -> async via server impl
 */
export function getProductById(id: string): any | null;
export function getProductById(shop: string, id: string): Promise<any | null>;
export function getProductById(a: string, b?: string): any {
  if (typeof b === "undefined") {
    // Legacy sync path: look up in local PRODUCTS
    return PRODUCTS.find((p) => p?.id === a) ?? null;
  }
  // Async server path if available
  const fn = (server as any)?.getProductById;
  if (typeof fn === "function") return fn(a, b);
  return Promise.resolve(null);
}

// Non-conflicting re-exports are safe:


export { assertLocale } from "./products/index";

export async function getProducts(...args: any[]): Promise<any[]> {
  const fn = (server as any)?.getProducts;
  if (typeof fn === "function") return fn(...args);
  return [];
}
export async function searchProducts(...args: any[]): Promise<any[]> {
  const fn = (server as any)?.searchProducts;
  if (typeof fn === "function") return fn(...args);
  return [];
}
