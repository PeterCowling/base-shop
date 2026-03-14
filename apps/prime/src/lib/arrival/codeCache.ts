/**
 * codeCache.ts
 *
 * Utilities for caching check-in codes in localStorage for offline resilience.
 */

const CACHE_KEY_PREFIX = 'prime_checkin_code_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface CachedCode {
  code: string;
  cachedAt: number;
}

/**
 * Cache a check-in code in localStorage.
 */
export function cacheCheckInCode(code: string, uuid: string): void {
  const key = `${CACHE_KEY_PREFIX}${uuid}`;
  const entry: CachedCode = { code, cachedAt: Date.now() };
  localStorage.setItem(key, JSON.stringify(entry));
}

/**
 * Retrieve a cached check-in code from localStorage.
 * Returns null if the entry is absent or older than CACHE_TTL_MS (24 hours).
 */
export function getCachedCheckInCode(uuid: string): CachedCode | null {
  const key = `${CACHE_KEY_PREFIX}${uuid}`;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const entry = JSON.parse(raw) as CachedCode;
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

/**
 * Clear a cached check-in code from localStorage.
 */
export function clearCachedCheckInCode(uuid: string): void {
  localStorage.removeItem(`${CACHE_KEY_PREFIX}${uuid}`);
}
