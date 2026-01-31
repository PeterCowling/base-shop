/**
 * D1 Database Access for Business OS
 *
 * Server-only helper to access Cloudflare D1 database.
 *
 * Migration strategy (BOS-D1-05):
 * - Phase 1 (MVP): Return mock/stub for local dev, prepare infrastructure
 * - Phase 2: Full Cloudflare Pages integration with @cloudflare/next-on-pages
 *
 * Current approach: Stub implementation to enable code migration.
 * Actual D1 access will be implemented in BOS-D1-06 after write paths are migrated.
 *
 * @packageDocumentation
 */

import "server-only";

import type { D1Database } from "@acme/platform-core/d1";

/**
 * Get Business OS D1 database instance (STUB)
 *
 * TODO (BOS-D1-06): Implement actual D1 binding access via Cloudflare Pages context.
 * For now, returns a stub to enable code migration without breaking existing functionality.
 *
 * @returns D1Database instance (stub for migration)
 * @throws Error noting this is a migration stub
 *
 * @example
 * ```ts
 * // In page component (Edge runtime)
 * export const runtime = "edge";
 *
 * export default async function Page() {
 *   try {
 *     const db = getDb();
 *     const cards = await listCardsForBoard(db, { business: "BRIK" });
 *     return <div>{cards.length} cards</div>;
 *   } catch (e) {
 *     // Falls back to RepoReader during migration
 *   }
 * }
 * ```
 */
export function getDb(): D1Database {
  throw new Error(
    "D1 database access not yet implemented (BOS-D1-05 migration in progress). " +
    "Full D1 integration will be completed in BOS-D1-06. " +
    "For now, pages should fall back to RepoReader."
  );
}

/**
 * Check if D1 is available
 *
 * @returns false during migration (D1 not yet fully integrated)
 */
export function hasDb(): boolean {
  return false;
}
