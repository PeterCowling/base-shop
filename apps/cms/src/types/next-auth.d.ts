// apps/cms/src/types/next-auth.d.ts

import "next-auth";
import { DefaultSession, DefaultUser } from "next-auth";
import "next-auth/jwt";

/* ------------------------------------------------------------------
 *  Shared role definition
 * ---------------------------------------------------------------- */
export type Role = "admin" | "viewer";

/* ------------------------------------------------------------------
 *  next-auth module augmentation
 * ---------------------------------------------------------------- */
declare module "next-auth" {
  /** The object returned from `authorize()` and stored in the DB/JWT */
  interface User extends DefaultUser {
    role: Role;
  }

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
