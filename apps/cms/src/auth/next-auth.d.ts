import "next-auth";
import "next-auth/adapters";
import "next-auth/jwt";

import { DefaultSession, DefaultUser } from "next-auth";

import type { Role } from "@acme/types";

export type { Role };

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: { role: Role; allowedShops?: string[] } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: Role;
    allowedShops?: string[];
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser extends DefaultUser {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    allowedShops?: string[];
  }
}
