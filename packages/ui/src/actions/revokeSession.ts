"use server";

import type { SessionRecord } from "@auth";
import { revalidatePath } from "next/cache";

export async function revoke(id: string) {
  const { getCustomerSession, listSessions, hasPermission, revokeSession } = await import("@auth");
  try {
    const session = await getCustomerSession();
    if (!session || !hasPermission(session.role, "manage_sessions")) {
      // i18n-exempt — server action error; surfaced via caller
      return { success: false, error: "Failed to revoke session." } as const;
    }
    const sessions: SessionRecord[] = await listSessions(session.customerId);
    if (!sessions.some((s) => s.sessionId === id)) {
      // i18n-exempt — server action error; surfaced via caller
      return { success: false, error: "Session does not belong to the user." } as const;
    }
    await revokeSession(id);
    revalidatePath("/account/sessions");
    return { success: true } as const;
  } catch {
    // i18n-exempt — server action error; surfaced via caller
    return { success: false, error: "Failed to revoke session." } as const;
  }
}
