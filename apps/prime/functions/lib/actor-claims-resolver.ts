/**
 * Actor claims resolver for Prime CF Pages Functions.
 *
 * Verifies the `x-prime-actor-claims` HMAC-SHA256 signed header produced by Reception
 * and returns the verified actor identity, or a Response on failure.
 *
 * All 8 mutation endpoints require signed claims — the compat window (plain
 * `x-prime-actor-uid` fallback) was removed in TASK-07. Missing or invalid claims
 * always return 401.
 *
 * - `resolveActorClaims` — for all 8 endpoints (broadcast and non-broadcast).
 * - `resolveActorClaimsWithCompat` — alias for `resolveActorClaims`; kept for
 *   backward compatibility with existing callers; compat fallback removed.
 *
 * See: docs/plans/prime-outbound-auth-hardening/plan.md
 */

import { verifyActorClaims } from './actor-claims';

/** Minimum secret length enforced at request time and at startup validation. */
const MIN_SECRET_LENGTH = 32;

export interface ActorClaimsEnv {
  PRIME_ACTOR_CLAIMS_SECRET?: string;
}

export interface ResolvedActorClaims {
  uid: string;
  roles: string[];
}

/**
 * Resolve actor claims from a request. Requires signed `x-prime-actor-claims` header.
 *
 * Returns `ResolvedActorClaims` on success, or a `Response` (401/503) on failure.
 * All mutation endpoints must call this; broadcast endpoints additionally gate on `roles`.
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
    console.error('[actor-claims-resolver] Missing x-prime-actor-claims header'); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
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
 * Alias for resolveActorClaims. The compat fallback (plain x-prime-actor-uid header)
 * was removed in TASK-07. All callers of this function now require signed claims.
 *
 * Kept as an alias to avoid a large rename refactor across callers; behavior is now
 * identical to resolveActorClaims.
 */
export async function resolveActorClaimsWithCompat(
  request: Request,
  env: ActorClaimsEnv,
): Promise<ResolvedActorClaims | Response> {
  return resolveActorClaims(request, env);
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

/**
 * Validate the Prime actor-claims secret configuration at deploy time.
 *
 * Call this at startup (e.g. in a health-check handler) to surface misconfiguration
 * before the first real request arrives. CF Pages Functions have no traditional startup
 * hook, so this is also called inline by `resolveActorClaims` (which returns 503 on
 * per-request failure). Use this helper for explicit startup-level checking.
 *
 * Rules:
 *  - `PRIME_ACTOR_CLAIMS_SECRET` must be present.
 *  - Must be at least 32 characters.
 *  - Must NOT be equal to `PRIME_STAFF_OWNER_GATE_TOKEN` (secret independence).
 *
 * In non-production environments the function warns via `console.warn` rather than
 * throwing, to allow test environments with minimal configuration to proceed.
 *
 * @param env - Object containing the relevant env vars.
 * @param isProduction - When true, throws on misconfiguration; when false, only warns.
 * @returns `{ valid: true }` if config is valid; `{ valid: false, reason: string }` if not.
 */
export interface ActorClaimsConfigValidation {
  valid: boolean;
  reason?: string;
}

export interface ActorClaimsConfigEnv extends ActorClaimsEnv {
  PRIME_STAFF_OWNER_GATE_TOKEN?: string;
  NODE_ENV?: string;
}

export function validatePrimeActorClaimsConfig(
  env: ActorClaimsConfigEnv,
  isProduction?: boolean,
): ActorClaimsConfigValidation {
  const secret = env.PRIME_ACTOR_CLAIMS_SECRET?.trim();
  const gatewayToken = env.PRIME_STAFF_OWNER_GATE_TOKEN?.trim();
  const isProd = isProduction ?? env.NODE_ENV === 'production';

  if (!secret) {
    const msg = '[actor-claims-config] PRIME_ACTOR_CLAIMS_SECRET is not set — actor claims will be rejected at request time (503)'; // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    if (isProd) {
      throw new Error(msg);
    }
    console.warn(msg);
    return { valid: false, reason: 'missing' };
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    const msg = `[actor-claims-config] PRIME_ACTOR_CLAIMS_SECRET is too short (${secret.length} chars; minimum is ${MIN_SECRET_LENGTH})`; // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    if (isProd) {
      throw new Error(msg);
    }
    console.warn(msg);
    return { valid: false, reason: 'too-short' };
  }

  if (gatewayToken && secret === gatewayToken) {
    const msg = '[actor-claims-config] PRIME_ACTOR_CLAIMS_SECRET must not equal PRIME_STAFF_OWNER_GATE_TOKEN — use a distinct secret for actor claims'; // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    if (isProd) {
      throw new Error(msg);
    }
    console.warn(msg);
    return { valid: false, reason: 'same-as-gateway-token' };
  }

  return { valid: true };
}
