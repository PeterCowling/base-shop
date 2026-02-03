/**
 * Business OS Ideas Repository
 *
 * D1-backed repository for Business OS idea entities (inbox and worked ideas).
 * Provides CRUD operations with Zod validation.
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
 * Idea status enum
 */
export const IdeaStatusSchema = z.enum(["raw", "worked", "converted", "dropped"]);

export type IdeaStatus = z.infer<typeof IdeaStatusSchema>;

/**
 * Idea location enum
 */
export const IdeaLocationSchema = z.enum(["inbox", "worked"]);

export type IdeaLocation = z.infer<typeof IdeaLocationSchema>;

/**
 * Idea frontmatter schema (YAML frontmatter in markdown files)
 */
export const IdeaFrontmatterSchema = z.object({
  Type: z.enum(["Idea", "Opportunity"]),
  ID: z.string().optional(),
  Business: z.string().optional(),
  Status: IdeaStatusSchema.optional(),
  "Created-Date": z.string().optional(),
  Tags: z.array(z.string()).optional(),
  "Title-it": z.string().optional(),
});

export type IdeaFrontmatter = z.infer<typeof IdeaFrontmatterSchema>;

/**
 * Full idea schema (frontmatter + content + metadata)
 */
export const IdeaSchema = IdeaFrontmatterSchema.extend({
  content: z.string(),
  "content-it": z.string().optional(),
  filePath: z.string(),
  fileSha: z.string().optional(),
});

export type Idea = z.infer<typeof IdeaSchema>;

/**
 * Idea database row (denormalized indexed columns + JSON payload)
 */
export type IdeaRow = {
  id: string;
  business: string | null;
  status: string | null;
  location: string | null;
  payload_json: string;
  created_at: string;
  updated_at: string;
};

// ============================================================================
// Row <-> Domain Conversion
// ============================================================================

/**
 * Parse idea from database row
 */
function parseIdeaFromRow(row: IdeaRow): Idea {
  const payload = JSON.parse(row.payload_json) as Idea;
  return IdeaSchema.parse(payload);
}

/**
 * Convert idea to database row
 */
function ideaToRow(idea: Idea, location: IdeaLocation, now: string): Omit<IdeaRow, "created_at"> {
  return {
    id: idea.ID ?? `idea-${Date.now()}`,
    business: idea.Business ?? null,
    status: idea.Status ?? "raw",
    location: location,
    payload_json: JSON.stringify(idea),
    updated_at: now,
  };
}

// ============================================================================
// Repository Functions
// ============================================================================

/**
 * List ideas from inbox
 *
 * @param db - D1 database instance
 * @param options - Query filters
 * @returns Array of ideas from inbox
 *
 * @example
 * ```ts
 * // All inbox ideas for BRIK
 * const ideas = await listInboxIdeas(db, { business: "BRIK" });
 *
 * // Only raw (unworked) ideas
 * const raw = await listInboxIdeas(db, { status: "raw" });
 * ```
 */
export async function listInboxIdeas(
  db: D1Database,
  options: {
    business?: string;
    status?: IdeaStatus;
    limit?: number;
    offset?: number;
  } = {}
): Promise<Idea[]> {
  const conditions: string[] = ["location = ?"];
  const binds: unknown[] = ["inbox"];

  if (options.business) {
    conditions.push("business = ?");
    binds.push(options.business);
  }

  if (options.status) {
    conditions.push("status = ?");
    binds.push(options.status);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;
  const limitClause = options.limit ? `LIMIT ${options.limit}` : "";
  const offsetClause = options.offset ? `OFFSET ${options.offset}` : "";

  const query = `
    SELECT id, business, status, location, payload_json, created_at, updated_at
    FROM business_os_ideas
    ${whereClause}
    ORDER BY created_at DESC
    ${limitClause} ${offsetClause}
  `.trim();

  const result = await db.prepare(query).bind(...binds).all<IdeaRow>();

  return (result.results ?? []).map(parseIdeaFromRow);
}

/**
 * List worked ideas
 *
 * @param db - D1 database instance
 * @param options - Query filters
 * @returns Array of worked ideas
 *
 * @example
 * ```ts
 * const worked = await listWorkedIdeas(db, { business: "BRIK" });
 * ```
 */
export async function listWorkedIdeas(
  db: D1Database,
  options: {
    business?: string;
    status?: IdeaStatus;
    limit?: number;
    offset?: number;
  } = {}
): Promise<Idea[]> {
  const conditions: string[] = ["location = ?"];
  const binds: unknown[] = ["worked"];

  if (options.business) {
    conditions.push("business = ?");
    binds.push(options.business);
  }

  if (options.status) {
    conditions.push("status = ?");
    binds.push(options.status);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;
  const limitClause = options.limit ? `LIMIT ${options.limit}` : "";
  const offsetClause = options.offset ? `OFFSET ${options.offset}` : "";

  const query = `
    SELECT id, business, status, location, payload_json, created_at, updated_at
    FROM business_os_ideas
    ${whereClause}
    ORDER BY created_at DESC
    ${limitClause} ${offsetClause}
  `.trim();

  const result = await db.prepare(query).bind(...binds).all<IdeaRow>();

  return (result.results ?? []).map(parseIdeaFromRow);
}

/**
 * Get idea by ID
 *
 * @param db - D1 database instance
 * @param id - Idea ID
 * @returns Idea or null if not found
 *
 * @example
 * ```ts
 * const idea = await getIdeaById(db, "BRIK-OPP-0001");
 * ```
 */
export async function getIdeaById(
  db: D1Database,
  id: string
): Promise<Idea | null> {
  const result = await db
    .prepare(
      "SELECT id, business, status, location, payload_json, created_at, updated_at FROM business_os_ideas WHERE id = ?"
    )
    .bind(id)
    .first<IdeaRow>();

  return result ? parseIdeaFromRow(result) : null;
}

/**
 * Upsert idea (create or update)
 *
 * @param db - D1 database instance
 * @param idea - Full idea data
 * @param location - Idea location (inbox or worked)
 * @returns Success status and created/updated idea
 *
 * @example
 * ```ts
 * // Create new inbox idea
 * const result = await upsertIdea(db, newIdea, "inbox");
 *
 * // Move idea to worked
 * const result = await upsertIdea(db, workedIdea, "worked");
 * ```
 */
export async function upsertIdea(
  db: D1Database,
  idea: Idea,
  location: IdeaLocation
): Promise<{ success: boolean; idea?: Idea }> {
  // Validate input
  const validated = IdeaSchema.parse(idea);
  const validatedLocation = IdeaLocationSchema.parse(location);
  const now = new Date().toISOString();

  // Prepare row data
  const row = ideaToRow(validated, validatedLocation, now);

  // Upsert (INSERT OR REPLACE)
  await db
    .prepare(
      `
      INSERT INTO business_os_ideas (id, business, status, location, payload_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM business_os_ideas WHERE id = ?), ?), ?)
      ON CONFLICT(id) DO UPDATE SET
        business = excluded.business,
        status = excluded.status,
        location = excluded.location,
        payload_json = excluded.payload_json,
        updated_at = excluded.updated_at
    `
    )
    .bind(
      row.id,
      row.business,
      row.status,
      row.location,
      row.payload_json,
      row.id, // for COALESCE subquery
      now, // created_at for new records
      row.updated_at
    )
    .run();

  // Fetch updated idea
  const updatedIdea = await getIdeaById(db, row.id);

  return {
    success: true,
    idea: updatedIdea ?? validated,
  };
}

/**
 * Update idea status
 *
 * Specialized operation for status transitions (raw → worked → converted/dropped).
 *
 * @param db - D1 database instance
 * @param id - Idea ID
 * @param newStatus - Target status
 * @returns Success status and updated idea
 *
 * @example
 * ```ts
 * // Mark idea as worked
 * const result = await updateIdeaStatus(db, "BRIK-OPP-0001", "worked");
 *
 * // Convert idea to card
 * const result = await updateIdeaStatus(db, "BRIK-OPP-0001", "converted");
 * ```
 */
export async function updateIdeaStatus(
  db: D1Database,
  id: string,
  newStatus: IdeaStatus
): Promise<{ success: boolean; idea?: Idea; error?: string }> {
  // Validate status
  const validatedStatus = IdeaStatusSchema.parse(newStatus);

  // Get current idea
  const idea = await getIdeaById(db, id);
  if (!idea) {
    return { success: false, error: "Idea not found" };
  }

  // Update idea with new status
  const updatedIdea: Idea = {
    ...idea,
    Status: validatedStatus,
  };

  // Determine location (worked ideas go to "worked" location)
  const location: IdeaLocation =
    validatedStatus === "worked" ? "worked" : "inbox";

  // Upsert with new status and location
  return await upsertIdea(db, updatedIdea, location);
}
