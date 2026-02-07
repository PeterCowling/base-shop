"use client";

import * as React from "react";

import type { XaProduct } from "../demoData";

import { getXaSearchService } from "./xaSearchService";

type XaSearchStatus = "loading" | "ready" | "error";

export function useXaProductSearch(query: string) {
  const [status, setStatus] = React.useState<XaSearchStatus>("loading");
  const [products, setProducts] = React.useState<XaProduct[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    getXaSearchService()
      .then((service) => service.searchProducts(query))
      .then((next) => {
        if (cancelled) return;
        setProducts(next);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setProducts([]);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  return { status, products };
}

