// apps/cms/src/auth/roles.ts
export type Role =
  | "admin"
  | "viewer"
  | "ShopAdmin"
  | "CatalogManager"
  | "ThemeEditor";

export interface CmsUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

/** Phase-0 in-memory users (replace with DB in Phase-1). */
export const USERS: Record<string, CmsUser & { password: string }> = {
  admin: {
    id: "1",
    name: "Admin",
    email: "admin@example.com",
    password: "admin",
    role: "admin",
  },
  viewer: {
    id: "2",
    name: "Viewer",
    email: "viewer@example.com",
    password: "viewer",
    role: "viewer",
  },
  shopAdmin: {
    id: "3",
    name: "Shop Admin",
    email: "shopadmin@example.com",
    password: "shopadmin",
    role: "ShopAdmin",
  },
  catalogManager: {
    id: "4",
    name: "Catalog Manager",
    email: "catalogmanager@example.com",
    password: "catalogmanager",
    role: "CatalogManager",
  },
  themeEditor: {
    id: "5",
    name: "Theme Editor",
    email: "themeeditor@example.com",
    password: "themeeditor",
    role: "ThemeEditor",
  },
};
