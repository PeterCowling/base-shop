// apps/cms/src/auth/roles.ts
import { ROLES, type Role } from "@types";
export { ROLES };
export type { Role };

/** Map of user.id to role(s). */
export const USER_ROLES: Record<string, Role | Role[]> = {
  "1": "admin",
  "2": "viewer",
  "3": "ShopAdmin",
  "4": "CatalogManager",
  "5": "ThemeEditor",
};
