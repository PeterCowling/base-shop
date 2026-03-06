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
 * Fail-open: all errors emit warnings; never throws; always exits 0.
 * Atomic write: write to temp, then rename (same pattern as generate-process-improvements.ts).
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { parsePatternReflectionEntries } from "./lp-do-pattern-promote-loop-update.js";
import type { PatternEntry } from "./lp-do-build-pattern-reflection-prefill.js";

/* ------------------------------------------------------------------ */
/*  Schema types                                                        */
/* ------------------------------------------------------------------ */

export interface PatternReflectionSidecar {
  schema_version: "pattern-reflection.entries.v1";
  generated_at: string;
  plan_slug: string;
  source_path: string;
  entries: PatternEntry[];
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
  const repoRoot = options.repoRoot ?? process.cwd();
  const sourcePath = path.join(planDir, "pattern-reflection.user.md");
  const sidecarPath = path.join(planDir, "pattern-reflection.entries.json");
  const tmpPath = `${sidecarPath}.tmp`;

  // Derive slug from plan directory basename.
  const planSlug = path.basename(planDir);

  // Guard: .user.md must exist.
  if (!fs.existsSync(sourcePath)) {
    process.stderr.write(
      `[pattern-reflection-extract] warn: ${sourcePath} not found, skipping sidecar emit\n`,
    );
    return;
  }

  let content: string;
  try {
    content = fs.readFileSync(sourcePath, "utf8");
  } catch (err) {
    process.stderr.write(
      `[pattern-reflection-extract] warn: failed to read ${sourcePath}: ${String(err)}\n`,
    );
    return;
  }

  // Parse entries using shared parser (YAML frontmatter primary, body-format fallback).
  let entries: PatternEntry[];
  try {
    entries = parsePatternReflectionEntries(content);
  } catch (err) {
    process.stderr.write(
      `[pattern-reflection-extract] warn: parse failed for ${sourcePath}: ${String(err)}\n`,
    );
    entries = [];
  }

  // Compute relative source_path for the sidecar.
  let relativeSourcePath: string;
  try {
    relativeSourcePath = path.relative(repoRoot, sourcePath).replace(/\\/g, "/");
  } catch {
    relativeSourcePath = sourcePath;
  }

  const sidecar: PatternReflectionSidecar = {
    schema_version: "pattern-reflection.entries.v1",
    generated_at: new Date().toISOString(),
    plan_slug: planSlug,
    source_path: relativeSourcePath,
    entries,
  };

  // Atomic write: temp file then rename.
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(sidecar, null, 2) + "\n", "utf8");
    fs.renameSync(tmpPath, sidecarPath);
    process.stderr.write(
      `[pattern-reflection-extract] info: wrote ${sidecarPath} (${entries.length} entries)\n`,
    );
  } catch (err) {
    // Clean up temp file if rename failed.
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
