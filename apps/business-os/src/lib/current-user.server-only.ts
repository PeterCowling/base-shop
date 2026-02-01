import "server-only";

import type { User } from "./current-user";
import { USERS } from "./current-user";

/**
 * Server-side helper to get current user (for API routes and server components).
 *
 * Phase 0 / D1 hosted path:
 * - Auth is disabled; do not depend on Node-only session libraries.
 * - Primary source of truth is the `current_user_id` cookie.
 */
export async function getCurrentUserServer(): Promise<User> {
  // Try to read from cookie (Next.js server components / route handlers)
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get("current_user_id");

    if (userIdCookie?.value && USERS[userIdCookie.value]) {
      return USERS[userIdCookie.value];
    }
  } catch {
    // Not in server component context, fall through
  }

  // Fall back to environment variable (dev) or Pete
  const userId = process.env.CURRENT_USER_ID || "pete";
  return USERS[userId] || USERS.pete;
}

