// apps/cms/src/auth/users.ts

export interface CmsUser {
  id: string;
  name: string;
  email: string;
  /** bcrypt hashed password */
  password: string;
}

/** Phase-0 in-memory users (replace with DB in Phase-1). */
export const USERS: Record<string, CmsUser> = {
  admin: {
    id: "1",
    name: "Admin",
    email: "admin@example.com",
    //password: "admin",
    password: "admin", // NOTE: stored in plain text
  },
  viewer: {
    id: "2",
    name: "Viewer",
    email: "viewer@example.com",
    //password: "viewer",
    password: "$2b$10$zrw7b.7IguK2cWtM83jgKOKe0YiM6BTzGI.S60J1nlanjPw7G5dt6",
  },
  shopAdmin: {
    id: "3",
    name: "Shop Admin",
    email: "shopadmin@example.com",
    //password: "shopadmin",
    password: "$2b$10$iiBPVdzX6hr0R.9eOSN36uhBqt0iOIj6ecZlPA.NBpzswomxcTvfi",
  },
  catalogManager: {
    id: "4",
    name: "Catalog Manager",
    email: "catalogmanager@example.com",
    //password: "catalogmanager",
    password: "$2b$10$bXz7QTWvPrn7okbbk58uDOJKBPJfPU6RI8F5HV4M5DnBFwSIbXi/y",
  },
  themeEditor: {
    id: "5",
    name: "Theme Editor",
    email: "themeeditor@example.com",
    //password: "themeeditor",
    password: "$2b$10$XCLdGULFzVh56kw/oRP2husM07I1fPe0NqjIUxk9d2/PZBTwVIruK",
  },
};
