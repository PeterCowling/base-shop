/**
 * D1 Module Exports
 *
 * Server-only module for Cloudflare D1 database access.
 * Provides type definitions and binding helpers for Business OS.
 *
 * @packageDocumentation
 */

import "server-only";

// Type exports
export type {
  D1Database,
  D1PreparedStatement,
  BaseCloudflareEnv,
} from "./types";

// Binding helper exports
export {
  getBusinessOsDb,
  getD1FromGlobalThis,
  hasBusinessOsDb,
  type BusinessOsEnv,
} from "./getBindings.server";
