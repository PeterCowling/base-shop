import type { XaBrand, XaProduct } from "./demoData";
import { XA_BRANDS, XA_PRODUCTS } from "./demoData";
import { siteConfig } from "./siteConfig";
import type { XaCategory, XaDepartment } from "./xaTypes";

export function formatLabel(value: string): string {
  return value
    .split(/[-_]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const XA_CATEGORY_LABELS: Record<XaCategory, string> = {
  clothing: "Clothing",
  bags: "Bags",
  jewelry: "Jewelry",
};

export const XA_DEPARTMENT_LABELS: Record<XaDepartment, string> = {
  women: "Iconic",
  men: "Everyday",
  kids: "Mini",
};

export const XA_SUBCATEGORIES: Record<XaCategory, string[]> = {
  clothing: ["outerwear", "knitwear", "tops", "shirts"],
  bags: [
    "birkin",
    "kelly",
    "constance",
    "lindy",
    "evelyne",
    "picotin",
    "garden-party",
    "herbag",
    "mini-kelly",
    "roulis",
    "verrou",
    "egee",
  ],
  jewelry: ["necklaces", "bracelets", "earrings", "rings"],
};

export const XA_ALLOWED_CATEGORIES = siteConfig.catalog.categories;
export const XA_ALLOWED_DEPARTMENTS = siteConfig.catalog.departments;

export const XA_DEPARTMENTS: Array<{ slug: XaDepartment; label: string }> =
  XA_ALLOWED_DEPARTMENTS.map((slug) => ({
    slug,
    label: formatLabel(slug),
  }));

export const XA_DEFAULT_SWATCH = "var(--xa-swatch-fallback)";
export const XA_FILTER_SWATCH_FALLBACK = "var(--xa-swatch-filter-fallback)";

export const XA_COLOR_SWATCHES: Record<string, string> = {
  black: "var(--xa-swatch-black)",
  ivory: "var(--xa-swatch-ivory)",
  cream: "var(--xa-swatch-cream)",
  camel: "var(--xa-swatch-camel)",
  brown: "var(--xa-swatch-brown)",
  navy: "var(--xa-swatch-navy)",
  gold: "var(--xa-swatch-gold)",
  graphite: "var(--xa-swatch-graphite)",
  tan: "var(--xa-swatch-tan)",
  charcoal: "var(--xa-swatch-charcoal)",
  bone: "var(--xa-swatch-bone)",
  silver: "var(--xa-swatch-silver)",
  indigo: "var(--xa-swatch-indigo)",
  white: "var(--xa-swatch-white)",
};

export function isCategoryAllowed(category: XaCategory): boolean {
  return XA_ALLOWED_CATEGORIES.includes(category);
}

export function isDepartmentAllowed(department: XaDepartment): boolean {
  return XA_ALLOWED_DEPARTMENTS.includes(department);
}

export function getCategoryHref(category: XaCategory, department?: XaDepartment): string {
  if (category === "clothing") {
    const base = department ?? siteConfig.catalog.defaultDepartment;
    return `/${base}/clothing`;
  }
  return `/${category}`;
}

export function getDepartmentCategoryHref(
  department: XaDepartment,
  category: XaCategory,
): string {
  return `/${department}/${category}`;
}

export function getDepartmentCategorySubcategoryHref(
  department: XaDepartment,
  category: XaCategory,
  subcategory?: string,
): string | null {
  const normalized = (subcategory ?? "").trim();
  if (!normalized) return null;
  if (!XA_SUBCATEGORIES[category].includes(normalized)) return null;
  return `/${department}/${category}/${normalized}`;
}

export function getDesignerName(handle: string, brands: XaBrand[] = XA_BRANDS): string {
  return brands.find((designer) => designer.handle === handle)?.name ??
    formatLabel(handle);
}

export function getTrendingDesigners(
  limit = 3,
  department?: XaDepartment,
  sourceData: { brands?: XaBrand[]; products?: XaProduct[] } = {},
): Array<{ handle: string; name: string }> {
  const brands = sourceData.brands ?? XA_BRANDS;
  const products = sourceData.products ?? XA_PRODUCTS;
  const filteredProducts = department
    ? products.filter((product) => product.taxonomy.department === department)
    : products;
  const counts = new Map<string, number>();
  for (const product of filteredProducts) {
    counts.set(product.brand, (counts.get(product.brand) ?? 0) + product.popularity);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([handle]) => ({ handle, name: getDesignerName(handle, brands) }));
}

export function filterByDepartment(products: XaProduct[], department?: XaDepartment) {
  if (!department) return products;
  return products.filter((product) => product.taxonomy.department === department);
}

export function filterByCategory(products: XaProduct[], category?: XaCategory) {
  if (!category) return products;
  return products.filter((product) => product.taxonomy.category === category);
}

export function filterBySubcategory(products: XaProduct[], subcategory?: string) {
  if (!subcategory) return products;
  return products.filter((product) => product.taxonomy.subcategory === subcategory);
}

export function getEffectivePrice(product: XaProduct, currency: string): number {
  return (product.prices as Record<string, number> | undefined)?.[currency] ?? product.price;
}

export function getNewInProducts(products: XaProduct[], limit: number): XaProduct[] {
  return [...products]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

type MediaItem = XaProduct["media"][number];
export function isProductImage(item: MediaItem): item is MediaItem & { type: "image" } {
  return item.type === "image" && item.url.trim().length > 0;
}
