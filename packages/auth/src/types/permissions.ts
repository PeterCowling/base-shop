// packages/auth/src/types/permissions.ts

import permissionsConfig from "../permissions.json" with { type: "json" };
import { z } from "zod";

// Permissions configuration maps roles to their permissions
// We only care about the union of all unique permission strings

type PermissionsConfig = Record<string, readonly string[]>;

const config: PermissionsConfig = permissionsConfig;

const allPermissionsFromConfig = [
  ...new Set(Object.values(config).flat()),
] as const;

export type Permission = (typeof allPermissionsFromConfig)[number];

export const PERMISSIONS: Permission[] = [...allPermissionsFromConfig];

const PermissionSchema = z.enum(allPermissionsFromConfig as [Permission, ...Permission[]]);

export function isPermission(permission: unknown): permission is Permission {
  return PermissionSchema.safeParse(permission).success;
}

export { PermissionSchema };
