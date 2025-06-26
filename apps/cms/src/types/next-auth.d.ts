// apps/cms/src/types/next-auth.d.ts

import "next-auth";
import { DefaultSession } from "next-auth";
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
}

/* ------------------------------------------------------------------
 *  next-auth/jwt module augmentation
 * ---------------------------------------------------------------- */
declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
  }
}
