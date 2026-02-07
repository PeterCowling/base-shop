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
  BaseCloudflareEnv,
  D1Database,
  D1PreparedStatement,
} from "./types";

// Binding helper exports
export {
  type BusinessOsEnv,
  getBusinessOsDb,
  getD1FromGlobalThis,
  hasBusinessOsDb,
} from "./getBindings.server";
