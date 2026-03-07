#!/usr/bin/env node
/**
 * Shadow replay harness for draft refinement parity verification.
 *
 * Runs offline over a corpus file and compares baseline (external identity)
 * against deterministic refinement quality outcomes.
 *
 * Usage:
 *   cd /path/to/repo-root
 *   pnpm --filter @acme/mcp-server exec tsx scripts/shadow-replay-refinement.ts \
 *     --input .agents/private/email-sample-stage-1.txt \
 *     --output docs/plans/email-production-readiness-hardening/shadow-replay-report.user.md \
 *     --limit 200
 */

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, dirname as parentDir, resolve } from "node:path";

type CorpusEmail = {
  id: string;
  subject: string;
  body: string;
};

type InterpretPayload = {
  scenario: { category: string };
  intents: { questions: Array<{ text: string }>; requests: Array<{ text: string }> };
  workflow_triggers: {
    booking_action_required: boolean;
    booking_context: boolean;
  };
  language: "EN" | "IT" | "ES" | "UNKNOWN";
};

type GeneratePayload = {
  draft: { bodyPlain: string; bodyHtml: string };
};

type RefinePayload = {
  draft: { bodyPlain: string; bodyHtml: string };
  refinement_applied: boolean;
  refinement_source: "claude-cli" | "codex" | "none";
  quality: {
    passed: boolean;
    failed_checks: string[];
    warnings: string[];
  };
};

type ReplayRow = {
  id: string;
  category: string;
  baselinePassed: boolean;
  deterministicPassed: boolean;
  baselineFailedChecks: number;
  deterministicFailedChecks: number;
  regressed: boolean;
  hardRuleViolation: boolean;
  error?: string;
};

type ReplaySummary = {
  totalRowsLoaded: number;
  rowsProcessed: number;
  processingErrors: number;
  baselineQualityPassCount: number;
  deterministicQualityPassCount: number;
  regressions: number;
  hardRuleProtectedCategoryViolations: number;
  startedAt: string;
  finishedAt: string;
  inputPath: string;
  limit: number;
};

type AcceptanceThresholds = {
  maxRegressions: number;
  maxHardRuleViolations: number;
  maxErrors: number;
};

const PROTECTED_CATEGORIES = new Set(["prepayment", "cancellation"]);
const MESSAGE_ID_RE = /^[0-9a-f]{16,}$/;

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  if (idx < 0) return undefined;
  return process.argv[idx + 1];
}

async function findRepoRoot(startDir: string): Promise<string> {
  let dir = startDir;
  for (;;) {
    try {
      await access(resolve(dir, "pnpm-workspace.yaml"));
      return dir;
    } catch {
      const next = parentDir(dir);
      if (next === dir) {
        throw new Error("Could not locate repo root (pnpm-workspace.yaml not found)");
      }
      dir = next;
    }
  }
}

function parseToolResult<T>(value: { isError?: boolean; content?: Array<{ text?: string }> }): T {
  if (value.isError) {
    throw new Error(value.content?.[0]?.text ?? "Tool returned error");
  }
  const text = value.content?.[0]?.text;
  if (!text) {
    throw new Error("Missing tool payload");
  }
  return JSON.parse(text) as T;
}

function parseNonNegativeIntegerArg(name: string, fallback: number): number {
  const value = getArg(name);
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
    throw new Error(`Invalid ${name} value: expected non-negative integer`);
  }
  return parsed;
}

async function parseCorpus(inputPath: string): Promise<CorpusEmail[]> {
  const raw = await readFile(inputPath, "utf-8");
  const trimmed = raw.trim();
  if (!trimmed) return [];

  // JSON array
  if (trimmed.startsWith("[")) {
    const arr = JSON.parse(trimmed) as Array<Record<string, unknown>>;
    return arr.map((row, i) => ({
      id: String(row.id ?? `row-${i + 1}`),
      subject: String(row.subject ?? ""),
      body: String(row.body ?? ""),
    }));
  }

  // JSONL
  if (trimmed.startsWith("{")) {
    const rows = trimmed
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>);
    return rows.map((row, i) => ({
      id: String(row.id ?? `row-${i + 1}`),
      subject: String(row.subject ?? ""),
      body: String(row.body ?? ""),
    }));
  }

  // Stage file format (EMAIL_DETAILS)
  const lines = raw.split("\n");
  const emails: CorpusEmail[] = [];
  let inDetails = false;
  let current: { id: string; subject: string; body: string } | null = null;
  let inBody = false;

  for (const line of lines) {
    if (line.trim() === "EMAIL_DETAILS") {
      inDetails = true;
      continue;
    }
    if (!inDetails) continue;

    if (MESSAGE_ID_RE.test(line.trim())) {
      if (current?.body.trim()) {
        emails.push(current);
      }
      current = { id: line.trim(), subject: "", body: "" };
      inBody = false;
      continue;
    }
    if (!current) continue;

    if (line.startsWith("- subject: ")) {
      current.subject = line.slice("- subject: ".length);
      inBody = false;
      continue;
    }
    if (line.startsWith("- body: ")) {
      current.body = line.slice("- body: ".length);
      inBody = true;
      continue;
    }
    if (line.startsWith("- thread_context:")) {
      inBody = false;
      continue;
    }
    if (inBody) {
      current.body = `${current.body}\n${line}`;
    }
  }

  if (current?.body.trim()) {
    emails.push(current);
  }

  return emails;
}

function categorySummary(rows: ReplayRow[]): Array<{ category: string; total: number; regressions: number }> {
  const byCategory = new Map<string, { total: number; regressions: number }>();
  for (const row of rows) {
    if (row.error) continue;
    const entry = byCategory.get(row.category) ?? { total: 0, regressions: 0 };
    entry.total += 1;
    if (row.regressed) entry.regressions += 1;
    byCategory.set(row.category, entry);
  }
  return Array.from(byCategory.entries())
    .map(([category, entry]) => ({ category, ...entry }))
    .sort((a, b) => b.total - a.total);
}

function buildReport(
  rows: ReplayRow[],
  summary: ReplaySummary,
): string {
  const processed = rows.filter((row) => !row.error);
  const errors = rows.filter((row) => row.error);
  const regressions = processed.filter((row) => row.regressed);
  const hardRuleViolations = processed.filter((row) => row.hardRuleViolation);
  const baselinePassed = processed.filter((row) => row.baselinePassed).length;
  const deterministicPassed = processed.filter((row) => row.deterministicPassed).length;

  const categories = categorySummary(rows);
  const regressionRows = regressions.slice(0, 25);
  const errorRows = errors.slice(0, 25);

  const lines: string[] = [];
  lines.push("# Shadow Replay Report — Email Refinement Parity");
  lines.push("");
  lines.push(`- Started: ${summary.startedAt}`);
  lines.push(`- Finished: ${summary.finishedAt}`);
  lines.push(`- Input: \`${summary.inputPath}\``);
  lines.push(`- Limit: ${summary.limit}`);
  lines.push("");
  lines.push("## Outcome");
  lines.push("");
  lines.push(`- Total rows loaded: ${rows.length}`);
  lines.push(`- Rows processed: ${processed.length}`);
  lines.push(`- Processing errors: ${errors.length}`);
  lines.push(`- Baseline quality pass count: ${baselinePassed}`);
  lines.push(`- Deterministic quality pass count: ${deterministicPassed}`);
  lines.push(`- Regressions (deterministic worse than baseline): ${regressions.length}`);
  lines.push(`- Hard-rule protected-category violations: ${hardRuleViolations.length}`);
  lines.push("");
  lines.push("## Acceptance Checks");
  lines.push("");
  lines.push(`- No quality regressions: ${regressions.length === 0 ? "PASS" : "FAIL"}`);
  lines.push(`- No protected-category mutations: ${hardRuleViolations.length === 0 ? "PASS" : "FAIL"}`);
  lines.push(`- No processing errors: ${errors.length === 0 ? "PASS" : "FAIL"}`);
  lines.push("");
  lines.push("## Category Breakdown");
  lines.push("");
  lines.push("| Category | Total | Regressions |");
  lines.push("|---|---:|---:|");
  for (const category of categories) {
    lines.push(`| ${category.category} | ${category.total} | ${category.regressions} |`);
  }
  if (categories.length === 0) {
    lines.push("| (none) | 0 | 0 |");
  }

  lines.push("");
  lines.push("## Regression Samples");
  lines.push("");
  if (regressionRows.length === 0) {
    lines.push("- None");
  } else {
    lines.push("| ID | Category | Baseline Failed Checks | Deterministic Failed Checks |");
    lines.push("|---|---|---:|---:|");
    for (const row of regressionRows) {
      lines.push(
        `| ${row.id} | ${row.category} | ${row.baselineFailedChecks} | ${row.deterministicFailedChecks} |`,
      );
    }
  }

  lines.push("");
  lines.push("## Processing Errors");
  lines.push("");
  if (errorRows.length === 0) {
    lines.push("- None");
  } else {
    lines.push("| ID | Error |");
    lines.push("|---|---|");
    for (const row of errorRows) {
      lines.push(`| ${row.id} | ${row.error?.replace(/\|/g, "\\|") ?? ""} |`);
    }
  }

  lines.push("");
  lines.push("## Notes");
  lines.push("");
  lines.push("- Baseline path = `draft_refine` with `refinement_mode: external` and identity candidate.");
  lines.push("- Deterministic path = `draft_refine` with `refinement_mode: deterministic_only`.");
  lines.push("- Regression definition: baseline passes but deterministic fails, or deterministic has more failed checks.");
  lines.push("- Protected categories checked: `prepayment`, `cancellation`.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

function summarizeRows(
  rows: ReplayRow[],
  metadata: Pick<ReplaySummary, "startedAt" | "finishedAt" | "inputPath" | "limit">,
): ReplaySummary {
  const processed = rows.filter((row) => !row.error);
  const errors = rows.filter((row) => row.error).length;
  const regressions = processed.filter((row) => row.regressed).length;
  const hardRuleViolations = processed.filter((row) => row.hardRuleViolation).length;
  const baselinePassed = processed.filter((row) => row.baselinePassed).length;
  const deterministicPassed = processed.filter((row) => row.deterministicPassed).length;

  return {
    totalRowsLoaded: rows.length,
    rowsProcessed: processed.length,
    processingErrors: errors,
    baselineQualityPassCount: baselinePassed,
    deterministicQualityPassCount: deterministicPassed,
    regressions,
    hardRuleProtectedCategoryViolations: hardRuleViolations,
    ...metadata,
  };
}

function passesThresholds(summary: ReplaySummary, thresholds: AcceptanceThresholds): boolean {
  return (
    summary.regressions <= thresholds.maxRegressions &&
    summary.hardRuleProtectedCategoryViolations <= thresholds.maxHardRuleViolations &&
    summary.processingErrors <= thresholds.maxErrors
  );
}

async function main(): Promise<void> {
  const inputArg = getArg("--input");
  const outputArg =
    getArg("--output") ??
    "../../docs/plans/email-production-readiness-hardening/shadow-replay-report.user.md";
  const jsonOutputArg = getArg("--json-output");
  const limitArg = getArg("--limit");
  const limit = limitArg ? Number(limitArg) : 200;
  const thresholds: AcceptanceThresholds = {
    maxRegressions: parseNonNegativeIntegerArg("--max-regressions", 0),
    maxHardRuleViolations: parseNonNegativeIntegerArg("--max-hard-rule-violations", 0),
    maxErrors: parseNonNegativeIntegerArg("--max-errors", 0),
  };

  if (!inputArg) {
    console.error("Missing required --input argument");
    process.exit(1);
  }
  if (!Number.isFinite(limit) || limit <= 0) {
    console.error("Invalid --limit value");
    process.exit(1);
  }

  const repoRoot = await findRepoRoot(process.cwd());
  process.chdir(repoRoot);

  const { default: handleDraftGenerateTool } = await import(
    "../src/tools/draft-generate.js"
  );
  const { default: handleDraftInterpretTool } = await import(
    "../src/tools/draft-interpret.js"
  );
  const { handleDraftRefineTool } = await import(
    "../src/tools/draft-refine.js"
  );

  const startedAt = new Date().toISOString();
  const inputPath = resolve(repoRoot, inputArg);
  const outputPath = resolve(repoRoot, outputArg);

  const corpus = await parseCorpus(inputPath);
  const selected = corpus.slice(0, limit);
  const rows: ReplayRow[] = [];

  for (const email of selected) {
    const id = email.id || `row-${rows.length + 1}`;
    try {
      const interpretResultRaw = await handleDraftInterpretTool("draft_interpret", {
        body: email.body,
        subject: email.subject,
      });
      const actionPlan = parseToolResult<InterpretPayload>(
        interpretResultRaw as { isError?: boolean; content?: Array<{ text?: string }> },
      );

      const generateResultRaw = await handleDraftGenerateTool("draft_generate", {
        actionPlan,
        subject: email.subject,
      });
      const generated = parseToolResult<GeneratePayload>(
        generateResultRaw as { isError?: boolean; content?: Array<{ text?: string }> },
      );
      const generatedBodyPlain =
        typeof generated.draft?.bodyPlain === "string" && generated.draft.bodyPlain.trim().length > 0
          ? generated.draft.bodyPlain
          : email.body;
      if (!generatedBodyPlain.trim()) {
        throw new Error("Generated draft body is empty");
      }

      const baselineRaw = await handleDraftRefineTool("draft_refine", {
        actionPlan,
        draft_id: `shadow-${id}-baseline`,
        refinement_mode: "external",
        rewrite_reason: "none",
        originalBodyPlain: generatedBodyPlain,
        refinedBodyPlain: generatedBodyPlain,
      });
      const baseline = parseToolResult<RefinePayload>(
        baselineRaw as { isError?: boolean; content?: Array<{ text?: string }> },
      );

      const deterministicRaw = await handleDraftRefineTool("draft_refine", {
        actionPlan,
        draft_id: `shadow-${id}-deterministic`,
        refinement_mode: "deterministic_only",
        rewrite_reason: "none",
        originalBodyPlain: generatedBodyPlain,
        // Keep compatibility with older draft_refine schemas that still require
        // refinedBodyPlain even for deterministic mode.
        refinedBodyPlain: generatedBodyPlain,
      });
      const deterministic = parseToolResult<RefinePayload>(
        deterministicRaw as { isError?: boolean; content?: Array<{ text?: string }> },
      );

      const baselineFailed = baseline.quality.failed_checks.length;
      const deterministicFailed = deterministic.quality.failed_checks.length;
      const regressed =
        (baseline.quality.passed && !deterministic.quality.passed) ||
        deterministicFailed > baselineFailed;

      const category = actionPlan.scenario.category;
      const hardRuleViolation =
        PROTECTED_CATEGORIES.has(category) &&
        deterministic.draft.bodyPlain.trim() !== generatedBodyPlain.trim();

      rows.push({
        id,
        category,
        baselinePassed: baseline.quality.passed,
        deterministicPassed: deterministic.quality.passed,
        baselineFailedChecks: baselineFailed,
        deterministicFailedChecks: deterministicFailed,
        regressed,
        hardRuleViolation,
      });
    } catch (error) {
      rows.push({
        id,
        category: "unknown",
        baselinePassed: false,
        deterministicPassed: false,
        baselineFailedChecks: 0,
        deterministicFailedChecks: 0,
        regressed: false,
        hardRuleViolation: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const finishedAt = new Date().toISOString();
  const summary = summarizeRows(rows, { startedAt, finishedAt, inputPath, limit });
  const report = buildReport(rows, summary);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, report, "utf-8");
  if (jsonOutputArg) {
    const jsonOutputPath = resolve(repoRoot, jsonOutputArg);
    await mkdir(dirname(jsonOutputPath), { recursive: true });
    await writeFile(jsonOutputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf-8");
  }

  console.info(
    `Shadow replay complete: rows=${summary.totalRowsLoaded} regressions=${summary.regressions} hard_rule_violations=${summary.hardRuleProtectedCategoryViolations} errors=${summary.processingErrors}`,
  );
  console.info(`Report written to ${outputPath}`);
  if (jsonOutputArg) {
    console.info(`JSON summary written to ${resolve(repoRoot, jsonOutputArg)}`);
  }

  if (!passesThresholds(summary, thresholds)) {
    console.error("Shadow replay acceptance gate failed");
    console.error(
      `Thresholds: regressions<=${thresholds.maxRegressions}, hard_rule_violations<=${thresholds.maxHardRuleViolations}, errors<=${thresholds.maxErrors}`,
    );
    process.exit(1);
  }
}

void main();
