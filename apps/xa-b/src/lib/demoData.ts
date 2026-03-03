import type { Currency } from "@acme/platform-core/contexts/CurrencyContext";
import type { SKU } from "@acme/types";

import mediaIndex from "../data/catalog.media.runtime.json";
import catalog from "../data/catalog.runtime.json";
import runtimeMeta from "../data/catalog.runtime.meta.json";

import { buildXaImageUrl } from "./xaImages";
import type { XaProductDetails, XaProductTaxonomy } from "./xaTypes";

export type XaProduct = SKU & {
  brand: string;
  collection: string;
  compareAtPrice?: number;
  prices?: Partial<Record<Currency, number>>;
  compareAtPrices?: Partial<Record<Currency, number>>;
  createdAt: string;
  popularity: number;
  variantGroup?: string;
  taxonomy: XaProductTaxonomy;
  details?: XaProductDetails;
};

type XaMediaSeed = Omit<SKU["media"][number], "url"> & {
  // Cloudflare Images id (optionally with "/variant").
  path: string;
};

type XaProductSeed = Omit<XaProduct, "media"> & { media: XaMediaSeed[] };

type XaCatalogSeed = {
  collections: Array<{ handle: string; title: string; description?: string }>;
  brands: Array<{ handle: string; name: string }>;
  products: XaProductSeed[];
};

const xaCatalog = catalog as XaCatalogSeed;
const xaMediaIndex = mediaIndex as {
  items?: Array<{ catalogPath?: string; altText?: string }>;
};
export const XA_CATALOG_RUNTIME_META = runtimeMeta as {
  source?: string;
  syncedAt?: string;
  version?: string;
  publishedAt?: string;
};

function resolveCatalogMaxAgeMs(): number {
  const raw = Number.parseInt(process.env.NEXT_PUBLIC_XA_CATALOG_MAX_AGE_HOURS ?? "48", 10);
  const safeHours = Number.isFinite(raw) && raw > 0 ? raw : 48;
  return safeHours * 60 * 60 * 1000;
}

function parseTimestamp(value: unknown): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const syncedAtMs = parseTimestamp(XA_CATALOG_RUNTIME_META.syncedAt);
export const XA_CATALOG_RUNTIME_FRESHNESS = {
  syncedAt: XA_CATALOG_RUNTIME_META.syncedAt,
  ageMs: syncedAtMs === null ? null : Math.max(0, Date.now() - syncedAtMs),
  isStale:
    syncedAtMs === null ? true : Date.now() - syncedAtMs > resolveCatalogMaxAgeMs(),
};

const altTextByPath = new Map<string, string>();
for (const item of xaMediaIndex.items ?? []) {
  if (!item || typeof item.catalogPath !== "string" || typeof item.altText !== "string") continue;
  if (!item.altText.trim()) continue;
  altTextByPath.set(item.catalogPath, item.altText.trim());
}

function toMediaItem(item: XaMediaSeed, fallbackAlt: string): SKU["media"][number] {
  const indexedAlt = altTextByPath.get(item.path);
  return {
    type: item.type,
    url: buildXaImageUrl(item.path),
    title: item.title,
    altText: item.altText ?? indexedAlt ?? fallbackAlt,
  };
}

export const XA_COLLECTIONS = xaCatalog.collections;
export const XA_BRANDS = xaCatalog.brands;
export const XA_PRODUCTS: XaProduct[] = xaCatalog.products.map((product) => ({
  ...product,
  media: product.media.map((item) => toMediaItem(item, product.title)),
}));

export function getXaProductByHandle(handle: string): XaProduct | null {
  return XA_PRODUCTS.find((p) => p.slug === handle) ?? null;
}
