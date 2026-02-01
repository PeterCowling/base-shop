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

  // Phase 0 fallback: default to Pete
  return USERS.pete;
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
