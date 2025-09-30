export const LOCALES = ["en", "de", "it", "fr", "es", "ja", "ko"] as const;
export type Locale = (typeof LOCALES)[number];

export const ROLES = [
  "admin",
  "viewer",
  "ShopAdmin",
  "CatalogManager",
  "ThemeEditor",
] as const;
export type Role = (typeof ROLES)[number];
