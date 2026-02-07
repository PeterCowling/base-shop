/**
 * D1 Database Access for Business OS
 *
 * Server-only helper to access Cloudflare D1 database.
 *
 * Uses @opennextjs/cloudflare context to access D1 bindings in Edge runtime.
 * For local development, use wrangler with D1 bindings configured.
 *
 * @packageDocumentation
 */

import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import type { D1Database } from "@acme/platform-core/d1";

declare global {
  interface CloudflareEnv {
    BUSINESS_OS_DB?: D1Database;
  }
}

/**
 * Get Business OS D1 database instance
 *
 * Accesses the D1 binding from Cloudflare Pages request context.
 * Only works in Edge runtime during an active request.
 *
 * @returns D1Database instance from Cloudflare binding
 * @throws Error if binding is not available or not in request context
 *
 * @example
 * ```ts
 * // In page component (Edge runtime required)
 * export const runtime = "edge";
 *
 * export default async function Page() {
 *   const db = getDb();
 *   const cards = await listCardsForBoard(db, { business: "BRIK" });
 *   return <div>{cards.length} cards</div>;
 * }
 * ```
 */
export function getDb(): D1Database {
  const { env } = getCloudflareContext();

  if (!env.BUSINESS_OS_DB) {
    const missingBindingError =
      "BUSINESS_OS_DB binding not found in Cloudflare environment. Ensure wrangler.toml has [[d1_databases]] with binding = 'BUSINESS_OS_DB' and the binding is configured in Cloudflare Pages settings."; // i18n-exempt -- BOS-04 developer-only config guard [ttl=2026-03-31]
    throw new Error(missingBindingError);
  }

  return env.BUSINESS_OS_DB;
}

/**
 * Check if D1 is available in current context
 *
 * @returns true if D1 binding is accessible, false otherwise
 */
export function hasDb(): boolean {
  try {
    const { env } = getCloudflareContext();
    return !!env.BUSINESS_OS_DB;
  } catch {
    return false;
  }
}
