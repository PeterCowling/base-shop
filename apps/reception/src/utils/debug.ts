// File: /src/utils/debug.ts
/**
 * Debug logging utilities.
 * Logs are only output when DEBUG_MODE is enabled.
 */

const DEBUG_MODE =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_DEBUG === "true";

/**
 * Log a debug message. Only outputs in development or when DEBUG is enabled.
 */
export function debugLog(...args: unknown[]): void {
  if (DEBUG_MODE) {
    console.log("[DEBUG]", ...args);
  }
}

/**
 * Log a debug warning. Only outputs in development or when DEBUG is enabled.
 */
export function debugWarn(...args: unknown[]): void {
  if (DEBUG_MODE) {
    console.warn("[DEBUG]", ...args);
  }
}

/**
 * Log a debug error. Always outputs (errors should be visible).
 */
export function debugError(...args: unknown[]): void {
  console.error("[ERROR]", ...args);
}

/**
 * Log with a custom prefix. Only outputs in development or when DEBUG is enabled.
 */
export function debugLogWithPrefix(prefix: string, ...args: unknown[]): void {
  if (DEBUG_MODE) {
    console.log(`[${prefix}]`, ...args);
  }
}

export { DEBUG_MODE };
