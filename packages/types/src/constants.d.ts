export const LOCALES = ["en", "de", "it"] as const;
export type Locale = (typeof LOCALES)[number];
export declare const ROLES: readonly ["admin", "viewer", "ShopAdmin", "CatalogManager", "ThemeEditor"];
export type Role = (typeof ROLES)[number];
