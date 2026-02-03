/**
 * D1 Binding Helpers
 *
 * Server-only helpers for accessing Cloudflare D1 database bindings.
 * These functions extract D1 bindings from Cloudflare runtime environment
 * and provide clear error messages when bindings are missing.
 *
 * Pattern: product-pipeline src/routes/api/_lib/db.ts + auth/src/store.ts
 *
 * @packageDocumentation
 */

import "server-only";

import type { D1Database } from "./types";

/**
 * Business OS environment bindings
 *
 * Expected bindings for Business OS app in Cloudflare runtime.
 */
export type BusinessOsEnv = {
  /** Business OS D1 database binding (configured in wrangler.toml) */
  BUSINESS_OS_DB?: D1Database;

  /** Session secret (for future auth) */
  SESSION_SECRET?: string;

  /** Auth enabled flag (for future auth) */
  BUSINESS_OS_AUTH_ENABLED?: string;

  [key: string]: unknown;
};

/**
 * Get Business OS D1 database from environment
 *
 * Extracts the BUSINESS_OS_DB binding from Cloudflare runtime environment.
 * Throws clear error if binding is missing (misconfigured wrangler.toml or
 * running outside Cloudflare runtime).
 *
 * @param env - Cloudflare environment object (from Pages function context)
 * @returns D1Database instance
 * @throws Error if BUSINESS_OS_DB binding is not configured
 *
 * @example
 * ```ts
 * // In Cloudflare Pages function
 * export const onRequestGet = async ({ env }) => {
 *   const db = getBusinessOsDb(env);
 *   const result = await db.prepare("SELECT * FROM business_os_cards").all();
 *   return new Response(JSON.stringify(result.results));
 * };
 * ```
 */
export function getBusinessOsDb(env: BusinessOsEnv): D1Database {
  if (!env.BUSINESS_OS_DB) {
    throw new Error(
      "BUSINESS_OS_DB binding missing. " +
      "Ensure wrangler.toml has [[d1_databases]] binding configured and " +
      "app is running in Cloudflare runtime (wrangler pages dev or deployed)."
    );
  }
  return env.BUSINESS_OS_DB;
}

/**
 * Get D1 database from globalThis (alternative pattern)
 *
 * Alternative binding access pattern via globalThis for cases where
 * env object is not available (e.g., middleware, background tasks).
 *
 * @param bindingName - Name of the D1 binding (default: "BUSINESS_OS_DB")
 * @returns D1Database instance or null if binding not found
 *
 * @example
 * ```ts
 * // In middleware or background task
 * const db = getD1FromGlobalThis("BUSINESS_OS_DB");
 * if (!db) {
 *   console.warn("D1 binding not available");
 *   return;
 * }
 * ```
 */
export function getD1FromGlobalThis(
  bindingName: string = "BUSINESS_OS_DB"
): D1Database | null {
  const binding = (globalThis as Record<string, unknown>)[bindingName] as
    | D1Database
    | undefined;
  return binding ?? null;
}

/**
 * Check if D1 binding is available
 *
 * Non-throwing check for D1 binding availability.
 * Useful for feature detection or fallback logic.
 *
 * @param env - Cloudflare environment object
 * @returns true if BUSINESS_OS_DB binding is configured
 *
 * @example
 * ```ts
 * if (hasBusinessOsDb(env)) {
 *   // Use D1-backed logic
 * } else {
 *   // Fall back to git-based logic (Phase 0 compatibility)
 * }
 * ```
 */
export function hasBusinessOsDb(env: BusinessOsEnv): boolean {
  return !!env.BUSINESS_OS_DB;
}
