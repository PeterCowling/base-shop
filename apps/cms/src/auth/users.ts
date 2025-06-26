// apps/cms/src/auth/users.ts

export interface CmsUser {
  id: string;
  name: string;
  email: string;
  password: string;
}

/** Phase-0 in-memory users (replace with DB in Phase-1). */
export const USERS: Record<string, CmsUser> = {
  admin: {
    id: "1",
    name: "Admin",
    email: "admin@example.com",
    password: "admin",
  },
  viewer: {
    id: "2",
    name: "Viewer",
    email: "viewer@example.com",
    password: "viewer",
  },
  shopAdmin: {
    id: "3",
    name: "Shop Admin",
    email: "shopadmin@example.com",
    password: "shopadmin",
  },
  catalogManager: {
    id: "4",
    name: "Catalog Manager",
    email: "catalogmanager@example.com",
    password: "catalogmanager",
  },
  themeEditor: {
    id: "5",
    name: "Theme Editor",
    email: "themeeditor@example.com",
    password: "themeeditor",
  },
};
