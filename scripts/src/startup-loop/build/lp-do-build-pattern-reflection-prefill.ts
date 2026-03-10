/**
 * lp-do-build-pattern-reflection-prefill.ts
 *
 * Deterministic auto-generator for `pattern-reflection.user.md`.
 * Scans archived results-review files for recurrent idea patterns,
 * applies the routing decision tree (Section 4.1, pattern-reflection.v1),
 * and produces a YAML-frontmatter markdown artifact.
 *
 * `deriveRecurrenceKey(title)` is LOCAL — differs from `deriveIdeaKey()`
 * which includes sourcePath (producing artificially low cross-plan counts).
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";

export interface PatternReflectionInput {
  featureSlug: string;
  currentIdeas: Array<{ title: string; category?: string; reason?: string; evidence_refs?: string[] }>;
  archiveDir: string;
  generatedAt?: string;
}

export type PatternCategory = "deterministic" | "ad_hoc" | "access_gap" | "unclassified";
export type RoutingTarget = "loop_update" | "skill_proposal" | "defer";

export interface PatternEntry {
  pattern_summary: string;
  category: PatternCategory;
  routing_target: RoutingTarget;
  occurrence_count: number;
  evidence_refs: string[];
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().trim().replace(/\s+/g, " ");
}

export function deriveRecurrenceKey(title: string): string {
  return createHash("sha1").update(normalizeTitle(title)).digest("hex");
}

function extractIdeasSection(markdown: string): string | null {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  let capturing = false;
  const buffer: string[] = [];
  for (const line of lines) {
    const hm = line.match(/^##\s+(.+?)\s*$/);
    if (hm) {
      if (capturing) break;
      const heading = hm[1].replace(/\*\*/g, "").replace(/`([^`]+)`/g, "$1").trim().toLowerCase();
      if (heading === "new idea candidates") capturing = true;
      continue;
    }
    if (capturing) buffer.push(line);
  }
  return capturing ? buffer.join("\n") : null;
}

function isNonePlaceholder(content: string): boolean {
  if (/^none\.?$/i.test(content) || /^none\b/i.test(content)) return true;
  const sep = content.match(/[:—–]\s*/);
  if (sep) {
    const after = content.slice((sep.index ?? 0) + sep[0].length).trim();
    if (/^none\b/i.test(after)) return true;
  }
  return false;
}

function cleanTitle(raw: string): string {
  return raw
    .replace(/^\*\*([^*]+)\*\*:?\s*/g, "$1 ")
    .replace(/^idea:\s*/i, "")
    .replace(/^trigger observation:\s*/i, "")
    .replace(/^suggested next action:\s*/i, "")
    .replace(/^Category\s+\d+\s*[—\-]+\s*[^:]+:\s*/i, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtmlComments(text: string): string {
  return text.replace(/<!--[\s\S]*?-->/g, "");
}

/**
 * Maps human-readable results-review category prefixes to PatternCategory values.
 * Keys are lowercased prefix fragments matched against the bullet content start.
 */
const CATEGORY_PREFIX_MAP: Array<[RegExp, PatternCategory]> = [
  [/^ai[-\s]to[-\s]mechanistic\b/i, "deterministic"],
  [/^new\s+loop\s+process\b/i, "deterministic"],
  [/^new\s+skill\b/i, "ad_hoc"],
  [/^new\s+open[-\s]source\s+package\b/i, "ad_hoc"],
  [/^new\s+standing\s+data\s+source\b/i, "ad_hoc"],
];

function extractCategoryFromPrefix(raw: string): PatternCategory | undefined {
  for (const [pattern, category] of CATEGORY_PREFIX_MAP) {
    if (pattern.test(raw.trim())) return category;
  }
  return undefined;
}

function extractBulletTitles(sectionBody: string): string[] {
  const titles: string[] = [];
  for (const line of stripHtmlComments(sectionBody).replace(/\r\n?/g, "\n").split("\n")) {
    const bm = line.trim().match(/^(?:[-*]|\d+\.)\s+(.+)/);
    if (!bm) continue;
    const content = bm[1].trim();
    if (isNonePlaceholder(content)) continue;
    const cleaned = cleanTitle(content.split("|")[0].trim());
    if (cleaned.length > 0) titles.push(cleaned);
  }
  return titles;
}

interface BulletEntry {
  title: string;
  category?: PatternCategory;
}

function extractBulletEntries(sectionBody: string): BulletEntry[] {
  const entries: BulletEntry[] = [];
  for (const line of stripHtmlComments(sectionBody).replace(/\r\n?/g, "\n").split("\n")) {
    const bm = line.trim().match(/^(?:[-*]|\d+\.)\s+(.+)/);
    if (!bm) continue;
    const content = bm[1].trim();
    if (isNonePlaceholder(content)) continue;
    const rawForCategory = content.split("|")[0].trim();
    const category = extractCategoryFromPrefix(rawForCategory);
    const cleaned = cleanTitle(rawForCategory);
    if (cleaned.length > 0) entries.push({ title: cleaned, category });
  }
  return entries;
}

export function scanArchiveForRecurrences(
  archiveDir: string,
  currentIdeas: Array<{ title: string }>,
): Map<string, { count: number; refs: string[] }> {
  const map = new Map<string, { count: number; refs: string[] }>();
  for (const idea of currentIdeas) {
    const key = deriveRecurrenceKey(idea.title);
    if (!map.has(key)) map.set(key, { count: 1, refs: [] });
  }
  let entries: string[];
  try { entries = fs.readdirSync(archiveDir); } catch { return map; }

  for (const entry of entries.sort()) {
    const reviewPath = path.join(archiveDir, entry, "results-review.user.md");
    let raw: string;
    try { raw = fs.readFileSync(reviewPath, "utf-8"); } catch { continue; }
    const section = extractIdeasSection(raw);
    if (!section) continue;
    const relPath = `docs/plans/_archive/${entry}/results-review.user.md`;
    for (const title of extractBulletTitles(section)) {
      const key = deriveRecurrenceKey(title);
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        if (!existing.refs.includes(relPath)) existing.refs.push(relPath);
      }
    }
  }
  return map;
}

export function applyRoutingDecisionTree(
  category: PatternCategory,
  occurrenceCount: number,
): RoutingTarget {
  if (category === "unclassified") return "defer";
  if (category === "deterministic") return occurrenceCount >= 3 ? "loop_update" : "defer";
  if (category === "ad_hoc") return occurrenceCount >= 2 ? "skill_proposal" : "defer";
  return "defer"; // access_gap
}

function escapeYaml(value: string): string {
  if (/[:#'"\n]/.test(value) || value !== value.trim()) {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return value;
}

function renderFrontmatter(slug: string, ts: string, entries: PatternEntry[]): string {
  const l: string[] = ["---", "schema_version: pattern-reflection.v1", `feature_slug: ${slug}`, `generated_at: ${ts}`];
  if (entries.length === 0) {
    l.push("entries: []");
  } else {
    l.push("entries:");
    for (const e of entries) {
      l.push(`  - pattern_summary: ${escapeYaml(e.pattern_summary)}`);
      l.push(`    category: ${e.category}`);
      l.push(`    routing_target: ${e.routing_target}`);
      l.push(`    occurrence_count: ${e.occurrence_count}`);
      if (e.evidence_refs.length > 0) {
        l.push("    evidence_refs:");
        for (const ref of e.evidence_refs) l.push(`      - ${ref}`);
      }
    }
  }
  l.push("---");
  return l.join("\n");
}

const EMPTY_BODY = "\n\n# Pattern Reflection\n\n## Patterns\n\nNone identified.\n\n## Access Declarations\n\nNone identified.\n";

export function prefillPatternReflection(input: PatternReflectionInput): string {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const ideas = input.currentIdeas.filter(
    (i) => i.title && !/^none\.?$/i.test(i.title.trim()),
  );

  if (ideas.length === 0) {
    process.stderr.write("[pre-fill] pattern-reflection: 0 entries, 0 promoted\n");
    return renderFrontmatter(input.featureSlug, generatedAt, []) + EMPTY_BODY;
  }

  const recurrenceMap = scanArchiveForRecurrences(input.archiveDir, ideas);
  const entries: PatternEntry[] = [];
  for (const idea of ideas) {
    const key = deriveRecurrenceKey(idea.title);
    const rec = recurrenceMap.get(key) ?? { count: 1, refs: [] };
    const category: PatternCategory = (idea.category as PatternCategory | undefined) ?? "unclassified";
    const summary = idea.title.length > 100 ? idea.title.slice(0, 97) + "..." : idea.title;
    entries.push({
      pattern_summary: summary,
      category,
      routing_target: applyRoutingDecisionTree(category, rec.count),
      occurrence_count: rec.count,
      evidence_refs: rec.refs,
    });
  }

  const promoted = entries.filter((e) => e.routing_target !== "defer").length;
  process.stderr.write(`[pre-fill] pattern-reflection: ${entries.length} entries, ${promoted} promoted\n`);

  const patternLines = entries.map(
    (e) => `- \`${e.category}\` | \`${e.pattern_summary}\` | routing: \`${e.routing_target}\` | occurrences: \`${e.occurrence_count}\``,
  );
  return `${renderFrontmatter(input.featureSlug, generatedAt, entries)}\n\n# Pattern Reflection\n\n## Patterns\n\n${patternLines.join("\n")}\n\n## Access Declarations\n\nNone identified.\n`;
}

const PLACEHOLDER_PATTERN = /<FILL>|<TBD>|\[FILL\]|\[TBD\]/;

/**
 * Returns true when the LLM refinement step should run for a pattern-reflection artifact.
 * Returns false (skip model) when the artifact is already deterministically complete:
 *   - no placeholder markers present,
 *   - no unclassified entries in the YAML frontmatter,
 *   - all required fields are present (schema_version, feature_slug, generated_at, entries).
 */
export function computeNeedsRefinement(
  prefillOutput: string,
  currentIdeas: Array<{ category?: string }>,
): boolean {
  // Gate 1: placeholder markers
  if (PLACEHOLDER_PATTERN.test(prefillOutput)) return true;

  // Gate 2: any unclassified entry
  if (currentIdeas.some((i) => !i.category || i.category === "unclassified")) return true;
  // Also check the rendered YAML for unclassified category lines
  if (/^\s+category:\s+unclassified\s*$/m.test(prefillOutput)) return true;

  // Gate 3: required YAML fields present
  const requiredFields = ["schema_version:", "feature_slug:", "generated_at:", "entries"];
  if (!requiredFields.every((f) => prefillOutput.includes(f))) return true;

  return false;
}

function extractCurrentIdeas(reviewPath: string): Array<{ title: string; category?: string; reason?: string; evidence_refs?: string[] }> {
  let raw: string;
  try { raw = fs.readFileSync(reviewPath, "utf-8"); } catch { return []; }
  const section = extractIdeasSection(raw);
  if (!section) return [];
  return extractBulletEntries(section).map((entry) => ({
    title: entry.title,
    category: entry.category,
    reason: undefined,
    evidence_refs: [],
  }));
}

function parseArgs(argv: string[]): { slug: string; planDir: string; archiveDir: string } {
  let slug = "", planDir = "", archiveDir = "";
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--slug" && i + 1 < argv.length) slug = argv[++i];
    else if (a === "--plan-dir" && i + 1 < argv.length) planDir = argv[++i];
    else if (a === "--archive-dir" && i + 1 < argv.length) archiveDir = argv[++i];
  }
  if (!slug || !planDir) {
    process.stderr.write("Usage: lp-do-build-pattern-reflection-prefill --slug <slug> --plan-dir <dir> [--archive-dir <dir>]\n");
    process.exit(1);
  }
  if (!archiveDir) archiveDir = path.join(path.dirname(planDir), "_archive");
  return { slug, planDir, archiveDir };
}

function getRepoRoot(): string {
  try {
    const { execSync } = require("node:child_process") as typeof import("node:child_process");
    return execSync("git rev-parse --show-toplevel", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return process.cwd();
  }
}

export function main(): void {
  const { slug, planDir, archiveDir } = parseArgs(process.argv);
  const repoRoot = getRepoRoot();
  const resolvedPlanDir = path.resolve(repoRoot, planDir);
  const resolvedArchiveDir = path.resolve(repoRoot, archiveDir);
  const currentIdeas = extractCurrentIdeas(path.join(resolvedPlanDir, "results-review.user.md"));
  const output = prefillPatternReflection({ featureSlug: slug, currentIdeas, archiveDir: resolvedArchiveDir });
  const needsRefinement = computeNeedsRefinement(output, currentIdeas);
  const outputPath = path.join(resolvedPlanDir, "pattern-reflection.user.md");
  fs.mkdirSync(resolvedPlanDir, { recursive: true });
  fs.writeFileSync(outputPath, output, "utf-8");
  process.stderr.write(`[pre-fill] wrote ${outputPath}\n`);
  process.stderr.write(`[pre-fill] needs_refinement: ${needsRefinement}\n`);
}

if (process.argv[1]?.includes("lp-do-build-pattern-reflection-prefill")) {
  main();
}
