// packages/auth/src/requirePermission.ts
import { getCustomerSession } from "./session";
import { hasPermission } from "./permissions";
import type { Permission } from "./types/index";

export async function requirePermission(perm: Permission) {
  const session = await getCustomerSession();
  const role = session?.role;
  if (!role || !hasPermission(role, perm)) {
    throw new Error("Unauthorized");
  }
  return session;
}
