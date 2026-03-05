import {
  type CatalogProductDraftInput,
  catalogProductDraftSchema,
  normalizeXaImageRole,
  slugify,
  sortXaMediaByRole,
  splitList,
  withAutoCatalogDraftFields,
  type XaImageRole,
} from "@acme/lib/xa";

import type { XaCatalogStorefront } from "./catalogStorefront.types";

type CurrencyRates = { EUR: number; GBP: number; AUD: number };

type CatalogBrand = { handle: string; name: string };
type CatalogCollection = { handle: string; title: string; description?: string };
type CatalogMediaEntry = {
  type: "image";
  path: string;
  altText: string;
  role?: XaImageRole;
};

type CatalogProduct = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  collection: string;
  price: number;
  prices: { AUD: number; EUR: number; GBP: number; USD: number };
  stock: number;
  media: CatalogMediaEntry[];
  sizes: string[];
  description: string;
  createdAt: string;
  popularity: number;
  taxonomy: {
    department: "women" | "men" | "kids";
    category: "clothing" | "bags" | "jewelry";
    subcategory: string;
    color: string[];
    material: string[];
    fit?: string;
    length?: string;
    neckline?: string;
    sleeveLength?: string;
    pattern?: string;
    occasion?: string[];
    strapStyle?: string;
    hardwareColor?: string;
    interiorColor?: string[];
    closureType?: string;
    fits?: string[];
    metal?: string;
    gemstone?: string;
    jewelrySize?: string;
    jewelryStyle?: string;
    jewelryTier?: string;
  };
  details?: {
    modelHeight?: string;
    modelSize?: string;
    fitNote?: string;
    fabricFeel?: string;
    care?: string;
    dimensions?: string;
    strapDrop?: string;
    whatFits?: string[];
    interior?: string[];
    sizeGuide?: string;
    warranty?: string;
  };
};

type CatalogPayload = {
  collections: CatalogCollection[];
  brands: CatalogBrand[];
  products: CatalogProduct[];
};

type MediaIndexPayload = {
  generatedAt: string;
  productsCsvPath: string;
  totals: {
    products: number;
    media: number;
    warnings: number;
  };
  items: Array<{
    productSlug: string;
    sourcePath: string;
    catalogPath: string;
    altText: string;
    role?: XaImageRole;
  }>;
};

type MediaValidationPolicy = "warn" | "strict";

function normalizeNumber(input: unknown): number {
  const parsed = Number(input);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed);
}

function optionalString(input: string | undefined): string | undefined {
  const trimmed = (input ?? "").trim();
  return trimmed ? trimmed : undefined;
}

function handleToTitle(handle: string): string {
  return handle
    .split("-")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => chunk[0]?.toUpperCase() + chunk.slice(1))
    .join(" ");
}

function sanitizeHandle(input: string, fallback: string): string {
  const value = slugify(input);
  if (value) return value;
  const fallbackValue = slugify(fallback);
  return fallbackValue || "unknown";
}

function applyCurrencyRates(
  usdPrice: number,
  rates: CurrencyRates,
): { AUD: number; EUR: number; GBP: number; USD: number } {
  const safeRate = (r: number) => (Number.isFinite(r) && r > 0 ? r : 1.0);
  return {
    USD: usdPrice,
    EUR: normalizeNumber(usdPrice * safeRate(rates.EUR)),
    GBP: normalizeNumber(usdPrice * safeRate(rates.GBP)),
    AUD: normalizeNumber(usdPrice * safeRate(rates.AUD)),
  };
}

function appendIfPresent(target: Record<string, unknown>, key: string, value: unknown): void {
  if (typeof value === "string" && value.trim()) {
    target[key] = value.trim();
  }
}

function appendIfListHasValues(target: Record<string, unknown>, key: string, value: string | undefined): void {
  const parsed = splitList(value ?? "");
  if (parsed.length > 0) {
    target[key] = parsed;
  }
}

function buildDetails(draft: ReturnType<typeof catalogProductDraftSchema.parse>) {
  const details = draft.details ?? {};
  const out: Record<string, unknown> = {};
  appendIfPresent(out, "modelHeight", details.modelHeight);
  appendIfPresent(out, "modelSize", details.modelSize);
  appendIfPresent(out, "fitNote", details.fitNote);
  appendIfPresent(out, "fabricFeel", details.fabricFeel);
  appendIfPresent(out, "care", details.care);
  appendIfPresent(out, "dimensions", details.dimensions);
  appendIfPresent(out, "strapDrop", details.strapDrop);
  appendIfListHasValues(out, "whatFits", details.whatFits);
  appendIfListHasValues(out, "interior", details.interior);
  appendIfPresent(out, "sizeGuide", details.sizeGuide);
  appendIfPresent(out, "warranty", details.warranty);
  return Object.keys(out).length > 0 ? out : undefined;
}

function parseCloudCurrencyRates(): CurrencyRates {
  const raw = (process.env.XA_UPLOADER_CLOUD_SYNC_CURRENCY_RATES ?? "").trim();
  if (!raw) return { EUR: 1, GBP: 1, AUD: 1 };
  try {
    const parsed = JSON.parse(raw) as { EUR?: number; GBP?: number; AUD?: number };
    const EUR = Number(parsed.EUR);
    const GBP = Number(parsed.GBP);
    const AUD = Number(parsed.AUD);
    if (![EUR, GBP, AUD].every((rate) => Number.isFinite(rate) && rate > 0)) {
      return { EUR: 1, GBP: 1, AUD: 1 };
    }
    return { EUR, GBP, AUD };
  } catch {
    return { EUR: 1, GBP: 1, AUD: 1 };
  }
}

function normalizeCatalogPath(rawPath: string): string {
  return rawPath.trim().replace(/^\/+/, "");
}

function isHttpsUrl(value: string): boolean {
  return /^https:\/\//i.test(value);
}

function parseAllowedExternalHosts(hosts: string[] | undefined): Set<string> {
  const out = new Set<string>();
  for (const host of hosts ?? []) {
    const normalized = host.trim().toLowerCase();
    if (!normalized) continue;
    out.add(normalized);
  }
  return out;
}

function isAllowedExternalImageUrl(url: string, allowedHosts: Set<string>): boolean {
  if (allowedHosts.size === 0) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  return allowedHosts.has(parsed.hostname.trim().toLowerCase());
}

function isValidCloudR2KeyPath(pathValue: string, storefront: XaCatalogStorefront): boolean {
  if (!pathValue || pathValue.includes("\\")) return false;
  const segments = pathValue.split("/").filter(Boolean);
  if (segments.length < 3) return false;
  if (segments[0] !== storefront) return false;
  return segments.every((segment) => segment.trim().length > 0);
}

function validateCloudCatalogPath(params: {
  catalogPath: string;
  storefront: XaCatalogStorefront;
  allowedExternalHosts: Set<string>;
}): { valid: true } | { valid: false; reason: string } {
  if (!params.catalogPath) {
    return { valid: false, reason: "empty_path" };
  }
  if (isHttpsUrl(params.catalogPath)) {
    if (isAllowedExternalImageUrl(params.catalogPath, params.allowedExternalHosts)) {
      return { valid: true };
    }
    return { valid: false, reason: "external_host_not_allowed" };
  }
  if (isValidCloudR2KeyPath(params.catalogPath, params.storefront)) {
    return { valid: true };
  }
  return { valid: false, reason: "invalid_cloud_key" };
}

function buildTaxonomy(draft: ReturnType<typeof catalogProductDraftSchema.parse>) {
  const taxonomy: Record<string, unknown> = {
    department: draft.taxonomy.department,
    category: draft.taxonomy.category,
    subcategory: optionalString(draft.taxonomy.subcategory) ?? "unknown",
    color: splitList(draft.taxonomy.color ?? ""),
    material: splitList(draft.taxonomy.material ?? ""),
  };
  appendIfPresent(taxonomy, "fit", draft.taxonomy.fit);
  appendIfPresent(taxonomy, "length", draft.taxonomy.length);
  appendIfPresent(taxonomy, "neckline", draft.taxonomy.neckline);
  appendIfPresent(taxonomy, "sleeveLength", draft.taxonomy.sleeveLength);
  appendIfPresent(taxonomy, "pattern", draft.taxonomy.pattern);
  appendIfListHasValues(taxonomy, "occasion", draft.taxonomy.occasion);
  appendIfPresent(taxonomy, "strapStyle", draft.taxonomy.strapStyle);
  appendIfPresent(taxonomy, "hardwareColor", draft.taxonomy.hardwareColor);
  appendIfListHasValues(taxonomy, "interiorColor", draft.taxonomy.interiorColor);
  appendIfPresent(taxonomy, "closureType", draft.taxonomy.closureType);
  const mergedFits = new Set([
    ...splitList(draft.taxonomy.fits ?? ""),
    ...splitList(draft.details?.whatFits ?? ""),
  ]);
  if (mergedFits.size > 0) {
    taxonomy.fits = Array.from(mergedFits);
  }
  appendIfPresent(taxonomy, "metal", draft.taxonomy.metal);
  appendIfPresent(taxonomy, "gemstone", draft.taxonomy.gemstone);
  appendIfPresent(taxonomy, "jewelrySize", draft.taxonomy.jewelrySize);
  appendIfPresent(taxonomy, "jewelryStyle", draft.taxonomy.jewelryStyle);
  appendIfPresent(taxonomy, "jewelryTier", draft.taxonomy.jewelryTier);
  return taxonomy as CatalogProduct["taxonomy"];
}

function buildMediaEntries(params: {
  rowNumber: number;
  productSlug: string;
  title: string;
  imageFiles: string[];
  imageRoles: string[];
  imageAltTexts: string[];
  strict: boolean;
  mediaValidationPolicy: MediaValidationPolicy;
  storefront: XaCatalogStorefront;
  allowedExternalHosts: Set<string>;
  warnings: string[];
  mediaItems: MediaIndexPayload["items"];
}): CatalogMediaEntry[] {
  if (params.strict && params.imageFiles.length === 0) {
    throw new Error(`[row ${params.rowNumber}] "${params.productSlug}" has no image paths.`);
  }
  const media: CatalogMediaEntry[] = [];
  for (const [index, rawPath] of params.imageFiles.entries()) {
    const catalogPath = normalizeCatalogPath(rawPath);
    if (!catalogPath) {
      params.warnings.push(`[row ${params.rowNumber}] "${params.productSlug}" has an empty image path entry.`);
      continue;
    }

    const cloudPathValidation = validateCloudCatalogPath({
      catalogPath,
      storefront: params.storefront,
      allowedExternalHosts: params.allowedExternalHosts,
    });
    if ("reason" in cloudPathValidation) {
      const reason = cloudPathValidation.reason;
      const message = `[row ${params.rowNumber}] "${params.productSlug}" has unsupported cloud image path "${catalogPath}" (${reason}).`;
      if (params.mediaValidationPolicy === "strict") {
        throw new Error(message);
      }
      params.warnings.push(message);
      continue;
    }

    const altText = params.imageAltTexts[index] || params.title || params.productSlug;
    const role = normalizeXaImageRole(params.imageRoles[index]);
    media.push({ type: "image", path: catalogPath, altText, ...(role ? { role } : {}) });
    params.mediaItems.push({
      productSlug: params.productSlug,
      sourcePath: catalogPath,
      catalogPath,
      altText,
      ...(role ? { role } : {}),
    });
  }
  if (params.strict && media.length === 0) {
    throw new Error(`[row ${params.rowNumber}] "${params.productSlug}" produced no media entries.`);
  }
  return sortXaMediaByRole(media);
}

function assertUniqueRowValue(params: {
  value: string;
  seen: Set<string>;
  rowNumber: number;
  label: "slug" | "id";
}): void {
  if (params.seen.has(params.value)) {
    throw new Error(`[row ${params.rowNumber}] duplicate ${params.label} "${params.value}".`);
  }
  params.seen.add(params.value);
}

function deriveProductSlug(params: {
  rowNumber: number;
  slug: string | undefined;
  title: string;
}): string {
  const productSlug = slugify(params.slug || params.title);
  if (!productSlug) {
    throw new Error(`[row ${params.rowNumber}] could not derive product slug.`);
  }
  return productSlug;
}

export function buildCatalogArtifactsFromDrafts(params: {
  storefront: XaCatalogStorefront;
  products: CatalogProductDraftInput[];
  strict: boolean;
  mediaValidationPolicy?: MediaValidationPolicy;
  allowedExternalImageHosts?: string[];
}): { catalog: CatalogPayload; mediaIndex: MediaIndexPayload; warnings: string[] } {
  const mediaValidationPolicy = params.mediaValidationPolicy === "strict" ? "strict" : "warn";
  const allowedExternalHosts = parseAllowedExternalHosts(params.allowedExternalImageHosts);
  const warnings: string[] = [];
  const rates = parseCloudCurrencyRates();
  const seenSlugs = new Set<string>();
  const seenIds = new Set<string>();
  const collectionsByHandle = new Map<string, CatalogCollection>();
  const brandsByHandle = new Map<string, CatalogBrand>();
  const catalogProducts: CatalogProduct[] = [];
  const mediaItems: MediaIndexPayload["items"] = [];

  for (const [index, input] of params.products.entries()) {
    const parsed = catalogProductDraftSchema.parse(withAutoCatalogDraftFields(input));
    const rowNumber = index + 1;
    const productSlug = deriveProductSlug({
      rowNumber,
      slug: parsed.slug,
      title: parsed.title,
    });
    assertUniqueRowValue({
      value: productSlug,
      seen: seenSlugs,
      rowNumber,
      label: "slug",
    });

    const productId = (parsed.id ?? "").trim() || `draft-${productSlug}`;
    assertUniqueRowValue({
      value: productId,
      seen: seenIds,
      rowNumber,
      label: "id",
    });

    const brandHandle = sanitizeHandle(parsed.brandHandle, "brand");
    const brandName = optionalString(parsed.brandName) ?? handleToTitle(brandHandle);
    brandsByHandle.set(brandHandle, { handle: brandHandle, name: brandName });

    const collectionHandle = sanitizeHandle(
      parsed.collectionHandle || parsed.collectionTitle || parsed.taxonomy.subcategory,
      `${parsed.taxonomy.category}-${parsed.taxonomy.subcategory}`,
    );
    const collectionTitle = optionalString(parsed.collectionTitle) ?? handleToTitle(collectionHandle);
    const collectionDescription = optionalString(parsed.collectionDescription);
    if (!collectionsByHandle.has(collectionHandle)) {
      collectionsByHandle.set(collectionHandle, {
        handle: collectionHandle,
        title: collectionTitle,
        ...(collectionDescription ? { description: collectionDescription } : {}),
      });
    }

    const imageFiles = splitList(parsed.imageFiles ?? "");
    const imageRoles = splitList(parsed.imageRoles ?? "");
    const imageAltTexts = splitList(parsed.imageAltTexts ?? "");
    const media = buildMediaEntries({
      rowNumber,
      productSlug,
      title: parsed.title,
      imageFiles,
      imageRoles,
      imageAltTexts,
      strict: params.strict === true,
      mediaValidationPolicy,
      storefront: params.storefront,
      allowedExternalHosts,
      warnings,
      mediaItems,
    });

    const details = buildDetails(parsed);
    const taxonomy = buildTaxonomy(parsed);

    const normalizedPrice = normalizeNumber(parsed.price);
    catalogProducts.push({
      id: productId,
      slug: productSlug,
      title: parsed.title,
      brand: brandHandle,
      collection: collectionHandle,
      price: normalizedPrice,
      prices: applyCurrencyRates(normalizedPrice, rates),
      stock: normalizeNumber(parsed.stock),
      media,
      sizes: splitList(parsed.sizes ?? ""),
      description: parsed.description,
      createdAt: parsed.createdAt,
      popularity: normalizeNumber(parsed.popularity),
      taxonomy,
      ...(details ? { details } : {}),
    });
  }

  catalogProducts.sort((left, right) => left.slug.localeCompare(right.slug));
  const catalog: CatalogPayload = {
    collections: [...collectionsByHandle.values()].sort((left, right) => left.handle.localeCompare(right.handle)),
    brands: [...brandsByHandle.values()].sort((left, right) => left.handle.localeCompare(right.handle)),
    products: catalogProducts,
  };

  const mediaIndex: MediaIndexPayload = {
    generatedAt: new Date().toISOString(),
    productsCsvPath: `cloud-draft://${params.storefront}`,
    totals: {
      products: catalogProducts.length,
      media: mediaItems.length,
      warnings: warnings.length,
    },
    items: mediaItems.sort((left, right) => left.catalogPath.localeCompare(right.catalogPath)),
  };

  return { catalog, mediaIndex, warnings };
}
