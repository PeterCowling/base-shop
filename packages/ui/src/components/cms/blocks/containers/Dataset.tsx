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
  /** Optional cache key to memoize fetch results across mounts */
  cacheKey?: string;
  /** TTL in ms for the cache entry; defaults to no TTL */
  ttlMs?: number;
  /** Optional transform for light manipulation (map/filter) */
  transform?: (items: unknown[]) => unknown[];
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
  const [state, setState] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const keyParts = [source, collectionId, shopId].filter(Boolean).join(":");
  const computedKey = (cacheKey || keyParts) + (limit ? `:limit=${limit}` : "") + (sortBy ? `:sort=${sortBy}:${sortOrder}` : "");

  // very light in-memory cache (per module)
  const cache = getDatasetCache();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      // cache check
      const cached = cache.get(computedKey);
      if (cached && (!cached.expiresAt || cached.expiresAt > Date.now())) {
        setItems(cached.items);
        setState("loaded");
        return;
      }
      if (source === "products" && collectionId) {
        setState("loading");
        try {
          const fetched = await fetchCollection(collectionId);
          if (!cancelled) {
            const list = (fetched as unknown[]) ?? [];
            setItems(list);
            cache.set(computedKey, list, ttlMs);
            setState("loaded");
          }
        } catch (err) {
          console.warn("Dataset(products) fetch failed:", err);
          if (!cancelled) {
            setItems(Array.isArray(skus) ? (skus as unknown[]) : []);
            setState("error");
          }
        }
      } else if (source === "manual") {
        const list = Array.isArray(skus) ? (skus as unknown[]) : [];
        setItems(list);
        cache.set(computedKey, list, ttlMs);
        setState("loaded");
      } else if (source === "blog" || source === "sanity") {
        setState("loading");
        try {
          const shop = shopId || (process.env.NEXT_PUBLIC_SHOP_ID as string | undefined) || "default";
          const res = await fetch(`/api/blog/posts/${encodeURIComponent(shop)}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const posts = (await res.json()) as unknown[];
          if (!cancelled) {
            const list = posts ?? [];
            setItems(list);
            cache.set(computedKey, list, ttlMs);
            setState("loaded");
          }
        } catch (err) {
          console.warn("Dataset(blog) fetch failed:", err);
          if (!cancelled) {
            setItems([]);
            setState("error");
          }
        }
      } else {
        // Placeholder for blog/sanity; keep current items
        setItems((prev) => prev ?? []);
        setState("loaded");
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [source, collectionId, shopId, skus, computedKey, ttlMs]);

  const processed = useMemo(() => {
    let list = Array.isArray(items) ? [...items] : [];
    if (sortBy) {
      const getVal = (obj: unknown): string | number => {
        if (obj && typeof obj === 'object' && sortBy in (obj as Record<string, unknown>)) {
          const v = (obj as Record<string, unknown>)[sortBy];
          return typeof v === 'number' ? v : String(v ?? '');
        }
        return '';
      };
      list.sort((a: unknown, b: unknown) => {
        const av = getVal(a);
        const bv = getVal(b);
        if (typeof av === 'number' && typeof bv === 'number') return sortOrder === 'asc' ? av - bv : bv - av;
        const as = String(av).toLowerCase();
        const bs = String(bv).toLowerCase();
        if (as === bs) return 0;
        return sortOrder === 'asc' ? (as < bs ? -1 : 1) : (as > bs ? -1 : 1);
      });
    }
    if (typeof limit === "number") list = list.slice(0, Math.max(0, limit));
    if (typeof transform === "function") {
      try { list = transform(list) ?? list; } catch {}
    }
    return list;
  }, [items, sortBy, sortOrder, limit, transform]);

  return (
    <div className={className} data-dataset-source={source}>
      <DatasetProvider items={processed} meta={{ source, itemRoutePattern, shopId }} state={state}>
        {children}
      </DatasetProvider>
    </div>
  );
}

// simple module-local cache util
type CacheEntry = { items: unknown[]; expiresAt?: number };
const __cache: Map<string, CacheEntry> = new Map();
function getDatasetCache() {
  return {
    get(key: string): CacheEntry | undefined {
      return __cache.get(key);
    },
    set(key: string, items: unknown[], ttlMs?: number) {
      const entry: CacheEntry = { items };
      if (typeof ttlMs === "number" && ttlMs > 0) entry.expiresAt = Date.now() + ttlMs;
      __cache.set(key, entry);
    },
  };
}
