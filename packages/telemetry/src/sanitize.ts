// packages/telemetry/src/sanitize.ts

/**
 * Allowlist of context keys that are safe to store.
 * This prevents PII (emails, names, passwords) from being logged.
 */
const ALLOWED_CONTEXT_KEYS = new Set([
  "app",
  "env",
  "requestId",
  "shopId",
  "url",
  "componentStack",
  "userId", // Note: will be hashed
  "sessionId", // Note: will be hashed
]);

/**
 * Sanitize context object to only include allowed keys.
 * Strips PII and truncates long strings.
 */
export function sanitizeContext(
  context?: Record<string, unknown>
): Record<string, unknown> {
  if (!context) return {};

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(context)) {
    if (ALLOWED_CONTEXT_KEYS.has(key)) {
      result[key] = sanitizeValue(key, value);
    }
  }

  return result;
}

/**
 * Sanitize individual values based on key type
 */
function sanitizeValue(key: string, value: unknown): unknown {
  // Truncate long strings
  if (typeof value === "string" && value.length > 1000) {
    return value.slice(0, 1000) + "...[truncated]";
  }

  // Hash sensitive IDs for privacy
  if ((key === "userId" || key === "sessionId") && typeof value === "string") {
    return hashValue(value);
  }

  return value;
}

/**
 * Simple hash for anonymizing IDs (not cryptographically secure)
 */
function hashValue(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `hash_${Math.abs(hash).toString(16)}`;
}
