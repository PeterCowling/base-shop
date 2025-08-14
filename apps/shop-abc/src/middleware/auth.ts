import { NextResponse } from "next/server";
import { attempts, registrationAttempts, mfaAttempts, redis } from "./cache";
import { warn } from "./logger";

export const MAX_ATTEMPTS = 3;
export const MAX_REGISTRATION_ATTEMPTS = 3;
const LOCK_MS = 5 * 60 * 1000; // 5 minutes

const COUNT_PREFIX = "login:count:";
const LOCK_PREFIX = "login:lock:";
const REG_COUNT_PREFIX = "register:count:";
const REG_LOCK_PREFIX = "register:lock:";
const MFA_COUNT_PREFIX = "mfa:count:";
const MFA_LOCK_PREFIX = "mfa:lock:";

function key(ip: string, user: string) {
  return `${ip}:${user}`;
}

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
      warn("login", `locked out ${k}`);
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
      warn("login", `lockout ${k}`);
      return NextResponse.json(
        { error: "Too many login attempts. Try again later." },
        { status: 429 },
      );
    }

    return null;
  }

  const record = attempts.get(k) ?? { count: 0, lockedUntil: 0 };

  if (record.lockedUntil > now) {
    warn("login", `locked out ${k}`);
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
    warn("login", `lockout ${k}`);
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429 },
    );
  }

  attempts.set(k, record);
  return null;
}

export async function clearLoginAttempts(ip: string, user: string) {
  const k = key(ip, user);
  if (redis) {
    await redis.del(`${COUNT_PREFIX}${k}`, `${LOCK_PREFIX}${k}`);
  } else {
    attempts.delete(k);
  }
}

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

export async function checkMfaRateLimit(
  ip: string,
  user: string,
): Promise<NextResponse | null> {
  const k = key(ip, user);
  const now = Date.now();

  if (redis) {
    const lockKey = `${MFA_LOCK_PREFIX}${k}`;
    const countKey = `${MFA_COUNT_PREFIX}${k}`;

    const locked = await redis.exists(lockKey);
    if (locked) {
      warn("mfa", `locked out ${k}`);
      return NextResponse.json(
        { error: "Too many MFA attempts. Try again later." },
        { status: 429 },
      );
    }

    const count = await redis.incr(countKey);
    if (count === 1) {
      await redis.pexpire(countKey, LOCK_MS);
    }
    if (count > MAX_ATTEMPTS) {
      await redis.set(lockKey, "1", { px: LOCK_MS });
      warn("mfa", `lockout ${k}`);
      return NextResponse.json(
        { error: "Too many MFA attempts. Try again later." },
        { status: 429 },
      );
    }

    return null;
  }

  const record = mfaAttempts.get(k) ?? { count: 0, lockedUntil: 0 };

  if (record.lockedUntil > now) {
    warn("mfa", `locked out ${k}`);
    return NextResponse.json(
      { error: "Too many MFA attempts. Try again later." },
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
    mfaAttempts.set(k, record);
    warn("mfa", `lockout ${k}`);
    return NextResponse.json(
      { error: "Too many MFA attempts. Try again later." },
      { status: 429 },
    );
  }

  mfaAttempts.set(k, record);
  return null;
}

export async function clearMfaAttempts(ip: string, user: string) {
  const k = key(ip, user);
  if (redis) {
    await redis.del(`${MFA_COUNT_PREFIX}${k}`, `${MFA_LOCK_PREFIX}${k}`);
  } else {
    mfaAttempts.delete(k);
  }
}

export async function __resetMfaRateLimiter() {
  if (redis) {
    try {
      await redis.flushall();
    } catch {
      // ignore errors in tests; flushall may be restricted in shared instances
    }
  } else {
    mfaAttempts.clear();
  }
}

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
      warn("register", `locked out ${k}`);
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
      warn("register", `lockout ${k}`);
      return NextResponse.json(
        { error: "Too many registration attempts. Try again later." },
        { status: 429 },
      );
    }

    return null;
  }

  const record = registrationAttempts.get(k) ?? { count: 0, lockedUntil: 0 };

  if (record.lockedUntil > now) {
    warn("register", `locked out ${k}`);
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
    warn("register", `lockout ${k}`);
    return NextResponse.json(
      { error: "Too many registration attempts. Try again later." },
      { status: 429 },
    );
  }

  registrationAttempts.set(k, record);
  return null;
}

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
