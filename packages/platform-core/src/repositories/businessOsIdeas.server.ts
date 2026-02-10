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
 * Idea priority enum
 */
export const IdeaPrioritySchema = z.enum(["P0", "P1", "P2", "P3", "P4", "P5"]);

export type IdeaPriority = z.infer<typeof IdeaPrioritySchema>;

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
  Priority: IdeaPrioritySchema.optional().default("P3"),
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
  priority: string | null;
  location: string | null;
  payload_json: string;
  created_at: string;
  updated_at: string;
};

export type ListIdeasOptions = {
  business?: string;
  status?: IdeaStatus;
  priorities?: IdeaPriority[];
  location?: IdeaLocation | "all";
  tagContains?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

// ============================================================================
// Row <-> Domain Conversion
// ============================================================================

/**
 * Parse idea from database row
 */
function parseIdeaFromRow(row: IdeaRow): Idea {
  const payload = JSON.parse(row.payload_json) as Partial<Idea>;
  // Legacy payloads may not include priority. Use row value when present, else default P3.
  if (!payload.Priority) {
    const parsedRowPriority = IdeaPrioritySchema.safeParse(row.priority);
    payload.Priority = parsedRowPriority.success ? parsedRowPriority.data : "P3";
  }
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
    priority: idea.Priority ?? "P3",
    location: location,
    payload_json: JSON.stringify(idea),
    updated_at: now,
  };
}

function clampLimit(limit: number): number {
  return Math.min(Math.max(Math.trunc(limit), 1), 500);
}

function clampOffset(offset: number): number {
  return Math.max(Math.trunc(offset), 0);
}

function buildWhereClause(options: ListIdeasOptions): { whereClause: string; binds: unknown[] } {
  const conditions: string[] = [];
  const binds: unknown[] = [];

  if (options.location && options.location !== "all") {
    conditions.push("location = ?");
    binds.push(options.location);
  }

  if (options.business) {
    conditions.push("business = ?");
    binds.push(options.business);
  }

  if (options.status) {
    conditions.push("status = ?");
    binds.push(options.status);
  }

  if (options.priorities && options.priorities.length > 0) {
    const placeholders = options.priorities.map(() => "?").join(", ");
    conditions.push(`priority IN (${placeholders})`);
    binds.push(...options.priorities);
  }

  if (options.tagContains) {
    conditions.push(
      "EXISTS (SELECT 1 FROM json_each(payload_json, '$.Tags') tags WHERE LOWER(CAST(tags.value AS TEXT)) LIKE ?)"
    );
    binds.push(`%${options.tagContains.toLowerCase()}%`);
  }

  if (options.search) {
    const searchTerm = `%${options.search.toLowerCase()}%`;
    conditions.push(
      `(
        LOWER(id) LIKE ?
        OR LOWER(COALESCE(json_extract(payload_json, '$.Title'), '')) LIKE ?
        OR LOWER(COALESCE(json_extract(payload_json, '$.content'), '')) LIKE ?
        OR EXISTS (
          SELECT 1 FROM json_each(payload_json, '$.Tags') search_tags
          WHERE LOWER(CAST(search_tags.value AS TEXT)) LIKE ?
        )
      )`
    );
    binds.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    binds,
  };
}

function buildPaginationClause(
  options: ListIdeasOptions
): { paginationClause: string; binds: unknown[] } {
  const binds: unknown[] = [];
  const hasLimit = typeof options.limit === "number";
  const hasOffset = typeof options.offset === "number";

  if (!hasLimit && !hasOffset) {
    return { paginationClause: "", binds };
  }

  if (hasLimit) {
    binds.push(clampLimit(options.limit as number));
    if (hasOffset) {
      binds.push(clampOffset(options.offset as number));
      return { paginationClause: "LIMIT ? OFFSET ?", binds };
    }
    return { paginationClause: "LIMIT ?", binds };
  }

  binds.push(clampOffset(options.offset as number));
  return { paginationClause: "LIMIT -1 OFFSET ?", binds };
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
    priority?: IdeaPriority;
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

  if (options.priority) {
    conditions.push("priority = ?");
    binds.push(options.priority);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;
  const limitClause = options.limit ? `LIMIT ${options.limit}` : "";
  const offsetClause = options.offset ? `OFFSET ${options.offset}` : "";

  const query = `
    SELECT id, business, status, priority, location, payload_json, created_at, updated_at
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
    priority?: IdeaPriority;
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

  if (options.priority) {
    conditions.push("priority = ?");
    binds.push(options.priority);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;
  const limitClause = options.limit ? `LIMIT ${options.limit}` : "";
  const offsetClause = options.offset ? `OFFSET ${options.offset}` : "";

  const query = `
    SELECT id, business, status, priority, location, payload_json, created_at, updated_at
    FROM business_os_ideas
    ${whereClause}
    ORDER BY created_at DESC
    ${limitClause} ${offsetClause}
  `.trim();

  const result = await db.prepare(query).bind(...binds).all<IdeaRow>();

  return (result.results ?? []).map(parseIdeaFromRow);
}

/**
 * List ideas across locations with deterministic priority-first ordering.
 *
 * Ordering:
 * 1. Priority (P0 -> P5)
 * 2. Created-Date descending
 * 3. ID ascending (stable tie-break)
 */
export async function listIdeas(
  db: D1Database,
  options: ListIdeasOptions = {}
): Promise<Idea[]> {
  const { whereClause, binds } = buildWhereClause(options);
  const { paginationClause, binds: paginationBinds } = buildPaginationClause(options);

  const query = `
    SELECT id, business, status, priority, location, payload_json, created_at, updated_at
    FROM business_os_ideas
    ${whereClause}
    ORDER BY
      CASE priority
        WHEN 'P0' THEN 0
        WHEN 'P1' THEN 1
        WHEN 'P2' THEN 2
        WHEN 'P3' THEN 3
        WHEN 'P4' THEN 4
        WHEN 'P5' THEN 5
        ELSE 6
      END ASC,
      COALESCE(json_extract(payload_json, '$."Created-Date"'), created_at) DESC,
      id ASC
    ${paginationClause}
  `.trim();

  const result = await db
    .prepare(query)
    .bind(...binds, ...paginationBinds)
    .all<IdeaRow>();

  return (result.results ?? []).map(parseIdeaFromRow);
}

/**
 * Count ideas matching list filters.
 */
export async function countIdeas(
  db: D1Database,
  options: Omit<ListIdeasOptions, "limit" | "offset"> = {}
): Promise<number> {
  const { whereClause, binds } = buildWhereClause(options);

  const query = `
    SELECT COUNT(1) AS total
    FROM business_os_ideas
    ${whereClause}
  `.trim();

  const result = await db.prepare(query).bind(...binds).first<{ total: number | string | null }>();
  const parsed =
    typeof result?.total === "string"
      ? Number.parseInt(result.total, 10)
      : (result?.total ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
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
      "SELECT id, business, status, priority, location, payload_json, created_at, updated_at FROM business_os_ideas WHERE id = ?"
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
      INSERT INTO business_os_ideas (id, business, status, priority, location, payload_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM business_os_ideas WHERE id = ?), ?), ?)
      ON CONFLICT(id) DO UPDATE SET
        business = excluded.business,
        status = excluded.status,
        priority = excluded.priority,
        location = excluded.location,
        payload_json = excluded.payload_json,
        updated_at = excluded.updated_at
    `
    )
    .bind(
      row.id,
      row.business,
      row.status,
      row.priority,
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
