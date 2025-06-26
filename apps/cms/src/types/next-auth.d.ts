// apps/cms/src/types/next-auth.d.ts

import "next-auth";
import { DefaultSession, DefaultUser } from "next-auth";
import "next-auth/adapters";
import "next-auth/jwt";

/* ------------------------------------------------------------------
 *  Shared role definition
 * ---------------------------------------------------------------- */
export type Role =
  | "admin"
  | "viewer"
  | "ShopAdmin"
  | "CatalogManager"
  | "ThemeEditor";

/* ------------------------------------------------------------------
 *  next-auth module augmentation
 * ---------------------------------------------------------------- */
declare module "next-auth" {
  /** Shape of `session` sent to the client */
  interface Session extends DefaultSession {
    user: {
      role: Role;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: Role;
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser extends DefaultUser {
    role: Role;
  }
}

/* ------------------------------------------------------------------
 *  next-auth/jwt module augmentation
 * ---------------------------------------------------------------- */
declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
  }
}
