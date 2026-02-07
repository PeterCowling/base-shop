"use client";

import { useCallback, useEffect, useState } from "react";

export interface RapidLaunchProduct {
  id: string;
  sku: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  image?: string | null;
  stock: number;
  variantCount: number;
  launchReady: boolean;
  missingFields: string[];
}

export interface RapidLaunchProductsState {
  products: RapidLaunchProduct[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useRapidLaunchProducts(args: {
  shopId: string;
  locale: string;
}): RapidLaunchProductsState {
  const { shopId, locale } = args;
  const [products, setProducts] = useState<RapidLaunchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!shopId) return;
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    let active = true;

    void fetch(
      `/api/rapid-launch/products?shop=${encodeURIComponent(shopId)}&locale=${encodeURIComponent(locale)}`,
      { signal: controller.signal }
    )
      .then(async (res) => {
        const payload = (await res.json()) as { products?: RapidLaunchProduct[]; error?: string };
        if (!res.ok) {
          throw new Error(payload.error || `Failed to load products (${res.status})`);
        }
        if (active) setProducts(payload.products ?? []);
      })
      .catch((err: unknown) => {
        if ((err as Error).name === "AbortError") return;
        if (active) setError((err as Error).message ?? "Failed to load products");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [shopId, locale]);

  useEffect(() => {
    if (!shopId) return;
    const abort = load();
    return () => abort?.();
  }, [load, shopId]);

  const refresh = useCallback(() => {
    load();
  }, [load]);

  return { products, loading, error, refresh };
}
