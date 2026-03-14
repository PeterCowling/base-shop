/**
 * Actor claims resolver for Prime CF Pages Functions.
 *
 * Verifies the `x-prime-actor-claims` HMAC-SHA256 signed header produced by Reception
 * and returns the verified actor identity, or a Response on failure.
 *
 * During the compat window (non-broadcast endpoints only):
 *   - If `x-prime-actor-claims` is present and valid → use it.
 *   - If `x-prime-actor-claims` is absent but `x-prime-actor-uid` is present
 *     → compat fallback: return `{uid: headerValue, roles: []}` (unverified).
 *   - If both headers are absent → compat fallback: return `{uid: 'prime-owner', roles: []}`.
 *
 * TODO: remove compat - TASK-07
 *
 * Broadcast endpoints MUST NOT use the compat fallback. Use `resolveActorClaims` (no compat)
 * for `staff-initiate-thread` and `review-campaign-send`. The compat fallback is only for
 * the 5 non-broadcast mutation endpoints during the rollout transition period.
 *
 * See: docs/plans/prime-outbound-auth-hardening/plan.md
 */

import { verifyActorClaims } from './actor-claims';

/** Minimum secret length enforced at request time. */
const MIN_SECRET_LENGTH = 32;

export interface ActorClaimsEnv {
  PRIME_ACTOR_CLAIMS_SECRET?: string;
}

export interface ResolvedActorClaims {
  uid: string;
  roles: string[];
}

/**
 * Resolve actor claims from a request. No compat fallback — for broadcast endpoints only.
 *
 * Returns `ResolvedActorClaims` on success, or a `Response` (401/503) on failure.
 * Broadcast endpoints must call this and gate on `roles` before proceeding.
 */
export async function resolveActorClaims(
  request: Request,
  env: ActorClaimsEnv,
): Promise<ResolvedActorClaims | Response> {
  const secret = env.PRIME_ACTOR_CLAIMS_SECRET?.trim();
  if (!secret) {
    console.error('[actor-claims-resolver] PRIME_ACTOR_CLAIMS_SECRET is not configured'); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return new Response(
      JSON.stringify({ success: false, error: 'claims-secret-not-configured' }), // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    console.error('[actor-claims-resolver] PRIME_ACTOR_CLAIMS_SECRET is too short (min 32 chars)'); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return new Response(
      JSON.stringify({ success: false, error: 'claims-secret-misconfigured' }), // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const claimsHeader = request.headers.get('x-prime-actor-claims');

  if (!claimsHeader) {
    // Broadcast endpoints reach here only — no compat fallback allowed.
    console.error('[actor-claims-resolver] Missing x-prime-actor-claims header (broadcast endpoint requires signed claims)'); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return new Response(
      JSON.stringify({ success: false, error: 'missing' }), // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const claims = await verifyActorClaims(claimsHeader, secret);
  if (!claims) {
    const isExpiredHint = claimsHeader.includes('.'); // heuristic — log both cases
    const reason = isExpiredHint ? 'invalid-sig-or-expired' : 'invalid-sig';
    console.error(`[actor-claims-resolver] HMAC verification failed: ${reason}`); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return new Response(
      JSON.stringify({ success: false, error: 'invalid-sig' }), // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return claims;
}

/**
 * Resolve actor claims with backward-compat fallback.
 * For non-broadcast endpoints only during the rollout transition period.
 *
 * TODO: remove compat - TASK-07
 *
 * Returns `ResolvedActorClaims` on success (verified or compat fallback),
 * or a `Response` (503) if the secret is misconfigured.
 */
export async function resolveActorClaimsWithCompat(
  request: Request,
  env: ActorClaimsEnv,
): Promise<ResolvedActorClaims | Response> {
  const secret = env.PRIME_ACTOR_CLAIMS_SECRET?.trim();
  if (!secret) {
    console.error('[actor-claims-resolver] PRIME_ACTOR_CLAIMS_SECRET is not configured'); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return new Response(
      JSON.stringify({ success: false, error: 'claims-secret-not-configured' }), // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    console.error('[actor-claims-resolver] PRIME_ACTOR_CLAIMS_SECRET is too short (min 32 chars)'); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return new Response(
      JSON.stringify({ success: false, error: 'claims-secret-misconfigured' }), // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const claimsHeader = request.headers.get('x-prime-actor-claims');

  if (claimsHeader) {
    // Signed claims present: verify and use them.
    const claims = await verifyActorClaims(claimsHeader, secret);
    if (!claims) {
      console.error('[actor-claims-resolver] HMAC verification failed: invalid-sig-or-expired'); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
      return new Response(
        JSON.stringify({ success: false, error: 'invalid-sig' }), // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }
    return claims;
  }

  // TODO: remove compat - TASK-07
  // Compat fallback: accept plain x-prime-actor-uid header (unverified).
  // Only used by non-broadcast endpoints during the rollout transition period.
  // Roles are empty because the unverified header carries no role information.
  const plainUid = request.headers.get('x-prime-actor-uid')?.trim() || 'prime-owner';
  return { uid: plainUid, roles: [] };
}

/**
 * Check whether a response is an actor-claims rejection (401/503) rather than
 * resolved claims. Use this to narrow the union type after resolveActorClaims.
 */
export function isActorClaimsResponse(
  result: ResolvedActorClaims | Response,
): result is Response {
  return result instanceof Response;
}
