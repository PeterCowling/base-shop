import type { SKU } from "@acme/types";
import { XA_PRODUCTS } from "./demoProducts";

export type Brand = { handle: string; name: string };
export type Collection = { handle: string; title: string };

const FEATURED_PRODUCT_IDS = new Set<string>(["green-sneaker", "sand-sneaker"]);

export function getFeaturedProducts(): SKU[] {
  return XA_PRODUCTS.filter((p) => FEATURED_PRODUCT_IDS.has(p.id)).slice();
}

export function getAllProducts(): SKU[] {
  return XA_PRODUCTS.slice();
}

export function getProductByHandle(handle: string): SKU | undefined {
  return XA_PRODUCTS.find((p) => p.slug === handle);
}

export function getSearchSuggestions(): string[] {
  return XA_PRODUCTS.map((p) => p.title ?? "").filter(Boolean);
}

export function estimateCompareAt(price: number | undefined): number | null {
  if (typeof price !== "number" || !Number.isFinite(price)) return null;
  return Math.round(price * 1.3);
}

export function productHref(product: Pick<SKU, "slug">): string {
  return `/products/${product.slug}`;
}

export const BRANDS: readonly Brand[] = [
  { handle: "eco-runner", name: "Eco Runner" },
];

export const COLLECTIONS: readonly Collection[] = [
  { handle: "all", title: "All Products" },
  { handle: "eco-runner", title: "Eco Runner" },
];
