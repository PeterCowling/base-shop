// apps/cover-me-pretty/src/app/[lang]/shop/ShopClient.client.tsx

"use client";

import type { SKU } from "@acme/types";
import FilterBar, {
  type FilterDefinition,
  type Filters,
} from "@acme/platform-core/components/shop/FilterBar";
import { ProductGrid } from "@acme/platform-core/components/shop/ProductGrid";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "@acme/i18n";
import { logAnalyticsEvent } from "@acme/platform-core/analytics/client";

/**
 * ShopClient
 *
 * Renders a filterable and searchable list of SKUs (products).  All query
 * parameters are read from next/navigation's useSearchParams(), which may
 * return null; optional chaining guards against that.
 */
export default function ShopClient({ skus }: { skus: SKU[] }) {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Safely read "q" from searchParams (may be null)
  const [query, setQuery] = useState(() => searchParams?.get("q") ?? "");
  // Safely initialize filters from searchParams (guard each get())
  const [filters, setFilters] = useState<Filters>(() => {
    const init: Filters = {};
    const size = searchParams?.get("size");
    const color = searchParams?.get("color");
    const maxPrice = searchParams?.get("maxPrice");
    if (size) init.size = size;
    if (color) init.color = color;
    if (maxPrice) {
      const n = Number(maxPrice);
      if (!Number.isNaN(n)) init.maxPrice = n;
    }
    return init;
  });

  // Avoid pushing URL search params on first render
  const synced = useRef(false);

  // Compute unique sizes and colors for the filter definitions
  const sizes = useMemo(
    () => Array.from(new Set(skus.flatMap((p) => p.sizes))).sort(),
    [skus]
  );
  const colors = useMemo(
    () => Array.from(new Set(skus.map((p) => p.slug.split("-")[0]))).sort(),
    [skus]
  );

  const defs: FilterDefinition[] = [
    { name: "size", label: "Size", type: "select", options: sizes },
    { name: "color", label: "Color", type: "select", options: colors },
    { name: "maxPrice", label: "Max Price", type: "number" },
  ];

  // Filter visible SKUs based on query and filters
  const visible = useMemo(() => {
    return skus.filter((p) => {
      if (query && !p.title.toLowerCase().includes(query.toLowerCase())) {
        return false;
      }
      if (filters.size && !p.sizes.includes(filters.size as string))
        return false;
      if (filters.color && !p.slug.startsWith(filters.color as string))
        return false;
      if (typeof filters.maxPrice === "number" && p.price > filters.maxPrice) {
        return false;
      }
      return true;
    });
  }, [filters, query, skus]);

  // Log search queries after initial render
  useEffect(() => {
    if (!query) return;
    const timer = setTimeout(() => {
      void logAnalyticsEvent({ type: "search", query, results: visible.length });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, visible.length]);

  // Log filter changes after initial render
  useEffect(() => {
    if (!synced.current) return;
    const activeFilters: Record<string, string | number> = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== "") activeFilters[k] = v as string | number;
    });
    if (Object.keys(activeFilters).length) {
      void logAnalyticsEvent({
        type: "filter_change",
        filters: activeFilters,
        results: visible.length,
        resultIds: visible.slice(0, 10).map((p) => p.id),
      });
    }
  }, [filters, visible]);

  // Update the URL query string whenever query or filters change (after first run)
  useEffect(() => {
    if (pathname) {
      void logAnalyticsEvent({ type: "page_view", path: pathname });
    }
  }, [pathname]);

  useEffect(() => {
    if (!synced.current) {
      synced.current = true;
      return;
    }
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== "") params.set(k, String(v));
    });
    const search = params.toString();
    router.push(`${pathname}${search ? `?${search}` : ""}`);
  }, [filters, pathname, query, router]);

  return (
    <div className="mx-auto flex flex-col gap-10 p-6">
      <input aria-label={t("shop.searchAriaLabel") as string}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("shop.searchPlaceholder") as string}
        className="mb-4 w-full rounded border px-2 py-1 sm:w-64"
      />
      <FilterBar definitions={defs} values={filters} onChange={setFilters} />
      <ProductGrid skus={visible} />
    </div>
  );
}
