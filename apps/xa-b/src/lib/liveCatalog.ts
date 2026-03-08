"use client";

import * as React from "react";

import {
  XA_BRANDS,
  XA_COLLECTIONS,
  XA_PRODUCTS,
} from "./demoData";
import { parseXaCatalogModel, type XaBrand, type XaCatalogModel, type XaCollection } from "./xaCatalogModel";

export type XaCatalogSnapshot = XaCatalogModel & {
  version?: string;
  publishedAt?: string;
  source: "live" | "bundled";
};

const BUNDLED_SNAPSHOT: XaCatalogSnapshot = {
  brands: XA_BRANDS,
  collections: XA_COLLECTIONS,
  products: XA_PRODUCTS,
  source: "bundled",
};

let snapshotPromise: Promise<XaCatalogSnapshot> | null = null;

function resolvePublicCatalogUrl(): string {
  return (process.env.NEXT_PUBLIC_XA_CATALOG_PUBLIC_URL ?? "").trim();
}

function parseCatalogResponse(payload: unknown): XaCatalogSnapshot | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as {
    catalog?: unknown;
    mediaIndex?: unknown;
    version?: unknown;
    publishedAt?: unknown;
  };
  const parsed = parseXaCatalogModel(record.catalog, record.mediaIndex);
  if (!parsed) return null;
  return {
    ...parsed,
    version: typeof record.version === "string" ? record.version : undefined,
    publishedAt: typeof record.publishedAt === "string" ? record.publishedAt : undefined,
    source: "live",
  };
}

export async function loadXaCatalogSnapshot(): Promise<XaCatalogSnapshot> {
  const url = resolvePublicCatalogUrl();
  if (!url) return BUNDLED_SNAPSHOT;

  snapshotPromise ??= fetch(url, { method: "GET", cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) return BUNDLED_SNAPSHOT;
      const parsed = parseCatalogResponse(await response.json().catch(() => null));
      return parsed ?? BUNDLED_SNAPSHOT;
    })
    .catch(() => BUNDLED_SNAPSHOT);

  return snapshotPromise;
}

export function useXaCatalogSnapshot() {
  const [snapshot, setSnapshot] = React.useState<XaCatalogSnapshot>(BUNDLED_SNAPSHOT);

  React.useEffect(() => {
    let cancelled = false;
    loadXaCatalogSnapshot().then((next) => {
      if (cancelled) return;
      setSnapshot(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return snapshot;
}

export function findXaBrand(
  brands: XaBrand[],
  handle: string,
): XaBrand | null {
  return brands.find((brand) => brand.handle === handle) ?? null;
}

export function findXaCollection(
  collections: XaCollection[],
  handle: string,
): XaCollection | null {
  return collections.find((collection) => collection.handle === handle) ?? null;
}
