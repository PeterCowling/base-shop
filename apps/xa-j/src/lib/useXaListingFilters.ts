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

type AppliedChip = { label: string; onRemove: () => void };

function buildAppliedValues(query: URLSearchParams): FilterValues {
  const out = createEmptyFilterValues();
  for (const key of ALL_FILTER_KEYS) {
    out[key] = new Set(query.getAll(getFilterParam(key)));
  }
  return out;
}

function resolveReferenceTimestamp(products: XaProduct[]) {
  const timestamps = products
    .map((product) => new Date(product.createdAt).getTime())
    .filter((value) => Number.isFinite(value));
  return timestamps.length ? Math.max(...timestamps) : Date.now();
}

function resolveNewInDays(appliedWindow: string | null, appliedNewIn: boolean) {
  const windowDays = appliedWindow === "day" ? 1 : appliedWindow === "week" ? 7 : null;
  return windowDays ?? (appliedNewIn ? 30 : null);
}

function filterAndSortProducts({
  products,
  cart,
  filterConfigs,
  appliedValues,
  appliedInStock,
  appliedSale,
  appliedWindow,
  appliedNewIn,
  appliedMin,
  appliedMax,
  referenceTimestamp,
  sort,
}: {
  products: XaProduct[];
  cart: XaCartState;
  filterConfigs: ReturnType<typeof getFilterConfigs>;
  appliedValues: FilterValues;
  appliedInStock: boolean;
  appliedSale: boolean;
  appliedWindow: string | null;
  appliedNewIn: boolean;
  appliedMin: number | null;
  appliedMax: number | null;
  referenceTimestamp: number;
  sort: SortKey;
}) {
  const newInDays = resolveNewInDays(appliedWindow, appliedNewIn);

  const out = products.filter((product) => {
    if (appliedInStock && getAvailableStock(product, cart) <= 0) return false;
    if (appliedSale && (!product.compareAtPrice || product.compareAtPrice <= product.price)) return false;

    if (newInDays) {
      const productTime = new Date(product.createdAt).getTime();
      const delta = referenceTimestamp - productTime;
      if (delta > newInDays * 24 * 60 * 60 * 1000) return false;
    }

    if (typeof appliedMin === "number" && product.price < appliedMin) return false;
    if (typeof appliedMax === "number" && product.price > appliedMax) return false;

    for (const config of filterConfigs) {
      const selected = appliedValues[config.key];
      if (!selected || selected.size === 0) continue;
      const values = config.accessor(product);
      if (!values.some((value) => selected.has(value))) return false;
    }

    return true;
  });

  return sortProducts(out, sort);
}

function applyDraftFiltersToQuery({
  searchParamsString,
  draftValues,
  draftInStock,
  draftSale,
  draftNewIn,
  draftMin,
  draftMax,
}: {
  searchParamsString: string;
  draftValues: FilterValues;
  draftInStock: boolean;
  draftSale: boolean;
  draftNewIn: boolean;
  draftMin: string;
  draftMax: string;
}) {
  const next = new URLSearchParams(searchParamsString);
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

  const min = draftMin.trim();
  const max = draftMax.trim();
  if (min) next.set("price[min]", min);
  else next.delete("price[min]");
  if (max) next.set("price[max]", max);
  else next.delete("price[max]");

  return next;
}

function clearAppliedFiltersFromQuery(searchParamsString: string) {
  const next = new URLSearchParams(searchParamsString);
  for (const key of ALL_FILTER_KEYS) {
    next.delete(getFilterParam(key));
  }
  next.delete("availability");
  next.delete("sale");
  next.delete("new-in");
  next.delete("window");
  next.delete("price[min]");
  next.delete("price[max]");
  return next;
}

function removeFilterValueFromQuery(searchParamsString: string, key: FilterKey, value: string) {
  const next = new URLSearchParams(searchParamsString);
  const values = new Set(next.getAll(getFilterParam(key)));
  values.delete(value);
  next.delete(getFilterParam(key));
  for (const item of values) next.append(getFilterParam(key), item);
  return next;
}

function removeQueryKey(searchParamsString: string, key: string) {
  const next = new URLSearchParams(searchParamsString);
  next.delete(key);
  return next;
}

function removePriceRangeFromQuery(searchParamsString: string) {
  const next = new URLSearchParams(searchParamsString);
  next.delete("price[min]");
  next.delete("price[max]");
  return next;
}

function buildAppliedChips({
  filterConfigs,
  appliedValues,
  appliedInStock,
  appliedSale,
  appliedNewIn,
  appliedWindow,
  appliedMin,
  appliedMax,
  searchParamsString,
  setQuery,
}: {
  filterConfigs: ReturnType<typeof getFilterConfigs>;
  appliedValues: FilterValues;
  appliedInStock: boolean;
  appliedSale: boolean;
  appliedNewIn: boolean;
  appliedWindow: string | null;
  appliedMin: number | null;
  appliedMax: number | null;
  searchParamsString: string;
  setQuery: (next: URLSearchParams) => void;
}): AppliedChip[] {
  const chips: AppliedChip[] = [];
  for (const config of filterConfigs) {
    const values = appliedValues[config.key];
    if (!values?.size) continue;
    for (const value of values) {
      chips.push({
        label: `${config.label}: ${config.formatValue(value)}`,
        onRemove: () => setQuery(removeFilterValueFromQuery(searchParamsString, config.key, value)),
      });
    }
  }

  if (appliedInStock) {
    chips.push({
      label: "In stock",
      onRemove: () => setQuery(removeQueryKey(searchParamsString, "availability")),
    });
  }

  if (appliedSale) {
    chips.push({
      label: "Sale",
      onRemove: () => setQuery(removeQueryKey(searchParamsString, "sale")),
    });
  }

  if (appliedNewIn && !appliedWindow) {
    chips.push({
      label: "New in",
      onRemove: () => setQuery(removeQueryKey(searchParamsString, "new-in")),
    });
  }

  if (appliedWindow) {
    const windowLabel = appliedWindow === "day" ? "Today" : "This week";
    chips.push({
      label: `New in: ${windowLabel}`,
      onRemove: () => setQuery(removeQueryKey(searchParamsString, "window")),
    });
  }

  if (typeof appliedMin === "number" || typeof appliedMax === "number") {
    const rangeLabel = `${appliedMin ?? 0}-${appliedMax ?? ""}`.replace(/-$/, "+");
    chips.push({
      label: `Price: ${rangeLabel}`,
      onRemove: () => setQuery(removePriceRangeFromQuery(searchParamsString)),
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

  const appliedValues = React.useMemo(() => buildAppliedValues(query), [query]);

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
    return resolveReferenceTimestamp(products);
  }, [products]);

  const filteredProducts = React.useMemo(() => {
    return filterAndSortProducts({
      products,
      cart,
      filterConfigs,
      appliedValues,
      appliedInStock,
      appliedSale,
      appliedWindow,
      appliedNewIn,
      appliedMin,
      appliedMax,
      referenceTimestamp,
      sort,
    });
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

  const applyFilters = () =>
    setQuery(
      applyDraftFiltersToQuery({
        searchParamsString: searchParams.toString(),
        draftValues,
        draftInStock,
        draftSale,
        draftNewIn,
        draftMin,
        draftMax,
      }),
    );

  const clearAppliedFilters = () =>
    setQuery(clearAppliedFiltersFromQuery(searchParams.toString()));

  const appliedChips = React.useMemo(() => {
    return buildAppliedChips({
      filterConfigs,
      appliedValues,
      appliedInStock,
      appliedSale,
      appliedNewIn,
      appliedWindow,
      appliedMin,
      appliedMax,
      searchParamsString: searchParams.toString(),
      setQuery,
    });
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
