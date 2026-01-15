import type { XaCategory } from "./xaTypes";

export type XaCatalogStorefront = "xa-c" | "xa-b" | "xa-j";

export type XaCatalogStorefrontConfig = {
  id: XaCatalogStorefront;
  appDir: string;
  labelKey: "storefrontXAC" | "storefrontXAB" | "storefrontXAJ";
  defaultCategory: XaCategory;
};
