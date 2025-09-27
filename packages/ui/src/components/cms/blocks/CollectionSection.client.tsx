"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SKU } from "@acme/types";
import ProductFilter, { type FacetConfig } from "./ProductFilter";
import { Grid as DSGrid } from "../../atoms/primitives/Grid";
import { Sidebar } from "../../atoms/primitives/Sidebar";

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
  const [status, setStatus] = React.useState<'idle'|'loading'|'loaded'|'error'>("idle");
  const [sort, setSort] = React.useState<string>(params.sort ?? "");
  const [size, setSize] = React.useState<string>(params.size ?? "");
  const [color, setColor] = React.useState<string>(params.color ?? "");
  const [price, setPrice] = React.useState<{ min?: number; max?: number }>({
    min: params.min ? Number(params.min) : undefined,
    max: params.max ? Number(params.max) : undefined,
  });

  const router = useRouter();
  const sp = useSearchParams();

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
    const controller = new AbortController();
    const load = async () => {
      try {
        setStatus('loading');
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
        if (!res.ok) { setStatus('error'); return; }
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
        setStatus('loaded');
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

  // best-effort; API should include total for real impl
  // const total = items.length;

  return (
    <div className={className} {...rest}>
      <div className="mx-auto px-4 py-6">
        {status === 'loading' ? (
          // i18n-exempt: developer-only loading hint
          <div className="mb-3 text-sm text-neutral-600">Loading collection…</div>
        ) : null}
        {status === 'error' ? (
          // i18n-exempt: developer-only error hint
          <div className="mb-3 text-sm text-red-600">Failed to load collection.</div>
        ) : null}
        <Sidebar className="gap-6">
          <aside>
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
          <section>
            <div className="mb-4 flex items-center justify-between">
              {/* i18n-exempt: section label */}
              <h2 className="text-lg font-medium">Products</h2>
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); updateUrl({ sort: e.target.value }); }}
                className="rounded border px-2 py-1 text-sm"
              >
                {/* i18n-exempt: UI options */}
                <option value="">Default</option>
                <option value="price">Price</option>
                <option value="title">Title</option>
              </select>
            </div>
            <DSGrid cols={1} gap={4} className="sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <div key={p.id} className="border rounded p-3">
                  <div className="aspect-video bg-neutral-100 mb-2" />
                  <div className="font-medium">{p.title}</div>
                  <div className="text-sm text-neutral-600">{p.slug}</div>
                </div>
              ))}
            </DSGrid>
            {paginationMode === "ssr" ? (
              <div className="mt-6 flex items-center justify-between text-sm">
                <button
                  className="rounded border px-3 py-1 disabled:opacity-50 inline-flex items-center justify-center min-h-10 min-w-10"
                  disabled={page <= 1}
                  onClick={() => updateUrl({ page: String(Math.max(1, page - 1)), pageSize: String(pageSize) })}
                >
                  {/* i18n-exempt: pagination label */}
                  Previous
                </button>
                {/* i18n-exempt: pagination label */}
                <span>Page {page}</span>
                <button
                  className="rounded border px-3 py-1 inline-flex items-center justify-center min-h-10 min-w-10"
                  onClick={() => updateUrl({ page: String(page + 1), pageSize: String(pageSize) })}
                >
                  {/* i18n-exempt: pagination label */}
                  Next
                </button>
              </div>
            ) : null}
            {seoText ? (
              <details className="mt-8" open={!seoCollapsible}>
                {/* i18n-exempt: SEO summary label */}
                <summary className="cursor-pointer select-none text-sm font-medium">About this collection</summary>
                <div className="prose mt-2 w-full text-sm text-neutral-700" dangerouslySetInnerHTML={{ __html: seoText }} />
              </details>
            ) : null}
          </section>
        </Sidebar>
      </div>
    </div>
  );
}
