import { compare } from 'bcryptjs';

import { createFirebaseCustomToken } from '../lib/firebase-custom-token';
import { errorResponse, jsonResponse } from '../lib/firebase-rest';

interface Env {
  RATE_LIMIT?: KVNamespace;
  PRIME_STAFF_PIN_HASH?: string;
  PRIME_STAFF_AUTH_UID?: string;
  PRIME_STAFF_AUTH_ROLE?: string;
  PRIME_STAFF_LOCKOUT_MAX_ATTEMPTS?: string;
  PRIME_STAFF_LOCKOUT_WINDOW_SECONDS?: string;
  PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL?: string;
  PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY?: string;
}

interface StaffAuthSessionRequestBody {
  pin?: string;
}

interface StaffLockoutState {
  failedAttempts: number;
  lockedUntil: number | null;
  lastFailedAt: number | null;
}

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_LOCKOUT_WINDOW_SECONDS = 15 * 60;
const LOCKOUT_STATE_TTL_SECONDS = 60 * 60;
const STAFF_ROLE_PRIORITY = ['owner', 'admin', 'staff'] as const;

function getMaxAttempts(env: Env): number {
  const parsed = Number.parseInt(env.PRIME_STAFF_LOCKOUT_MAX_ATTEMPTS ?? '', 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return DEFAULT_MAX_ATTEMPTS;
}

function getLockoutWindowMs(env: Env): number {
  const parsed = Number.parseInt(env.PRIME_STAFF_LOCKOUT_WINDOW_SECONDS ?? '', 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed * 1000;
  }
  return DEFAULT_LOCKOUT_WINDOW_SECONDS * 1000;
}

function normalizeRole(role: string | undefined): (typeof STAFF_ROLE_PRIORITY)[number] {
  const normalizedRole = (role ?? 'staff').toLowerCase();
  if (STAFF_ROLE_PRIORITY.includes(normalizedRole as (typeof STAFF_ROLE_PRIORITY)[number])) {
    return normalizedRole as (typeof STAFF_ROLE_PRIORITY)[number];
  }
  return 'staff';
}

function getStaffUid(env: Env): string {
  return (env.PRIME_STAFF_AUTH_UID ?? 'prime_staff').trim() || 'prime_staff';
}

function getClientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP')?.trim() || 'unknown';
}

function getLockoutStateKey(clientIp: string): string {
  return `prime:staff-auth:lockout:${clientIp}`;
}

async function readLockoutState(env: Env, key: string): Promise<StaffLockoutState> {
  if (!env.RATE_LIMIT) {
    return {
      failedAttempts: 0,
      lockedUntil: null,
      lastFailedAt: null,
    };
  }

  const raw = await env.RATE_LIMIT.get(key);
  if (!raw) {
    return {
      failedAttempts: 0,
      lockedUntil: null,
      lastFailedAt: null,
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StaffLockoutState>;
    return {
      failedAttempts: Number.isFinite(parsed.failedAttempts) ? Number(parsed.failedAttempts) : 0,
      lockedUntil: Number.isFinite(parsed.lockedUntil) ? Number(parsed.lockedUntil) : null,
      lastFailedAt: Number.isFinite(parsed.lastFailedAt) ? Number(parsed.lastFailedAt) : null,
    };
  } catch {
    return {
      failedAttempts: 0,
      lockedUntil: null,
      lastFailedAt: null,
    };
  }
}

async function writeLockoutState(env: Env, key: string, state: StaffLockoutState): Promise<void> {
  if (!env.RATE_LIMIT) {
    return;
  }

  await env.RATE_LIMIT.put(key, JSON.stringify(state), {
    expirationTtl: LOCKOUT_STATE_TTL_SECONDS,
  });
}

async function clearLockoutState(env: Env, key: string): Promise<void> {
  if (!env.RATE_LIMIT) {
    return;
  }

  await env.RATE_LIMIT.delete(key);
}

function buildFailurePayload(
  error: string,
  state: StaffLockoutState,
  maxAttempts: number,
) {
  const attemptsRemaining = Math.max(0, maxAttempts - state.failedAttempts);
  return {
    error,
    failedAttempts: state.failedAttempts,
    attemptsRemaining,
    lockedUntil: state.lockedUntil,
  };
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.PRIME_STAFF_PIN_HASH) {
    return errorResponse('Staff auth is not configured (missing PRIME_STAFF_PIN_HASH)', 503);
  }
  if (!env.PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL || !env.PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    return errorResponse(
      'Staff auth is not configured (missing Firebase service account credentials)',
      503,
    );
  }

  let body: StaffAuthSessionRequestBody;
  try {
    body = await request.json() as StaffAuthSessionRequestBody;
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const pin = (body.pin ?? '').trim();
  if (!pin) {
    return errorResponse('PIN is required', 400);
  }

  const maxAttempts = getMaxAttempts(env);
  const lockoutWindowMs = getLockoutWindowMs(env);
  const now = Date.now();
  const lockoutKey = getLockoutStateKey(getClientIp(request));
  const existingState = await readLockoutState(env, lockoutKey);

  if (existingState.lockedUntil !== null && existingState.lockedUntil > now) {
    return jsonResponse(
      buildFailurePayload('Too many invalid PIN attempts. Try again later.', existingState, maxAttempts),
      429,
    );
  }

  const pinMatches = await compare(pin, env.PRIME_STAFF_PIN_HASH);
  if (!pinMatches) {
    const nextFailedAttempts = existingState.failedAttempts + 1;
    const shouldLock = nextFailedAttempts >= maxAttempts;
    const nextState: StaffLockoutState = {
      failedAttempts: nextFailedAttempts,
      lockedUntil: shouldLock ? now + lockoutWindowMs : null,
      lastFailedAt: now,
    };

    await writeLockoutState(env, lockoutKey, nextState);
    return jsonResponse(buildFailurePayload('Invalid PIN', nextState, maxAttempts), 401);
  }

  await clearLockoutState(env, lockoutKey);

  const role = normalizeRole(env.PRIME_STAFF_AUTH_ROLE);
  const uid = getStaffUid(env);
  const claims = {
    role,
    roles: [role],
    staff: true,
    hostelId: 'prime',
  };

  const customToken = await createFirebaseCustomToken(
    {
      uid,
      claims,
    },
    {
      serviceAccountEmail: env.PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL,
      serviceAccountPrivateKey: env.PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY,
      nowMs: now,
    },
  );

  return jsonResponse({
    customToken,
    uid,
    role,
    claims,
  });
};
