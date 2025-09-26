"use client";

import React from "react";
import type { SKU } from "@acme/types";
import ProductFilter, { type FacetConfig } from "./ProductFilter";

export interface CollectionClientProps extends React.HTMLAttributes<HTMLDivElement> {
  initial: SKU[];
  params: Record<string, string | undefined>;
  paginationMode?: "loadMore" | "ssr";
  pageSize?: number;
  seoText?: string;
  seoCollapsible?: boolean;
}

export default function CollectionSectionClient({ initial, params, paginationMode = "loadMore", pageSize = 12, seoText, seoCollapsible = true, className, ...rest }: CollectionClientProps) {
  const [items, setItems] = React.useState<SKU[]>(initial);
  const [sort, setSort] = React.useState<string>(params.sort ?? "");
  const [size, setSize] = React.useState<string>(params.size ?? "");
  const [color, setColor] = React.useState<string>(params.color ?? "");
  const [price, setPrice] = React.useState<{ min?: number; max?: number }>({
    min: params.min ? Number(params.min) : undefined,
    max: params.max ? Number(params.max) : undefined,
  });

  const router = require("next/navigation").useRouter();
  const sp = require("next/navigation").useSearchParams();

  const updateUrl = React.useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URL(window.location.href);
      const entries = new URLSearchParams(next.search);
      Object.entries(patch).forEach(([k, v]) => {
        if (v == null || v === "") entries.delete(k);
        else entries.set(k, v);
      });
      next.search = entries.toString();
      router.push(next.pathname + (next.search ? `?${next.search}` : ""));
    },
    [router]
  );

  React.useEffect(() => {
    // Refetch on search param changes
    const query = sp?.toString() ?? "";
    const controller = new AbortController();
    const load = async () => {
      try {
        const col = (params.slug ?? "").toString();
        const url = new URL(`/api/collections/${encodeURIComponent(col)}`, window.location.origin);
        if (sort) url.searchParams.set("sort", sort);
        if (paginationMode === "ssr") {
          const page = sp?.get("page") ?? "1";
          const ps = sp?.get("pageSize") ?? String(pageSize);
          url.searchParams.set("page", page);
          url.searchParams.set("pageSize", ps);
        }
        const res = await fetch(url.toString(), { signal: controller.signal });
        if (!res.ok) return;
        const data = (await res.json()) as { items?: SKU[] } | SKU[];
        let list = Array.isArray(data) ? data : (data.items ?? []);
        // Apply facet filters client-side
        list = list.filter((p) => {
          const priceOk = (price.min == null || (p.price ?? 0) >= price.min) && (price.max == null || (p.price ?? 0) <= price.max);
          const sizeOk = !size || p.sizes?.includes(size);
          const colorId = String(p.id ?? "").split("-")[0];
          const colorOk = !color || colorId === color || String(p.id).includes(color);
          return priceOk && sizeOk && colorOk;
        });
        setItems(list);
      } catch {}
    };
    void load();
    return () => controller.abort();
  }, [sp, params.slug, sort, size, color, price.min, price.max, paginationMode, pageSize]);

  const facetConfig: FacetConfig = { size: true, color: true, price: true };

  const [page, setPage] = React.useState<number>(() => Number(sp?.get("page") ?? 1));
  React.useEffect(() => {
    setPage(Number(sp?.get("page") ?? 1));
  }, [sp]);

  const total = items.length; // best-effort; API should include total for real impl

  return (
    <div className={className} {...rest}>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-4 gap-6">
          <aside className="col-span-1">
            <ProductFilter
              facets={facetConfig}
              onChange={(state) => {
                setSize(state.size ?? "");
                setColor(state.color ?? "");
                setPrice({ min: state.minPrice, max: state.maxPrice });
                updateUrl({ size: state.size, color: state.color, min: state.minPrice ? String(state.minPrice) : undefined, max: state.maxPrice ? String(state.maxPrice) : undefined });
              }}
            />
          </aside>
          <section className="col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium">Products</h2>
              <select value={sort} onChange={(e) => { setSort(e.target.value); updateUrl({ sort: e.target.value }); }} className="rounded border px-2 py-1 text-sm">
                <option value="">Default</option>
                <option value="price">Price</option>
                <option value="title">Title</option>
              </select>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <div key={p.id} className="border rounded p-3">
                  <div className="aspect-[4/3] bg-neutral-100 mb-2" />
                  <div className="font-medium">{p.title}</div>
                  <div className="text-sm text-neutral-600">{p.slug}</div>
                </div>
              ))}
            </div>
            {paginationMode === "ssr" ? (
              <div className="mt-6 flex items-center justify-between text-sm">
                <button
                  className="rounded border px-3 py-1 disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => updateUrl({ page: String(Math.max(1, page - 1)), pageSize: String(pageSize) })}
                >
                  Previous
                </button>
                <span>Page {page}</span>
                <button
                  className="rounded border px-3 py-1"
                  onClick={() => updateUrl({ page: String(page + 1), pageSize: String(pageSize) })}
                >
                  Next
                </button>
              </div>
            ) : null}
            {seoText ? (
              <details className="mt-8" open={!seoCollapsible}>
                <summary className="cursor-pointer select-none text-sm font-medium">About this collection</summary>
                <div className="prose mt-2 max-w-none text-sm text-neutral-700" dangerouslySetInnerHTML={{ __html: seoText }} />
              </details>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
