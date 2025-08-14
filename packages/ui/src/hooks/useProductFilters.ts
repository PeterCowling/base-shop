import { useMemo, useState } from "react";

export type ProductStatus = "all" | "active" | "draft" | "archived";

export interface UseProductFiltersResult<T> {
  search: string;
  status: ProductStatus;
  setSearch: (v: string) => void;
  setStatus: (v: ProductStatus) => void;
  filteredRows: T[];
}

export function useProductFilters<
  T extends {
    title: string | Record<string, string>;
    sku?: string;
    status?: ProductStatus;
  }
>(rows: readonly T[]): UseProductFiltersResult<T> {
  const [search, setSearch] = useState<string>("");
  const [status, setStatus] = useState<ProductStatus>("all");

  const availableLocales = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((p) => {
      if (typeof p.title === "object") {
        Object.keys(p.title).forEach((k) => set.add(k));
      }
    });
    return Array.from(set);
  }, [rows]);

  const normalisedQuery = useMemo(() => search.trim().toLowerCase(), [search]);

  const filteredRows = useMemo(() => {
    return rows.filter((p) => {
      const matchesTitle =
        typeof p.title === "string"
          ? p.title.toLowerCase().includes(normalisedQuery)
          : availableLocales.some((loc) => {
              const t = (p.title as Record<string, string>)[loc] ?? "";
              return t.toLowerCase().includes(normalisedQuery);
            });

      const sku = p.sku ?? "";
      const matchesSku = sku.toLowerCase().includes(normalisedQuery);

      const matchesQuery =
        normalisedQuery.length === 0 || matchesTitle || matchesSku;

      const matchesStatus = status === "all" || p.status === status;

      return matchesQuery && matchesStatus;
    });
  }, [rows, normalisedQuery, status, availableLocales]);

  return { search, status, setSearch, setStatus, filteredRows };
}
