"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { SKU } from "@acme/types";
import { fetchCollection } from "../products/fetchCollection";
import { DatasetProvider } from "../data/DataContext";

export type DatasetSource = "products" | "blog" | "sanity" | "manual";

export interface DatasetProps {
  children?: ReactNode;
  /** Where data is fetched from */
  source?: DatasetSource;
  /** Products: provide a collection to fetch */
  collectionId?: string;
  /** Products: manual list of SKUs when source = manual */
  skus?: SKU[];
  /** Optional override for shop id (otherwise NEXT_PUBLIC_SHOP_ID or 'default') */
  shopId?: string;
  /** Optional hard limit */
  limit?: number;
  /** Optional client-side sort (e.g., "title", "price") */
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  /** Optional dynamic route template for items, e.g. "/blog/{slug}" */
  itemRoutePattern?: string;
  className?: string;
}

/**
 * Dataset container: provides a list of items via React context.
 * - products/collectionId uses existing CMS API route
 * - manual uses provided skus
 * - other sources are stubs for now; caller can pass items via runtimeData if needed
 */
export default function Dataset({
  children,
  source = "products",
  collectionId,
  skus,
  shopId,
  limit,
  sortBy,
  sortOrder = "asc",
  itemRoutePattern,
  className,
}: DatasetProps) {
  const [items, setItems] = useState<unknown[]>(Array.isArray(skus) ? skus : []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (source === "products" && collectionId) {
        try {
          const fetched = await fetchCollection(collectionId);
          if (!cancelled) setItems(fetched as unknown[]);
        } catch (err) {
          console.warn("Dataset(products) fetch failed:", err);
          if (!cancelled) setItems(Array.isArray(skus) ? (skus as unknown[]) : []);
        }
      } else if (source === "manual") {
        setItems(Array.isArray(skus) ? (skus as unknown[]) : []);
      } else if (source === "blog" || source === "sanity") {
        try {
          const shop = shopId || (process.env.NEXT_PUBLIC_SHOP_ID as string | undefined) || "default";
          const res = await fetch(`/api/blog/posts/${encodeURIComponent(shop)}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const posts = (await res.json()) as unknown[];
          if (!cancelled) setItems(posts);
        } catch (err) {
          console.warn("Dataset(blog) fetch failed:", err);
          if (!cancelled) setItems([]);
        }
      } else {
        // Placeholder for blog/sanity; keep current items
        setItems((prev) => prev ?? []);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [source, collectionId, JSON.stringify(skus), shopId]);

  const processed = useMemo(() => {
    let list = Array.isArray(items) ? [...items] : [];
    if (sortBy) {
      list.sort((a: any, b: any) => {
        const av = (a?.[sortBy] ?? "") as unknown as string | number;
        const bv = (b?.[sortBy] ?? "") as unknown as string | number;
        if (typeof av === "number" && typeof bv === "number") return sortOrder === "asc" ? av - bv : bv - av;
        const as = String(av).toLowerCase();
        const bs = String(bv).toLowerCase();
        if (as === bs) return 0;
        return sortOrder === "asc" ? (as < bs ? -1 : 1) : (as > bs ? -1 : 1);
      });
    }
    if (typeof limit === "number") list = list.slice(0, Math.max(0, limit));
    return list;
  }, [items, sortBy, sortOrder, limit]);

  return (
    <div className={className} data-dataset-source={source}>
      <DatasetProvider items={processed} meta={{ source, itemRoutePattern, shopId }}>
        {children}
      </DatasetProvider>
    </div>
  );
}
