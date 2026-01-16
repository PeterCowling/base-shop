/**
 * Role-based access utilities for Reception app.
 * Centralizes permission checks across the application.
 */

import type { User, UserRole } from "../types/domains/userDomain";

// Check if user has a specific role
export function hasRole(user: User | null, role: UserRole): boolean {
  if (!user) return false;
  return user.roles?.includes(role) ?? false;
}

// Check if user has any of the specified roles
export function hasAnyRole(user: User | null, roles: UserRole[]): boolean {
  if (!user) return false;
  const userRoles = user.roles ?? [];
  return roles.some((role) => userRoles.includes(role));
}

// Check if user has all of the specified roles
export function hasAllRoles(user: User | null, roles: UserRole[]): boolean {
  if (!user) return false;
  const userRoles = user.roles ?? [];
  return roles.every((role) => userRoles.includes(role));
}

// Check if user is owner or developer (privileged access)
export function isPrivileged(user: User | null): boolean {
  return hasAnyRole(user, ["owner", "developer"]);
}

// Check if user is an owner
export function isOwner(user: User | null): boolean {
  return hasRole(user, "owner");
}

// Check if user is a developer
export function isDeveloper(user: User | null): boolean {
  return hasRole(user, "developer");
}

// Check if user is staff (any authenticated user)
export function isStaff(user: User | null): boolean {
  return user !== null;
}

// Permission definitions for different features
export const Permissions = {
  // Till operations - owners and developers only
  TILL_ACCESS: ["owner", "developer"] as UserRole[],

  // Management dashboard - owners and developers only
  MANAGEMENT_ACCESS: ["owner", "developer"] as UserRole[],

  // Room allocation - owners, developers, and designated staff
  ROOM_ALLOCATION: ["owner", "developer"] as UserRole[],

  // Safe operations - all staff with PIN verification
  SAFE_ACCESS: ["owner", "developer", "staff"] as UserRole[],

  // Basic operations - all staff
  OPERATIONS_ACCESS: ["owner", "developer", "staff"] as UserRole[],

  // Real-time dashboard - owners and developers only
  REALTIME_DASHBOARD: ["owner", "developer"] as UserRole[],

  // Alloggiati - owners and developers only
  ALLOGGIATI_ACCESS: ["owner", "developer"] as UserRole[],

  // Stock management - owners and developers only
  STOCK_ACCESS: ["owner", "developer"] as UserRole[],

  // Statistics - owners and developers only
  STATISTICS_ACCESS: ["owner", "developer"] as UserRole[],

  // Bulk actions (cancel, email) - owners and developers only
  BULK_ACTIONS: ["owner", "developer"] as UserRole[],
} as const;

// Check if user can access a feature
export function canAccess(user: User | null, permission: UserRole[]): boolean {
  return hasAnyRole(user, permission);
}

// Get user's display name (for UI)
export function getUserDisplayName(user: User | null): string {
  if (!user) return "Guest";
  return user.displayName ?? user.user_name ?? user.email;
}

// Get user's primary role (highest privilege)
export function getPrimaryRole(user: User | null): UserRole | null {
  if (!user) return null;
  const userRoles = user.roles ?? [];
  if (userRoles.includes("owner")) return "owner";
  if (userRoles.includes("developer")) return "developer";
  if (userRoles.includes("staff")) return "staff";
  return null;
}
