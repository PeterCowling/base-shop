/**
 * D1 Database Types
 *
 * Minimal type definitions for Cloudflare D1 database interface.
 * These types match the actual Cloudflare Workers D1 API but avoid
 * runtime dependencies on @cloudflare/workers-types.
 *
 * Pattern: product-pipeline src/routes/api/_lib/types.ts
 */

/**
 * D1 prepared statement interface
 *
 * Supports parameterized queries via bind() and multiple execution methods.
 */
export type D1PreparedStatement = {
  /** Bind parameters to the prepared statement */
  bind: (...args: unknown[]) => D1PreparedStatement;

  /** Execute and return all matching rows */
  all: <T = unknown>() => Promise<{ results?: T[]; success?: boolean; meta?: { duration?: number } }>;

  /** Execute and return first matching row (or null) */
  first: <T = unknown>() => Promise<T | null>;

  /** Execute statement (for INSERT/UPDATE/DELETE) */
  run: () => Promise<{ success?: boolean; meta?: { changes?: number; duration?: number } }>;
};

/**
 * D1 Database interface
 *
 * Main interface for interacting with Cloudflare D1 database.
 */
export type D1Database = {
  /** Prepare a SQL statement for execution */
  prepare: (query: string) => D1PreparedStatement;

  /** Execute multiple statements in a batch (transaction) */
  batch: (statements: D1PreparedStatement[]) => Promise<unknown[]>;

  /** Dump the database (debug/export use) */
  dump?: () => Promise<ArrayBuffer>;

  /** Execute raw SQL (admin use only, not recommended for app code) */
  exec?: (query: string) => Promise<{ count?: number; duration?: number }>;
};

/**
 * Cloudflare Pages/Workers environment bindings
 *
 * Extended by specific apps (e.g., BusinessOsEnv in business-os)
 */
export type BaseCloudflareEnv = {
  [key: string]: unknown;
};
