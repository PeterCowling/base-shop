import type { Role } from "@acme/types";
import "next-auth";
import { DefaultSession, DefaultUser } from "next-auth";
import "next-auth/adapters";
import "next-auth/jwt";

export type { Role };

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: { role: Role } & DefaultSession["user"];
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

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
  }
}
