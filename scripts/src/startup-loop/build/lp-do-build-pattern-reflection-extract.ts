/**
 * lp-do-build-pattern-reflection-extract.ts
 *
 * Post-authoring extractor for pattern-reflection.user.md.
 * Reads the finalized pattern-reflection artifact after LLM authoring (SKILL.md step 2.5),
 * parses entries using parsePatternReflectionEntries(), and writes a structured JSON sidecar:
 *   pattern-reflection.entries.json
 *
 * Sidecar schema version: pattern-reflection.entries.v1
 *
 * Fail-closed for backlog intake: all errors emit machine-readable sidecars,
 * but the extractor itself never throws and always exits 0.
 * Atomic write: write to temp, then rename (same pattern as generate-process-improvements.ts).
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { load as loadYaml } from "js-yaml";

import { parsePatternReflectionEntries } from "./lp-do-pattern-promote-loop-update.js";
import type { PatternEntry } from "./lp-do-build-pattern-reflection-prefill.js";
import {
  type BuildOriginFailure,
  type BuildOriginStatus,
  detectRepoRoot,
  deriveBuildOriginIdentity,
  toRepoRelativePath,
} from "./build-origin-signal.js";

/* ------------------------------------------------------------------ */
/*  Schema types                                                        */
/* ------------------------------------------------------------------ */

export interface PatternReflectionSidecar {
  schema_version: "pattern-reflection.entries.v1";
  generated_at: string;
  plan_slug: string;
  review_cycle_key: string;
  source_path: string;
  build_origin_status: BuildOriginStatus;
  failures: BuildOriginFailure[];
  entries: CanonicalPatternEntry[];
}

export interface CanonicalPatternEntry extends PatternEntry {
  review_cycle_key: string;
  canonical_title: string;
  build_signal_id: string;
  recurrence_key: string;
  build_origin_status: "ready";
}

interface PatternReflectionYamlFrontmatter {
  entries?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractYamlFrontmatter(content: string): string | null {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  if (lines[0]?.trim() !== "---") {
    return null;
  }
  const endIndex = lines.indexOf("---", 1);
  if (endIndex === -1) {
    return null;
  }
  return lines.slice(1, endIndex).join("\n");
}

function writeSidecar(sidecarPath: string, sidecar: PatternReflectionSidecar): void {
  const tmpPath = `${sidecarPath}.tmp`;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(sidecar, null, 2) + "\n", "utf8");
    fs.renameSync(tmpPath, sidecarPath);
    process.stderr.write(
      `[pattern-reflection-extract] info: wrote ${sidecarPath} (${sidecar.entries.length} entries, status=${sidecar.build_origin_status})\n`,
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
      `[pattern-reflection-extract] warn: failed to write sidecar at ${sidecarPath}: ${String(err)}\n`,
    );
  }
}

/* ------------------------------------------------------------------ */
/*  Core extract function                                               */
/* ------------------------------------------------------------------ */

/**
 * Extract pattern entries from a finalized pattern-reflection.user.md and write
 * pattern-reflection.entries.json alongside it.
 *
 * @param planDir - Absolute or repo-relative path to the plan directory.
 * @param options.repoRoot - Repo root for computing relative source_path. Defaults to cwd.
 */
export async function extractPatternReflectionSignals(
  planDir: string,
  options: { repoRoot?: string } = {},
): Promise<void> {
  const repoRoot = options.repoRoot ?? detectRepoRoot(process.cwd());
  const sourcePath = path.join(planDir, "pattern-reflection.user.md");
  const sidecarPath = path.join(planDir, "pattern-reflection.entries.json");

  // Derive slug from plan directory basename.
  const planSlug = path.basename(planDir);
  const reviewCycleKey = planSlug;
  const relativeSourcePath = toRepoRelativePath(repoRoot, sourcePath);

  // Guard: .user.md must exist.
  if (!fs.existsSync(sourcePath)) {
    writeSidecar(sidecarPath, {
      schema_version: "pattern-reflection.entries.v1",
      generated_at: new Date().toISOString(),
      plan_slug: planSlug,
      review_cycle_key: reviewCycleKey,
      source_path: relativeSourcePath,
      build_origin_status: "source_missing",
      failures: [
        {
          code: "source_missing",
          message: `${relativeSourcePath} not found`,
        },
      ],
      entries: [],
    });
    return;
  }

  let content: string;
  try {
    content = fs.readFileSync(sourcePath, "utf8");
  } catch (err) {
    writeSidecar(sidecarPath, {
      schema_version: "pattern-reflection.entries.v1",
      generated_at: new Date().toISOString(),
      plan_slug: planSlug,
      review_cycle_key: reviewCycleKey,
      source_path: relativeSourcePath,
      build_origin_status: "parse_failed",
      failures: [
        {
          code: "read_failed",
          message: String(err),
        },
      ],
      entries: [],
    });
    return;
  }

  const yamlFrontmatter = extractYamlFrontmatter(content);
  if (yamlFrontmatter) {
    try {
      const parsed = loadYaml(yamlFrontmatter);
      if (!isRecord(parsed)) {
        writeSidecar(sidecarPath, {
          schema_version: "pattern-reflection.entries.v1",
          generated_at: new Date().toISOString(),
          plan_slug: planSlug,
          review_cycle_key: reviewCycleKey,
          source_path: relativeSourcePath,
          build_origin_status: "schema_invalid",
          failures: [
            {
              code: "schema_invalid",
              message: "pattern-reflection frontmatter must deserialize to an object",
            },
          ],
          entries: [],
        });
        return;
      }
      const frontmatter = parsed as PatternReflectionYamlFrontmatter;
      if ("entries" in frontmatter && frontmatter.entries !== undefined && !Array.isArray(frontmatter.entries)) {
        writeSidecar(sidecarPath, {
          schema_version: "pattern-reflection.entries.v1",
          generated_at: new Date().toISOString(),
          plan_slug: planSlug,
          review_cycle_key: reviewCycleKey,
          source_path: relativeSourcePath,
          build_origin_status: "schema_invalid",
          failures: [
            {
              code: "schema_invalid",
              message: "`entries` must be an array when present in pattern-reflection frontmatter",
            },
          ],
          entries: [],
        });
        return;
      }
    } catch (err) {
      writeSidecar(sidecarPath, {
        schema_version: "pattern-reflection.entries.v1",
        generated_at: new Date().toISOString(),
        plan_slug: planSlug,
        review_cycle_key: reviewCycleKey,
        source_path: relativeSourcePath,
        build_origin_status: "parse_failed",
        failures: [
          {
            code: "parse_failed",
            message: String(err),
          },
        ],
        entries: [],
      });
      return;
    }
  }

  // Parse entries using shared parser (YAML frontmatter primary, body-format fallback).
  let entries: PatternEntry[];
  try {
    entries = parsePatternReflectionEntries(content);
  } catch (err) {
    writeSidecar(sidecarPath, {
      schema_version: "pattern-reflection.entries.v1",
      generated_at: new Date().toISOString(),
      plan_slug: planSlug,
      review_cycle_key: reviewCycleKey,
      source_path: relativeSourcePath,
      build_origin_status: "parse_failed",
      failures: [
        {
          code: "parse_failed",
          message: String(err),
        },
      ],
      entries: [],
    });
    return;
  }

  const canonicalEntries: CanonicalPatternEntry[] = entries.map((entry) => {
    const identity = deriveBuildOriginIdentity(
      reviewCycleKey,
      entry.canonical_title ?? entry.pattern_summary,
    );
    return {
      ...entry,
      review_cycle_key: reviewCycleKey,
      canonical_title: identity.canonical_title,
      build_signal_id: identity.build_signal_id,
      recurrence_key: identity.recurrence_key,
      build_origin_status: identity.build_origin_status,
    };
  });

  const sidecar: PatternReflectionSidecar = {
    schema_version: "pattern-reflection.entries.v1",
    generated_at: new Date().toISOString(),
    plan_slug: planSlug,
    review_cycle_key: reviewCycleKey,
    source_path: relativeSourcePath,
    build_origin_status: "ready",
    failures: [],
    entries: canonicalEntries,
  };

  writeSidecar(sidecarPath, sidecar);
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

if (process.argv[1]?.includes("lp-do-build-pattern-reflection-extract")) {
  const { planDir } = parseArgs(process.argv.slice(2));
  if (!planDir) {
    process.stderr.write("[pattern-reflection-extract] error: --plan-dir is required\n");
    process.exit(0); // Fail-open: exit 0 even on bad args.
  }
  const absDir = path.resolve(planDir);
  extractPatternReflectionSignals(absDir).catch((err) => {
    process.stderr.write(`[pattern-reflection-extract] warn: unexpected error: ${String(err)}\n`);
  });
}
