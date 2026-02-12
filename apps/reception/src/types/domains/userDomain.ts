/* src/types/domains/userDomain.ts */

import { z } from "zod";

export const UserRoleSchema = z.enum(["admin", "manager", "staff", "viewer", "owner", "developer"]);
export type UserRole = z.infer<typeof UserRoleSchema>;
const USER_ROLE_VALUES = new Set<UserRole>(UserRoleSchema.options);

const userRolesSchema = z
  .union([
    z.array(UserRoleSchema),
    z.record(z.string(), z.union([z.boolean(), UserRoleSchema])),
  ])
  .optional();

export const userProfileSchema = z.object({
  uid: z.string(),
  email: z.string(),
  user_name: z.string(),
  displayName: z.string().optional(),
  roles: userRolesSchema,
});

export type RawUserProfile = z.infer<typeof userProfileSchema>;

export function normalizeRoles(rawRoles: RawUserProfile["roles"]): UserRole[] | undefined {
  if (rawRoles === undefined) {
    return undefined;
  }

  const normalized = new Set<UserRole>();

  if (Array.isArray(rawRoles)) {
    for (const role of rawRoles) {
      if (USER_ROLE_VALUES.has(role)) {
        normalized.add(role);
      }
    }
    return Array.from(normalized);
  }

  for (const [key, value] of Object.entries(rawRoles)) {
    if (value === true && USER_ROLE_VALUES.has(key as UserRole)) {
      normalized.add(key as UserRole);
      continue;
    }

    if (typeof value === "string" && USER_ROLE_VALUES.has(value as UserRole)) {
      normalized.add(value as UserRole);
    }
  }

  return Array.from(normalized);
}

export type UserProfile = {
  uid: string;
  email: string;
  user_name: string;
  displayName?: string;
  roles?: UserRole[];
};

// Legacy schema for backwards compatibility
export const userSchema = z.object({
  email: z.string(),
  user_name: z.string(),
});

export type User = z.infer<typeof userSchema> & {
  uid?: string;
  displayName?: string;
  roles?: UserRole[];
};

export const usersRecordSchema = z.record(userSchema);

// Device PIN type for PIN-based authentication
export type DevicePin = {
  uid: string;
  pinHash: string;
  createdAt: number;
};
