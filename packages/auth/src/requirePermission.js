// packages/auth/src/requirePermission.ts
import { getCustomerSession } from "./session.js";
import { hasPermission } from "./permissions.js";
export async function requirePermission(perm) {
    const session = await getCustomerSession();
    const role = session?.role;
    if (!role || !hasPermission(role, perm)) {
        throw new Error("Unauthorized");
    }
    return session;
}
