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

const SORTERS = {
  title: (a: SKU, b: SKU) => (a.title ?? "").localeCompare(b.title ?? ""),
  price: (a: SKU, b: SKU) => (a.price ?? 0) - (b.price ?? 0),
} as const;

const FILTERS: Record<string, (sku: SKU, value: string) => boolean> = {
  size: (sku, value) => Array.isArray((sku as any).sizes) && (sku as any).sizes.includes(value),
};

interface ProductQuery {
  sort?: keyof typeof SORTERS;
  filter?: Record<string, string>;
  page?: number;
  limit?: number;
}

export async function getProducts(
  a?: string | ProductQuery,
  b?: ProductQuery,
): Promise<SKU[]> {
  let shop: string | undefined;
  let params: ProductQuery | undefined;

  if (typeof a === "string") {
    shop = a;
    params = b;
  } else {
    params = a;
  }

  let products: SKU[];
  if (shop) {
    try {
      const { readRepo } = await import("./repositories/products.server");
      products = [...(await readRepo<SKU>(shop))];
    } catch {
      products = [...base.PRODUCTS];
    }
  } else {
    products = [...base.PRODUCTS];
  }

  if (params?.filter) {
    for (const [key, value] of Object.entries(params.filter)) {
      const fn = FILTERS[key];
      if (fn) {
        products = products.filter((p) => fn(p, value));
      }
    }
  }

  if (params?.sort) {
    const sortKey = params.sort in SORTERS ? params.sort : "title";
    products.sort(SORTERS[sortKey]);
  }

  const limit = params?.limit ?? products.length;
  const page = params?.page ?? 1;
  const start = (page - 1) * limit;

  return products.slice(start, start + limit);
}

export async function searchProducts(
  a: string,
  b?: string,
): Promise<SKU[]> {
  if (typeof b === "undefined") {
    const q = a.toLowerCase();
    return base.PRODUCTS.filter((p) =>
      (p.title ?? "").toLowerCase().includes(q),
    );
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
