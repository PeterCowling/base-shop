// apps/cms/src/auth/roles.ts
export type Role = "admin" | "viewer";

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
};
