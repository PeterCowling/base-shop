import type { CatalogPublishState } from "@acme/lib/xa/catalogAdminSchema";
import type { Currency } from "@acme/platform-core/contexts/CurrencyContext";
import type { SKU } from "@acme/types";

import { buildXaImageUrl } from "./xaImages";
import type {
  XaCategory,
  XaDepartment,
  XaProductDetails,
  XaProductTaxonomy,
} from "./xaTypes";

type XaMediaItem = SKU["media"][number];
type XaStringListSeed = string | string[] | null | undefined;

export type XaBrand = { handle: string; name: string };
export type XaCollection = { handle: string; title: string; description?: string };

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
  path: string;
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
  interiorColor?: XaStringListSeed;
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

export type XaCatalogSeed = {
  collections: XaCollection[];
  brands: XaBrand[];
  products: XaProductSeed[];
};

type XaMediaIndex = {
  items?: Array<{ catalogPath?: string; altText?: string }>;
};

export type XaCatalogModel = {
  collections: XaCollection[];
  brands: XaBrand[];
  products: XaProduct[];
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

function normalizeProductTaxonomy(taxonomy: XaProductTaxonomySeed): XaProductTaxonomy {
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
    interiorColor: normalizeSeedStringList(taxonomy.interiorColor),
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

function normalizeProductStatus(value: unknown): CatalogPublishState | null {
  if (value === "draft" || value === "live" || value === "out_of_stock") {
    return value;
  }
  return null;
}

function buildAltTextIndex(mediaIndex: XaMediaIndex | null | undefined): Map<string, string> {
  const altTextByPath = new Map<string, string>();
  for (const item of mediaIndex?.items ?? []) {
    if (!item || typeof item.catalogPath !== "string" || typeof item.altText !== "string") continue;
    if (!item.altText.trim()) continue;
    altTextByPath.set(item.catalogPath, item.altText.trim());
  }
  return altTextByPath;
}

function toMediaItem(
  item: XaMediaSeed,
  fallbackAlt: string,
  altTextByPath: Map<string, string>,
): XaMediaItem {
  const indexedAlt = altTextByPath.get(item.path);
  return {
    type: item.type,
    url: buildXaImageUrl(item.path),
    title: item.title,
    altText: item.altText ?? indexedAlt ?? fallbackAlt,
  };
}

function buildProductMedia(
  product: XaProductSeed,
  altTextByPath: Map<string, string>,
): XaMediaItem[] {
  return product.media.map((item) => toMediaItem(item, product.title, altTextByPath));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parseXaCatalogModel(
  catalog: unknown,
  mediaIndex: unknown,
): XaCatalogModel | null {
  if (!isRecord(catalog)) return null;
  if (!Array.isArray(catalog.collections) || !Array.isArray(catalog.brands) || !Array.isArray(catalog.products)) {
    return null;
  }

  const seed = catalog as unknown as XaCatalogSeed;
  const altTextByPath = buildAltTextIndex((mediaIndex as XaMediaIndex | null | undefined) ?? null);

  return {
    collections: seed.collections,
    brands: seed.brands,
    products: seed.products.reduce<XaProduct[]>((products, product) => {
      const status = normalizeProductStatus(product.status);
      if (status === null) return products;
      products.push({
        ...product,
        status,
        taxonomy: normalizeProductTaxonomy(product.taxonomy),
        details: normalizeProductDetails(product.details),
        media: buildProductMedia(product, altTextByPath),
      });
      return products;
    }, []),
  };
}
