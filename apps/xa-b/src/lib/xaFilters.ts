/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy filters data pending i18n overhaul */
import type { XaProduct } from "./demoData";
import type { XaCategory } from "./xaTypes";
import { formatLabel, getDesignerName } from "./xaCatalog";

export type SortKey =
  | "newest"
  | "price-asc"
  | "price-desc"
  | "best-sellers"
  | "biggest-discount";

export type FilterKey =
  | "designer"
  | "size"
  | "type"
  | "color"
  | "material"
  | "fit"
  | "length"
  | "neckline"
  | "sleeve"
  | "pattern"
  | "occasion"
  | "size-class"
  | "strap-style"
  | "hardware-color"
  | "closure-type"
  | "fits"
  | "metal"
  | "gemstone"
  | "jewelry-size"
  | "jewelry-style"
  | "jewelry-tier";

export const ALL_FILTER_KEYS: FilterKey[] = [
  "designer",
  "size",
  "type",
  "color",
  "material",
  "fit",
  "length",
  "neckline",
  "sleeve",
  "pattern",
  "occasion",
  "size-class",
  "strap-style",
  "hardware-color",
  "closure-type",
  "fits",
  "metal",
  "gemstone",
  "jewelry-size",
  "jewelry-style",
  "jewelry-tier",
];

export type FilterConfig = {
  key: FilterKey;
  label: string;
  accessor: (product: XaProduct) => string[];
  formatValue: (value: string) => string;
  sortValues?: (values: string[]) => string[];
};

const sizeOrder = ["XXS", "XS", "S", "M", "L", "XL", "XXL"];

const filterAccessors: Record<FilterKey, (product: XaProduct) => string[]> = {
  designer: (product) => [product.brand],
  size: (product) => product.sizes,
  type: (product) => [product.taxonomy.subcategory],
  color: (product) => product.taxonomy.color,
  material: (product) => product.taxonomy.material,
  fit: (product) => (product.taxonomy.fit ? [product.taxonomy.fit] : []),
  length: (product) => (product.taxonomy.length ? [product.taxonomy.length] : []),
  neckline: (product) => (product.taxonomy.neckline ? [product.taxonomy.neckline] : []),
  sleeve: (product) => (product.taxonomy.sleeveLength ? [product.taxonomy.sleeveLength] : []),
  pattern: (product) => (product.taxonomy.pattern ? [product.taxonomy.pattern] : []),
  occasion: (product) => product.taxonomy.occasion ?? [],
  "size-class": (product) => (product.taxonomy.sizeClass ? [product.taxonomy.sizeClass] : []),
  "strap-style": (product) => (product.taxonomy.strapStyle ? [product.taxonomy.strapStyle] : []),
  "hardware-color": (product) => (product.taxonomy.hardwareColor ? [product.taxonomy.hardwareColor] : []),
  "closure-type": (product) => (product.taxonomy.closureType ? [product.taxonomy.closureType] : []),
  fits: (product) => product.taxonomy.fits ?? [],
  metal: (product) => (product.taxonomy.metal ? [product.taxonomy.metal] : []),
  gemstone: (product) => (product.taxonomy.gemstone ? [product.taxonomy.gemstone] : []),
  "jewelry-size": (product) => (product.taxonomy.jewelrySize ? [product.taxonomy.jewelrySize] : []),
  "jewelry-style": (product) => (product.taxonomy.jewelryStyle ? [product.taxonomy.jewelryStyle] : []),
  "jewelry-tier": (product) => (product.taxonomy.jewelryTier ? [product.taxonomy.jewelryTier] : []),
};

const filterFormatters: Record<FilterKey, (value: string) => string> = {
  designer: getDesignerName,
  size: (value) => value,
  type: formatLabel,
  color: formatLabel,
  material: formatLabel,
  fit: formatLabel,
  length: formatLabel,
  neckline: formatLabel,
  sleeve: formatLabel,
  pattern: formatLabel,
  occasion: formatLabel,
  "size-class": formatLabel,
  "strap-style": formatLabel,
  "hardware-color": formatLabel,
  "closure-type": formatLabel,
  fits: formatLabel,
  metal: formatLabel,
  gemstone: formatLabel,
  "jewelry-size": formatLabel,
  "jewelry-style": formatLabel,
  "jewelry-tier": formatLabel,
};

const filterLabels: Record<FilterKey, string> = {
  designer: "Designer",
  size: "Size",
  type: "Category",
  color: "Color",
  material: "Material",
  fit: "Fit",
  length: "Length",
  neckline: "Neckline",
  sleeve: "Sleeve length",
  pattern: "Pattern",
  occasion: "Occasion",
  "size-class": "Size class",
  "strap-style": "Strap style",
  "hardware-color": "Hardware color",
  "closure-type": "Closure type",
  fits: "Fits",
  metal: "Metal",
  gemstone: "Gemstone",
  "jewelry-size": "Size",
  "jewelry-style": "Style",
  "jewelry-tier": "Tier",
};

const orderByCategory: Record<"clothing" | "bags" | "jewelry" | "all", FilterKey[]> = {
  clothing: [
    "size",
    "designer",
    "type",
    "color",
    "material",
    "fit",
    "length",
    "neckline",
    "sleeve",
    "pattern",
    "occasion",
  ],
  bags: [
    "designer",
    "type",
    "color",
    "material",
    "size-class",
    "strap-style",
    "hardware-color",
    "closure-type",
    "fits",
  ],
  jewelry: [
    "designer",
    "type",
    "color",
    "metal",
    "gemstone",
    "jewelry-size",
    "jewelry-style",
    "jewelry-tier",
  ],
  all: ["designer", "type", "color", "material"],
};

export function getFilterConfigs(
  category?: XaCategory,
  options?: { showType?: boolean },
): FilterConfig[] {
  const base = orderByCategory[category ?? "all"];
  return base
    .filter((key) => (key === "type" ? options?.showType !== false : true))
    .map((key) => {
      const label = key === "type"
        ? category === "bags"
          ? "Bag type"
          : category === "jewelry"
            ? "Type"
            : "Category"
        : filterLabels[key];
      const sortValues = key === "size"
        ? (values: string[]) => {
          return [...values].sort((a, b) => {
            const aIdx = sizeOrder.indexOf(a);
            const bIdx = sizeOrder.indexOf(b);
            if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
            if (aIdx >= 0) return -1;
            if (bIdx >= 0) return 1;
            return a.localeCompare(b);
          });
        }
        : undefined;
      return {
        key,
        label,
        accessor: filterAccessors[key],
        formatValue: filterFormatters[key],
        sortValues,
      };
    });
}

export function collectFacetValues(
  products: XaProduct[],
  configs: FilterConfig[],
): Record<FilterKey, string[]> {
  const facets = {} as Record<FilterKey, string[]>;
  for (const config of configs) {
    const values = new Set<string>();
    for (const product of products) {
      for (const value of config.accessor(product)) {
        if (value) values.add(value);
      }
    }
    const list = Array.from(values);
    facets[config.key] = config.sortValues ? config.sortValues(list) : list.sort();
  }
  return facets;
}
