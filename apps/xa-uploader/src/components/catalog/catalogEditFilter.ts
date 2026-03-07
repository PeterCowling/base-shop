import type { CatalogProductDraftInput } from "@acme/lib/xa";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type EditFilterCriteria = {
  brand?: string;
  collection?: string;
  size?: string;
  color?: string;
};

export type EditFilterOptions = {
  brands: string[];
  collections: string[];
  sizes: string[];
  colors: string[];
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function splitPipe(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

function pipeContains(pipeValue: string | undefined, needle: string): boolean {
  return splitPipe(pipeValue).includes(needle);
}

/* ------------------------------------------------------------------ */
/*  filterCatalogProducts                                              */
/* ------------------------------------------------------------------ */

export function filterCatalogProducts(
  products: CatalogProductDraftInput[],
  criteria: EditFilterCriteria,
): CatalogProductDraftInput[] {
  return products.filter((p) => {
    if (criteria.brand && p.brandHandle !== criteria.brand) return false;
    if (criteria.collection && p.collectionHandle !== criteria.collection) return false;
    if (criteria.size && !pipeContains(p.sizes, criteria.size)) return false;
    if (criteria.color && !pipeContains(p.taxonomy.color, criteria.color)) return false;
    return true;
  });
}

/* ------------------------------------------------------------------ */
/*  extractFilterOptions                                               */
/* ------------------------------------------------------------------ */

export function extractFilterOptions(
  products: CatalogProductDraftInput[],
  criteria: EditFilterCriteria,
): EditFilterOptions {
  const brands = [...new Set(products.map((p) => p.brandHandle).filter(Boolean))];

  // Collections: filtered by brand only
  const byBrand = criteria.brand
    ? products.filter((p) => p.brandHandle === criteria.brand)
    : products;
  const collections = [...new Set(byBrand.map((p) => p.collectionHandle ?? "").filter(Boolean))];

  // Sizes: filtered by brand + collection (not by size itself)
  const byCollection = filterCatalogProducts(products, { brand: criteria.brand, collection: criteria.collection });
  const sizes = [...new Set(byCollection.flatMap((p) => splitPipe(p.sizes)))];

  // Colors: filtered by brand + collection + size (not by color itself)
  const bySize = filterCatalogProducts(products, { brand: criteria.brand, collection: criteria.collection, size: criteria.size });
  const colors = [...new Set(bySize.flatMap((p) => splitPipe(p.taxonomy.color)))];

  return { brands, collections, sizes, colors };
}
