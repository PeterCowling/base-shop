// packages/auth/src/types/roles.ts

import { z } from "zod";

import rolesConfig from "../roles.json" with { type: "json" };

type RolesConfig = {
  write: readonly string[];
  read: readonly string[];
};

const config: RolesConfig = rolesConfig;

const allRolesFromConfig = [
  ...new Set([...config.write, ...config.read]),
] as const;

export type Role = (typeof allRolesFromConfig)[number];

export const WRITE_ROLES: Role[] = [...config.write];
export const READ_ROLES: Role[] = [...allRolesFromConfig];

let RoleSchema = z.enum(READ_ROLES as [Role, ...Role[]]);

export function isRole(role: unknown): role is Role {
  return RoleSchema.safeParse(role).success;
}

export function extendRoles(extension: Partial<RolesConfig>): void {
  if (extension.write) {
    for (const role of extension.write) {
      if (!WRITE_ROLES.includes(role as Role)) {
        WRITE_ROLES.push(role as Role);
      }
      if (!READ_ROLES.includes(role as Role)) {
        READ_ROLES.push(role as Role);
      }
    }
  }

  if (extension.read) {
    for (const role of extension.read) {
      if (!READ_ROLES.includes(role as Role)) {
        READ_ROLES.push(role as Role);
      }
    }
  }

  RoleSchema = z.enum(READ_ROLES as [Role, ...Role[]]);
}

export { RoleSchema };
