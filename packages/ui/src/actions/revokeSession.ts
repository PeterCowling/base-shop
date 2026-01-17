"use server";

import type { SessionRecord } from "@acme/auth";
import { revalidatePath } from "next/cache";

export async function revoke(id: string) {
  const { getCustomerSession, listSessions, hasPermission, revokeSession } = await import("@acme/auth");
  try {
    const session = await getCustomerSession();
    if (!session || !hasPermission(session.role, "manage_sessions")) {
      // Return i18n key so UI can translate
      return { success: false, error: "account.sessions.errors.revokeFailed" } as const;
    }
    const sessions: SessionRecord[] = await listSessions(session.customerId);
    if (!sessions.some((s) => s.sessionId === id)) {
      // Not owned: i18n key consumed by client component
      return { success: false, error: "account.sessions.errors.notOwned" } as const;
    }
    await revokeSession(id);
    revalidatePath("/account/sessions");
    return { success: true } as const;
  } catch {
    // Generic failure: i18n key consumed by client component
    return { success: false, error: "account.sessions.errors.revokeFailed" } as const;
  }
}
