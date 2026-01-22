import { type CatalogProductDraftInput,slugify } from "../../lib/catalogAdminSchema";

export const EMPTY_TAXONOMY: CatalogProductDraftInput["taxonomy"] = {
  department: "women",
  category: "clothing",
  subcategory: "",
  color: "",
  material: "",
  fit: "",
  length: "",
  neckline: "",
  sleeveLength: "",
  pattern: "",
  occasion: "",
  sizeClass: "",
  strapStyle: "",
  hardwareColor: "",
  closureType: "",
  fits: "",
  metal: "",
  gemstone: "",
  jewelrySize: "",
  jewelryStyle: "",
  jewelryTier: "",
};

export const EMPTY_DETAILS: NonNullable<CatalogProductDraftInput["details"]> = {
  modelHeight: "",
  modelSize: "",
  fitNote: "",
  fabricFeel: "",
  care: "",
  dimensions: "",
  strapDrop: "",
  whatFits: "",
  interior: "",
  sizeGuide: "",
  warranty: "",
};

export const EMPTY_DRAFT: CatalogProductDraftInput = {
  title: "",
  slug: "",
  id: "",
  brandHandle: "",
  brandName: "",
  collectionHandle: "",
  collectionTitle: "",
  collectionDescription: "",
  price: "0",
  compareAtPrice: "",
  deposit: "0",
  stock: "0",
  forSale: true,
  forRental: false,
  sizes: "",
  description: "",
  createdAt: new Date().toISOString(),
  popularity: "0",
  imageFiles: "",
  imageAltTexts: "",
  taxonomy: { ...EMPTY_TAXONOMY },
  details: { ...EMPTY_DETAILS },
};

export function buildEmptyDraft(
  category: CatalogProductDraftInput["taxonomy"]["category"],
): CatalogProductDraftInput {
  return {
    ...EMPTY_DRAFT,
    createdAt: new Date().toISOString(),
    taxonomy: { ...EMPTY_TAXONOMY, category },
    details: { ...EMPTY_DETAILS },
  };
}

function setDefault<K extends keyof CatalogProductDraftInput>(
  target: CatalogProductDraftInput,
  key: K,
  fallback: CatalogProductDraftInput[K],
) {
  if (target[key] === undefined) {
    target[key] = fallback;
  }
}

export function withDraftDefaults(product: CatalogProductDraftInput): CatalogProductDraftInput {
  const merged = { ...EMPTY_DRAFT, ...product } as CatalogProductDraftInput;
  (Object.keys(EMPTY_DRAFT) as Array<keyof CatalogProductDraftInput>).forEach((key) => {
    setDefault(merged, key, EMPTY_DRAFT[key]);
  });

  const slug = slugify(merged.slug || merged.title);
  return {
    ...merged,
    slug,
    createdAt: merged.createdAt || EMPTY_DRAFT.createdAt,
    taxonomy: { ...EMPTY_TAXONOMY, ...(product.taxonomy ?? {}) },
    details: { ...EMPTY_DETAILS, ...(product.details ?? {}) },
  };
}
