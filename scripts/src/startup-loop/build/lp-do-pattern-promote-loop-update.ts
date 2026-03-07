/**
 * lp-do-pattern-promote-loop-update.ts
 *
 * Reads pattern-reflection artifacts (YAML frontmatter or body-format),
 * filters entries with routing_target === "loop_update", and produces
 * operator-reviewable draft patch files for standing process docs.
 *
 * Shared exports (used by lp-do-pattern-promote-skill-proposal.ts):
 *   - parsePatternReflectionEntries()
 *   - filterByRoutingTarget()
 *   - PromotionDraft, PromotionResult types
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { load as loadYaml } from "js-yaml";

import type {
  PatternCategory,
  PatternEntry,
  RoutingTarget,
} from "./lp-do-build-pattern-reflection-prefill.js";

export type { PatternCategory, PatternEntry, RoutingTarget };

export interface PromotionDraft {
  filename: string;
  content: string;
  entry: PatternEntry;
  targetDoc: string;
}

export interface PromotionResult {
  processed: number;
  matched: number;
  drafted: number;
  skipped: number;
  drafts: PromotionDraft[];
}

export interface PromoteOptions {
  reflectionPath: string;
  outputDir: string;
  dryRun: boolean;
}

/* ------------------------------------------------------------------ */
/*  Dual-format parser                                                 */
/* ------------------------------------------------------------------ */

interface YamlFrontmatter {
  entries?: Array<{
    pattern_summary?: string;
    category?: string;
    routing_target?: string;
    occurrence_count?: number;
    evidence_refs?: string[];
  }>;
  [key: string]: unknown;
}

function extractYamlFrontmatter(content: string): string | null {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  if (lines[0]?.trim() !== "---") return null;
  const endIdx = lines.indexOf("---", 1);
  if (endIdx === -1) return null;
  return lines.slice(1, endIdx).join("\n");
}

function parseYamlEntries(yamlStr: string): PatternEntry[] {
  let parsed: YamlFrontmatter;
  try {
    parsed = loadYaml(yamlStr) as YamlFrontmatter;
  } catch {
    return [];
  }
  if (!parsed || !Array.isArray(parsed.entries)) return [];

  const entries: PatternEntry[] = [];
  for (const raw of parsed.entries) {
    if (!raw.pattern_summary || !raw.routing_target) {
      process.stderr.write("[promote] skipping entry: missing required fields\n");
      continue;
    }
    entries.push({
      pattern_summary: String(raw.pattern_summary),
      category: (raw.category as PatternCategory) ?? "unclassified",
      routing_target: raw.routing_target as RoutingTarget,
      occurrence_count:
        typeof raw.occurrence_count === "number" ? raw.occurrence_count : 1,
      evidence_refs: Array.isArray(raw.evidence_refs)
        ? raw.evidence_refs.map(String)
        : [],
    });
  }
  return entries;
}

function parseBodyFormatEntries(content: string): PatternEntry[] {
  const entries: PatternEntry[] = [];
  const sections = content.split(/^### Entry \d+|^### \d+\./m);

  for (const section of sections.slice(1)) {
    const summary =
      section.match(/\*\*pattern_summary:\*\*\s*(.+)/i)?.[1]?.trim();
    const category =
      section.match(/\*\*category:\*\*\s*(.+)/i)?.[1]?.trim();
    const routingTarget =
      section.match(/\*\*routing_target:\*\*\s*(.+)/i)?.[1]?.trim();
    const occurrenceCount =
      section.match(/\*\*occurrence_count:\*\*\s*(\d+)/i)?.[1];

    if (!summary || !routingTarget) continue;

    const evidenceRefs: string[] = [];
    const evidenceMatch = section.match(
      /\*\*evidence_refs:\*\*([\s\S]*?)(?=\n- \*\*|\n###|\n## |$)/i,
    );
    if (evidenceMatch) {
      for (const line of evidenceMatch[1].split("\n")) {
        const ref = line.match(/^\s*-\s+`?([^`\n]+)`?\s*$/)?.[1]?.trim();
        if (ref) evidenceRefs.push(ref);
      }
    }

    entries.push({
      pattern_summary: summary,
      category: (category as PatternCategory) ?? "unclassified",
      routing_target: routingTarget as RoutingTarget,
      occurrence_count: occurrenceCount ? parseInt(occurrenceCount, 10) : 1,
      evidence_refs: evidenceRefs,
    });
  }
  return entries;
}

/**
 * Parse pattern-reflection entries from either format:
 * (a) YAML frontmatter `entries[]` (newer, deterministic prefill)
 * (b) markdown body with `**routing_target:**` bullets (older, LLM-authored)
 */
export function parsePatternReflectionEntries(
  content: string,
): PatternEntry[] {
  if (!content.trim()) return [];

  const yamlStr = extractYamlFrontmatter(content);
  if (yamlStr) {
    const entries = parseYamlEntries(yamlStr);
    if (entries.length > 0) return entries;
  }

  return parseBodyFormatEntries(content);
}

export function filterByRoutingTarget(
  entries: PatternEntry[],
  target: RoutingTarget,
): PatternEntry[] {
  return entries.filter((e) => e.routing_target === target);
}

/* ------------------------------------------------------------------ */
/*  Draft generation (loop_update)                                     */
/* ------------------------------------------------------------------ */

function inferTargetDoc(entry: PatternEntry): string {
  const refs = entry.evidence_refs.join(" ").toLowerCase();
  const summary = entry.pattern_summary.toLowerCase();

  if (refs.includes("process-registry") || summary.includes("process")) {
    return "docs/business-os/startup-loop/process-registry-v2.md";
  }
  if (
    refs.includes("loop-output-contracts") ||
    summary.includes("contract") ||
    summary.includes("artifact")
  ) {
    return "docs/business-os/startup-loop/contracts/loop-output-contracts.md";
  }
  if (refs.includes("skill") || summary.includes("skill")) {
    return ".claude/skills/ (specific skill TBD)";
  }
  return "unknown";
}

function sanitizeFilename(summary: string): string {
  return summary
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export function generateLoopUpdateDraft(
  entry: PatternEntry,
): PromotionDraft {
  const targetDoc = inferTargetDoc(entry);
  const filename = `loop-update-draft-${sanitizeFilename(entry.pattern_summary)}.md`;

  const evidenceList =
    entry.evidence_refs.length > 0
      ? entry.evidence_refs.map((r) => `- \`${r}\``).join("\n")
      : "- None provided";

  const content = [
    "---",
    "Type: Loop-Update-Draft",
    "Generated-by: lp-do-pattern-promote-loop-update",
    "Status: Pending-Review",
    "---",
    "",
    "# Loop Update Draft",
    "",
    "## Pattern Summary",
    "",
    entry.pattern_summary,
    "",
    "## Classification",
    "",
    `- **Category:** ${entry.category}`,
    `- **Routing target:** ${entry.routing_target}`,
    `- **Occurrence count:** ${entry.occurrence_count}`,
    "",
    "## Target Standing Document",
    "",
    targetDoc,
    "",
    "## Evidence References",
    "",
    evidenceList,
    "",
    "## Proposed Patch",
    "",
    "<!-- Operator: review the pattern above and draft the specific changes needed in the target document. -->",
    "",
    "> TODO: Describe the concrete change to apply to the target document based on the pattern identified above.",
    "",
  ].join("\n");

  return { filename, content, entry, targetDoc };
}

export function promoteLoopUpdateEntries(
  options: PromoteOptions,
): PromotionResult {
  const { reflectionPath, outputDir, dryRun } = options;

  let content: string;
  try {
    content = fs.readFileSync(reflectionPath, "utf-8");
  } catch (err) {
    process.stderr.write(`[promote] cannot read ${reflectionPath}: ${err}\n`);
    return { processed: 0, matched: 0, drafted: 0, skipped: 0, drafts: [] };
  }

  const allEntries = parsePatternReflectionEntries(content);
  const matched = filterByRoutingTarget(allEntries, "loop_update");

  process.stderr.write(
    `[promote] ${allEntries.length} entries parsed, ${matched.length} with routing_target=loop_update\n`,
  );

  const drafts: PromotionDraft[] = [];
  let skipped = 0;

  for (const entry of matched) {
    const draft = generateLoopUpdateDraft(entry);
    drafts.push(draft);

    if (dryRun) {
      process.stdout.write(
        `[dry-run] would write: ${path.join(outputDir, draft.filename)}\n`,
      );
      process.stdout.write(`  target_doc: ${draft.targetDoc}\n`);
      process.stdout.write(`  pattern: ${entry.pattern_summary}\n\n`);
    } else {
      const outPath = path.join(outputDir, draft.filename);
      try {
        fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(outPath, draft.content, "utf-8");
        process.stdout.write(`[promote] wrote: ${outPath}\n`);
      } catch (err) {
        process.stderr.write(`[promote] failed to write ${outPath}: ${err}\n`);
        skipped++;
      }
    }
  }

  const drafted = dryRun ? 0 : drafts.length - skipped;
  process.stderr.write(
    `[promote] summary: ${allEntries.length} processed, ${matched.length} matched, ${drafted} drafted, ${skipped} skipped\n`,
  );

  return {
    processed: allEntries.length,
    matched: matched.length,
    drafted,
    skipped,
    drafts,
  };
}

/* ------------------------------------------------------------------ */
/*  CLI                                                                */
/* ------------------------------------------------------------------ */

function parseArgs(
  argv: string[],
): PromoteOptions {
  let reflectionPath = "";
  let outputDir = "";
  let dryRun = false;

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--reflection-path" && i + 1 < argv.length)
      reflectionPath = argv[++i];
    else if (a === "--output-dir" && i + 1 < argv.length)
      outputDir = argv[++i];
    else if (a === "--dry-run") dryRun = true;
  }

  if (!reflectionPath || !outputDir) {
    process.stderr.write(
      "Usage: lp-do-pattern-promote-loop-update --reflection-path <path> --output-dir <dir> [--dry-run]\n",
    );
    process.exit(1);
  }

  return { reflectionPath, outputDir, dryRun };
}

export function main(): void {
  const options = parseArgs(process.argv);
  promoteLoopUpdateEntries(options);
}

if (process.argv[1]?.includes("lp-do-pattern-promote-loop-update")) {
  main();
}
