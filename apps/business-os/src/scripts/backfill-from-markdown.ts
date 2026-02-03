import path from "node:path";

import matter from "gray-matter";

import type { D1Database } from "@acme/platform-core/d1";
import {
  appendAuditEntry,
  type Card,
  CardSchema,
  getCardById,
  getIdeaById,
  getLatestStageDoc,
  type Idea,
  type IdeaLocation,
  IdeaSchema,
  type StageDoc,
  StageDocSchema,
  type StageType,
  upsertCard,
  upsertIdea,
  upsertStageDoc,
} from "@acme/platform-core/repositories/businessOs.server";

import { computeEntitySha } from "@/lib/entity-sha";
import { getRepoRoot, isValidRepoRoot } from "@/lib/get-repo-root";
import { readdirWithinRoot, readFileWithinRoot } from "@/lib/safe-fs";

type BackfillRepositories = {
  getCardById: typeof getCardById;
  upsertCard: typeof upsertCard;
  getIdeaById: typeof getIdeaById;
  upsertIdea: typeof upsertIdea;
  getLatestStageDoc: typeof getLatestStageDoc;
  upsertStageDoc: typeof upsertStageDoc;
  appendAuditEntry: typeof appendAuditEntry;
};

type BackfillStats = {
  inserted: number;
  skippedExisting: number;
  conflicts: number;
  wouldInsert: number;
};

type BackfillResult = {
  stats: {
    cards: BackfillStats;
    ideas: BackfillStats;
    stageDocs: BackfillStats;
  };
  conflicts: Array<{
    entityType: "card" | "idea" | "stage_doc";
    entityId: string;
    reason: string;
  }>;
  validationFailures: Array<{
    entityType: "card" | "idea" | "stage_doc";
    entityId: string;
    reason: string;
  }>;
  countersUpdated: Array<{ key: string; value: number }>;
};

type BackfillOptions = {
  db: D1Database;
  repoRoot: string;
  dryRun?: boolean;
  validate?: boolean;
  repositories?: BackfillRepositories;
};

type ParsedMarkdown<T> = {
  entity: T;
  rawContent: string;
  frontmatterOrder: string[];
};

type IdeaEntry = ParsedMarkdown<Idea> & { location: IdeaLocation };

type StageDocEntry = ParsedMarkdown<StageDoc> & { cardId: string; stage: StageType };

const DEFAULT_REPOSITORIES: BackfillRepositories = {
  getCardById,
  upsertCard,
  getIdeaById,
  upsertIdea,
  getLatestStageDoc,
  upsertStageDoc,
  appendAuditEntry,
};

const STAGE_FILES: StageType[] = ["fact-find", "plan", "build", "reflect"];

const AUDIT_SOURCE = "backfill";
const REASON_CARD_CONFLICT = "Existing card differs from markdown"; // i18n-exempt -- BOS-00 [ttl=2026-03-31]
const REASON_IDEA_CONFLICT = "Existing idea differs from markdown"; // i18n-exempt -- BOS-00 [ttl=2026-03-31]
const REASON_STAGE_CONFLICT = "Existing stage doc differs from markdown"; // i18n-exempt -- BOS-00 [ttl=2026-03-31]
const REASON_IDEA_MISSING_ID = "Idea missing ID"; // i18n-exempt -- BOS-00 [ttl=2026-03-31]
const REASON_CARD_MISSING = "Card missing after backfill"; // i18n-exempt -- BOS-00 [ttl=2026-03-31]
const REASON_IDEA_MISSING = "Idea missing after backfill"; // i18n-exempt -- BOS-00 [ttl=2026-03-31]
const REASON_STAGE_MISSING = "Stage doc missing after backfill"; // i18n-exempt -- BOS-00 [ttl=2026-03-31]
const REASON_MARKDOWN_MISMATCH = "Serialized markdown mismatch"; // i18n-exempt -- BOS-00 [ttl=2026-03-31]
const ERROR_UPSERT_CARD_PREFIX = "Failed to upsert card"; // i18n-exempt -- BOS-00 [ttl=2026-03-31]
const ERROR_UPSERT_IDEA_PREFIX = "Failed to upsert idea"; // i18n-exempt -- BOS-00 [ttl=2026-03-31]
const ERROR_UPSERT_STAGE_PREFIX = "Failed to upsert stage doc"; // i18n-exempt -- BOS-00 [ttl=2026-03-31]
const ERROR_INVALID_REPO_ROOT_PREFIX = "Invalid repo root:"; // i18n-exempt -- BOS-00 [ttl=2026-03-31]
const ERROR_MISSING_BINDING =
  "BUSINESS_OS_DB binding not found. Run this script in a Cloudflare runtime (wrangler pages dev) or inject the D1 binding before execution."; // i18n-exempt -- BOS-00 [ttl=2026-03-31]
const ERROR_BACKFILL_CONFLICTS =
  "Backfill completed with conflicts or validation failures"; // i18n-exempt -- BOS-00 [ttl=2026-03-31]

function createEmptyStats(): BackfillStats {
  return {
    inserted: 0,
    skippedExisting: 0,
    conflicts: 0,
    wouldInsert: 0,
  };
}

function normalizeMarkdown(content: string): string {
  const unix = content.replace(/\r\n/g, "\n");
  const trimmed = unix
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/u, ""))
    .join("\n");
  return `${trimmed.replace(/\n*$/u, "")}\n`;
}

function removeUndefinedValues(input: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

function orderFrontmatterKeys(
  input: Record<string, unknown>,
  keyOrder: string[]
): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  const remaining = new Set(Object.keys(input));

  for (const key of keyOrder) {
    if (remaining.has(key)) {
      ordered[key] = input[key];
      remaining.delete(key);
    }
  }

  for (const key of Array.from(remaining).sort()) {
    ordered[key] = input[key];
  }

  return ordered;
}

function serializeMarkdown(
  content: string,
  frontmatter: Record<string, unknown>,
  keyOrder: string[]
): string {
  const cleaned = removeUndefinedValues(frontmatter);
  const ordered = orderFrontmatterKeys(cleaned, keyOrder);
  return normalizeMarkdown(matter.stringify(content, ordered));
}

function toRelativePath(repoRoot: string, absolutePath: string): string {
  const relativePath = path.relative(repoRoot, absolutePath);
  return relativePath.split(path.sep).join("/");
}

function stripEntitySha<T extends Record<string, unknown>>(entity: T): Record<string, unknown> {
  const { fileSha: _fileSha, ...rest } = entity as { fileSha?: string } & Record<string, unknown>;
  return rest;
}

async function isEntityMatch(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>
): Promise<boolean> {
  const [existingSha, incomingSha] = await Promise.all([
    computeEntitySha(stripEntitySha(existing)),
    computeEntitySha(stripEntitySha(incoming)),
  ]);
  return existingSha === incomingSha;
}

function buildFrontmatter(entity: Record<string, unknown>): Record<string, unknown> {
  const { content: _content, filePath: _filePath, fileSha: _fileSha, ...frontmatter } = entity;
  return frontmatter;
}

function extractCounterId(id: string): { prefix: string; value: number } | null {
  const parts = id.split("-");
  if (parts.length < 2) return null;
  const numericPart = parts[parts.length - 1] ?? "";
  if (!/^\d+$/u.test(numericPart)) return null;
  const prefix = parts.slice(0, -1).join("-");
  const value = Number.parseInt(numericPart, 10);
  if (!Number.isFinite(value)) return null;
  return { prefix, value };
}

async function readMarkdownFile(
  repoRoot: string,
  absolutePath: string
): Promise<{ data: Record<string, unknown>; content: string; raw: string; frontmatterOrder: string[] }> {
  const rawContent = (await readFileWithinRoot(repoRoot, absolutePath, "utf-8")) as string;
  const parsed = matter(rawContent);
  const data = parsed.data as Record<string, unknown>;
  const frontmatterOrder = Object.keys(data);
  return { data, content: parsed.content, raw: rawContent, frontmatterOrder };
}

async function readCardEntries(repoRoot: string): Promise<Array<ParsedMarkdown<Card>>> {
  const cards: Array<ParsedMarkdown<Card>> = [];
  const cardsPath = path.join(repoRoot, "docs/business-os/cards");
  const entries = await readdirWithinRoot(repoRoot, cardsPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".user.md")) {
      const filePath = path.join(cardsPath, entry.name);
      const { data, content, raw, frontmatterOrder } = await readMarkdownFile(repoRoot, filePath);
      const relativePath = toRelativePath(repoRoot, filePath);
      const cardBase = CardSchema.parse({
        ...data,
        content,
        filePath: relativePath,
      });
      const fileSha = await computeEntitySha(cardBase as Record<string, unknown>);
      const card = CardSchema.parse({ ...cardBase, fileSha });
      cards.push({ entity: card, rawContent: raw, frontmatterOrder });
    }
  }

  const archivePath = path.join(cardsPath, "archive");
  const archiveEntries = await readdirWithinRoot(repoRoot, archivePath, { withFileTypes: true }).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return [];
      throw error;
    }
  );

  for (const entry of archiveEntries) {
    if (!entry.isFile() || !entry.name.endsWith(".user.md")) continue;
    const filePath = path.join(archivePath, entry.name);
    const { data, content, raw, frontmatterOrder } = await readMarkdownFile(repoRoot, filePath);
    const relativePath = toRelativePath(repoRoot, filePath);
    const cardBase = CardSchema.parse({
      ...data,
      content,
      filePath: relativePath,
    });
    const fileSha = await computeEntitySha(cardBase as Record<string, unknown>);
    const card = CardSchema.parse({ ...cardBase, fileSha });
    cards.push({ entity: card, rawContent: raw, frontmatterOrder });
  }

  return cards;
}

async function readIdeaEntries(repoRoot: string): Promise<IdeaEntry[]> {
  const ideaEntries: IdeaEntry[] = [];
  const ideaDirs: Array<{ dir: string; location: IdeaLocation }> = [
    { dir: "docs/business-os/ideas/inbox", location: "inbox" },
    { dir: "docs/business-os/ideas/inbox/archive", location: "inbox" },
    { dir: "docs/business-os/ideas/worked", location: "worked" },
    { dir: "docs/business-os/ideas/worked/archive", location: "worked" },
  ];

  for (const { dir, location } of ideaDirs) {
    const absoluteDir = path.join(repoRoot, dir);
    const entries = await readdirWithinRoot(repoRoot, absoluteDir, { withFileTypes: true }).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return [];
        throw error;
      }
    );

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".user.md")) continue;
      const filePath = path.join(absoluteDir, entry.name);
      const { data, content, raw, frontmatterOrder } = await readMarkdownFile(repoRoot, filePath);
      const relativePath = toRelativePath(repoRoot, filePath);
      const ideaBase = IdeaSchema.parse({
        ...data,
        content,
        filePath: relativePath,
      });
      const fileSha = await computeEntitySha(ideaBase as Record<string, unknown>);
      const idea = IdeaSchema.parse({ ...ideaBase, fileSha });
      ideaEntries.push({ entity: idea, rawContent: raw, frontmatterOrder, location });
    }
  }

  return ideaEntries;
}

async function readStageDocEntries(repoRoot: string): Promise<StageDocEntry[]> {
  const stageDocs: StageDocEntry[] = [];
  const cardsPath = path.join(repoRoot, "docs/business-os/cards");
  const entries = await readdirWithinRoot(repoRoot, cardsPath, { withFileTypes: true }).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return [];
      throw error;
    }
  );

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === "archive") continue;
    if (entry.name.startsWith(".")) continue;

    const cardDir = path.join(cardsPath, entry.name);
    const stageEntries = await readdirWithinRoot(repoRoot, cardDir, { withFileTypes: true }).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return [];
        throw error;
      }
    );

    for (const stageEntry of stageEntries) {
      if (!stageEntry.isFile()) continue;
      const stageName = stageEntry.name.replace(/\.user\.md$/u, "");
      if (!STAGE_FILES.includes(stageName as StageType)) continue;

      const filePath = path.join(cardDir, stageEntry.name);
      const { data, content, raw, frontmatterOrder } = await readMarkdownFile(repoRoot, filePath);
      const relativePath = toRelativePath(repoRoot, filePath);

      const stageDocBase = StageDocSchema.parse({
        ...data,
        content,
        filePath: relativePath,
      });
      const fileSha = await computeEntitySha(stageDocBase as Record<string, unknown>);
      const stageDoc = StageDocSchema.parse({ ...stageDocBase, fileSha });

      stageDocs.push({
        entity: stageDoc,
        rawContent: raw,
        frontmatterOrder,
        cardId: stageDoc["Card-ID"],
        stage: stageDoc.Stage,
      });
    }
  }

  return stageDocs;
}

async function updateCounter(db: D1Database, key: string, value: number): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `
      INSERT INTO business_os_metadata (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `
    )
    .bind(key, String(value), now)
    .run();
}

async function updateCounters(
  db: D1Database,
  cardEntries: Array<ParsedMarkdown<Card>>,
  ideaEntries: IdeaEntry[]
): Promise<Array<{ key: string; value: number }>> {
  const counters = new Map<string, number>();

  for (const entry of cardEntries) {
    const extracted = extractCounterId(entry.entity.ID);
    if (!extracted) continue;
    const key = `counter:card:${extracted.prefix}`;
    counters.set(key, Math.max(counters.get(key) ?? 0, extracted.value));
  }

  for (const entry of ideaEntries) {
    const ideaId = entry.entity.ID;
    if (!ideaId) continue;
    const extracted = extractCounterId(ideaId);
    if (!extracted) continue;
    const key = `counter:idea:${extracted.prefix}`;
    counters.set(key, Math.max(counters.get(key) ?? 0, extracted.value));
  }

  const updates: Array<{ key: string; value: number }> = [];
  for (const [key, value] of counters) {
    await updateCounter(db, key, value);
    updates.push({ key, value });
  }

  return updates;
}

async function backfillCards(params: {
  db: D1Database;
  repositories: BackfillRepositories;
  entries: Array<ParsedMarkdown<Card>>;
  dryRun: boolean;
  stats: BackfillStats;
  conflicts: BackfillResult["conflicts"];
}): Promise<void> {
  const { db, repositories, entries, dryRun, stats, conflicts } = params;

  for (const entry of entries) {
    const existing = await repositories.getCardById(db, entry.entity.ID);
    if (existing) {
      const matches = await isEntityMatch(existing, entry.entity as Record<string, unknown>);
      if (matches) {
        stats.skippedExisting += 1;
        continue;
      }
      stats.conflicts += 1;
      conflicts.push({
        entityType: "card",
        entityId: entry.entity.ID,
        reason: REASON_CARD_CONFLICT,
      });
      continue;
    }

    if (dryRun) {
      stats.wouldInsert += 1;
      continue;
    }

    const result = await repositories.upsertCard(db, entry.entity, null);
    if (!result.success) {
      throw new Error(`${ERROR_UPSERT_CARD_PREFIX} ${entry.entity.ID}`);
    }
    stats.inserted += 1;

    await repositories.appendAuditEntry(db, {
      entity_type: "card",
      entity_id: entry.entity.ID,
      action: "create",
      actor: AUDIT_SOURCE,
      changes_json: JSON.stringify({ source: AUDIT_SOURCE }),
    });
  }
}

async function backfillIdeas(params: {
  db: D1Database;
  repositories: BackfillRepositories;
  entries: IdeaEntry[];
  dryRun: boolean;
  stats: BackfillStats;
  conflicts: BackfillResult["conflicts"];
}): Promise<void> {
  const { db, repositories, entries, dryRun, stats, conflicts } = params;

  for (const entry of entries) {
    const ideaId = entry.entity.ID ?? "";
    if (!ideaId) {
      stats.conflicts += 1;
      conflicts.push({
        entityType: "idea",
        entityId: "(missing)",
        reason: REASON_IDEA_MISSING_ID,
      });
      continue;
    }

    const existing = await repositories.getIdeaById(db, ideaId);
    if (existing) {
      const matches = await isEntityMatch(existing, entry.entity as Record<string, unknown>);
      if (matches) {
        stats.skippedExisting += 1;
        continue;
      }
      stats.conflicts += 1;
      conflicts.push({
        entityType: "idea",
        entityId: ideaId,
        reason: REASON_IDEA_CONFLICT,
      });
      continue;
    }

    if (dryRun) {
      stats.wouldInsert += 1;
      continue;
    }

    const result = await repositories.upsertIdea(db, entry.entity, entry.location);
    if (!result.success) {
      throw new Error(`${ERROR_UPSERT_IDEA_PREFIX} ${ideaId}`);
    }
    stats.inserted += 1;

    await repositories.appendAuditEntry(db, {
      entity_type: "idea",
      entity_id: ideaId,
      action: "create",
      actor: AUDIT_SOURCE,
      changes_json: JSON.stringify({ source: AUDIT_SOURCE }),
    });
  }
}

async function backfillStageDocs(params: {
  db: D1Database;
  repositories: BackfillRepositories;
  entries: StageDocEntry[];
  dryRun: boolean;
  stats: BackfillStats;
  conflicts: BackfillResult["conflicts"];
}): Promise<void> {
  const { db, repositories, entries, dryRun, stats, conflicts } = params;

  for (const entry of entries) {
    const existing = await repositories.getLatestStageDoc(db, entry.cardId, entry.stage);
    if (existing) {
      const matches = await isEntityMatch(existing, entry.entity as Record<string, unknown>);
      if (matches) {
        stats.skippedExisting += 1;
        continue;
      }
      stats.conflicts += 1;
      conflicts.push({
        entityType: "stage_doc",
        entityId: `${entry.cardId}:${entry.stage}`,
        reason: REASON_STAGE_CONFLICT,
      });
      continue;
    }

    if (dryRun) {
      stats.wouldInsert += 1;
      continue;
    }

    const result = await repositories.upsertStageDoc(db, entry.entity, null);
    if (!result.success) {
      throw new Error(`${ERROR_UPSERT_STAGE_PREFIX} ${entry.cardId}:${entry.stage}`);
    }
    stats.inserted += 1;

    await repositories.appendAuditEntry(db, {
      entity_type: "stage_doc",
      entity_id: `${entry.cardId}:${entry.stage}`,
      action: "create",
      actor: AUDIT_SOURCE,
      changes_json: JSON.stringify({ source: AUDIT_SOURCE }),
    });
  }
}

async function validateCards(params: {
  db: D1Database;
  repositories: BackfillRepositories;
  entries: Array<ParsedMarkdown<Card>>;
  validationFailures: BackfillResult["validationFailures"];
}): Promise<void> {
  const { db, repositories, entries, validationFailures } = params;

  for (const entry of entries) {
    const dbCard = await repositories.getCardById(db, entry.entity.ID);
    if (!dbCard) {
      validationFailures.push({
        entityType: "card",
        entityId: entry.entity.ID,
        reason: REASON_CARD_MISSING,
      });
      continue;
    }
    const expected = normalizeMarkdown(entry.rawContent);
    const actual = serializeMarkdown(
      dbCard.content,
      buildFrontmatter(dbCard as Record<string, unknown>),
      entry.frontmatterOrder
    );
    if (expected !== actual) {
      validationFailures.push({
        entityType: "card",
        entityId: entry.entity.ID,
        reason: REASON_MARKDOWN_MISMATCH,
      });
    }
  }
}

async function validateIdeas(params: {
  db: D1Database;
  repositories: BackfillRepositories;
  entries: IdeaEntry[];
  validationFailures: BackfillResult["validationFailures"];
}): Promise<void> {
  const { db, repositories, entries, validationFailures } = params;

  for (const entry of entries) {
    const ideaId = entry.entity.ID ?? "";
    if (!ideaId) continue;
    const dbIdea = await repositories.getIdeaById(db, ideaId);
    if (!dbIdea) {
      validationFailures.push({
        entityType: "idea",
        entityId: ideaId,
        reason: REASON_IDEA_MISSING,
      });
      continue;
    }
    const expected = normalizeMarkdown(entry.rawContent);
    const actual = serializeMarkdown(
      dbIdea.content,
      buildFrontmatter(dbIdea as Record<string, unknown>),
      entry.frontmatterOrder
    );
    if (expected !== actual) {
      validationFailures.push({
        entityType: "idea",
        entityId: ideaId,
        reason: REASON_MARKDOWN_MISMATCH,
      });
    }
  }
}

async function validateStageDocs(params: {
  db: D1Database;
  repositories: BackfillRepositories;
  entries: StageDocEntry[];
  validationFailures: BackfillResult["validationFailures"];
}): Promise<void> {
  const { db, repositories, entries, validationFailures } = params;

  for (const entry of entries) {
    const dbStage = await repositories.getLatestStageDoc(db, entry.cardId, entry.stage);
    if (!dbStage) {
      validationFailures.push({
        entityType: "stage_doc",
        entityId: `${entry.cardId}:${entry.stage}`,
        reason: REASON_STAGE_MISSING,
      });
      continue;
    }
    const expected = normalizeMarkdown(entry.rawContent);
    const actual = serializeMarkdown(
      dbStage.content,
      buildFrontmatter(dbStage as Record<string, unknown>),
      entry.frontmatterOrder
    );
    if (expected !== actual) {
      validationFailures.push({
        entityType: "stage_doc",
        entityId: `${entry.cardId}:${entry.stage}`,
        reason: REASON_MARKDOWN_MISMATCH,
      });
    }
  }
}

export async function backfillFromMarkdown(options: BackfillOptions): Promise<BackfillResult> {
  const { db, repoRoot, dryRun = false, validate = !dryRun } = options;
  const repositories = options.repositories ?? DEFAULT_REPOSITORIES;

  const stats = {
    cards: createEmptyStats(),
    ideas: createEmptyStats(),
    stageDocs: createEmptyStats(),
  };
  const conflicts: BackfillResult["conflicts"] = [];
  const validationFailures: BackfillResult["validationFailures"] = [];

  const cardEntries = await readCardEntries(repoRoot);
  const ideaEntries = await readIdeaEntries(repoRoot);
  const stageDocEntries = await readStageDocEntries(repoRoot);

  await backfillCards({
    db,
    repositories,
    entries: cardEntries,
    dryRun,
    stats: stats.cards,
    conflicts,
  });

  await backfillIdeas({
    db,
    repositories,
    entries: ideaEntries,
    dryRun,
    stats: stats.ideas,
    conflicts,
  });

  await backfillStageDocs({
    db,
    repositories,
    entries: stageDocEntries,
    dryRun,
    stats: stats.stageDocs,
    conflicts,
  });

  let countersUpdated: Array<{ key: string; value: number }> = [];
  if (!dryRun) {
    countersUpdated = await updateCounters(db, cardEntries, ideaEntries);
  }

  if (validate && !dryRun) {
    await validateCards({ db, repositories, entries: cardEntries, validationFailures });
    await validateIdeas({ db, repositories, entries: ideaEntries, validationFailures });
    await validateStageDocs({ db, repositories, entries: stageDocEntries, validationFailures });
  }

  return {
    stats,
    conflicts,
    validationFailures,
    countersUpdated,
  };
}

function parseArgs(args: string[]): { repoRoot: string; dryRun: boolean; validate: boolean } {
  let repoRoot = getRepoRoot();
  let dryRun = false;
  let validate = true;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--repo-root") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--repo-root requires a value");
      }
      repoRoot = value;
      index += 1;
      continue;
    }
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (arg === "--no-validate") {
      validate = false;
      continue;
    }
  }

  if (!isValidRepoRoot(repoRoot)) {
    throw new Error(`${ERROR_INVALID_REPO_ROOT_PREFIX} ${repoRoot}`);
  }

  return { repoRoot, dryRun, validate };
}

async function runCli(): Promise<void> {
  const { repoRoot, dryRun, validate } = parseArgs(process.argv.slice(2));
  const { getD1FromGlobalThis } = await import(
    "@acme/platform-core/d1" // i18n-exempt -- BOS-00 [ttl=2026-03-31]
  );
  const db = getD1FromGlobalThis("BUSINESS_OS_DB");

  if (!db) {
    throw new Error(ERROR_MISSING_BINDING);
  }

  const result = await backfillFromMarkdown({
    db,
    repoRoot,
    dryRun,
    validate,
  });

  const summary = {
    stats: result.stats,
    conflicts: result.conflicts.length,
    validationFailures: result.validationFailures.length,
    countersUpdated: result.countersUpdated.length,
  };

  console.info(JSON.stringify(summary, null, 2));

  if (result.conflicts.length > 0 || result.validationFailures.length > 0) {
    throw new Error(ERROR_BACKFILL_CONFLICTS);
  }
}

if (require.main === module) {
  runCli().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
