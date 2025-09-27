// apps/cms/src/auth/users.ts

import type { CmsUser } from "@acme/types";
export type { CmsUser } from "@acme/types";

/** Phase-0 in-memory users (replace with DB in Phase-1). */
export const USERS: Record<string, CmsUser> = {
  admin: {
    id: "1",
    name: "Admin", // i18n-exempt: dev-only mock user display name
    email: "admin@example.com", // i18n-exempt: test email seed
    //password: "admin",
    password: "admin", // i18n-exempt: dev-only seed password
  },
  viewer: {
    id: "2",
    name: "Viewer", // i18n-exempt: dev-only mock user display name
    email: "viewer@example.com", // i18n-exempt: test email seed
    //password: "viewer",
    password:
      "$argon2id$v=19$m=65536,t=3,p=4$EJTukba6cgu3oddf7NWibw$925GwzuYHM9wGz+R+j8TDed1jF1sllCqEOyQ63g5Iw4", // i18n-exempt: test hash fixture
  },
  shopAdmin: {
    id: "3",
    name: "Shop Admin", // i18n-exempt: dev-only mock user display name
    email: "shopadmin@example.com", // i18n-exempt: test email seed
    //password: "shopadmin",
    password:
      "$argon2id$v=19$m=65536,t=3,p=4$Qzzwz9iLHAK1XFp0gY8CaA$mRWqHTICaS4hB/E7TheLtyQjbmvzN2QKVuz0NnCKr+w", // i18n-exempt: test hash fixture
  },
  catalogManager: {
    id: "4",
    name: "Catalog Manager", // i18n-exempt: dev-only mock user display name
    email: "catalogmanager@example.com", // i18n-exempt: test email seed
    //password: "catalogmanager",
    password:
      "$argon2id$v=19$m=65536,t=3,p=4$1ie22pUv+lwFEJcQy15tHg$zJRHh2i3T5UpBpO0ffpDSnQbRpDwWh5bTqbCgLq22JE", // i18n-exempt: test hash fixture
  },
  themeEditor: {
    id: "5",
    name: "Theme Editor", // i18n-exempt: dev-only mock user display name
    email: "themeeditor@example.com", // i18n-exempt: test email seed
    //password: "themeeditor",
    password:
      "$argon2id$v=19$m=65536,t=3,p=4$XCickdgFmjP4faHZ2TCafA$x/vBXe/eGRdl3IgI1fNbb9RBXhOGpUGkJPsHbmV98Bw", // i18n-exempt: test hash fixture
  },
};
