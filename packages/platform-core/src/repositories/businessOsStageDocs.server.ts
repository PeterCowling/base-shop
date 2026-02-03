/**
 * Business OS Stage Documents Repository
 *
 * D1-backed repository for Business OS stage documents
 * (fact-find, plan, build, reflect docs attached to cards).
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
 * Stage type enum
 */
export const StageTypeSchema = z.enum(["fact-find", "plan", "build", "reflect"]);

export type StageType = z.infer<typeof StageTypeSchema>;

/**
 * Stage document frontmatter schema
 */
export const StageDocFrontmatterSchema = z.object({
  Type: z.literal("Stage"),
  Stage: StageTypeSchema,
  "Card-ID": z.string().min(1),
  Created: z.string().optional(),
  Updated: z.string().optional(),
});

export type StageDocFrontmatter = z.infer<typeof StageDocFrontmatterSchema>;

/**
 * Full stage document schema
 */
export const StageDocSchema = StageDocFrontmatterSchema.extend({
  content: z.string(),
  filePath: z.string(),
  fileSha: z.string().optional(),
});

export type StageDoc = z.infer<typeof StageDocSchema>;

/**
 * Stage document database row
 */
export type StageDocRow = {
  id: string;
  card_id: string;
  stage: string;
  payload_json: string;
  created_at: string;
  updated_at: string;
};

// ============================================================================
// Row <-> Domain Conversion
// ============================================================================

/**
 * Parse stage doc from database row
 */
function parseStageDocFromRow(row: StageDocRow): StageDoc {
  const payload = JSON.parse(row.payload_json) as StageDoc;
  return StageDocSchema.parse(payload);
}

/**
 * Convert stage doc to database row
 */
function stageDocToRow(stageDoc: StageDoc, now: string): Omit<StageDocRow, "id" | "created_at"> {
  return {
    card_id: stageDoc["Card-ID"],
    stage: stageDoc.Stage,
    payload_json: JSON.stringify(stageDoc),
    updated_at: now,
  };
}

// ============================================================================
// Repository Functions
// ============================================================================

/**
 * List stage documents for a card
 *
 * @param db - D1 database instance
 * @param cardId - Card ID
 * @param stage - Optional stage filter
 * @returns Array of stage documents
 *
 * @example
 * ```ts
 * // All stage docs for card
 * const docs = await listStageDocsForCard(db, "BRIK-ENG-0001");
 *
 * // Only fact-find docs
 * const factFinds = await listStageDocsForCard(db, "BRIK-ENG-0001", "fact-find");
 * ```
 */
export async function listStageDocsForCard(
  db: D1Database,
  cardId: string,
  stage?: StageType
): Promise<StageDoc[]> {
  let query: string;
  const binds: unknown[] = [cardId];

  if (stage) {
    query = `
      SELECT id, card_id, stage, payload_json, created_at, updated_at
      FROM business_os_stage_docs
      WHERE card_id = ? AND stage = ?
      ORDER BY created_at ASC
    `;
    binds.push(stage);
  } else {
    query = `
      SELECT id, card_id, stage, payload_json, created_at, updated_at
      FROM business_os_stage_docs
      WHERE card_id = ?
      ORDER BY stage ASC, created_at ASC
    `;
  }

  const result = await db.prepare(query).bind(...binds).all<StageDocRow>();

  return (result.results ?? []).map(parseStageDocFromRow);
}

/**
 * Get stage document by ID
 *
 * @param db - D1 database instance
 * @param id - Stage document ID
 * @returns Stage document or null if not found
 */
export async function getStageDocById(
  db: D1Database,
  id: string
): Promise<StageDoc | null> {
  const result = await db
    .prepare(
      "SELECT id, card_id, stage, payload_json, created_at, updated_at FROM business_os_stage_docs WHERE id = ?"
    )
    .bind(id)
    .first<StageDocRow>();

  return result ? parseStageDocFromRow(result) : null;
}

/**
 * Get latest stage document for card + stage
 *
 * @param db - D1 database instance
 * @param cardId - Card ID
 * @param stage - Stage type
 * @returns Latest stage document or null if none exists
 *
 * @example
 * ```ts
 * // Get current plan document
 * const plan = await getLatestStageDoc(db, "BRIK-ENG-0001", "plan");
 * ```
 */
export async function getLatestStageDoc(
  db: D1Database,
  cardId: string,
  stage: StageType
): Promise<StageDoc | null> {
  const result = await db
    .prepare(
      `
      SELECT id, card_id, stage, payload_json, created_at, updated_at
      FROM business_os_stage_docs
      WHERE card_id = ? AND stage = ?
      ORDER BY created_at DESC
      LIMIT 1
    `
    )
    .bind(cardId, stage)
    .first<StageDocRow>();

  return result ? parseStageDocFromRow(result) : null;
}

/**
 * Upsert stage document
 *
 * Creates new stage document or updates existing one.
 * Uses card_id + stage + created_at for uniqueness (allows multiple docs per stage over time).
 *
 * @param db - D1 database instance
 * @param stageDoc - Full stage document data
 * @param id - Optional ID for updates (null for create)
 * @returns Success status and created/updated stage doc
 *
 * @example
 * ```ts
 * // Create new fact-find doc
 * const result = await upsertStageDoc(db, newFactFind, null);
 *
 * // Update existing plan doc
 * const result = await upsertStageDoc(db, updatedPlan, "stage-doc-123");
 * ```
 */
export async function upsertStageDoc(
  db: D1Database,
  stageDoc: StageDoc,
  id: string | null
): Promise<{ success: boolean; stageDoc?: StageDoc; id?: string }> {
  // Validate input
  const validated = StageDocSchema.parse(stageDoc);
  const now = new Date().toISOString();

  // Generate ID for new docs
  const docId = id ?? `stage-doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  // Prepare row data
  const row = stageDocToRow(validated, now);

  // Upsert
  await db
    .prepare(
      `
      INSERT INTO business_os_stage_docs (id, card_id, stage, payload_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, COALESCE((SELECT created_at FROM business_os_stage_docs WHERE id = ?), ?), ?)
      ON CONFLICT(id) DO UPDATE SET
        card_id = excluded.card_id,
        stage = excluded.stage,
        payload_json = excluded.payload_json,
        updated_at = excluded.updated_at
    `
    )
    .bind(
      docId,
      row.card_id,
      row.stage,
      row.payload_json,
      docId, // for COALESCE subquery
      now, // created_at for new records
      row.updated_at
    )
    .run();

  // Fetch updated stage doc
  const updatedDoc = await getStageDocById(db, docId);

  return {
    success: true,
    stageDoc: updatedDoc ?? validated,
    id: docId,
  };
}
