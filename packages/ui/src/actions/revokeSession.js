"use server";
// packages/ui/src/actions/revokeSession.ts
import { revalidatePath } from "next/cache";
export async function revoke(id) {
    const { getCustomerSession, listSessions, hasPermission, revokeSession } = await import("@auth");
    try {
        const session = await getCustomerSession();
        if (!session || !hasPermission(session.role, "manage_sessions")) {
            return { success: false, error: "Failed to revoke session." };
        }
        const sessions = await listSessions(session.customerId);
        if (!sessions.some((s) => s.sessionId === id)) {
            return { success: false, error: "Session does not belong to the user." };
        }
        await revokeSession(id);
        revalidatePath("/account/sessions");
        return { success: true };
    }
    catch {
        return { success: false, error: "Failed to revoke session." };
    }
}
