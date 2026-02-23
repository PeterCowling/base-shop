import type { XaCategory } from "./xaTypes";

export type XaCatalogStorefront = "xa-b";

export type XaCatalogStorefrontConfig = {
  id: XaCatalogStorefront;
  appDir: string;
  labelKey: "storefrontXAC" | "storefrontXAB" | "storefrontXAJ";
  defaultCategory: XaCategory;
};
