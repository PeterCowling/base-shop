import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  computeSkillMetrics,
  currentMarkdownFiles,
  DEFAULT_SKILL_ORCHESTRATOR_THRESHOLD,
} from "./skill-size-metrics.js";

export interface CoreTriadSkillBudgetEntry {
  skill: string;
  skill_md_path: string;
  target_lines: number;
  allowed_lines: number;
  waiver_reason?: string;
  waiver_owner?: string;
  waiver_expires_on?: string;
}

export interface CoreTriadSkillBudgetManifest {
  schema_version: "core-triad-skill-budgets.v1";
  generated_at: string;
  threshold_source: string;
  budgets: CoreTriadSkillBudgetEntry[];
}

export interface TriadBudgetCheck {
  skill: string;
  skillMdPath: string;
  targetLines: number;
  allowedLines: number;
  actualLines: number;
  status: "pass" | "warn" | "fail";
  detail: string;
}

export interface ValidateCoreTriadSkillBudgetsResult {
  manifest: CoreTriadSkillBudgetManifest;
  checks: TriadBudgetCheck[];
  failures: TriadBudgetCheck[];
  warnings: TriadBudgetCheck[];
}

const CORE_TRIAD_SKILLS = ["lp-do-fact-find", "lp-do-plan", "lp-do-build"] as const;
export const DEFAULT_CORE_TRIAD_BUDGET_MANIFEST_PATH = join(
  "scripts",
  "src",
  "startup-loop",
  "diagnostics",
  "core-triad-skill-budgets.json",
);

function parseArgs(argv: string[]): { rootDir: string; manifestPath: string } {
  let rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
  let manifestPath = DEFAULT_CORE_TRIAD_BUDGET_MANIFEST_PATH;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    switch (token) {
      case "--":
        continue;
      case "--root-dir": {
        const value = argv[++index];
        if (!value) throw new Error("Missing value for --root-dir");
        rootDir = resolve(value);
        continue;
      }
      case "--manifest": {
        const value = argv[++index];
        if (!value) throw new Error("Missing value for --manifest");
        manifestPath = value;
        continue;
      }
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
      default:
        throw new Error(`Unknown argument: ${token}`);
    }
  }

  return { rootDir, manifestPath };
}

function printHelp(): void {
  console.log(`Usage:
  pnpm --filter scripts startup-loop:validate-core-triad-size-budgets

Options:
  --root-dir <path>   Repo root override
  --manifest <path>   Manifest path override`);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isIsoDateOnly(value: string | undefined): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function resolveManifestPath(rootDir: string, manifestPath: string): string {
  return manifestPath.startsWith("/") ? manifestPath : join(rootDir, manifestPath);
}

function validateManifestShape(
  manifestPath: string,
  candidate: unknown,
): CoreTriadSkillBudgetManifest {
  if (typeof candidate !== "object" || candidate === null) {
    throw new Error(`${manifestPath}: manifest must be a JSON object.`);
  }

  const record = candidate as Record<string, unknown>;
  if (record.schema_version !== "core-triad-skill-budgets.v1") {
    throw new Error(
      `${manifestPath}: schema_version must be "core-triad-skill-budgets.v1".`,
    );
  }
  if (typeof record.generated_at !== "string" || record.generated_at.length === 0) {
    throw new Error(`${manifestPath}: generated_at must be a non-empty string.`);
  }
  if (typeof record.threshold_source !== "string" || record.threshold_source.length === 0) {
    throw new Error(`${manifestPath}: threshold_source must be a non-empty string.`);
  }
  if (!Array.isArray(record.budgets)) {
    throw new Error(`${manifestPath}: budgets must be an array.`);
  }

  const entries = record.budgets as unknown[];
  const seenSkills = new Set<string>();
  for (const entry of entries) {
    if (typeof entry !== "object" || entry === null) {
      throw new Error(`${manifestPath}: each budget entry must be an object.`);
    }
    const budget = entry as Record<string, unknown>;
    if (typeof budget.skill !== "string" || budget.skill.length === 0) {
      throw new Error(`${manifestPath}: each budget entry requires a non-empty skill.`);
    }
    if (seenSkills.has(budget.skill)) {
      throw new Error(`${manifestPath}: duplicate budget entry for ${budget.skill}.`);
    }
    seenSkills.add(budget.skill);
    if (typeof budget.skill_md_path !== "string" || budget.skill_md_path.length === 0) {
      throw new Error(`${manifestPath}: ${budget.skill} requires skill_md_path.`);
    }
    if (!isPositiveInteger(budget.target_lines)) {
      throw new Error(`${manifestPath}: ${budget.skill} target_lines must be a positive integer.`);
    }
    if (!isPositiveInteger(budget.allowed_lines)) {
      throw new Error(`${manifestPath}: ${budget.skill} allowed_lines must be a positive integer.`);
    }
    if ((budget.allowed_lines as number) < (budget.target_lines as number)) {
      throw new Error(
        `${manifestPath}: ${budget.skill} allowed_lines must be >= target_lines.`,
      );
    }
    const requiresWaiver = (budget.allowed_lines as number) > (budget.target_lines as number);
    if (requiresWaiver) {
      if (typeof budget.waiver_reason !== "string" || budget.waiver_reason.trim() === "") {
        throw new Error(`${manifestPath}: ${budget.skill} requires waiver_reason.`);
      }
      if (typeof budget.waiver_owner !== "string" || budget.waiver_owner.trim() === "") {
        throw new Error(`${manifestPath}: ${budget.skill} requires waiver_owner.`);
      }
      if (!isIsoDateOnly(budget.waiver_expires_on as string | undefined)) {
        throw new Error(`${manifestPath}: ${budget.skill} requires waiver_expires_on YYYY-MM-DD.`);
      }
    }
  }

  for (const skill of CORE_TRIAD_SKILLS) {
    if (!seenSkills.has(skill)) {
      throw new Error(`${manifestPath}: missing budget entry for ${skill}.`);
    }
  }

  return candidate as CoreTriadSkillBudgetManifest;
}

export function loadCoreTriadSkillBudgetManifest(options: {
  rootDir: string;
  manifestPath?: string;
}): CoreTriadSkillBudgetManifest {
  const manifestPath = resolveManifestPath(
    options.rootDir,
    options.manifestPath ?? DEFAULT_CORE_TRIAD_BUDGET_MANIFEST_PATH,
  );
  if (!existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }
  const parsed = JSON.parse(readFileSync(manifestPath, "utf8")) as unknown;
  return validateManifestShape(manifestPath, parsed);
}

function waiverExpired(dateOnly: string | undefined, now: Date): boolean {
  if (!dateOnly) return false;
  const parsed = new Date(`${dateOnly}T23:59:59.999Z`);
  return Number.isNaN(parsed.valueOf()) ? true : parsed < now;
}

function evaluateBudgetEntry(
  rootDir: string,
  entry: CoreTriadSkillBudgetEntry,
  now: Date,
): TriadBudgetCheck {
  let metrics = null;
  try {
    const markdownFiles = currentMarkdownFiles(rootDir, entry.skill);
    metrics = computeSkillMetrics(
      rootDir,
      entry.skill,
      markdownFiles,
      (relativePath) => readFileSync(join(rootDir, relativePath), "utf8"),
      entry.target_lines,
    );
  } catch {
    metrics = null;
  }

  if (!metrics) {
    return {
      skill: entry.skill,
      skillMdPath: entry.skill_md_path,
      targetLines: entry.target_lines,
      allowedLines: entry.allowed_lines,
      actualLines: -1,
      status: "fail",
      detail: `Missing SKILL.md surface at ${entry.skill_md_path}.`,
    };
  }

  if (entry.skill_md_path !== `.claude/skills/${entry.skill}/SKILL.md`) {
    return {
      skill: entry.skill,
      skillMdPath: entry.skill_md_path,
      targetLines: entry.target_lines,
      allowedLines: entry.allowed_lines,
      actualLines: metrics.skillMdLines,
      status: "fail",
      detail: `Manifest path mismatch for ${entry.skill}: expected .claude/skills/${entry.skill}/SKILL.md.`,
    };
  }

  if (metrics.skillMdLines > entry.allowed_lines) {
    return {
      skill: entry.skill,
      skillMdPath: entry.skill_md_path,
      targetLines: entry.target_lines,
      allowedLines: entry.allowed_lines,
      actualLines: metrics.skillMdLines,
      status: "fail",
      detail: `Actual lines ${metrics.skillMdLines} exceed allowed_lines ${entry.allowed_lines}.`,
    };
  }

  if (
    metrics.skillMdLines > entry.target_lines &&
    waiverExpired(entry.waiver_expires_on, now)
  ) {
    return {
      skill: entry.skill,
      skillMdPath: entry.skill_md_path,
      targetLines: entry.target_lines,
      allowedLines: entry.allowed_lines,
      actualLines: metrics.skillMdLines,
      status: "fail",
      detail: `Waiver expired on ${entry.waiver_expires_on}; actual lines remain above target ${entry.target_lines}.`,
    };
  }

  if (metrics.skillMdLines > entry.target_lines) {
    return {
      skill: entry.skill,
      skillMdPath: entry.skill_md_path,
      targetLines: entry.target_lines,
      allowedLines: entry.allowed_lines,
      actualLines: metrics.skillMdLines,
      status: "warn",
      detail: `Actual lines ${metrics.skillMdLines} exceed target ${entry.target_lines} but remain within allowed_lines ${entry.allowed_lines}.`,
    };
  }

  return {
    skill: entry.skill,
    skillMdPath: entry.skill_md_path,
    targetLines: entry.target_lines,
    allowedLines: entry.allowed_lines,
    actualLines: metrics.skillMdLines,
    status: "pass",
    detail: `Actual lines ${metrics.skillMdLines} are within target ${entry.target_lines}.`,
  };
}

export function validateCoreTriadSkillBudgets(options: {
  rootDir: string;
  manifestPath?: string;
  now?: Date;
}): ValidateCoreTriadSkillBudgetsResult {
  const manifest = loadCoreTriadSkillBudgetManifest(options);
  const now = options.now ?? new Date();
  const checks = manifest.budgets.map((entry) => evaluateBudgetEntry(options.rootDir, entry, now));
  const failures = checks.filter((check) => check.status === "fail");
  const warnings = checks.filter((check) => check.status === "warn");
  return {
    manifest,
    checks,
    failures,
    warnings,
  };
}

function formatBudgetTable(checks: TriadBudgetCheck[]): string[] {
  const lines = [
    "| Skill | Actual | Target | Allowed | Status | Detail |",
    "|---|---:|---:|---:|---|---|",
  ];
  for (const check of checks) {
    lines.push(
      `| ${check.skill} | ${check.actualLines} | ${check.targetLines} | ${check.allowedLines} | ${check.status} | ${check.detail} |`,
    );
  }
  return lines;
}

function formatFailureBlock(reason: string, nextStep: string): string {
  return [
    `Failure reason: ${reason}`,
    "Retry posture: retry-allowed",
    `Exact next step: ${nextStep}`,
    "Anti-retry list: do not rerun `pnpm --filter scripts startup-loop:validate-core-triad-size-budgets` unchanged; do not rerun `bash scripts/validate-changes.sh` unchanged; do not attempt env-var bypasses or unrelated file edits.",
    "Escalation/stop condition: stop after 2 unchanged retries with the same failure, or immediately if the required waiver/budget change needs operator approval.",
  ].join("\n");
}

function main(): void {
  try {
    const options = parseArgs(process.argv.slice(2));
    const result = validateCoreTriadSkillBudgets(options);

    if (result.failures.length > 0) {
      console.error("FAIL: core triad skill size budget check failed.");
      console.error("");
      for (const line of formatBudgetTable(result.checks)) {
        console.error(line);
      }
      console.error("");
      const nextStep =
        `reduce the listed SKILL.md file(s) to their allowed budget or update ${options.manifestPath} with an approved waiver, then rerun \`pnpm --filter scripts startup-loop:validate-core-triad-size-budgets\``;
      console.error(
        formatFailureBlock(
          result.failures.map((check) => `${check.skill} (${check.actualLines} > ${check.allowedLines} or invalid waiver)`).join("; "),
          nextStep,
        ),
      );
      process.exit(1);
    }

    console.log("OK: core triad skill size budgets checked");
    console.log(`threshold_source: ${result.manifest.threshold_source}`);
    console.log(`default_threshold: ${DEFAULT_SKILL_ORCHESTRATOR_THRESHOLD}`);
    console.log("");
    for (const line of formatBudgetTable(result.checks)) {
      console.log(line);
    }

    if (result.warnings.length > 0) {
      console.log("");
      console.log("WARN: some triad skills remain above target under an active waiver.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("FAIL: core triad skill size budget validator could not load its manifest.");
    console.error("");
    console.error(
      formatFailureBlock(
        message,
        "repair `scripts/src/startup-loop/diagnostics/core-triad-skill-budgets.json`, then rerun `pnpm --filter scripts startup-loop:validate-core-triad-size-budgets`",
      ),
    );
    process.exit(1);
  }
}

if (process.argv[1]?.includes("core-triad-size-budget-validator.ts")) {
  main();
}
