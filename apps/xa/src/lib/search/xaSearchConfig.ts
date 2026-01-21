import type { XaProduct } from "../demoData";

export type XaSearchDoc = {
  id: string;
  title: string;
  brand: string;
  collection: string;
  taxonomy: string;
  sizes: string;
  description: string;
};

const TEXT_SEP = " ";

function join(values: Array<string | undefined | null> | undefined) {
  if (!values?.length) return "";
  return values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean)
    .join(TEXT_SEP);
}

function normalizeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function toXaSearchDoc(product: XaProduct): XaSearchDoc {
  const taxonomy = product.taxonomy;
  const taxonomyText = join([
    taxonomy.department,
    taxonomy.category,
    taxonomy.subcategory,
    join(taxonomy.color),
    join(taxonomy.material),
    taxonomy.fit,
    taxonomy.length,
    taxonomy.neckline,
    taxonomy.sleeveLength,
    taxonomy.pattern,
    join(taxonomy.occasion),
    taxonomy.sizeClass,
    taxonomy.strapStyle,
    taxonomy.hardwareColor,
    taxonomy.closureType,
    join(taxonomy.fits),
    taxonomy.metal,
    taxonomy.gemstone,
    taxonomy.jewelrySize,
    taxonomy.jewelryStyle,
    taxonomy.jewelryTier,
  ]);

  return {
    id: product.slug,
    title: normalizeText(product.title),
    brand: normalizeText(product.brand),
    collection: normalizeText(product.collection),
    taxonomy: normalizeText(taxonomyText),
    sizes: normalizeText(join(product.sizes)),
    description: normalizeText(product.description ?? ""),
  };
}

export const XA_MINISEARCH_FIELDS: Array<keyof XaSearchDoc> = [
  "title",
  "brand",
  "collection",
  "taxonomy",
  "sizes",
  "description",
];

export const XA_MINISEARCH_STORE_FIELDS: Array<keyof XaSearchDoc> = [];

export const XA_MINISEARCH_SEARCH_OPTIONS = {
  prefix: true,
  fuzzy: 0.2,
  boost: {
    title: 6,
    brand: 4,
    collection: 2,
    taxonomy: 2,
    description: 1,
    sizes: 0.5,
  },
} as const;

export function xaMiniSearchProcessTerm(term: string) {
  return normalizeText(term).toLowerCase();
}

