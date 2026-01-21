"use client";

/* eslint-disable react-hooks/exhaustive-deps -- XA-0001 [ttl=2026-12-31] legacy filter hooks pending refactor */

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { XaCartState } from "./xaCart";
import type { XaProduct } from "./demoData";
import type { XaCategory } from "./xaTypes";
import {
  ALL_FILTER_KEYS,
  collectFacetValues,
  getFilterConfigs,
  type FilterKey,
  type SortKey,
} from "./xaFilters";
import { getAvailableStock } from "./inventoryStore";
import {
  cloneFilterValues,
  createEmptyFilterValues,
  getFilterParam,
  sortProducts,
  toNumber,
} from "./xaListingUtils";

type UseXaListingFiltersArgs = {
  products: XaProduct[];
  category?: XaCategory;
  showTypeFilter?: boolean;
  cart: XaCartState;
  filtersOpen: boolean;
};

export function useXaListingFilters({
  products,
  category,
  showTypeFilter = true,
  cart,
  filtersOpen,
}: UseXaListingFiltersArgs) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();
  const query = React.useMemo(() => new URLSearchParams(queryKey), [queryKey]);

  const appliedValues = React.useMemo(() => {
    const out = createEmptyFilterValues();
    for (const key of ALL_FILTER_KEYS) {
      out[key] = new Set(query.getAll(getFilterParam(key)));
    }
    return out;
  }, [query]);

  const appliedAvailability = query.get("availability") ?? null;
  const appliedInStock = appliedAvailability === "in-stock";
  const appliedSale = query.get("sale") === "1";
  const appliedWindow = query.get("window") ?? null;
  const appliedNewIn = query.get("new-in") === "1" || Boolean(appliedWindow);
  const appliedMin = toNumber(query.get("price[min]"));
  const appliedMax = toNumber(query.get("price[max]"));
  const sort = (query.get("sort") as SortKey | null) ?? "newest";

  const [draftValues, setDraftValues] = React.useState(() =>
    cloneFilterValues(appliedValues),
  );
  const [draftInStock, setDraftInStock] = React.useState(appliedInStock);
  const [draftSale, setDraftSale] = React.useState(appliedSale);
  const [draftNewIn, setDraftNewIn] = React.useState(appliedNewIn);
  const [draftMin, setDraftMin] = React.useState(appliedMin?.toString() ?? "");
  const [draftMax, setDraftMax] = React.useState(appliedMax?.toString() ?? "");

  React.useEffect(() => {
    if (!filtersOpen) return;
    setDraftValues(cloneFilterValues(appliedValues));
    setDraftInStock(appliedInStock);
    setDraftSale(appliedSale);
    setDraftNewIn(appliedNewIn);
    setDraftMin(appliedMin?.toString() ?? "");
    setDraftMax(appliedMax?.toString() ?? "");
  }, [filtersOpen]);

  const filterConfigs = React.useMemo(
    () => getFilterConfigs(category, { showType: showTypeFilter }),
    [category, showTypeFilter],
  );

  const facetValues = React.useMemo(
    () => collectFacetValues(products, filterConfigs),
    [products, filterConfigs],
  );

  const referenceTimestamp = React.useMemo(() => {
    const timestamps = products
      .map((product) => new Date(product.createdAt).getTime())
      .filter((value) => Number.isFinite(value));
    return timestamps.length ? Math.max(...timestamps) : Date.now();
  }, [products]);

  const filteredProducts = React.useMemo(() => {
    const min = appliedMin;
    const max = appliedMax;
    const windowDays = appliedWindow === "day" ? 1 : appliedWindow === "week" ? 7 : null;
    const newInDays = windowDays ?? (appliedNewIn ? 30 : null);

    const out = products.filter((product) => {
      if (appliedInStock && getAvailableStock(product, cart) <= 0) return false;
      if (appliedSale) {
        if (!product.compareAtPrice || product.compareAtPrice <= product.price) return false;
      }
      if (newInDays) {
        const productTime = new Date(product.createdAt).getTime();
        const delta = referenceTimestamp - productTime;
        if (delta > newInDays * 24 * 60 * 60 * 1000) return false;
      }
      if (typeof min === "number" && product.price < min) return false;
      if (typeof max === "number" && product.price > max) return false;

      for (const config of filterConfigs) {
        const selected = appliedValues[config.key];
        if (!selected || selected.size === 0) continue;
        const values = config.accessor(product);
        if (!values.some((value) => selected.has(value))) return false;
      }
      return true;
    });

    return sortProducts(out, sort);
  }, [
    appliedInStock,
    appliedSale,
    appliedNewIn,
    appliedWindow,
    appliedMin,
    appliedMax,
    appliedValues,
    cart,
    filterConfigs,
    products,
    referenceTimestamp,
    sort,
  ]);

  const setQuery = (next: URLSearchParams) => {
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const applySort = (nextSort: SortKey) => {
    const next = new URLSearchParams(searchParams.toString());
    if (nextSort === "newest") {
      next.delete("sort");
    } else {
      next.set("sort", nextSort);
    }
    setQuery(next);
  };

  const toggleDraftValue = (key: FilterKey, value: string) => {
    setDraftValues((prev) => {
      const next = cloneFilterValues(prev);
      const bucket = new Set(next[key]);
      if (bucket.has(value)) bucket.delete(value);
      else bucket.add(value);
      next[key] = bucket;
      return next;
    });
  };

  const clearAllDraft = () => {
    setDraftValues(createEmptyFilterValues());
    setDraftInStock(false);
    setDraftSale(false);
    setDraftNewIn(false);
    setDraftMin("");
    setDraftMax("");
  };

  const applyFilters = () => {
    const next = new URLSearchParams(searchParams.toString());
    for (const key of ALL_FILTER_KEYS) {
      next.delete(getFilterParam(key));
    }
    for (const key of ALL_FILTER_KEYS) {
      for (const value of Array.from(draftValues[key])) {
        next.append(getFilterParam(key), value);
      }
    }
    if (draftInStock) next.set("availability", "in-stock");
    else next.delete("availability");

    if (draftSale) next.set("sale", "1");
    else next.delete("sale");

    if (draftNewIn) next.set("new-in", "1");
    else next.delete("new-in");
    if (!draftNewIn) next.delete("window");

    if (draftMin.trim()) next.set("price[min]", draftMin.trim());
    else next.delete("price[min]");
    if (draftMax.trim()) next.set("price[max]", draftMax.trim());
    else next.delete("price[max]");

    setQuery(next);
  };

  const clearAppliedFilters = () => {
    const next = new URLSearchParams(searchParams.toString());
    for (const key of ALL_FILTER_KEYS) {
      next.delete(getFilterParam(key));
    }
    next.delete("availability");
    next.delete("sale");
    next.delete("new-in");
    next.delete("window");
    next.delete("price[min]");
    next.delete("price[max]");
    setQuery(next);
  };

  const removeFilterValue = (key: FilterKey, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    const values = new Set(next.getAll(getFilterParam(key)));
    values.delete(value);
    next.delete(getFilterParam(key));
    for (const item of values) next.append(getFilterParam(key), item);
    setQuery(next);
  };

  const appliedChips = React.useMemo(() => {
    const chips: Array<{ label: string; onRemove: () => void }> = [];
    for (const config of filterConfigs) {
      const values = appliedValues[config.key];
      if (!values?.size) continue;
      for (const value of values) {
        chips.push({
          label: `${config.label}: ${config.formatValue(value)}`,
          onRemove: () => removeFilterValue(config.key, value),
        });
      }
    }
    if (appliedInStock) {
      chips.push({
        label: "In stock",
        onRemove: () => {
          const next = new URLSearchParams(searchParams.toString());
          next.delete("availability");
          setQuery(next);
        },
      });
    }
    if (appliedSale) {
      chips.push({
        label: "Sale",
        onRemove: () => {
          const next = new URLSearchParams(searchParams.toString());
          next.delete("sale");
          setQuery(next);
        },
      });
    }
    if (appliedNewIn && !appliedWindow) {
      chips.push({
        label: "New in",
        onRemove: () => {
          const next = new URLSearchParams(searchParams.toString());
          next.delete("new-in");
          setQuery(next);
        },
      });
    }
    if (appliedWindow) {
      const windowLabel = appliedWindow === "day" ? "Today" : "This week";
      chips.push({
        label: `New in: ${windowLabel}`,
        onRemove: () => {
          const next = new URLSearchParams(searchParams.toString());
          next.delete("window");
          setQuery(next);
        },
      });
    }
    if (typeof appliedMin === "number" || typeof appliedMax === "number") {
      const rangeLabel = `${appliedMin ?? 0}-${appliedMax ?? ""}`.replace(/-$/, "+");
      chips.push({
        label: `Price: ${rangeLabel}`,
        onRemove: () => {
          const next = new URLSearchParams(searchParams.toString());
          next.delete("price[min]");
          next.delete("price[max]");
          setQuery(next);
        },
      });
    }
    return chips;
  }, [
    appliedInStock,
    appliedNewIn,
    appliedSale,
    appliedWindow,
    appliedMin,
    appliedMax,
    appliedValues,
    filterConfigs,
    searchParams,
    removeFilterValue,
    setQuery,
  ]);

  return {
    sort,
    applySort,
    filterConfigs,
    facetValues,
    filteredProducts,
    appliedChips,
    hasAppliedFilters: appliedChips.length > 0,
    draftValues,
    draftInStock,
    draftSale,
    draftNewIn,
    draftMin,
    draftMax,
    setDraftInStock,
    setDraftSale,
    setDraftNewIn,
    setDraftMin,
    setDraftMax,
    toggleDraftValue,
    clearAllDraft,
    applyFilters,
    clearAppliedFilters,
  };
}
