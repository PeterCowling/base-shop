// packages/auth/src/requirePermission.ts
import { hasPermission } from "./permissions";
import { type CustomerSession,getCustomerSession } from "./session";
import type { Permission } from "./types/index";

export async function requirePermission(
  perm: Permission
): Promise<CustomerSession> {
  const session = await getCustomerSession();
  if (!session || !hasPermission(session.role, perm)) {
    throw new Error("Unauthorized");
  }
  return session;
}
