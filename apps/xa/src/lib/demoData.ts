import type { SKU } from "@acme/types";

import catalog from "../data/catalog.json";
import { buildXaImageUrl } from "./xaImages";
import type { XaProductDetails, XaProductTaxonomy } from "./xaTypes";

export type XaProduct = SKU & {
  brand: string;
  collection: string;
  compareAtPrice?: number;
  createdAt: string;
  popularity: number;
  variantGroup?: string;
  taxonomy: XaProductTaxonomy;
  details?: XaProductDetails;
};

type XaMediaSeed = Omit<SKU["media"][number], "url"> & {
  // Cloudflare Images id (optionally with "/variant").
  path: string;
};

type XaProductSeed = Omit<XaProduct, "media"> & { media: XaMediaSeed[] };

type XaCatalogSeed = {
  collections: Array<{ handle: string; title: string; description?: string }>;
  brands: Array<{ handle: string; name: string }>;
  products: XaProductSeed[];
};

const xaCatalog = catalog as XaCatalogSeed;

function toMediaItem(item: XaMediaSeed, fallbackAlt: string): SKU["media"][number] {
  return {
    type: item.type,
    url: buildXaImageUrl(item.path),
    title: item.title,
    altText: item.altText ?? fallbackAlt,
  };
}

export const XA_COLLECTIONS = xaCatalog.collections;
export const XA_BRANDS = xaCatalog.brands;
export const XA_PRODUCTS: XaProduct[] = xaCatalog.products.map((product) => ({
  ...product,
  media: product.media.map((item) => toMediaItem(item, product.title)),
}));

export function getXaProductByHandle(handle: string): XaProduct | null {
  return XA_PRODUCTS.find((p) => p.slug === handle) ?? null;
}
