// Compat facade for product lookups used by both UI and server.
/* Broad types on purpose; tighten when real models land. */
export type { Locale, ProductPublication } from "@acme/types";

// Pull in the real product dataset and helpers. This keeps existing imports
// like `@platform-core/products` working while ensuring the in-memory list
// actually contains catalogue data.
import type { SKU as BaseSKU } from "@acme/types";
import * as base from "./products/index";

/**
 * Compatibility SKU type that allows optional `sku` field for legacy access.
 */
export type SKU = BaseSKU & { sku?: string };

/** Simple in-memory list for legacy/sync call sites (stories, demos, cart sync path). */
export const PRODUCTS: SKU[] = [...base.PRODUCTS];

/** Quick slug lookup for demos. */
export function getProductBySlug(slug: string): SKU | null {
  return base.getProductBySlug(slug) ?? null;
}

/** Overloads:
 *  - getProductById(id)            -> sync (legacy) from PRODUCTS
 *  - getProductById(shop, id)      -> async via server impl
 */
export function getProductById(id: string): SKU | null;
export function getProductById(shop: string, id: string): Promise<SKU | null>;
export function getProductById(
  a: string,
  b?: string,
): SKU | null | Promise<SKU | null> {
  if (typeof b === "undefined") {
    // Legacy sync path: look up in local PRODUCTS
    return base.getProductById(a) ?? null;
  }
  return import("./repositories/products.server")
    .then((m) => m.getProductById<SKU>(a, b))
    .catch(() => base.getProductById(b) ?? null);
}

// Non-conflicting re-exports are safe:


export { assertLocale } from "./products/index";

/** Maximum allowed page size when listing products. */
export const MAX_LIMIT = 100;

export interface ProductQueryOptions {
  sort?: unknown;
  filter?: unknown;
  page?: number;
  limit?: number;
}

/**
 * Validate query options for product listings.
 *
 * Sort and filter are passed through for now, but page and limit are
 * normalized so callers can't request out-of-range values.
 */
export function validateQuery(
  opts: ProductQueryOptions = {},
): Required<Pick<ProductQueryOptions, "page" | "limit">> &
  Omit<ProductQueryOptions, "page" | "limit"> {
  const page = Math.max(1, Math.floor(opts.page ?? 1));
  const limitRaw = Math.floor(opts.limit ?? MAX_LIMIT);
  const limit = Math.min(MAX_LIMIT, Math.max(1, limitRaw));
  return { ...opts, page, limit };
}

export async function getProducts(a?: unknown): Promise<SKU[]> {
  if (typeof a !== "string" || a.trim() === "") {
    throw new Error("getProducts requires a shop identifier");
  }
  try {
    const { readRepo } = await import("./repositories/products.server");
    return await readRepo<SKU>(a);
  } catch {
    return [...base.PRODUCTS];
  }
}

export async function searchProducts(
  a: string,
  b?: string,
): Promise<SKU[]> {
  if (typeof b === "undefined") {
    if (a.trim() === "") {
      throw new Error("searchProducts requires a query string");
    }
    const q = a.toLowerCase();
    return base.PRODUCTS.filter((p) =>
      (p.title ?? "").toLowerCase().includes(q),
    );
  }

  if (a.trim() === "" || b.trim() === "") {
    throw new Error("searchProducts requires both shop and query string");
  }

  try {
    const { readRepo } = await import("./repositories/products.server");
    const products = await readRepo<SKU>(a);
    const q = b.toLowerCase();
    return products.filter((p) =>
      (p.title ?? "").toLowerCase().includes(q),
    );
  } catch {
    return [];
  }
}
