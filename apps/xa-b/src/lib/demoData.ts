import mediaIndex from "../data/catalog.media.runtime.json";
import catalog from "../data/catalog.runtime.json";

import { parseXaCatalogModel, type XaBrand, type XaCollection, type XaProduct } from "./xaCatalogModel";

export type { XaBrand, XaCollection, XaProduct } from "./xaCatalogModel";

const parsedCatalog = parseXaCatalogModel(catalog, mediaIndex);
if (!parsedCatalog) {
  throw new Error("[xa-demo-data] bundled catalog.runtime payload is invalid");
}

export const XA_COLLECTIONS: XaCollection[] = parsedCatalog.collections;
export const XA_BRANDS: XaBrand[] = parsedCatalog.brands;
export const XA_PRODUCTS: XaProduct[] = parsedCatalog.products;

export function getXaProductByHandle(handle: string): XaProduct | null {
  return XA_PRODUCTS.find((p) => p.slug === handle) ?? null;
}
