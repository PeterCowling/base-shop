"use client";

import React from "react";
import type { SKU } from "@acme/types";
import ProductFilter from "./ProductFilter";

export interface CollectionClientProps extends React.HTMLAttributes<HTMLDivElement> {
  initial: SKU[];
  params: Record<string, string | undefined>;
}

export default function CollectionSectionClient({ initial, params, className, ...rest }: CollectionClientProps) {
  const [items, setItems] = React.useState<SKU[]>(initial);
  const [sort, setSort] = React.useState<string>(params.sort ?? "");
  const [size, setSize] = React.useState<string>(params.size ?? "");
  const [color, setColor] = React.useState<string>(params.color ?? "");

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
        const res = await fetch(url.toString(), { signal: controller.signal });
        if (!res.ok) return;
        const data = (await res.json()) as { items?: SKU[] } | SKU[];
        const list = Array.isArray(data) ? data : (data.items ?? []);
        setItems(list);
      } catch {}
    };
    void load();
    return () => controller.abort();
  }, [sp, params.slug, sort]);

  return (
    <div className={className} {...rest}>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-4 gap-6">
          <aside className="col-span-1">
            <ProductFilter
              showSize
              showColor
              showPrice
              onChange={(state: any) => {
                setSize(state.size ?? "");
                setColor(state.color ?? "");
                updateUrl({ size: state.size, color: state.color, min: String(state.minPrice ?? ""), max: String(state.maxPrice ?? "") });
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
          </section>
        </div>
      </div>
    </div>
  );
}

