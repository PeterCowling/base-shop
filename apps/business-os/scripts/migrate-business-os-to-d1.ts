#!/usr/bin/env tsx
/**
 * Business OS Data Migration Script
 * BOS-D1-08: Import docs/business-os/** markdown files into D1
 *
 * Usage:
 *   pnpm tsx apps/business-os/scripts/migrate-business-os-to-d1.ts [--dry-run] [--apply]
 *
 * Default: dry-run mode (parse + validate + report only)
 * --apply: Actually write to D1 database
 * --dry-run: Explicit dry-run (same as default)
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

import type { D1Database } from "@cloudflare/workers-types";

// For migration script, we need to bypass server-only guards
// Import schemas and types only, and implement our own direct D1 calls
import type { D1Result } from "@cloudflare/workers-types";
import { z } from "zod";

// Re-define minimal schemas needed for migration
// (copied from platform-core to avoid server-only issues)
const LaneSchema = z.enum([
  "Inbox",
  "Fact-finding",
  "Planned",
  "In progress",
  "Blocked",
  "Done",
  "Reflected",
]);

const PrioritySchema = z.enum(["P0", "P1", "P2", "P3", "P4", "P5"]);

// Schema for parsing frontmatter (uses actual field names from files)
const CardFrontmatterSchema = z.object({
  ID: z.string(),
  Type: z.literal("Card"),
  Status: z.string().optional(), // Not used in D1, but present in frontmatter
  Title: z.string().optional(),
  Business: z.string().optional(),
  Lane: LaneSchema,
  Priority: PrioritySchema.optional(),
  Owner: z.string().optional(),
  Tags: z.array(z.string()).optional(),
  Created: z.union([z.string(), z.date()]).transform(val =>
    val instanceof Date ? val.toISOString().split('T')[0] : val
  ),
  Completed: z.union([z.string(), z.date()]).optional().transform(val =>
    val instanceof Date ? val.toISOString().split('T')[0] : val
  ),
  "Due-Date": z.union([z.string(), z.date()]).optional().transform(val =>
    val instanceof Date ? val.toISOString().split('T')[0] : val
  ),
  Updated: z.union([z.string(), z.date()]).optional().transform(val =>
    val instanceof Date ? val.toISOString().split('T')[0] : val
  ),
  "Proposed-Lane": LaneSchema.optional(),
});

const CardSchema = z.object({
  ID: z.string(),
  Type: z.literal("Card"),
  Title: z.string().optional(),
  Business: z.string().optional(),
  Lane: LaneSchema,
  Priority: PrioritySchema.optional(),
  Owner: z.string().optional(),
  Tags: z.array(z.string()).optional(),
  "Created-Date": z.string(),
  "Completed-Date": z.string().optional(),
  "Due-Date": z.string().optional(),
  Updated: z.string().optional(),
  "Proposed-Lane": LaneSchema.optional(),
  content: z.string(),
  filePath: z.string().optional(),
  fileSha: z.string().optional(),
});

const IdeaStatusSchema = z.enum(["raw", "worked"]);
const IdeaLocationSchema = z.enum(["inbox", "worked", "archive"]);

// Schema for parsing frontmatter (uses actual field names from files)
const IdeaFrontmatterSchema = z.object({
  ID: z.string(),
  Type: z.literal("Idea"),
  Status: IdeaStatusSchema,
  Business: z.string().optional(),
  Tags: z.array(z.string()).optional(),
  "Created-Date": z.union([z.string(), z.date()]).transform(val =>
    val instanceof Date ? val.toISOString().split('T')[0] : val
  ),
});

const IdeaSchema = z.object({
  ID: z.string(),
  Type: z.literal("Idea"),
  Status: IdeaStatusSchema,
  Location: IdeaLocationSchema,
  Business: z.string().optional(),
  Tags: z.array(z.string()).optional(),
  "Created-Date": z.string(),
  content: z.string(),
  filePath: z.string().optional(),
});

const StageTypeSchema = z.enum(["fact-find", "plan", "build", "reflect"]);

// Schema for parsing frontmatter (uses actual field names from files)
const StageDocFrontmatterSchema = z.object({
  Type: z.union([z.literal("Stage"), z.literal("StageDoc")]), // Allow both
  Created: z.union([z.string(), z.date()]).optional().transform(val =>
    val instanceof Date ? val.toISOString().split('T')[0] : val
  ),
});

const StageDocSchema = z.object({
  id: z.string(),
  Type: z.literal("StageDoc"),
  CardID: z.string(),
  Stage: StageTypeSchema,
  "Created-Date": z.string().optional(),
  content: z.string(),
  filePath: z.string().optional(),
});

type Card = z.infer<typeof CardSchema>;
type Idea = z.infer<typeof IdeaSchema>;
type StageDoc = z.infer<typeof StageDocSchema>;

import { computeEntitySha } from "../src/lib/entity-sha";

interface MigrationResult {
  success: boolean;
  entity: "card" | "idea" | "stage-doc";
  id: string;
  filePath: string;
  error?: string;
}

interface MigrationReport {
  cardsSuccess: number;
  cardsFailed: number;
  ideasSuccess: number;
  ideasFailed: number;
  stageDocsSuccess: number;
  stageDocsFailed: number;
  failures: MigrationResult[];
}

/**
 * Parse command-line args
 */
function parseArgs(): { dryRun: boolean; apply: boolean } {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const apply = args.includes("--apply");

  // Default is dry-run if no flags specified
  if (!dryRun && !apply) {
    return { dryRun: true, apply: false };
  }

  return { dryRun, apply };
}

/**
 * Get D1 database instance (local or remote)
 * For now, this uses the local D1 binding from wrangler
 */
async function getD1Database(): Promise<D1Database> {
  // This will be replaced with actual D1 binding access
  // For local development, use wrangler dev or wrangler d1 execute
  throw new Error(
    "D1 database access not yet implemented - use wrangler d1 execute for now"
  );
}

/**
 * Direct D1 upsert for cards (bypasses repository layer for migration)
 */
async function upsertCardDirect(
  db: D1Database,
  card: Card
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await db
      .prepare(
        `
      INSERT INTO business_os_cards (
        id, business, lane, priority, owner, tags, title,
        created_at, completed_at, due_date, updated_at, proposed_lane,
        content, file_sha
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        business = excluded.business,
        lane = excluded.lane,
        priority = excluded.priority,
        owner = excluded.owner,
        tags = excluded.tags,
        title = excluded.title,
        completed_at = excluded.completed_at,
        due_date = excluded.due_date,
        updated_at = excluded.updated_at,
        proposed_lane = excluded.proposed_lane,
        content = excluded.content,
        file_sha = excluded.file_sha
    `
      )
      .bind(
        card.ID,
        card.Business || null,
        card.Lane,
        card.Priority || null,
        card.Owner || null,
        card.Tags ? JSON.stringify(card.Tags) : null,
        card.Title || null,
        card["Created-Date"],
        card["Completed-Date"] || null,
        card["Due-Date"] || null,
        card.Updated || card["Created-Date"],
        card["Proposed-Lane"] || null,
        card.content,
        card.fileSha || null
      )
      .run();

    return { success: result.success };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Direct D1 upsert for ideas (bypasses repository layer for migration)
 */
async function upsertIdeaDirect(
  db: D1Database,
  idea: Idea
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await db
      .prepare(
        `
      INSERT INTO business_os_ideas (
        id, status, location, business, tags, created_at, content
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        location = excluded.location,
        business = excluded.business,
        tags = excluded.tags,
        content = excluded.content
    `
      )
      .bind(
        idea.ID,
        idea.Status,
        idea.Location,
        idea.Business || null,
        idea.Tags ? JSON.stringify(idea.Tags) : null,
        idea["Created-Date"],
        idea.content
      )
      .run();

    return { success: result.success };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Direct D1 upsert for stage docs (bypasses repository layer for migration)
 */
async function upsertStageDocDirect(
  db: D1Database,
  stageDoc: StageDoc
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await db
      .prepare(
        `
      INSERT INTO business_os_stage_docs (
        id, card_id, stage, created_at, content
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        content = excluded.content
    `
      )
      .bind(
        stageDoc.id,
        stageDoc.CardID,
        stageDoc.Stage,
        stageDoc["Created-Date"] || new Date().toISOString().split("T")[0],
        stageDoc.content
      )
      .run();

    return { success: result.success };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Find all Business OS markdown files
 */
async function findBusinessOsFiles(
  rootDir: string
): Promise<{ cards: string[]; ideas: string[]; stageDocs: string[] }> {
  const businessOsDir = path.join(rootDir, "docs/business-os");

  const cards: string[] = [];
  const ideas: string[] = [];
  const stageDocs: string[] = [];

  // Find cards
  const cardsDir = path.join(businessOsDir, "cards");
  try {
    const cardFiles = await readdir(cardsDir);
    for (const file of cardFiles) {
      if (file.endsWith(".user.md")) {
        cards.push(path.join(cardsDir, file));
      } else if (!file.startsWith(".") && !file.includes(".")) {
        // Check for stage docs in card subdirectories
        const cardId = file;
        const cardSubdir = path.join(cardsDir, cardId);
        try {
          const stageFiles = await readdir(cardSubdir);
          for (const stageFile of stageFiles) {
            if (stageFile.endsWith(".user.md")) {
              stageDocs.push(path.join(cardSubdir, stageFile));
            }
          }
        } catch {
          // Not a directory, skip
        }
      }
    }
  } catch (err) {
    console.warn(`Warning: Could not read cards directory: ${String(err)}`);
  }

  // Find ideas
  const ideasInboxDir = path.join(businessOsDir, "ideas/inbox");
  try {
    const ideaFiles = await readdir(ideasInboxDir);
    for (const file of ideaFiles) {
      if (file.endsWith(".user.md")) {
        ideas.push(path.join(ideasInboxDir, file));
      }
    }
  } catch (err) {
    console.warn(
      `Warning: Could not read ideas/inbox directory: ${String(err)}`
    );
  }

  return { cards, ideas, stageDocs };
}

/**
 * Parse a card file
 */
async function parseCard(
  filePath: string,
  repoRoot: string
): Promise<Card | null> {
  try {
    const content = await readFile(filePath, "utf-8");
    const parsed = matter(content);

    // First validate frontmatter format
    const frontmatterResult = CardFrontmatterSchema.safeParse(parsed.data);
    if (!frontmatterResult.success) {
      console.error(`Card frontmatter validation failed for ${filePath}:`, frontmatterResult.error);
      return null;
    }

    const frontmatter = frontmatterResult.data;

    // Map to D1 schema format (rename fields)
    const card: Card = {
      ID: frontmatter.ID,
      Type: "Card" as const,
      Title: frontmatter.Title,
      Business: frontmatter.Business,
      Lane: frontmatter.Lane,
      Priority: frontmatter.Priority,
      Owner: frontmatter.Owner,
      Tags: frontmatter.Tags,
      "Created-Date": frontmatter.Created,
      "Completed-Date": frontmatter.Completed,
      "Due-Date": frontmatter["Due-Date"],
      Updated: frontmatter.Updated || frontmatter.Created,
      "Proposed-Lane": frontmatter["Proposed-Lane"],
      content: parsed.content,
      filePath: path.relative(repoRoot, filePath),
    };

    // Compute fileSha
    const fileSha = await computeEntitySha(card as unknown as Record<string, unknown>);

    return {
      ...card,
      fileSha,
    };
  } catch (err) {
    console.error(`Failed to parse card ${filePath}:`, err);
    return null;
  }
}

/**
 * Parse an idea file
 */
async function parseIdea(
  filePath: string,
  repoRoot: string
): Promise<Idea | null> {
  try {
    const content = await readFile(filePath, "utf-8");
    const parsed = matter(content);

    // First validate frontmatter format
    const frontmatterResult = IdeaFrontmatterSchema.safeParse(parsed.data);
    if (!frontmatterResult.success) {
      console.error(`Idea frontmatter validation failed for ${filePath}:`, frontmatterResult.error);
      return null;
    }

    const frontmatter = frontmatterResult.data;

    // Determine location from file path (inbox/worked/archive)
    const location: "inbox" | "worked" | "archive" = filePath.includes("/inbox/")
      ? "inbox"
      : filePath.includes("/worked/")
        ? "worked"
        : "archive";

    // Map to D1 schema format
    const idea: Idea = {
      ID: frontmatter.ID,
      Type: "Idea" as const,
      Status: frontmatter.Status,
      Location: location,
      Business: frontmatter.Business,
      Tags: frontmatter.Tags,
      "Created-Date": frontmatter["Created-Date"],
      content: parsed.content,
      filePath: path.relative(repoRoot, filePath),
    };

    return idea;
  } catch (err) {
    console.error(`Failed to parse idea ${filePath}:`, err);
    return null;
  }
}

/**
 * Parse a stage doc file
 */
async function parseStageDoc(
  filePath: string,
  repoRoot: string
): Promise<StageDoc | null> {
  try {
    const content = await readFile(filePath, "utf-8");
    const parsed = matter(content);

    // First validate frontmatter format
    const frontmatterResult = StageDocFrontmatterSchema.safeParse(parsed.data);
    if (!frontmatterResult.success) {
      console.error(`Stage doc frontmatter validation failed for ${filePath}:`, frontmatterResult.error);
      return null;
    }

    const frontmatter = frontmatterResult.data;

    // Extract card ID and stage from path
    // Path format: docs/business-os/cards/CARD-ID/STAGE.user.md
    const pathParts = filePath.split("/");
    const stageFileName = pathParts[pathParts.length - 1];
    const cardId = pathParts[pathParts.length - 2];
    const stage = stageFileName.replace(".user.md", "") as "fact-find" | "plan" | "build" | "reflect";

    // Generate deterministic ID: ${cardId}/${stage}
    const id = `${cardId}/${stage}`;

    // Map to D1 schema format
    const stageDoc: StageDoc = {
      id,
      Type: "StageDoc" as const,
      CardID: cardId,
      Stage: stage,
      "Created-Date": frontmatter.Created,
      content: parsed.content,
      filePath: path.relative(repoRoot, filePath),
    };

    return stageDoc;
  } catch (err) {
    console.error(`Failed to parse stage doc ${filePath}:`, err);
    return null;
  }
}

/**
 * Migrate cards to D1
 */
async function migrateCards(
  db: D1Database,
  cardPaths: string[],
  repoRoot: string,
  dryRun: boolean
): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];

  for (const cardPath of cardPaths) {
    const card = await parseCard(cardPath, repoRoot);

    if (!card) {
      results.push({
        success: false,
        entity: "card",
        id: path.basename(cardPath, ".user.md"),
        filePath: path.relative(repoRoot, cardPath),
        error: "Parse/validation failed",
      });
      continue;
    }

    if (dryRun) {
      results.push({
        success: true,
        entity: "card",
        id: card.ID,
        filePath: card.filePath || path.relative(repoRoot, cardPath),
      });
      continue;
    }

    // Actually upsert to D1
    try {
      const result = await upsertCardDirect(db, card);
      if (result.success) {
        results.push({
          success: true,
          entity: "card",
          id: card.ID,
          filePath: card.filePath || path.relative(repoRoot, cardPath),
        });
      } else {
        results.push({
          success: false,
          entity: "card",
          id: card.ID,
          filePath: card.filePath || path.relative(repoRoot, cardPath),
          error: result.error || "Unknown upsert error",
        });
      }
    } catch (err) {
      results.push({
        success: false,
        entity: "card",
        id: card.ID,
        filePath: card.filePath || path.relative(repoRoot, cardPath),
        error: String(err),
      });
    }
  }

  return results;
}

/**
 * Migrate ideas to D1
 */
async function migrateIdeas(
  db: D1Database,
  ideaPaths: string[],
  repoRoot: string,
  dryRun: boolean
): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];

  for (const ideaPath of ideaPaths) {
    const idea = await parseIdea(ideaPath, repoRoot);

    if (!idea) {
      results.push({
        success: false,
        entity: "idea",
        id: path.basename(ideaPath, ".user.md"),
        filePath: path.relative(repoRoot, ideaPath),
        error: "Parse/validation failed",
      });
      continue;
    }

    if (dryRun) {
      results.push({
        success: true,
        entity: "idea",
        id: idea.ID,
        filePath: idea.filePath || path.relative(repoRoot, ideaPath),
      });
      continue;
    }

    // Actually upsert to D1
    try {
      const result = await upsertIdeaDirect(db, idea);
      if (result.success) {
        results.push({
          success: true,
          entity: "idea",
          id: idea.ID,
          filePath: idea.filePath || path.relative(repoRoot, ideaPath),
        });
      } else {
        results.push({
          success: false,
          entity: "idea",
          id: idea.ID,
          filePath: idea.filePath || path.relative(repoRoot, ideaPath),
          error: result.error || "Unknown upsert error",
        });
      }
    } catch (err) {
      results.push({
        success: false,
        entity: "idea",
        id: idea.ID,
        filePath: idea.filePath || path.relative(repoRoot, ideaPath),
        error: String(err),
      });
    }
  }

  return results;
}

/**
 * Migrate stage docs to D1
 */
async function migrateStageDocs(
  db: D1Database,
  stageDocPaths: string[],
  repoRoot: string,
  dryRun: boolean
): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];

  for (const stageDocPath of stageDocPaths) {
    const stageDoc = await parseStageDoc(stageDocPath, repoRoot);

    if (!stageDoc) {
      results.push({
        success: false,
        entity: "stage-doc",
        id: path.basename(stageDocPath, ".user.md"),
        filePath: path.relative(repoRoot, stageDocPath),
        error: "Parse/validation failed",
      });
      continue;
    }

    if (dryRun) {
      results.push({
        success: true,
        entity: "stage-doc",
        id: stageDoc.id,
        filePath: stageDoc.filePath || path.relative(repoRoot, stageDocPath),
      });
      continue;
    }

    // Actually upsert to D1
    try {
      const result = await upsertStageDocDirect(db, stageDoc);
      if (result.success) {
        results.push({
          success: true,
          entity: "stage-doc",
          id: stageDoc.id,
          filePath: stageDoc.filePath || path.relative(repoRoot, stageDocPath),
        });
      } else {
        results.push({
          success: false,
          entity: "stage-doc",
          id: stageDoc.id,
          filePath: stageDoc.filePath || path.relative(repoRoot, stageDocPath),
          error: result.error || "Unknown upsert error",
        });
      }
    } catch (err) {
      results.push({
        success: false,
        entity: "stage-doc",
        id: stageDoc.id,
        filePath: stageDoc.filePath || path.relative(repoRoot, stageDocPath),
        error: String(err),
      });
    }
  }

  return results;
}

/**
 * Generate migration report
 */
function generateReport(results: MigrationResult[]): MigrationReport {
  const report: MigrationReport = {
    cardsSuccess: 0,
    cardsFailed: 0,
    ideasSuccess: 0,
    ideasFailed: 0,
    stageDocsSuccess: 0,
    stageDocsFailed: 0,
    failures: [],
  };

  for (const result of results) {
    if (result.entity === "card") {
      if (result.success) {
        report.cardsSuccess++;
      } else {
        report.cardsFailed++;
        report.failures.push(result);
      }
    } else if (result.entity === "idea") {
      if (result.success) {
        report.ideasSuccess++;
      } else {
        report.ideasFailed++;
        report.failures.push(result);
      }
    } else if (result.entity === "stage-doc") {
      if (result.success) {
        report.stageDocsSuccess++;
      } else {
        report.stageDocsFailed++;
        report.failures.push(result);
      }
    }
  }

  return report;
}

/**
 * Print migration report
 */
function printReport(report: MigrationReport, dryRun: boolean): void {
  console.log("\n" + "=".repeat(60));
  console.log(
    `Business OS Migration Report (${dryRun ? "DRY-RUN" : "APPLIED"})`
  );
  console.log("=".repeat(60));

  console.log("\nCards:");
  console.log(`  ✓ Success: ${report.cardsSuccess}`);
  console.log(`  ✗ Failed:  ${report.cardsFailed}`);

  console.log("\nIdeas:");
  console.log(`  ✓ Success: ${report.ideasSuccess}`);
  console.log(`  ✗ Failed:  ${report.ideasFailed}`);

  console.log("\nStage Docs:");
  console.log(`  ✓ Success: ${report.stageDocsSuccess}`);
  console.log(`  ✗ Failed:  ${report.stageDocsFailed}`);

  const totalSuccess =
    report.cardsSuccess + report.ideasSuccess + report.stageDocsSuccess;
  const totalFailed =
    report.cardsFailed + report.ideasFailed + report.stageDocsFailed;

  console.log("\nTotal:");
  console.log(`  ✓ Success: ${totalSuccess}`);
  console.log(`  ✗ Failed:  ${totalFailed}`);

  if (report.failures.length > 0) {
    console.log("\n" + "=".repeat(60));
    console.log("Failures:");
    console.log("=".repeat(60));
    for (const failure of report.failures) {
      console.log(
        `\n[${failure.entity}] ${failure.id} (${failure.filePath})`
      );
      console.log(`  Error: ${failure.error || "Unknown error"}`);
    }
  }

  console.log("\n" + "=".repeat(60));
}

/**
 * Main migration function
 */
async function main(): Promise<void> {
  const { dryRun, apply } = parseArgs();
  const mode = dryRun ? "dry-run" : apply ? "apply" : "dry-run";

  console.log(`Business OS Migration to D1 (mode: ${mode})`);
  console.log("=".repeat(60));

  // Find repo root (assuming script is in apps/business-os/scripts/)
  const repoRoot = path.resolve(__dirname, "../../..");
  console.log(`Repo root: ${repoRoot}`);

  // Find all Business OS files
  console.log("\nScanning for Business OS files...");
  const files = await findBusinessOsFiles(repoRoot);
  console.log(`Found ${files.cards.length} cards`);
  console.log(`Found ${files.ideas.length} ideas`);
  console.log(`Found ${files.stageDocs.length} stage docs`);

  // Get D1 database (for now, this will throw in dry-run mode)
  let db: D1Database | null = null;
  if (apply) {
    try {
      db = await getD1Database();
    } catch (err) {
      console.error("\nError: Could not connect to D1 database");
      console.error(String(err));
      console.error(
        "\nFor now, use dry-run mode or migrate manually with wrangler d1 execute"
      );
      process.exit(1);
    }
  }

  // Migrate entities
  console.log("\nMigrating entities...");
  const allResults: MigrationResult[] = [];

  if (files.cards.length > 0) {
    console.log(`\nProcessing ${files.cards.length} cards...`);
    const cardResults = await migrateCards(
      db!,
      files.cards,
      repoRoot,
      dryRun
    );
    allResults.push(...cardResults);
  }

  if (files.ideas.length > 0) {
    console.log(`\nProcessing ${files.ideas.length} ideas...`);
    const ideaResults = await migrateIdeas(
      db!,
      files.ideas,
      repoRoot,
      dryRun
    );
    allResults.push(...ideaResults);
  }

  if (files.stageDocs.length > 0) {
    console.log(`\nProcessing ${files.stageDocs.length} stage docs...`);
    const stageDocResults = await migrateStageDocs(
      db!,
      files.stageDocs,
      repoRoot,
      dryRun
    );
    allResults.push(...stageDocResults);
  }

  // Generate and print report
  const report = generateReport(allResults);
  printReport(report, dryRun);

  // Exit with error code if any failures
  const totalFailed =
    report.cardsFailed + report.ideasFailed + report.stageDocsFailed;
  if (totalFailed > 0) {
    process.exit(1);
  }
}

// Run main function
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
