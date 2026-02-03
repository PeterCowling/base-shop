#!/usr/bin/env tsx
/**
 * Business OS D1 Export Script
 * BOS-D1-09: Export D1 data to markdown files in docs/business-os/**
 *
 * Usage:
 *   pnpm tsx scripts/src/business-os/export-d1-to-git.ts [--dry-run] [--commit]
 *
 * Default: dry-run mode (generate files but don't commit)
 * --commit: Commit and push changes to work/business-os-export branch
 * --dry-run: Explicit dry-run (same as default)
 *
 * Strategy:
 * - Query all entities from D1 (cards, ideas, stage docs)
 * - Format as markdown with frontmatter (inverse of migration)
 * - Write to docs/business-os/** with deterministic paths
 * - Commit to work/business-os-export branch
 * - Auto-PR workflow handles PR creation + auto-merge
 */

import { execSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

import type { D1Database } from "@cloudflare/workers-types";

interface Card {
  id: string;
  business: string | null;
  lane: string;
  priority: string | null;
  owner: string | null;
  tags: string | null;
  title: string | null;
  created_at: string;
  completed_at: string | null;
  due_date: string | null;
  updated_at: string;
  proposed_lane: string | null;
  content: string;
  file_sha: string | null;
}

interface Idea {
  id: string;
  status: string;
  location: string;
  business: string | null;
  tags: string | null;
  created_at: string;
  content: string;
}

interface StageDoc {
  id: string;
  card_id: string;
  stage: string;
  created_at: string | null;
  content: string;
}

interface ExportResult {
  cardsExported: number;
  ideasExported: number;
  stageDocsExported: number;
  filesWritten: string[];
}

/**
 * Get D1 database instance
 * Uses wrangler to access local or remote D1
 */
async function getD1Database(): Promise<D1Database> {
  // This will be replaced with actual D1 binding access via wrangler
  // For now, throw to indicate setup is needed
  throw new Error(
    "D1 database access not yet implemented - requires wrangler D1 binding setup"
  );
}

/**
 * Parse command-line args
 */
function parseArgs(): { dryRun: boolean; commit: boolean } {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const commit = args.includes("--commit");

  // Default is dry-run if no flags specified
  if (!dryRun && !commit) {
    return { dryRun: true, commit: false };
  }

  return { dryRun, commit };
}

/**
 * Query all cards from D1
 */
async function queryCards(db: D1Database): Promise<Card[]> {
  const result = await db
    .prepare(
      `
      SELECT id, business, lane, priority, owner, tags, title,
             created_at, completed_at, due_date, updated_at, proposed_lane,
             content, file_sha
      FROM business_os_cards
      ORDER BY created_at DESC
    `
    )
    .all<Card>();

  return result.results || [];
}

/**
 * Query all ideas from D1
 */
async function queryIdeas(db: D1Database): Promise<Idea[]> {
  const result = await db
    .prepare(
      `
      SELECT id, status, location, business, tags, created_at, content
      FROM business_os_ideas
      ORDER BY created_at DESC
    `
    )
    .all<Idea>();

  return result.results || [];
}

/**
 * Query all stage docs from D1
 */
async function queryStageDocs(db: D1Database): Promise<StageDoc[]> {
  const result = await db
    .prepare(
      `
      SELECT id, card_id, stage, created_at, content
      FROM business_os_stage_docs
      ORDER BY card_id, stage
    `
    )
    .all<StageDoc>();

  return result.results || [];
}

/**
 * Format card as markdown with frontmatter
 */
function formatCardMarkdown(card: Card): string {
  const frontmatter: Record<string, unknown> = {
    Type: "Card",
    Status: "Active", // Not stored in D1, but present in original files
    Lane: card.lane,
    Priority: card.priority || undefined,
    Owner: card.owner || undefined,
    ID: card.id,
    Title: card.title || undefined,
    Business: card.business || undefined,
    Tags: card.tags ? JSON.parse(card.tags) : undefined,
    Created: card.created_at,
    Updated: card.updated_at,
  };

  // Add optional fields
  if (card.completed_at) {
    frontmatter.Completed = card.completed_at;
  }
  if (card.due_date) {
    frontmatter["Due-Date"] = card.due_date;
  }
  if (card.proposed_lane) {
    frontmatter["Proposed-Lane"] = card.proposed_lane;
  }

  // Remove undefined values
  Object.keys(frontmatter).forEach((key) => {
    if (frontmatter[key] === undefined) {
      delete frontmatter[key];
    }
  });

  return matter.stringify(card.content, frontmatter);
}

/**
 * Format idea as markdown with frontmatter
 */
function formatIdeaMarkdown(idea: Idea): string {
  const frontmatter: Record<string, unknown> = {
    Type: "Idea",
    ID: idea.id,
    Business: idea.business || undefined,
    Status: idea.status,
    "Created-Date": idea.created_at,
    Tags: idea.tags ? JSON.parse(idea.tags) : undefined,
  };

  // Remove undefined values
  Object.keys(frontmatter).forEach((key) => {
    if (frontmatter[key] === undefined) {
      delete frontmatter[key];
    }
  });

  return matter.stringify(idea.content, frontmatter);
}

/**
 * Format stage doc as markdown with frontmatter
 */
function formatStageDocMarkdown(stageDoc: StageDoc): string {
  const frontmatter: Record<string, unknown> = {
    Type: "Stage",
    Created: stageDoc.created_at || undefined,
  };

  // Remove undefined values
  Object.keys(frontmatter).forEach((key) => {
    if (frontmatter[key] === undefined) {
      delete frontmatter[key];
    }
  });

  return matter.stringify(stageDoc.content, frontmatter);
}

/**
 * Get file path for card
 */
function getCardPath(card: Card, repoRoot: string): string {
  return path.join(repoRoot, "docs/business-os/cards", `${card.id}.user.md`);
}

/**
 * Get file path for idea
 */
function getIdeaPath(idea: Idea, repoRoot: string): string {
  const locationDir = idea.location || "inbox";
  return path.join(
    repoRoot,
    "docs/business-os/ideas",
    locationDir,
    `${idea.id}.user.md`
  );
}

/**
 * Get file path for stage doc
 */
function getStageDocPath(stageDoc: StageDoc, repoRoot: string): string {
  return path.join(
    repoRoot,
    "docs/business-os/cards",
    stageDoc.card_id,
    `${stageDoc.stage}.user.md`
  );
}

/**
 * Export cards to markdown files
 */
async function exportCards(
  cards: Card[],
  repoRoot: string,
  dryRun: boolean
): Promise<string[]> {
  const filesWritten: string[] = [];

  for (const card of cards) {
    const filePath = getCardPath(card, repoRoot);
    const markdown = formatCardMarkdown(card);

    if (dryRun) {
      console.log(`[DRY-RUN] Would write: ${path.relative(repoRoot, filePath)}`);
      filesWritten.push(filePath);
    } else {
      await writeFile(filePath, markdown, "utf-8");
      filesWritten.push(filePath);
    }
  }

  return filesWritten;
}

/**
 * Export ideas to markdown files
 */
async function exportIdeas(
  ideas: Idea[],
  repoRoot: string,
  dryRun: boolean
): Promise<string[]> {
  const filesWritten: string[] = [];

  for (const idea of ideas) {
    const filePath = getIdeaPath(idea, repoRoot);
    const markdown = formatIdeaMarkdown(idea);

    if (dryRun) {
      console.log(`[DRY-RUN] Would write: ${path.relative(repoRoot, filePath)}`);
      filesWritten.push(filePath);
    } else {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await mkdir(dir, { recursive: true });
      await writeFile(filePath, markdown, "utf-8");
      filesWritten.push(filePath);
    }
  }

  return filesWritten;
}

/**
 * Export stage docs to markdown files
 */
async function exportStageDocs(
  stageDocs: StageDoc[],
  repoRoot: string,
  dryRun: boolean
): Promise<string[]> {
  const filesWritten: string[] = [];

  for (const stageDoc of stageDocs) {
    const filePath = getStageDocPath(stageDoc, repoRoot);
    const markdown = formatStageDocMarkdown(stageDoc);

    if (dryRun) {
      console.log(`[DRY-RUN] Would write: ${path.relative(repoRoot, filePath)}`);
      filesWritten.push(filePath);
    } else {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await mkdir(dir, { recursive: true });
      await writeFile(filePath, markdown, "utf-8");
      filesWritten.push(filePath);
    }
  }

  return filesWritten;
}

/**
 * Commit and push changes
 */
function commitAndPush(repoRoot: string, filesWritten: number): void {
  const branchName = "work/business-os-export";
  const timestamp = new Date().toISOString();

  console.log("\nCommitting changes to git...");

  try {
    // Check if we're on the right branch
    const currentBranch = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: repoRoot,
      encoding: "utf-8",
    }).trim();

    if (currentBranch !== branchName) {
      console.log(`Switching to branch: ${branchName}`);
      try {
        execSync(`git checkout ${branchName}`, { cwd: repoRoot });
      } catch {
        // Branch doesn't exist, create it
        console.log(`Creating new branch: ${branchName}`);
        execSync(`git checkout -b ${branchName}`, { cwd: repoRoot });
      }
    }

    // Stage all changes in docs/business-os
    execSync("git add docs/business-os/", { cwd: repoRoot });

    // Check if there are changes to commit
    const status = execSync("git status --porcelain docs/business-os/", {
      cwd: repoRoot,
      encoding: "utf-8",
    });

    if (!status.trim()) {
      console.log("No changes to commit (D1 and git are in sync)");
      return;
    }

    // Commit changes
    const commitMessage = `sync: Export Business OS from D1 (${timestamp})

Exported ${filesWritten} files from D1 to docs/business-os/
Auto-generated by export-d1-to-git.ts

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`;

    execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, {
      cwd: repoRoot,
    });

    console.log("✓ Committed changes");

    // Push to remote
    console.log(`Pushing to remote: ${branchName}`);
    execSync(`git push -u origin ${branchName}`, { cwd: repoRoot });

    console.log("✓ Pushed to remote");
    console.log(
      "\nAuto-PR workflow will create/update PR for review and auto-merge"
    );
  } catch (err) {
    console.error("Git operation failed:", err);
    throw err;
  }
}

/**
 * Update last export timestamp in D1
 */
async function updateExportTimestamp(db: D1Database): Promise<void> {
  const timestamp = new Date().toISOString();

  await db
    .prepare(
      `
    INSERT INTO business_os_metadata (key, value, updated_at)
    VALUES ('last_export_at', ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `
    )
    .bind(timestamp, timestamp)
    .run();
}

/**
 * Main export function
 */
async function main(): Promise<void> {
  const { dryRun, commit } = parseArgs();
  const mode = dryRun ? "dry-run" : commit ? "commit" : "dry-run";

  console.log(`Business OS D1 Export (mode: ${mode})`);
  console.log("=".repeat(60));

  // Find repo root
  const repoRoot = path.resolve(__dirname, "../../..");
  console.log(`Repo root: ${repoRoot}`);

  // Get D1 database
  let db: D1Database | null = null;
  try {
    db = await getD1Database();
  } catch (err) {
    console.error("\nError: Could not connect to D1 database");
    console.error(String(err));
    console.error(
      "\nFor actual D1 access, set up wrangler binding and update getD1Database()"
    );
    if (!dryRun && commit) {
      process.exit(1);
    }
    console.log("\nProceeding in dry-run mode with placeholder data...");
  }

  // Query entities from D1
  let cards: Card[] = [];
  let ideas: Idea[] = [];
  let stageDocs: StageDoc[] = [];

  if (db) {
    console.log("\nQuerying D1 database...");
    [cards, ideas, stageDocs] = await Promise.all([
      queryCards(db),
      queryIdeas(db),
      queryStageDocs(db),
    ]);
    console.log(`Found ${cards.length} cards`);
    console.log(`Found ${ideas.length} ideas`);
    console.log(`Found ${stageDocs.length} stage docs`);
  } else {
    console.log("\n[DRY-RUN] No D1 connection - using placeholder counts");
    console.log("Found 0 cards (placeholder)");
    console.log("Found 0 ideas (placeholder)");
    console.log("Found 0 stage docs (placeholder)");
  }

  // Export entities to markdown files
  console.log("\nExporting entities to markdown...");
  const [cardFiles, ideaFiles, stageDocFiles] = await Promise.all([
    exportCards(cards, repoRoot, dryRun),
    exportIdeas(ideas, repoRoot, dryRun),
    exportStageDocs(stageDocs, repoRoot, dryRun),
  ]);

  const totalFiles = cardFiles.length + ideaFiles.length + stageDocFiles.length;

  // Generate report
  const result: ExportResult = {
    cardsExported: cards.length,
    ideasExported: ideas.length,
    stageDocsExported: stageDocs.length,
    filesWritten: [...cardFiles, ...ideaFiles, ...stageDocFiles],
  };

  console.log("\n" + "=".repeat(60));
  console.log(`Business OS Export Report (${mode.toUpperCase()})`);
  console.log("=".repeat(60));
  console.log(`\nCards exported: ${result.cardsExported}`);
  console.log(`Ideas exported: ${result.ideasExported}`);
  console.log(`Stage docs exported: ${result.stageDocsExported}`);
  console.log(`Total files: ${totalFiles}`);

  // Commit and push if requested
  if (commit && !dryRun && totalFiles > 0) {
    commitAndPush(repoRoot, totalFiles);

    // Update export timestamp in D1
    if (db) {
      await updateExportTimestamp(db);
      console.log("\n✓ Updated last_export_at timestamp in D1");
    }
  } else if (commit && dryRun) {
    console.log("\n[DRY-RUN] Would commit and push to work/business-os-export");
  }

  console.log("\n" + "=".repeat(60));
}

// Run main function
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
