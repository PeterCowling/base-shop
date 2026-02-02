/**
 * Business OS Cards Repository
 *
 * D1-backed repository for Business OS card entities.
 * Provides CRUD operations with Zod validation and optimistic concurrency control.
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
 * Lane enum
 */
export const LaneSchema = z.enum([
  "Inbox",
  "Fact-finding",
  "Planned",
  "In progress",
  "Blocked",
  "Done",
  "Reflected",
]);

export type Lane = z.infer<typeof LaneSchema>;

/**
 * Priority enum
 */
export const PrioritySchema = z.enum(["P0", "P1", "P2", "P3", "P4", "P5"]);

export type Priority = z.infer<typeof PrioritySchema>;

/**
 * Card frontmatter schema (YAML frontmatter in markdown files)
 */
export const CardFrontmatterSchema = z.object({
  Type: z.literal("Card"),
  Lane: LaneSchema,
  Priority: PrioritySchema,
  Owner: z.string(),
  ID: z.string().min(1),
  Title: z.string().optional(),
  "Title-it": z.string().optional(),
  "Proposed-Lane": LaneSchema.optional(),
  Business: z.string().optional(),
  Tags: z.array(z.string()).optional(),
  Dependencies: z.array(z.string()).optional(),
  "Due-Date": z.string().optional(),
  Created: z.string().optional(),
  Updated: z.string().optional(),
  "Completed-Date": z.string().optional(),
  Blocked: z.boolean().optional(),
  "Blocked-Reason": z.string().optional(),
  "Feature-Slug": z.string().optional(),
  "Last-Progress": z.string().optional(),
  "Plan-Link": z.string().optional(),
});

export type CardFrontmatter = z.infer<typeof CardFrontmatterSchema>;

/**
 * Full card schema (frontmatter + content + metadata)
 */
export const CardSchema = CardFrontmatterSchema.extend({
  content: z.string(),
  "content-it": z.string().optional(),
  filePath: z.string(),
  fileSha: z.string().optional(),
});

export type Card = z.infer<typeof CardSchema>;

/**
 * Card database row (denormalized indexed columns + JSON payload)
 */
export type CardRow = {
  id: string;
  business: string | null;
  lane: string;
  priority: string;
  owner: string;
  title: string | null;
  payload_json: string;
  created_at: string;
  updated_at: string;
};

/**
 * Card update input (partial updates with optimistic concurrency)
 */
export const CardUpdateInputSchema = CardSchema.partial().extend({
  ID: z.string().min(1), // ID is required for updates
});

export type CardUpdateInput = z.infer<typeof CardUpdateInputSchema>;

// ============================================================================
// Row <-> Domain Conversion
// ============================================================================

/**
 * Parse card from database row
 *
 * Reconstructs full Card object from denormalized D1 row.
 */
function parseCardFromRow(row: CardRow): Card {
  const payload = JSON.parse(row.payload_json) as Card;

  // Validate parsed payload
  return CardSchema.parse(payload);
}

/**
 * Convert card to database row
 *
 * Denormalizes card for efficient querying.
 */
function cardToRow(card: Card, now: string): Omit<CardRow, "created_at"> {
  return {
    id: card.ID,
    business: card.Business ?? null,
    lane: card.Lane,
    priority: card.Priority,
    owner: card.Owner,
    title: card.Title ?? null,
    payload_json: JSON.stringify(card),
    updated_at: now,
  };
}

// ============================================================================
// Repository Functions
// ============================================================================

/**
 * List cards for board view
 *
 * Optimized query using indexed columns (business, lane, priority, updated_at).
 *
 * @param db - D1 database instance
 * @param options - Query filters
 * @returns Array of cards matching filters
 *
 * @example
 * ```ts
 * // All cards for BRIK business
 * const cards = await listCardsForBoard(db, { business: "BRIK" });
 *
 * // Only "In progress" lane
 * const inProgress = await listCardsForBoard(db, {
 *   business: "BRIK",
 *   lane: "In progress"
 * });
 *
 * // Global P0/P1 board (across all businesses)
 * const highPriority = await listCardsForBoard(db, {
 *   priorities: ["P0", "P1"]
 * });
 * ```
 */
export async function listCardsForBoard(
  db: D1Database,
  options: {
    business?: string;
    lane?: Lane;
    priorities?: Priority[];
    owner?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<Card[]> {
  const conditions: string[] = [];
  const binds: unknown[] = [];

  if (options.business) {
    conditions.push("business = ?");
    binds.push(options.business);
  }

  if (options.lane) {
    conditions.push("lane = ?");
    binds.push(options.lane);
  }

  if (options.priorities && options.priorities.length > 0) {
    const placeholders = options.priorities.map(() => "?").join(", ");
    conditions.push(`priority IN (${placeholders})`);
    binds.push(...options.priorities);
  }

  if (options.owner) {
    conditions.push("owner = ?");
    binds.push(options.owner);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const limitClause = options.limit ? `LIMIT ${options.limit}` : "";
  const offsetClause = options.offset ? `OFFSET ${options.offset}` : "";

  const query = `
    SELECT id, business, lane, priority, owner, title, payload_json, created_at, updated_at
    FROM business_os_cards
    ${whereClause}
    ORDER BY priority ASC, updated_at DESC
    ${limitClause} ${offsetClause}
  `.trim();

  const result = await db.prepare(query).bind(...binds).all<CardRow>();

  return (result.results ?? []).map(parseCardFromRow);
}

/**
 * Get card by ID
 *
 * @param db - D1 database instance
 * @param id - Card ID (e.g., "BRIK-ENG-0001")
 * @returns Card or null if not found
 *
 * @example
 * ```ts
 * const card = await getCardById(db, "BRIK-ENG-0001");
 * if (!card) {
 *   return new Response("Not found", { status: 404 });
 * }
 * ```
 */
export async function getCardById(
  db: D1Database,
  id: string
): Promise<Card | null> {
  const result = await db
    .prepare(
      "SELECT id, business, lane, priority, owner, title, payload_json, created_at, updated_at FROM business_os_cards WHERE id = ?"
    )
    .bind(id)
    .first<CardRow>();

  return result ? parseCardFromRow(result) : null;
}

/**
 * Upsert card (create or update)
 *
 * Uses INSERT OR REPLACE for atomic upsert.
 * Optimistic concurrency via baseUpdatedAt comparison.
 *
 * @param db - D1 database instance
 * @param card - Full card data
 * @param baseUpdatedAt - Expected updated_at for optimistic concurrency (null for create)
 * @returns Success status and updated card
 *
 * @example
 * ```ts
 * // Create new card
 * const result = await upsertCard(db, newCard, null);
 *
 * // Update existing card (with concurrency check)
 * const result = await upsertCard(db, updatedCard, "2026-01-30T14:30:00Z");
 * if (!result.success) {
 *   return new Response("Conflict: card was modified", { status: 409 });
 * }
 * ```
 */
export async function upsertCard(
  db: D1Database,
  card: Card,
  baseUpdatedAt: string | null
): Promise<{ success: boolean; card?: Card; error?: string }> {
  // Validate input
  const validated = CardSchema.parse(card);
  const now = new Date().toISOString();

  // Check optimistic concurrency (if baseUpdatedAt provided)
  if (baseUpdatedAt !== null) {
    const existing = await getCardById(db, validated.ID);
    if (existing) {
      const existingRow = await db
        .prepare("SELECT updated_at FROM business_os_cards WHERE id = ?")
        .bind(validated.ID)
        .first<{ updated_at: string }>();

      if (existingRow && existingRow.updated_at !== baseUpdatedAt) {
        return {
          success: false,
          error: "Conflict: card was modified by another process",
        };
      }
    }
  }

  // Prepare row data
  const row = cardToRow(validated, now);

  // Upsert (INSERT OR REPLACE)
  await db
    .prepare(
      `
      INSERT INTO business_os_cards (id, business, lane, priority, owner, title, payload_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM business_os_cards WHERE id = ?), ?), ?)
      ON CONFLICT(id) DO UPDATE SET
        business = excluded.business,
        lane = excluded.lane,
        priority = excluded.priority,
        owner = excluded.owner,
        title = excluded.title,
        payload_json = excluded.payload_json,
        updated_at = excluded.updated_at
    `
    )
    .bind(
      row.id,
      row.business,
      row.lane,
      row.priority,
      row.owner,
      row.title,
      row.payload_json,
      row.id, // for COALESCE subquery
      now, // created_at for new records
      row.updated_at
    )
    .run();

  // Fetch updated card
  const updatedCard = await getCardById(db, validated.ID);

  return {
    success: true,
    card: updatedCard ?? validated,
  };
}

/**
 * Move card to different lane
 *
 * Specialized operation for lane transitions (optimized update).
 *
 * @param db - D1 database instance
 * @param id - Card ID
 * @param newLane - Target lane
 * @param baseUpdatedAt - Expected updated_at for optimistic concurrency
 * @returns Success status and updated card
 *
 * @example
 * ```ts
 * const result = await moveCardToLane(
 *   db,
 *   "BRIK-ENG-0001",
 *   "In progress",
 *   "2026-01-30T14:30:00Z"
 * );
 * ```
 */
export async function moveCardToLane(
  db: D1Database,
  id: string,
  newLane: Lane,
  baseUpdatedAt: string
): Promise<{ success: boolean; card?: Card; error?: string }> {
  // Validate lane
  const validatedLane = LaneSchema.parse(newLane);

  // Get current card
  const card = await getCardById(db, id);
  if (!card) {
    return { success: false, error: "Card not found" };
  }

  // Check optimistic concurrency
  const currentRow = await db
    .prepare("SELECT updated_at FROM business_os_cards WHERE id = ?")
    .bind(id)
    .first<{ updated_at: string }>();

  if (!currentRow || currentRow.updated_at !== baseUpdatedAt) {
    return {
      success: false,
      error: "Conflict: card was modified by another process",
    };
  }

  // Update card with new lane
  const updatedCard: Card = {
    ...card,
    Lane: validatedLane,
    Updated: new Date().toISOString(),
  };

  // Upsert with new lane
  return await upsertCard(db, updatedCard, baseUpdatedAt);
}

/**
 * Get maximum updated_at timestamp (for version/polling endpoint)
 *
 * @param db - D1 database instance
 * @returns Latest updated_at timestamp or null if no cards exist
 *
 * @example
 * ```ts
 * // Auto-refresh polling endpoint
 * export async function GET({ env }) {
 *   const db = getBusinessOsDb(env);
 *   const version = await getCardsVersion(db);
 *   return new Response(JSON.stringify({ version }));
 * }
 * ```
 */
export async function getCardsVersion(
  db: D1Database
): Promise<string | null> {
  const result = await db
    .prepare("SELECT MAX(updated_at) as max_updated FROM business_os_cards")
    .first<{ max_updated: string | null }>();

  return result?.max_updated ?? null;
}
