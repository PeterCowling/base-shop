// packages/auth/src/requirePermission.ts
import { getCustomerSession } from "./session.ts";
import { hasPermission } from "./permissions.ts";
import type { Permission } from "./types/index.ts";

export async function requirePermission(perm: Permission) {
  const session = await getCustomerSession();
  const role = session?.role;
  if (!role || !hasPermission(role, perm)) {
    throw new Error("Unauthorized");
  }
  return session;
}
