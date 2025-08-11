// apps/shop-abc/src/middleware.ts
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

/** Track login attempts per IP + user */
interface Attempt {
  count: number;
  lockedUntil: number;
}

// Fallback in-memory store used when Redis is not configured
const attempts = new Map<string, Attempt>();
const registrationAttempts = new Map<string, Attempt>();

// Redis client configured via environment variables. If the variables are not
// set we simply fall back to the in-memory `Map` above which is suitable for
// local development and unit tests.
let redis: Redis | null = null;
if (
  process.env.LOGIN_RATE_LIMIT_REDIS_URL &&
  process.env.LOGIN_RATE_LIMIT_REDIS_TOKEN
) {
  redis = new Redis({
    url: process.env.LOGIN_RATE_LIMIT_REDIS_URL,
    token: process.env.LOGIN_RATE_LIMIT_REDIS_TOKEN,
  });
} else if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  // Fall back to generic Upstash env vars if provided
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export const MAX_ATTEMPTS = 3;
export const MAX_REGISTRATION_ATTEMPTS = 3;
const LOCK_MS = 5 * 60 * 1000; // 5 minutes

const COUNT_PREFIX = "login:count:";
const LOCK_PREFIX = "login:lock:";
const REG_COUNT_PREFIX = "register:count:";
const REG_LOCK_PREFIX = "register:lock:";

function key(ip: string, user: string) {
  return `${ip}:${user}`;
}

/**
 * Check rate limit for login attempts.
 * Returns a 429 response if the account is locked or limit exceeded.
 */
export async function checkLoginRateLimit(
  ip: string,
  user: string,
): Promise<NextResponse | null> {
  const k = key(ip, user);
  const now = Date.now();

  if (redis) {
    const lockKey = `${LOCK_PREFIX}${k}`;
    const countKey = `${COUNT_PREFIX}${k}`;

    const locked = await redis.exists(lockKey);
    if (locked) {
      console.warn(`[login] locked out ${k}`);
      return NextResponse.json(
        { error: "Too many login attempts. Try again later." },
        { status: 429 },
      );
    }

    const count = await redis.incr(countKey);
    if (count === 1) {
      await redis.pexpire(countKey, LOCK_MS);
    }
    if (count > MAX_ATTEMPTS) {
      await redis.set(lockKey, "1", { px: LOCK_MS });
      console.warn(`[login] lockout ${k}`);
      return NextResponse.json(
        { error: "Too many login attempts. Try again later." },
        { status: 429 },
      );
    }

    return null;
  }

  const record = attempts.get(k) ?? { count: 0, lockedUntil: 0 };

  if (record.lockedUntil > now) {
    console.warn(`[login] locked out ${k}`);
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429 },
    );
  }

  if (record.lockedUntil && record.lockedUntil <= now) {
    record.count = 0;
    record.lockedUntil = 0;
  }

  record.count += 1;

  if (record.count > MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCK_MS;
    attempts.set(k, record);
    console.warn(`[login] lockout ${k}`);
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429 },
    );
  }

  attempts.set(k, record);
  return null;
}

/** Clear attempts after successful login */
export async function clearLoginAttempts(ip: string, user: string) {
  const k = key(ip, user);
  if (redis) {
    await redis.del(`${COUNT_PREFIX}${k}`, `${LOCK_PREFIX}${k}`);
  } else {
    attempts.delete(k);
  }
}

/** Test helper to reset store */
export async function __resetLoginRateLimiter() {
  if (redis) {
    try {
      await redis.flushall();
    } catch {
      // ignore errors in tests; flushall may be restricted in shared instances
    }
  } else {
    attempts.clear();
  }
}

/**
 * Check rate limit for registration attempts.
 * Returns a 429 response if the limit is exceeded.
 */
export async function checkRegistrationRateLimit(
  ip: string,
): Promise<NextResponse | null> {
  const k = ip;
  const now = Date.now();

  if (redis) {
    const lockKey = `${REG_LOCK_PREFIX}${k}`;
    const countKey = `${REG_COUNT_PREFIX}${k}`;

    const locked = await redis.exists(lockKey);
    if (locked) {
      console.warn(`[register] locked out ${k}`);
      return NextResponse.json(
        { error: "Too many registration attempts. Try again later." },
        { status: 429 },
      );
    }

    const count = await redis.incr(countKey);
    if (count === 1) {
      await redis.pexpire(countKey, LOCK_MS);
    }
    if (count > MAX_REGISTRATION_ATTEMPTS) {
      await redis.set(lockKey, "1", { px: LOCK_MS });
      console.warn(`[register] lockout ${k}`);
      return NextResponse.json(
        { error: "Too many registration attempts. Try again later." },
        { status: 429 },
      );
    }

    return null;
  }

  const record = registrationAttempts.get(k) ?? { count: 0, lockedUntil: 0 };

  if (record.lockedUntil > now) {
    console.warn(`[register] locked out ${k}`);
    return NextResponse.json(
      { error: "Too many registration attempts. Try again later." },
      { status: 429 },
    );
  }

  if (record.lockedUntil && record.lockedUntil <= now) {
    record.count = 0;
    record.lockedUntil = 0;
  }

  record.count += 1;

  if (record.count > MAX_REGISTRATION_ATTEMPTS) {
    record.lockedUntil = now + LOCK_MS;
    registrationAttempts.set(k, record);
    console.warn(`[register] lockout ${k}`);
    return NextResponse.json(
      { error: "Too many registration attempts. Try again later." },
      { status: 429 },
    );
  }

  registrationAttempts.set(k, record);
  return null;
}

/** Test helper to reset registration store */
export async function __resetRegistrationRateLimiter() {
  if (redis) {
    try {
      await redis.flushall();
    } catch {
      // ignore errors in tests; flushall may be restricted in shared instances
    }
  } else {
    registrationAttempts.clear();
  }
}
