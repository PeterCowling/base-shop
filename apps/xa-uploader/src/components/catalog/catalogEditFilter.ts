// Import directly (not from the @acme/lib/xa barrel) to avoid pulling
// server-only packages (fast-csv, node:fs) into the client bundle.
import { type CatalogProductDraftInput, splitList } from "@acme/lib/xa/catalogAdminSchema";

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

function pipeContains(pipeValue: string | undefined, needle: string): boolean {
  return splitList(pipeValue ?? "").includes(needle);
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
  const sizes = [...new Set(byCollection.flatMap((p) => splitList(p.sizes ?? "")))];

  // Colors: filtered by brand + collection + size (not by color itself)
  const bySize = filterCatalogProducts(products, { brand: criteria.brand, collection: criteria.collection, size: criteria.size });
  const colors = [...new Set(bySize.flatMap((p) => splitList(p.taxonomy.color ?? "")))];

  return { brands, collections, sizes, colors };
}
