export type { Locale } from "@acme/i18n";

export const ROLES = [
  "admin",
  "viewer",
  "ShopAdmin",
  "CatalogManager",
  "ThemeEditor",
] as const;
export type Role = (typeof ROLES)[number];
