// apps/cms/src/auth/roles.ts
export type Role =
  | "admin"
  | "viewer"
  | "ShopAdmin"
  | "CatalogManager"
  | "ThemeEditor";

/** Map of user.id to role(s). */
export const USER_ROLES: Record<string, Role | Role[]> = {
  "1": "admin",
  "2": "viewer",
  "3": "ShopAdmin",
  "4": "CatalogManager",
  "5": "ThemeEditor",
};
