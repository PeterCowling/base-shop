/**
 * Business OS Audit Log Repository
 *
 * D1-backed repository for Business OS audit log (mutation tracking).
 * Provides append-only audit trail for all entity changes.
 *
 * Pattern: apps/product-pipeline/src/routes/api/_lib/db.ts
 *
 * @packageDocumentation
 */

import "server-only";

import { z } from "zod";

import type { D1Database } from "../d1/types";

// ============================================================================
// Zod Schemas
// ============================================================================

/**
 * Entity type enum
 */
export const AuditEntityTypeSchema = z.enum([
  "card",
  "idea",
  "stage_doc",
  "comment",
]);

export type AuditEntityType = z.infer<typeof AuditEntityTypeSchema>;

/**
 * Action type enum
 */
export const AuditActionSchema = z.enum(["create", "update", "delete", "move"]);

export type AuditAction = z.infer<typeof AuditActionSchema>;

/**
 * Audit log entry schema
 */
export const AuditEntrySchema = z.object({
  id: z.number().int().positive().optional(), // Autoincrement, optional for creation
  entity_type: AuditEntityTypeSchema,
  entity_id: z.string().min(1),
  action: AuditActionSchema,
  actor: z.string().min(1),
  timestamp: z.string(),
  changes_json: z.string().nullable().optional(),
});

export type AuditEntry = z.infer<typeof AuditEntrySchema>;

/**
 * Audit log database row
 */
export type AuditLogRow = {
  id: number;
  entity_type: string;
  entity_id: string;
  action: string;
  actor: string;
  timestamp: string;
  changes_json: string | null;
};

// ============================================================================
// Repository Functions
// ============================================================================

/**
 * Append audit log entry
 *
 * Creates immutable audit record for entity mutation.
 *
 * @param db - D1 database instance
 * @param entry - Audit entry data (without ID, timestamp auto-generated)
 * @returns Success status and created entry ID
 *
 * @example
 * ```ts
 * // Log card creation
 * await appendAuditEntry(db, {
 *   entity_type: "card",
 *   entity_id: "BRIK-ENG-0001",
 *   action: "create",
 *   actor: "Pete",
 *   changes_json: JSON.stringify({ lane: "Inbox", priority: "P2" }),
 * });
 *
 * // Log lane move
 * await appendAuditEntry(db, {
 *   entity_type: "card",
 *   entity_id: "BRIK-ENG-0001",
 *   action: "move",
 *   actor: "Pete",
 *   changes_json: JSON.stringify({ from: "Inbox", to: "Fact-finding" }),
 * });
 * ```
 */
export async function appendAuditEntry(
  db: D1Database,
  entry: {
    entity_type: AuditEntityType;
    entity_id: string;
    action: AuditAction;
    actor: string;
    changes_json?: string | null;
  }
): Promise<{ success: boolean; id?: number }> {
  // Validate input
  const validated = AuditEntrySchema.omit({ id: true, timestamp: true }).parse(entry);
  const now = new Date().toISOString();

  // Insert audit entry (autoincrement ID)
  const result = await db
    .prepare(
      `
      INSERT INTO business_os_audit_log (entity_type, entity_id, action, actor, timestamp, changes_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    )
    .bind(
      validated.entity_type,
      validated.entity_id,
      validated.action,
      validated.actor,
      now,
      validated.changes_json ?? null
    )
    .run();

  return {
    success: result.success ?? false,
    id: result.meta?.last_row_id,
  };
}

/**
 * List audit log entries for entity
 *
 * @param db - D1 database instance
 * @param entityType - Entity type filter
 * @param entityId - Entity ID filter
 * @param limit - Maximum entries to return
 * @returns Array of audit entries (newest first)
 *
 * @example
 * ```ts
 * // Get audit trail for card
 * const history = await listAuditEntries(db, "card", "BRIK-ENG-0001");
 * ```
 */
export async function listAuditEntries(
  db: D1Database,
  entityType: AuditEntityType,
  entityId: string,
  limit = 100
): Promise<AuditEntry[]> {
  const result = await db
    .prepare(
      `
      SELECT id, entity_type, entity_id, action, actor, timestamp, changes_json
      FROM business_os_audit_log
      WHERE entity_type = ? AND entity_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `
    )
    .bind(entityType, entityId, limit)
    .all<AuditLogRow>();

  return (result.results ?? []).map((row) => AuditEntrySchema.parse(row));
}

/**
 * List recent audit log entries (across all entities)
 *
 * @param db - D1 database instance
 * @param limit - Maximum entries to return
 * @param offset - Pagination offset
 * @returns Array of audit entries (newest first)
 *
 * @example
 * ```ts
 * // Get recent activity across all entities
 * const recent = await listRecentAuditEntries(db, 50);
 * ```
 */
export async function listRecentAuditEntries(
  db: D1Database,
  limit = 100,
  offset = 0
): Promise<AuditEntry[]> {
  const result = await db
    .prepare(
      `
      SELECT id, entity_type, entity_id, action, actor, timestamp, changes_json
      FROM business_os_audit_log
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `
    )
    .bind(limit, offset)
    .all<AuditLogRow>();

  return (result.results ?? []).map((row) => AuditEntrySchema.parse(row));
}

/**
 * List audit entries by actor
 *
 * @param db - D1 database instance
 * @param actor - Actor name (user or agent)
 * @param limit - Maximum entries to return
 * @returns Array of audit entries (newest first)
 *
 * @example
 * ```ts
 * // Get Pete's recent activity
 * const peteActivity = await listAuditEntriesByActor(db, "Pete", 20);
 * ```
 */
export async function listAuditEntriesByActor(
  db: D1Database,
  actor: string,
  limit = 100
): Promise<AuditEntry[]> {
  const result = await db
    .prepare(
      `
      SELECT id, entity_type, entity_id, action, actor, timestamp, changes_json
      FROM business_os_audit_log
      WHERE actor = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `
    )
    .bind(actor, limit)
    .all<AuditLogRow>();

  return (result.results ?? []).map((row) => AuditEntrySchema.parse(row));
}
