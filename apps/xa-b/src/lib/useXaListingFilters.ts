"use client";


import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { Currency } from "@acme/platform-core/contexts/CurrencyContext";

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
  currency: Currency;
};

type FilterValues = ReturnType<typeof createEmptyFilterValues>;

type AppliedChip = { label: string; onRemove: () => void };

type AppliedFilterState = {
  appliedValues: FilterValues;
  appliedInStock: boolean;
  appliedSale: boolean;
  appliedWindow: string | null;
  appliedNewIn: boolean;
  appliedMin: number | null;
  appliedMax: number | null;
  sort: SortKey;
};

type DraftFilterState = {
  draftValues: FilterValues;
  draftInStock: boolean;
  draftSale: boolean;
  draftNewIn: boolean;
  draftMin: string;
  draftMax: string;
};

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

function deriveAppliedFilterState(query: URLSearchParams): AppliedFilterState {
  const appliedValues = buildAppliedValues(query);
  const appliedAvailability = query.get("availability") ?? null;
  const appliedWindow = query.get("window") ?? null;

  return {
    appliedValues,
    appliedInStock: appliedAvailability === "in-stock",
    appliedSale: query.get("sale") === "1",
    appliedWindow,
    appliedNewIn: query.get("new-in") === "1" || Boolean(appliedWindow),
    appliedMin: toNumber(query.get("price[min]")),
    appliedMax: toNumber(query.get("price[max]")),
    sort: (query.get("sort") as SortKey | null) ?? "newest",
  };
}

function toDraftFilterState(applied: AppliedFilterState): DraftFilterState {
  return {
    draftValues: cloneFilterValues(applied.appliedValues),
    draftInStock: applied.appliedInStock,
    draftSale: applied.appliedSale,
    draftNewIn: applied.appliedNewIn,
    draftMin: applied.appliedMin?.toString() ?? "",
    draftMax: applied.appliedMax?.toString() ?? "",
  };
}

function useDraftFilterState({
  filtersOpen,
  applied,
}: {
  filtersOpen: boolean;
  applied: AppliedFilterState;
}) {
  const [state, setState] = React.useState<DraftFilterState>(() =>
    toDraftFilterState(applied),
  );

  React.useEffect(() => {
    if (!filtersOpen) return;
    setState(toDraftFilterState(applied));
  }, [applied, filtersOpen]);

  const setDraftValues = React.useCallback((next: FilterValues | ((prev: FilterValues) => FilterValues)) => {
    setState((prev) => ({
      ...prev,
      draftValues: typeof next === "function" ? next(prev.draftValues) : next,
    }));
  }, []);

  const setDraftInStock = React.useCallback((next: boolean) => {
    setState((prev) => ({ ...prev, draftInStock: next }));
  }, []);

  const setDraftSale = React.useCallback((next: boolean) => {
    setState((prev) => ({ ...prev, draftSale: next }));
  }, []);

  const setDraftNewIn = React.useCallback((next: boolean) => {
    setState((prev) => ({ ...prev, draftNewIn: next }));
  }, []);

  const setDraftMin = React.useCallback((next: string) => {
    setState((prev) => ({ ...prev, draftMin: next }));
  }, []);

  const setDraftMax = React.useCallback((next: string) => {
    setState((prev) => ({ ...prev, draftMax: next }));
  }, []);

  const clearAllDraft = React.useCallback(() => {
    setState({
      draftValues: createEmptyFilterValues(),
      draftInStock: false,
      draftSale: false,
      draftNewIn: false,
      draftMin: "",
      draftMax: "",
    });
  }, []);

  return {
    ...state,
    setDraftValues,
    setDraftInStock,
    setDraftSale,
    setDraftNewIn,
    setDraftMin,
    setDraftMax,
    clearAllDraft,
  };
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
  currency,
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
  currency: Currency;
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

    const effectivePrice = product.prices?.[currency] ?? product.price;
    if (typeof appliedMin === "number" && effectivePrice < appliedMin) return false;
    if (typeof appliedMax === "number" && effectivePrice > appliedMax) return false;

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
  currency,
}: UseXaListingFiltersArgs) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();
  const query = React.useMemo(() => new URLSearchParams(queryKey), [queryKey]);
  const applied = React.useMemo(() => deriveAppliedFilterState(query), [query]);
  const {
    draftValues,
    draftInStock,
    draftSale,
    draftNewIn,
    draftMin,
    draftMax,
    setDraftValues,
    setDraftInStock,
    setDraftSale,
    setDraftNewIn,
    setDraftMin,
    setDraftMax,
    clearAllDraft,
  } = useDraftFilterState({ filtersOpen, applied });
  const {
    appliedValues,
    appliedInStock,
    appliedSale,
    appliedWindow,
    appliedNewIn,
    appliedMin,
    appliedMax,
    sort,
  } = applied;

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
      currency,
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
    currency,
  ]);

  const setQuery = React.useCallback(
    (next: URLSearchParams) => {
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router],
  );

  const applySort = (nextSort: SortKey) => {
    const next = new URLSearchParams(queryKey);
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

  const applyFilters = () =>
    setQuery(
      applyDraftFiltersToQuery({
        searchParamsString: queryKey,
        draftValues,
        draftInStock,
        draftSale,
        draftNewIn,
        draftMin,
        draftMax,
      }),
    );

  const clearAppliedFilters = () =>
    setQuery(clearAppliedFiltersFromQuery(queryKey));

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
      searchParamsString: queryKey,
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
    queryKey,
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
