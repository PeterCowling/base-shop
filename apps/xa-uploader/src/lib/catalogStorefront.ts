import type {
  XaCatalogStorefront,
  XaCatalogStorefrontConfig,
} from "./catalogStorefront.types";

export type { XaCatalogStorefront, XaCatalogStorefrontConfig };

export const DEFAULT_STOREFRONT: XaCatalogStorefront = "xa-b";

export const XA_CATALOG_STOREFRONTS: XaCatalogStorefrontConfig[] = [
  {
    id: "xa-b",
    appDir: "xa-b",
    labelKey: "storefrontXAB",
    defaultCategory: "bags",
  },
];

export function parseStorefront(value?: string | null): XaCatalogStorefront {
  if (value === "xa-b") return value;
  return DEFAULT_STOREFRONT;
}

export function getStorefrontConfig(value?: string | null): XaCatalogStorefrontConfig {
  const id = parseStorefront(value);
  return XA_CATALOG_STOREFRONTS.find((storefront) => storefront.id === id) ?? XA_CATALOG_STOREFRONTS[0];
}
