/**
 * lp-do-build-results-review-extract.ts
 *
 * Post-authoring extractor for results-review.user.md.
 * Reads the finalized results-review artifact after LLM authoring (SKILL.md step 2),
 * parses and classifies idea candidates using the shared parse module, and writes a
 * structured JSON sidecar:
 *   results-review.signals.json
 *
 * Sidecar schema version: results-review.signals.v1
 *
 * Fail-open: all errors emit warnings; never throws; always exits 0.
 * Atomic write: write to temp, then rename (same pattern as generate-process-improvements.ts).
 *
 * Used by: generate-process-improvements.ts (TASK-04), self-evolving-from-build-output.ts (TASK-05)
 */

import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

import {
  classifyIdeaItem,
  extractBulletItems,
  parseIdeaCandidate,
  parseSections,
  sanitizeText,
  stripHtmlComments,
  toIsoDate,
  type ProcessImprovementItem,
} from "./lp-do-build-results-review-parse.js";

/* ------------------------------------------------------------------ */
/*  Internal helpers (mirrored from generate-process-improvements.ts)  */
/* ------------------------------------------------------------------ */

interface FrontmatterParseResult {
  frontmatter: Record<string, unknown>;
  body: string;
}

function normalizeNewlines(input: string): string {
  return input.replace(/\r\n?/g, "\n");
}

function parseFrontmatter(content: string): FrontmatterParseResult {
  const normalized = normalizeNewlines(content);
  let frontmatter: Record<string, unknown> = {};
  let body = normalized;

  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?/);
  if (match) {
    try {
      // Minimal YAML frontmatter extraction without js-yaml dependency.
      const lines = match[1].split("\n");
      for (const line of lines) {
        const kv = line.match(/^(\w[\w-]*):\s*(.*)\s*$/);
        if (kv && kv[1] && kv[2] !== undefined) {
          frontmatter[kv[1]] = kv[2].trim();
        }
      }
    } catch {
      frontmatter = {};
    }
    body = normalized.slice(match[0].length);
  }

  return { frontmatter, body };
}

function extractFrontmatterString(
  frontmatter: Record<string, unknown>,
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    const value = frontmatter[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function inferBusiness(frontmatter: Record<string, unknown>): string {
  const biz = extractFrontmatterString(frontmatter, ["Business-Unit", "business", "business_scope"]);
  if (!biz) return "BOS";
  const norm = sanitizeText(biz).toUpperCase();
  return norm.length > 0 ? norm : "BOS";
}

function isNonePlaceholder(raw: string): boolean {
  if (/^none\.?$/i.test(raw.trim())) return true;
  if (/^none\b/i.test(raw.trim())) return true;
  const sepMatch = raw.trim().match(/[:—–]\s*/);
  if (sepMatch) {
    const after = raw.trim().slice((sepMatch.index ?? 0) + sepMatch[0].length).trim();
    if (/^none\b/i.test(after)) return true;
  }
  return false;
}

function isStruckThrough(item: string): boolean {
  return /^~~.+~~(\s*\|.*)?$/.test(item.trim());
}

/**
 * Derive a stable, deterministic idea key — SHA-1 of `${sourcePath}::${title}`.
 * Must match deriveIdeaKey() in generate-process-improvements.ts.
 */
function deriveIdeaKey(sourcePath: string, title: string): string {
  return createHash("sha1").update(`${sourcePath}::${title}`).digest("hex");
}

/* ------------------------------------------------------------------ */
/*  Schema types                                                        */
/* ------------------------------------------------------------------ */

export interface ResultsReviewSidecar {
  schema_version: "results-review.signals.v1";
  generated_at: string;
  plan_slug: string;
  source_path: string;
  items: ProcessImprovementItem[];
}

/* ------------------------------------------------------------------ */
/*  Core extract function                                               */
/* ------------------------------------------------------------------ */

/**
 * Extract idea candidates from a finalized results-review.user.md and write
 * results-review.signals.json alongside it.
 *
 * @param planDir - Absolute path to the plan directory.
 * @param options.repoRoot - Repo root for computing relative source_path. Defaults to cwd.
 */
export async function extractResultsReviewSignals(
  planDir: string,
  options: { repoRoot?: string } = {},
): Promise<void> {
  const repoRoot = options.repoRoot ?? process.cwd();
  const sourcePath = path.join(planDir, "results-review.user.md");
  const sidecarPath = path.join(planDir, "results-review.signals.json");
  const tmpPath = `${sidecarPath}.tmp`;

  const planSlug = path.basename(planDir);

  // Guard: .user.md must exist.
  if (!fs.existsSync(sourcePath)) {
    process.stderr.write(
      `[results-review-extract] warn: ${sourcePath} not found, skipping sidecar emit\n`,
    );
    return;
  }

  let raw: string;
  try {
    raw = fs.readFileSync(sourcePath, "utf8");
  } catch (err) {
    process.stderr.write(
      `[results-review-extract] warn: failed to read ${sourcePath}: ${String(err)}\n`,
    );
    return;
  }

  // Parse frontmatter + body.
  const parsed = parseFrontmatter(raw);
  const sections = parseSections(parsed.body);
  const ideasSection = sections.get("new idea candidates");

  const items: ProcessImprovementItem[] = [];

  if (ideasSection) {
    const business = inferBusiness(parsed.frontmatter);
    const dateRaw =
      extractFrontmatterString(parsed.frontmatter, ["Review-date", "date"]) ??
      new Date().toISOString();
    const date = toIsoDate(dateRaw);

    // Relative source path for idea_key derivation (matching generate-process-improvements.ts).
    let relSourcePath: string;
    try {
      relSourcePath = path.relative(repoRoot, sourcePath).replace(/\\/g, "/");
    } catch {
      relSourcePath = sourcePath;
    }

    const ideasRaw = extractBulletItems(stripHtmlComments(ideasSection))
      .filter((item) => !isStruckThrough(item))
      .filter((item) => !isNonePlaceholder(item));

    for (const ideaRaw of ideasRaw) {
      const idea = parseIdeaCandidate(ideaRaw);
      const ideaKey = deriveIdeaKey(relSourcePath, idea.title);

      const ideaItem: ProcessImprovementItem = {
        type: "idea",
        business,
        title: idea.title,
        body: idea.body,
        suggested_action: idea.suggestedAction,
        source: "results-review.user.md",
        date,
        path: relSourcePath,
        idea_key: ideaKey,
      };

      // Classify — fail-open (classifyIdeaItem is wrapped in try/catch internally).
      classifyIdeaItem(ideaItem);

      items.push(ideaItem);
    }
  }

  // Compute relative source_path for the sidecar.
  let relativeSourcePath: string;
  try {
    relativeSourcePath = path.relative(repoRoot, sourcePath).replace(/\\/g, "/");
  } catch {
    relativeSourcePath = sourcePath;
  }

  const sidecar: ResultsReviewSidecar = {
    schema_version: "results-review.signals.v1",
    generated_at: new Date().toISOString(),
    plan_slug: planSlug,
    source_path: relativeSourcePath,
    items,
  };

  // Atomic write: temp file then rename.
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(sidecar, null, 2) + "\n", "utf8");
    fs.renameSync(tmpPath, sidecarPath);
    process.stderr.write(
      `[results-review-extract] info: wrote ${sidecarPath} (${items.length} items)\n`,
    );
  } catch (err) {
    try {
      if (fs.existsSync(tmpPath)) {
        fs.unlinkSync(tmpPath);
      }
    } catch {
      // Ignore cleanup errors.
    }
    process.stderr.write(
      `[results-review-extract] warn: failed to write sidecar at ${sidecarPath}: ${String(err)}\n`,
    );
  }
}

/* ------------------------------------------------------------------ */
/*  CLI entry point                                                     */
/* ------------------------------------------------------------------ */

function parseArgs(argv: string[]): { planDir: string | null; slug: string | null } {
  let planDir: string | null = null;
  let slug: string | null = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--plan-dir" && argv[i + 1]) {
      planDir = argv[i + 1] ?? null;
      i++;
    } else if (argv[i] === "--slug" && argv[i + 1]) {
      slug = argv[i + 1] ?? null;
      i++;
    }
  }
  return { planDir, slug };
}

if (process.argv[1]?.includes("lp-do-build-results-review-extract")) {
  const { planDir } = parseArgs(process.argv.slice(2));
  if (!planDir) {
    process.stderr.write("[results-review-extract] error: --plan-dir is required\n");
    process.exit(0);
  }
  const absDir = path.resolve(planDir);
  extractResultsReviewSignals(absDir).catch((err) => {
    process.stderr.write(`[results-review-extract] warn: unexpected error: ${String(err)}\n`);
  });
}
