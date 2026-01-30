/**
 * Current User Management
 * Phase 0+: Simple user identification (no authentication)
 *
 * In Phase 0, this is Pete-only. In Phase 0.5+, we support multiple users
 * with simple identification (no login required for local development).
 */

export interface User {
  /** User identifier */
  id: string;
  /** Display name */
  name: string;
  /** Email */
  email: string;
  /** User role */
  role: "admin" | "user";
}

/**
 * Predefined users
 */
export const USERS: Record<string, User> = {
  pete: {
    id: "pete",
    name: "Pete", // i18n-exempt -- BOS-04 [ttl=2026-03-01] User name identifier
    email: "pete@business-os.local",
    role: "admin",
  },
  cristiana: {
    id: "cristiana",
    name: "Cristiana", // i18n-exempt -- BOS-04 [ttl=2026-03-01] User name identifier
    email: "cristiana@business-os.local",
    role: "admin",
  },
  avery: {
    id: "avery",
    name: "Avery", // i18n-exempt -- BOS-04 [ttl=2026-03-01] User name identifier
    email: "avery@business-os.local",
    role: "user",
  },
} as const;

/**
 * Admin users who can see all archived cards
 */
export const ADMIN_USERS = ["pete", "cristiana"];

/**
 * Get current user from cookie, environment, or default to Pete
 * Phase 0: Hardcoded to Pete
 * Phase 0.5+: Read from cookie or header
 */
export function getCurrentUser(): User {
  // Try to get from cookie first (client-side only)
  if (typeof window !== "undefined") {
    const cookies = document.cookie.split(";");
    // i18n-exempt -- BOS-02: Cookie name constant [ttl=2026-03-31]
    const userCookie = cookies.find((c) => c.trim().startsWith("current_user_id="));
    if (userCookie) {
      const userId = userCookie.split("=")[1];
      if (USERS[userId]) {
        return USERS[userId];
      }
    }
  }

  // Fall back to environment variable (server-side or dev)
  const userId = process.env.CURRENT_USER_ID || "pete";

  return USERS[userId] || USERS.pete;
}

/**
 * Check if user can view all archived cards
 */
export function canViewAllArchived(user: User): boolean {
  return ADMIN_USERS.includes(user.id);
}

/**
 * Check if user can edit a card
 * Returns true if:
 * - User is the card owner, OR
 * - User is an admin (can edit any card)
 */
export function canEditCard(user: User, card: { Owner?: string }): boolean {
  // Admins can edit any card
  if (ADMIN_USERS.includes(user.id)) {
    return true;
  }

  // User can edit if they own the card
  return card.Owner === user.name;
}

/**
 * Server-side helper to get current user (for API routes and server components)
 *
 * Priority order when BUSINESS_OS_AUTH_ENABLED=true:
 * 1. Iron session (authenticated user)
 * 2. Fall back to CURRENT_USER_ID env var (dev mode)
 *
 * Priority order when auth disabled:
 * 1. current_user_id cookie
 * 2. CURRENT_USER_ID env var
 */
export async function getCurrentUserServer(): Promise<User> {
  const authEnabled = process.env.BUSINESS_OS_AUTH_ENABLED === "true";

  // When auth is enabled, check iron session first
  if (authEnabled) {
    try {
      // Dynamically import to avoid circular dependencies
      const { getAuthenticatedUserFromHeaders } = await import("./auth");
      const user = await getAuthenticatedUserFromHeaders();

      if (user) {
        return user;
      }

      // If no session user, fall back to env var for dev mode
      // (This allows testing without login when auth is enabled)
      const userId = process.env.CURRENT_USER_ID;
      if (userId && USERS[userId]) {
        return USERS[userId];
      }

      // No authenticated user and no env fallback - return Pete as safe default
      // (Middleware should have already redirected unauthenticated users to /login)
      return USERS.pete;
    } catch (error) {
      // If auth check fails, fall through to legacy behavior
      console.error("Failed to get authenticated user:", error);
    }
  }

  // Legacy behavior (auth disabled or auth check failed)
  // Try to read from cookie (Next.js server components)
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

  // Fall back to environment variable
  const userId = process.env.CURRENT_USER_ID || "pete";
  return USERS[userId] || USERS.pete;
}
