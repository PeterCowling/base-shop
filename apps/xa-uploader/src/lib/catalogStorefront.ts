import type {
  XaCatalogStorefront,
  XaCatalogStorefrontConfig,
} from "./catalogStorefront.types";

export type { XaCatalogStorefront, XaCatalogStorefrontConfig };

export const DEFAULT_STOREFRONT: XaCatalogStorefront = "xa-c";

export const XA_CATALOG_STOREFRONTS: XaCatalogStorefrontConfig[] = [
  {
    id: "xa-c",
    appDir: "xa",
    labelKey: "storefrontXAC",
    defaultCategory: "clothing",
  },
  {
    id: "xa-b",
    appDir: "xa-b",
    labelKey: "storefrontXAB",
    defaultCategory: "bags",
  },
  {
    id: "xa-j",
    appDir: "xa-j",
    labelKey: "storefrontXAJ",
    defaultCategory: "jewelry",
  },
];

export function parseStorefront(value?: string | null): XaCatalogStorefront {
  if (value === "xa-b" || value === "xa-j" || value === "xa-c") return value;
  return DEFAULT_STOREFRONT;
}

export function getStorefrontConfig(value?: string | null): XaCatalogStorefrontConfig {
  const id = parseStorefront(value);
  return XA_CATALOG_STOREFRONTS.find((storefront) => storefront.id === id) ?? XA_CATALOG_STOREFRONTS[0];
}
