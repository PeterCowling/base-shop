"use client";

/* eslint-disable react-hooks/exhaustive-deps -- XA-0001 [ttl=2026-12-31] legacy filter hooks pending refactor */

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { XaProduct } from "./demoData";
import { getAvailableStock } from "./inventoryStore";
import type { XaCartState } from "./xaCart";
import {
  ALL_FILTER_KEYS,
  collectFacetValues,
  type FilterKey,
  getFilterConfigs,
  type SortKey,
} from "./xaFilters";
import {
  cloneFilterValues,
  createEmptyFilterValues,
  getFilterParam,
  sortProducts,
  toNumber,
} from "./xaListingUtils";
import type { XaCategory } from "./xaTypes";

type UseXaListingFiltersArgs = {
  products: XaProduct[];
  category?: XaCategory;
  showTypeFilter?: boolean;
  cart: XaCartState;
  filtersOpen: boolean;
};

type FilterValues = ReturnType<typeof createEmptyFilterValues>;

function parseAppliedValues(query: URLSearchParams): FilterValues {
  const out = createEmptyFilterValues();
  for (const key of ALL_FILTER_KEYS) {
    out[key] = new Set(query.getAll(getFilterParam(key)));
  }
  return out;
}

function resolveReferenceTimestamp(products: XaProduct[]): number {
  const timestamps = products
    .map((product) => new Date(product.createdAt).getTime())
    .filter((value) => Number.isFinite(value));
  return timestamps.length ? Math.max(...timestamps) : Date.now();
}

function resolveNewInDays(appliedWindow: string | null, appliedNewIn: boolean): number | null {
  if (appliedWindow === "day") return 1;
  if (appliedWindow === "week") return 7;
  return appliedNewIn ? 30 : null;
}

function filterAndSortProducts(args: {
  products: XaProduct[];
  cart: XaCartState;
  filterConfigs: ReturnType<typeof getFilterConfigs>;
  appliedValues: FilterValues;
  appliedInStock: boolean;
  appliedSale: boolean;
  appliedNewIn: boolean;
  appliedWindow: string | null;
  appliedMin?: number;
  appliedMax?: number;
  referenceTimestamp: number;
  sort: SortKey;
}): XaProduct[] {
  const newInDays = resolveNewInDays(args.appliedWindow, args.appliedNewIn);
  const min = args.appliedMin;
  const max = args.appliedMax;

  const filtered = args.products.filter((product) => {
    if (args.appliedInStock && getAvailableStock(product, args.cart) <= 0) return false;
    if (args.appliedSale && (!product.compareAtPrice || product.compareAtPrice <= product.price)) {
      return false;
    }
    if (newInDays) {
      const productTime = new Date(product.createdAt).getTime();
      const delta = args.referenceTimestamp - productTime;
      if (delta > newInDays * 24 * 60 * 60 * 1000) return false;
    }
    if (typeof min === "number" && product.price < min) return false;
    if (typeof max === "number" && product.price > max) return false;

    for (const config of args.filterConfigs) {
      const selected = args.appliedValues[config.key];
      if (!selected || selected.size === 0) continue;
      const values = config.accessor(product);
      if (!values.some((value) => selected.has(value))) return false;
    }

    return true;
  });

  return sortProducts(filtered, args.sort);
}

function pushQuery(router: ReturnType<typeof useRouter>, pathname: string, next: URLSearchParams) {
  const qs = next.toString();
  router.push(qs ? `${pathname}?${qs}` : pathname);
}

function buildSortQuery(searchParamsString: string, nextSort: SortKey): URLSearchParams {
  const next = new URLSearchParams(searchParamsString);
  if (nextSort === "newest") next.delete("sort");
  else next.set("sort", nextSort);
  return next;
}

function buildDraftQuery(args: {
  searchParamsString: string;
  draftValues: FilterValues;
  draftInStock: boolean;
  draftSale: boolean;
  draftNewIn: boolean;
  draftMin: string;
  draftMax: string;
}): URLSearchParams {
  const next = new URLSearchParams(args.searchParamsString);
  for (const key of ALL_FILTER_KEYS) {
    next.delete(getFilterParam(key));
  }
  for (const key of ALL_FILTER_KEYS) {
    for (const value of Array.from(args.draftValues[key])) {
      next.append(getFilterParam(key), value);
    }
  }

  if (args.draftInStock) next.set("availability", "in-stock");
  else next.delete("availability");
  if (args.draftSale) next.set("sale", "1");
  else next.delete("sale");
  if (args.draftNewIn) next.set("new-in", "1");
  else next.delete("new-in");
  if (!args.draftNewIn) next.delete("window");

  const min = args.draftMin.trim();
  if (min) next.set("price[min]", min);
  else next.delete("price[min]");

  const max = args.draftMax.trim();
  if (max) next.set("price[max]", max);
  else next.delete("price[max]");

  return next;
}

function buildClearedFiltersQuery(searchParamsString: string): URLSearchParams {
  const next = new URLSearchParams(searchParamsString);
  for (const key of ALL_FILTER_KEYS) next.delete(getFilterParam(key));
  next.delete("availability");
  next.delete("sale");
  next.delete("new-in");
  next.delete("window");
  next.delete("price[min]");
  next.delete("price[max]");
  return next;
}

function buildRemovedValueQuery(args: {
  searchParamsString: string;
  key: FilterKey;
  value: string;
}): URLSearchParams {
  const next = new URLSearchParams(args.searchParamsString);
  const values = new Set(next.getAll(getFilterParam(args.key)));
  values.delete(args.value);
  next.delete(getFilterParam(args.key));
  for (const item of values) next.append(getFilterParam(args.key), item);
  return next;
}

function buildAppliedChips(args: {
  filterConfigs: ReturnType<typeof getFilterConfigs>;
  appliedValues: FilterValues;
  appliedInStock: boolean;
  appliedSale: boolean;
  appliedNewIn: boolean;
  appliedWindow: string | null;
  appliedMin?: number;
  appliedMax?: number;
  searchParamsString: string;
  removeFilterValue: (key: FilterKey, value: string) => void;
  setQuery: (next: URLSearchParams) => void;
}): Array<{ label: string; onRemove: () => void }> {
  const chips: Array<{ label: string; onRemove: () => void }> = [];

  for (const config of args.filterConfigs) {
    const values = args.appliedValues[config.key];
    if (!values?.size) continue;
    for (const value of values) {
      chips.push({
        label: `${config.label}: ${config.formatValue(value)}`,
        onRemove: () => args.removeFilterValue(config.key, value),
      });
    }
  }

  if (args.appliedInStock) {
    chips.push({
      label: "In stock",
      onRemove: () => {
        const next = new URLSearchParams(args.searchParamsString);
        next.delete("availability");
        args.setQuery(next);
      },
    });
  }

  if (args.appliedSale) {
    chips.push({
      label: "Sale",
      onRemove: () => {
        const next = new URLSearchParams(args.searchParamsString);
        next.delete("sale");
        args.setQuery(next);
      },
    });
  }

  if (args.appliedNewIn && !args.appliedWindow) {
    chips.push({
      label: "New in",
      onRemove: () => {
        const next = new URLSearchParams(args.searchParamsString);
        next.delete("new-in");
        args.setQuery(next);
      },
    });
  }

  if (args.appliedWindow) {
    const windowLabel = args.appliedWindow === "day" ? "Today" : "This week";
    chips.push({
      label: `New in: ${windowLabel}`,
      onRemove: () => {
        const next = new URLSearchParams(args.searchParamsString);
        next.delete("window");
        args.setQuery(next);
      },
    });
  }

  if (typeof args.appliedMin === "number" || typeof args.appliedMax === "number") {
    const rangeLabel = `${args.appliedMin ?? 0}-${args.appliedMax ?? ""}`.replace(/-$/, "+");
    chips.push({
      label: `Price: ${rangeLabel}`,
      onRemove: () => {
        const next = new URLSearchParams(args.searchParamsString);
        next.delete("price[min]");
        next.delete("price[max]");
        args.setQuery(next);
      },
    });
  }

  return chips;
}

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

  const appliedValues = React.useMemo(() => parseAppliedValues(query), [query]);

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

  const referenceTimestamp = React.useMemo(() => resolveReferenceTimestamp(products), [products]);
  const setQuery = (next: URLSearchParams) => pushQuery(router, pathname, next);
  const searchParamsString = searchParams.toString();

  const filteredProducts = React.useMemo(
    () =>
      filterAndSortProducts({
        products,
        cart,
        filterConfigs,
        appliedValues,
        appliedInStock,
        appliedSale,
        appliedNewIn,
        appliedWindow,
        appliedMin,
        appliedMax,
        referenceTimestamp,
        sort,
      }),
    [
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
    ],
  );

  const applySort = (nextSort: SortKey) => {
    setQuery(buildSortQuery(searchParamsString, nextSort));
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
    setQuery(
      buildDraftQuery({
        searchParamsString,
        draftValues,
        draftInStock,
        draftSale,
        draftNewIn,
        draftMin,
        draftMax,
      }),
    );
  };

  const clearAppliedFilters = () => {
    setQuery(buildClearedFiltersQuery(searchParamsString));
  };

  const removeFilterValue = (key: FilterKey, value: string) => {
    setQuery(buildRemovedValueQuery({ searchParamsString, key, value }));
  };

  const appliedChips = React.useMemo(
    () =>
      buildAppliedChips({
        filterConfigs,
        appliedValues,
        appliedInStock,
        appliedSale,
        appliedNewIn,
        appliedWindow,
        appliedMin,
        appliedMax,
        searchParamsString,
        removeFilterValue,
        setQuery,
      }),
    [
      appliedInStock,
      appliedNewIn,
      appliedSale,
      appliedWindow,
      appliedMin,
      appliedMax,
      appliedValues,
      filterConfigs,
      searchParamsString,
      removeFilterValue,
      setQuery,
    ],
  );

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
