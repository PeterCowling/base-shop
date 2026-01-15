// Only expose the locales that have first-class translation support.
// Additional languages can be added once their translations are available.
export const LOCALES = ["en", "de", "it", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const ROLES = [
  "admin",
  "viewer",
  "ShopAdmin",
  "CatalogManager",
  "ThemeEditor",
] as const;
export type Role = (typeof ROLES)[number];
