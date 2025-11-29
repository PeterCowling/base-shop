// apps/cms/src/app/[lang]/shop/ShopClient.tsx
"use client";

import FilterBar, {
  type Filters,
  type FilterDefinition,
} from "@platform-core/components/shop/FilterBar";
import { ProductGrid } from "@platform-core/components/shop/ProductGrid";
import type { SKU } from "@acme/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "@i18n/Translations";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function ShopClient({ skus }: { skus: SKU[] }) {
  const t = useTranslations();
  // Extract to avoid eslint false positive from key substring 'ariaLabel' matching 'arial'
  const searchAriaLabel = String(t("shop.searchAriaLabel"));
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [filters, setFilters] = useState<Filters>(() => {
    const init: Filters = {};
    const size = searchParams.get("size");
    const color = searchParams.get("color");
    const maxPrice = searchParams.get("maxPrice");
    if (size) init.size = size;
    if (color) init.color = color;
    if (maxPrice) {
      const n = Number(maxPrice);
      if (!Number.isNaN(n)) init.maxPrice = n;
    }
    return init;
  });
  const synced = useRef(false);
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

  const visible = useMemo(() => {
    return skus.filter((p) => {
      if (query && !p.title.toLowerCase().includes(query.toLowerCase())) {
        return false;
      }
      if (filters.size && !p.sizes.includes(filters.size as string)) return false;
      if (filters.color && !p.slug.startsWith(filters.color as string)) return false;
      if (typeof filters.maxPrice === "number" && p.price > filters.maxPrice) {
        return false;
      }
      return true;
    });
  }, [filters, query, skus]);

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
    <div className="px-4 py-10">
      <h1 className="mb-4 text-3xl font-bold">{t("nav.shop")}</h1>
      <input
        aria-label={searchAriaLabel}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("shop.searchPlaceholder") as string}
        className="mb-4 w-full border rounded px-2 py-1 sm:w-64"
      />
      <FilterBar
        definitions={defs}
        values={filters}
        onChange={setFilters}
      />
      <ProductGrid skus={visible} />
    </div>
  );
}
