/**
 * Permissions Module
 * MVP-B2: Server-side authorization on all mutations
 *
 * Centralized permission checks for all mutation operations.
 * Extends the pattern from canEditCard() in current-user.ts to ideas and other entities.
 */

import { ADMIN_USERS, type User } from "./current-user";

/**
 * Check if user can create an idea
 * Any authenticated user can create ideas
 */
export function canCreateIdea(user: User): boolean {
  return !!user;
}

/**
 * Check if user can create a card
 * Any authenticated user can create cards
 */
export function canCreateCard(user: User): boolean {
  return !!user;
}

/**
 * Check if user can edit a card
 * Returns true if:
 * - User is an admin (can edit any card), OR
 * - User is the card owner
 */
export function canEditCard(
  user: User,
  card: { Owner?: string }
): boolean {
  // Admins can edit any card
  if (ADMIN_USERS.includes(user.id)) {
    return true;
  }

  // User can edit if they own the card
  return card.Owner === user.name;
}

/**
 * Check if user can edit an idea
 * Returns true if:
 * - User is an admin (can edit any idea), OR
 * - User is the idea owner
 */
export function canEditIdea(
  user: User,
  idea: { Owner?: string }
): boolean {
  // Admins can edit any idea
  if (ADMIN_USERS.includes(user.id)) {
    return true;
  }

  // User can edit if they own the idea
  return idea.Owner === user.name;
}
