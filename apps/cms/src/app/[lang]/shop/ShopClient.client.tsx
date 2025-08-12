// apps/cms/src/app/[lang]/shop/ShopClient.tsx
"use client";

import FilterBar, {
  Filters,
} from "@platform-core/src/components/shop/FilterBar";
import { ProductGrid } from "@platform-core/src/components/shop/ProductGrid";
import type { SKU } from "@acme/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function ShopClient({ skus }: { skus: SKU[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [filters, setFilters] = useState<Filters>(() => {
    const size = searchParams.get("size") || undefined;
    return size ? { size } : {};
  });

  const sizes = useMemo(
    () => Array.from(new Set(skus.flatMap((p) => p.sizes))).sort(),
    [skus]
  );

  const visible = useMemo(() => {
    return skus.filter((p) => {
      const sizeMatch = !filters.size || p.sizes.includes(filters.size);
      const queryMatch =
        !query || p.title.toLowerCase().includes(query.toLowerCase());
      return sizeMatch && queryMatch;
    });
  }, [filters, query, skus]);

  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (filters.size) params.set("size", filters.size);
    const search = params.toString();
    router.push(`${pathname}${search ? `?${search}` : ""}`);
  }, [query, filters, pathname, router]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-4 text-3xl font-bold">Shop</h1>
      <input
        type="search"
        aria-label="Search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-4 w-full max-w-sm rounded border px-3 py-2"
      />
      <FilterBar
        onChange={setFilters}
        sizes={sizes}
        initialSize={filters.size}
      />
      <ProductGrid skus={visible} />
    </div>
  );
}
