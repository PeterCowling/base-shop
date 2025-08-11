// apps/shop-abc/src/middleware.ts
import { NextResponse } from "next/server";

/** Track login attempts per IP + user */
interface Attempt {
  count: number;
  lockedUntil: number;
}

const attempts = new Map<string, Attempt>();

export const MAX_ATTEMPTS = 3;
const LOCK_MS = 5 * 60 * 1000; // 5 minutes

function key(ip: string, user: string) {
  return `${ip}:${user}`;
}

/**
 * Check rate limit for login attempts.
 * Returns a 429 response if the account is locked or limit exceeded.
 */
export function checkLoginRateLimit(ip: string, user: string) {
  const k = key(ip, user);
  const now = Date.now();
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
export function clearLoginAttempts(ip: string, user: string) {
  attempts.delete(key(ip, user));
}

/** Test helper to reset store */
export function __resetLoginRateLimiter() {
  attempts.clear();
}
