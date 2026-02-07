/* eslint-disable ds/no-raw-color -- XA-0001 [ttl=2026-12-31] XA theme palette uses raw swatches pending tokenization */
import type { XaProduct } from "./demoData";
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

export const XA_SUBCATEGORIES: Record<XaCategory, string[]> = {
  clothing: ["outerwear", "knitwear", "tops", "shirts"],
  bags: ["tote", "shoulder", "crossbody", "clutch", "backpack", "belt-bag", "bucket"],
  jewelry: ["necklaces", "bracelets", "earrings", "rings"],
};

export const XA_ALLOWED_CATEGORIES = siteConfig.catalog.categories;
export const XA_ALLOWED_DEPARTMENTS = siteConfig.catalog.departments;

export const XA_DEPARTMENTS: Array<{ slug: XaDepartment; label: string }> =
  XA_ALLOWED_DEPARTMENTS.map((slug) => ({
    slug,
    label: formatLabel(slug),
  }));

export const XA_COLOR_SWATCHES: Record<string, string> = {
  black: "#0f0f0f",
  ivory: "#f3f0e8",
  cream: "#f4efe4",
  camel: "#b88963",
  brown: "#7c5a41",
  navy: "#1f2a44",
  gold: "#d3b26a",
  graphite: "#3b3f46",
  tan: "#c08a58",
  charcoal: "#2b2d31",
  bone: "#efe9dd",
  silver: "#c9c9c9",
  indigo: "#2d3c5a",
  white: "#ffffff",
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

export function getDesignerName(handle: string): string {
  return XA_BRANDS.find((designer) => designer.handle === handle)?.name ??
    formatLabel(handle);
}

export function getTrendingDesigners(
  limit = 3,
  department?: XaDepartment,
): Array<{ handle: string; name: string }> {
  const source = department
    ? XA_PRODUCTS.filter((product) => product.taxonomy.department === department)
    : XA_PRODUCTS;
  const counts = new Map<string, number>();
  for (const product of source) {
    counts.set(product.brand, (counts.get(product.brand) ?? 0) + product.popularity);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([handle]) => ({ handle, name: getDesignerName(handle) }));
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
