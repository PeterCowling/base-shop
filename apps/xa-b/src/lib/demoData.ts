import type { CatalogPublishState } from "@acme/lib/xa/catalogAdminSchema";
import {
  normalizeXaImageRole,
  sortXaMediaByRole,
  type XaImageRole,
} from "@acme/lib/xa/catalogImageRoles";
import type { Currency } from "@acme/platform-core/contexts/CurrencyContext";
import type { SKU } from "@acme/types";

import mediaIndex from "../data/catalog.media.runtime.json";
import catalog from "../data/catalog.runtime.json";
import runtimeMeta from "../data/catalog.runtime.meta.json";

import { buildXaImageUrl } from "./xaImages";
import type {
  XaCategory,
  XaDepartment,
  XaProductDetails,
  XaProductTaxonomy,
} from "./xaTypes";

type XaMediaItem = SKU["media"][number] & { role?: XaImageRole };
type XaStringListSeed = string | string[] | null | undefined;

export type XaProduct = Omit<SKU, "media" | "stock"> & {
  media: XaMediaItem[];
  brand: string;
  collection: string;
  status: CatalogPublishState;
  prices?: Partial<Record<Currency, number>>;
  createdAt: string;
  popularity: number;
  variantGroup?: string;
  taxonomy: XaProductTaxonomy;
  details?: XaProductDetails;
};

type XaMediaSeed = Omit<SKU["media"][number], "url"> & {
  // Cloudflare Images id (optionally with "/variant").
  path: string;
  role?: string;
};

type XaProductTaxonomySeed = {
  department: XaDepartment;
  category: XaCategory;
  subcategory: string;
  color?: XaStringListSeed;
  material?: XaStringListSeed;
  fit?: string | null;
  length?: string | null;
  neckline?: string | null;
  sleeveLength?: string | null;
  pattern?: string | null;
  occasion?: XaStringListSeed;
  strapStyle?: string | null;
  hardwareColor?: string | null;
  closureType?: string | null;
  fits?: XaStringListSeed;
  metal?: string | null;
  gemstone?: string | null;
  jewelrySize?: string | null;
  jewelryStyle?: string | null;
  jewelryTier?: string | null;
};

type XaProductDetailsSeed = {
  modelHeight?: string | null;
  modelSize?: string | null;
  fitNote?: string | null;
  fabricFeel?: string | null;
  care?: string | null;
  dimensions?: string | null;
  strapDrop?: string | null;
  whatFits?: XaStringListSeed;
  interior?: XaStringListSeed;
  sizeGuide?: string | null;
  warranty?: string | null;
};

type XaProductSeed = Omit<XaProduct, "media" | "taxonomy" | "details"> & {
  media: XaMediaSeed[];
  taxonomy: XaProductTaxonomySeed;
  details?: XaProductDetailsSeed | null;
};

type XaCatalogSeed = {
  collections: Array<{ handle: string; title: string; description?: string }>;
  brands: Array<{ handle: string; name: string }>;
  products: XaProductSeed[];
};

const xaCatalog = catalog as unknown as XaCatalogSeed;
const xaMediaIndex = mediaIndex as {
  items?: Array<{ catalogPath?: string; altText?: string }>;
};
export const XA_CATALOG_RUNTIME_META = runtimeMeta as {
  source?: string;
  syncedAt?: string;
  version?: string;
  publishedAt?: string;
};

function toNonEmptyString(value: string | null | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

function splitPipeSegments(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split("|")
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function normalizeSeedStringList(
  value: XaStringListSeed,
  options: { splitCommas?: boolean } = {},
): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }
  if (typeof value !== "string") return [];
  const normalized = value.trim();
  if (!normalized) return [];
  if (normalized.includes("|")) return splitPipeSegments(normalized);
  if (options.splitCommas && normalized.includes(",")) {
    return normalized
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [normalized];
}

function normalizeProductTaxonomy(
  taxonomy: XaProductTaxonomySeed,
): XaProductTaxonomy {
  return {
    department: taxonomy.department,
    category: taxonomy.category,
    subcategory: taxonomy.subcategory,
    color: normalizeSeedStringList(taxonomy.color),
    material: normalizeSeedStringList(taxonomy.material),
    fit: toNonEmptyString(taxonomy.fit),
    length: toNonEmptyString(taxonomy.length),
    neckline: toNonEmptyString(taxonomy.neckline),
    sleeveLength: toNonEmptyString(taxonomy.sleeveLength),
    pattern: toNonEmptyString(taxonomy.pattern),
    occasion: normalizeSeedStringList(taxonomy.occasion),
    strapStyle: toNonEmptyString(taxonomy.strapStyle),
    hardwareColor: toNonEmptyString(taxonomy.hardwareColor),
    closureType: toNonEmptyString(taxonomy.closureType),
    fits: normalizeSeedStringList(taxonomy.fits),
    metal: toNonEmptyString(taxonomy.metal),
    gemstone: toNonEmptyString(taxonomy.gemstone),
    jewelrySize: toNonEmptyString(taxonomy.jewelrySize),
    jewelryStyle: toNonEmptyString(taxonomy.jewelryStyle),
    jewelryTier: toNonEmptyString(taxonomy.jewelryTier),
  };
}

function normalizeProductDetails(
  details: XaProductDetailsSeed | null | undefined,
): XaProductDetails | undefined {
  if (!details) return undefined;

  const normalized: XaProductDetails = {};

  normalized.modelHeight = toNonEmptyString(details.modelHeight);
  normalized.modelSize = toNonEmptyString(details.modelSize);
  normalized.fitNote = toNonEmptyString(details.fitNote);
  normalized.fabricFeel = toNonEmptyString(details.fabricFeel);
  normalized.care = toNonEmptyString(details.care);
  normalized.dimensions = toNonEmptyString(details.dimensions);
  normalized.strapDrop = toNonEmptyString(details.strapDrop);
  normalized.sizeGuide = toNonEmptyString(details.sizeGuide);
  normalized.warranty = toNonEmptyString(details.warranty);

  const whatFits = normalizeSeedStringList(details.whatFits, { splitCommas: true });
  if (whatFits.length > 0) normalized.whatFits = whatFits;

  const interior = normalizeSeedStringList(details.interior);
  if (interior.length > 0) normalized.interior = interior;

  return Object.values(normalized).some((value) => value !== undefined)
    ? normalized
    : undefined;
}

function expandMediaSeed(item: XaMediaSeed): XaMediaSeed[] {
  const paths = splitPipeSegments(item.path);
  if (paths.length <= 1) return [item];

  const altTexts = splitPipeSegments(item.altText);
  const roles = splitPipeSegments(item.role);

  return paths.map((path, index) => ({
    ...item,
    path,
    altText: altTexts[index] ?? altTexts.at(-1) ?? item.altText,
    role: roles[index] ?? roles.at(-1) ?? item.role,
  }));
}

function resolveCatalogMaxAgeMs(): number {
  const raw = Number.parseInt(process.env.NEXT_PUBLIC_XA_CATALOG_MAX_AGE_HOURS ?? "48", 10);
  const safeHours = Number.isFinite(raw) && raw > 0 ? raw : 48;
  return safeHours * 60 * 60 * 1000;
}

function normalizeProductStatus(value: unknown): CatalogPublishState | null {
  if (value === "draft" || value === "live" || value === "out_of_stock") {
    return value;
  }
  return null;
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

function toMediaItem(item: XaMediaSeed, fallbackAlt: string, role: XaImageRole | undefined): XaMediaItem {
  const indexedAlt = altTextByPath.get(item.path);
  return {
    type: item.type,
    url: buildXaImageUrl(item.path),
    title: item.title,
    altText: item.altText ?? indexedAlt ?? fallbackAlt,
    ...(role ? { role } : {}),
  };
}

function resolveProductMediaRole(item: XaMediaSeed): XaImageRole | undefined {
  return normalizeXaImageRole(item.role);
}

function buildProductMedia(product: XaProductSeed): XaMediaItem[] {
  const hydrated = product.media
    .flatMap((item) => expandMediaSeed(item))
    .map((item) => {
      const role = resolveProductMediaRole(item);
      return toMediaItem(item, product.title, role);
    });
  return sortXaMediaByRole(hydrated);
}

export const XA_COLLECTIONS = xaCatalog.collections;
export const XA_BRANDS = xaCatalog.brands;
export const XA_PRODUCTS: XaProduct[] = xaCatalog.products.reduce<XaProduct[]>(
  (products, product) => {
    const status = normalizeProductStatus(product.status);
    if (status === null) return products;
    products.push({
      ...product,
      status,
      taxonomy: normalizeProductTaxonomy(product.taxonomy),
      details: normalizeProductDetails(product.details),
      media: buildProductMedia(product),
    });
    return products;
  },
  [],
);

export function getXaProductByHandle(handle: string): XaProduct | null {
  return XA_PRODUCTS.find((p) => p.slug === handle) ?? null;
}
