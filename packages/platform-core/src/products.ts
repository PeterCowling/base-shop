// Compat facade for product lookups used by both UI and server.
/* Broad types on purpose; tighten when real models land. */
export type { Locale, ProductPublication } from "@acme/types";

// Pull in the real product dataset and helpers. This keeps existing imports
// like `@platform-core/products` working while ensuring the in-memory list
// actually contains catalogue data.
import type { SKU as BaseSKU } from "@acme/types";
import * as base from "./products/index";
import { defaultFilterMappings } from "./defaultFilterMappings";

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

export const ALLOWED_SORTS = ["title", "price"] as const;
type SortKey = (typeof ALLOWED_SORTS)[number];

type FilterKey = keyof typeof defaultFilterMappings;
type FilterRecord = Partial<Record<FilterKey, unknown>>;

export interface ProductQueryOptions {
  sort?: string;
  filter?: Record<string, unknown>;
  page?: number;
  limit?: number;
}

/**
 * Validate query options for product listings.
 *
 * Sort and filter are passed through for now, but page and limit are
 * normalized so callers can't request out-of-range values.
 */
export function validateQuery({
  sort,
  filter,
  page,
  limit,
}: ProductQueryOptions = {}): {
  sort: SortKey;
  filter: FilterRecord;
  page: number;
  limit: number;
} {
  const safeSort = ALLOWED_SORTS.includes(sort as SortKey)
    ? (sort as SortKey)
    : ALLOWED_SORTS[0];

  const allowedFilters = new Set<FilterKey>(
    Object.keys(defaultFilterMappings) as FilterKey[],
  );
  const safeFilter = Object.fromEntries(
    Object.entries(filter ?? {}).filter(([key]) =>
      allowedFilters.has(key as FilterKey),
    ),
  ) as FilterRecord;

  const pageNum = Math.max(1, Math.floor(page ?? 1));
  const limitRaw = Math.floor(limit ?? MAX_LIMIT);
  const limitNum = Math.min(MAX_LIMIT, Math.max(1, limitRaw));
  return { sort: safeSort, filter: safeFilter, page: pageNum, limit: limitNum };
}

export async function getProducts(a?: unknown): Promise<SKU[]> {
  if (typeof a === "string") {
    try {
      const { readRepo } = await import("./repositories/products.server");
      return await readRepo<SKU>(a);
    } catch {
      return [...base.PRODUCTS];
    }
  }
  return [...base.PRODUCTS];
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
