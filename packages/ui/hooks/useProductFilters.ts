import type { ProductPublication } from "@platform-core/products";
import { useMemo, useState } from "react";

export type ProductStatus = "all" | "active" | "draft" | "archived";

export interface UseProductFiltersResult {
  search: string;
  status: ProductStatus;
  setSearch: (v: string) => void;
  setStatus: (v: ProductStatus) => void;
  filteredRows: ProductPublication[];
}

export function useProductFilters(
  rows: ProductPublication[]
): UseProductFiltersResult {
  const [search, setSearch] = useState<string>("");
  const [status, setStatus] = useState<ProductStatus>("all");

  const availableLocales = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((p) => Object.keys(p.title).forEach((k) => set.add(k)));
    return Array.from(set);
  }, [rows]);

  const normalisedQuery = useMemo(() => search.trim().toLowerCase(), [search]);

  const filteredRows = useMemo(() => {
    return rows.filter((p) => {
      const matchesTitle = availableLocales.some((loc) => {
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
