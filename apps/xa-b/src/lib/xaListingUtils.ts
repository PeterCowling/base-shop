import type { XaProduct } from "./demoData";
import { ALL_FILTER_KEYS, type FilterKey, type SortKey } from "./xaFilters";

export function toNumber(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function sortProducts(products: XaProduct[], sort: SortKey): XaProduct[] {
  const copy = [...products];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price-desc":
      return copy.sort((a, b) => b.price - a.price);
    case "newest":
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "best-sellers":
    default:
      return copy.sort((a, b) => b.popularity - a.popularity);
  }
}

export function createEmptyFilterValues(): Record<FilterKey, Set<string>> {
  const values = {} as Record<FilterKey, Set<string>>;
  for (const key of ALL_FILTER_KEYS) {
    values[key] = new Set();
  }
  return values;
}

export function cloneFilterValues(values: Record<FilterKey, Set<string>>) {
  const next = {} as Record<FilterKey, Set<string>>;
  for (const key of ALL_FILTER_KEYS) {
    next[key] = new Set(values[key]);
  }
  return next;
}

export function getFilterParam(key: FilterKey) {
  return `f[${key}]`;
}

const NEW_IN_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Returns true when a product was added within the last 30 days.
 * Uses wall-clock time by default; accepts optional referenceDate for testing.
 */
export function isNewIn(product: XaProduct, referenceDate?: Date): boolean {
  if (!product.createdAt) return false;
  const ref = referenceDate ?? new Date();
  const created = new Date(product.createdAt);
  if (Number.isNaN(created.getTime())) return false;
  const diffMs = ref.getTime() - created.getTime();
  return diffMs >= 0 && diffMs <= NEW_IN_WINDOW_MS;
}
