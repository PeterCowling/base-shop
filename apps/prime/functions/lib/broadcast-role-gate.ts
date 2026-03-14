/**
 * Broadcast role gate for Prime CF Pages Functions.
 *
 * Broadcast operations (whole-hostel messages) require the actor to hold
 * the `owner` or `admin` role. This guard is applied AFTER actor claims
 * have been verified by `resolveActorClaims` / `resolveActorClaimsWithCompat`.
 *
 * Direct-message sends and non-broadcast mutations do NOT use this guard.
 *
 * Allowed roles: `owner`, `admin` (exact, case-sensitive, flat set — not hierarchical).
 */

import { errorResponse } from './firebase-rest';

/** Roles authorised to initiate or send broadcast messages. */
const BROADCAST_ALLOWED_ROLES: ReadonlySet<string> = new Set(['owner', 'admin']);

/**
 * Returns `true` when the given roles array contains at least one broadcast-authorised role.
 */
export function isBroadcastRoleAuthorized(roles: string[]): boolean {
  return roles.some((r) => BROADCAST_ALLOWED_ROLES.has(r));
}

/**
 * Returns a 403 Response if the actor is not broadcast-authorised, or `null` if authorised.
 *
 * Usage: call after `resolveActorClaims` has extracted `{uid, roles}`.
 *
 * @example
 * ```ts
 * const claimsResult = await resolveActorClaims(request, env);
 * if (isActorClaimsResponse(claimsResult)) return claimsResult;
 * const roleGate = enforceBroadcastRoleGate(claimsResult.roles, claimsResult.uid);
 * if (roleGate) return roleGate;
 * ```
 */
export function enforceBroadcastRoleGate(roles: string[], uid: string): Response | null {
  if (isBroadcastRoleAuthorized(roles)) {
    return null;
  }
  console.error( // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    `[broadcast-role-gate] Role check failed for uid=${uid}: roles=[${roles.join(',')}] do not include owner or admin`,
  );
  return errorResponse('Insufficient role for broadcast operation', 403); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
}
