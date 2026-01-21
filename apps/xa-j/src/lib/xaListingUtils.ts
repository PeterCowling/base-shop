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
    case "biggest-discount":
      return copy.sort((a, b) => {
        const discountA =
          typeof a.compareAtPrice === "number" && a.compareAtPrice > a.price
            ? (a.compareAtPrice - a.price) / a.compareAtPrice
            : 0;
        const discountB =
          typeof b.compareAtPrice === "number" && b.compareAtPrice > b.price
            ? (b.compareAtPrice - b.price) / b.compareAtPrice
            : 0;
        return discountB - discountA;
      });
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
