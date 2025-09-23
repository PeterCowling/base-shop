"use client";

import React, { createContext, useContext, useMemo } from "react";

export interface DatasetMeta {
  source?: string;
  itemRoutePattern?: string;
  shopId?: string;
}

export interface DatasetValue<T = unknown> {
  items: T[];
  meta?: DatasetMeta;
  state?: "idle" | "loading" | "loaded" | "error";
}

export interface ItemValue<T = unknown> {
  item: T | null;
  index?: number;
}

const DatasetCtx = createContext<DatasetValue | null>(null);
const ItemCtx = createContext<ItemValue | null>(null);

export function DatasetProvider<T = unknown>({ items, meta, state, children }: { items: T[]; meta?: DatasetMeta; state?: DatasetValue['state']; children?: React.ReactNode }) {
  const value = useMemo(() => ({ items, meta, state }), [items, meta, state]);
  return <DatasetCtx.Provider value={value as DatasetValue}>{children}</DatasetCtx.Provider>;
}

export function ItemProvider<T = unknown>({ item, index, children }: { item: T | null; index?: number; children?: React.ReactNode }) {
  const value = useMemo(() => ({ item, index }), [item, index]);
  return <ItemCtx.Provider value={value as ItemValue}>{children}</ItemCtx.Provider>;
}

export function useDataset<T = unknown>(): T[] {
  const ctx = useContext(DatasetCtx);
  return (ctx?.items ?? []) as T[];
}

export function useCurrentItem<T = unknown>(): ItemValue<T> {
  const ctx = useContext(ItemCtx);
  return (ctx ?? { item: null, index: undefined }) as ItemValue<T>;
}

export function useDatasetMeta(): DatasetMeta | undefined {
  const ctx = useContext(DatasetCtx);
  return ctx?.meta;
}

export function useDatasetState(): DatasetValue['state'] {
  const ctx = useContext(DatasetCtx);
  return ctx?.state ?? "idle";
}
