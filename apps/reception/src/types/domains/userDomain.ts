/* src/types/domains/userDomain.ts */

import { z } from "zod";

export const UserRoleSchema = z.enum(["admin", "manager", "staff", "viewer", "owner", "developer"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const userProfileSchema = z.object({
  uid: z.string(),
  email: z.string(),
  user_name: z.string(),
  displayName: z.string().optional(),
  roles: z.array(UserRoleSchema).optional(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

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
