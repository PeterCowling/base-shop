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
 * Get current user from environment or default to Pete
 * Phase 0: Hardcoded to Pete
 * Phase 0.5+: Read from cookie or header
 */
export function getCurrentUser(): User {
  // Phase 0.5+: In development, allow switching users via env var
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
 * Server-side helper to get current user (for API routes and server components)
 */
export function getCurrentUserServer(): User {
  // Phase 0.5+: Could read from cookies/headers
  // For now, use environment variable
  return getCurrentUser();
}
