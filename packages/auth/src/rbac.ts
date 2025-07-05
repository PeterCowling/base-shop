// packages/auth/src/rbac.ts

import type { Role } from "./types/roles";

export const WRITE_ROLES: Role[] = [
  "admin",
  "ShopAdmin",
  "CatalogManager",
  "ThemeEditor",
];

export const READ_ROLES: Role[] = [...WRITE_ROLES, "viewer"];

export function canWrite(role?: Role | null): boolean {
  return role ? WRITE_ROLES.includes(role) : false;
}

export function canRead(role?: Role | null): boolean {
  return role ? READ_ROLES.includes(role) : false;
}

export type { Role };
