/**
 * lp-do-build-results-review-prefill.ts
 *
 * Deterministic pre-fill script for results-review.user.md.
 * Generates boilerplate sections from build artifacts (build-event.json,
 * plan.md task table, standing-registry.json, git diff file list).
 * Output conforms to `docs/plans/_templates/results-review.user.md`.
 *
 * Introduced in TASK-01 of build-completion-deterministic-lifts.
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { readBuildEvent } from "./lp-do-build-event-emitter.js";
import type { BuildEvent } from "./lp-do-build-event-emitter.js";

// --- Types ---

export interface StandingRegistryArtifact {
  artifact_id: string;
  path: string;
  active: boolean;
  [key: string]: unknown;
}

export interface StandingRegistry {
  artifacts: StandingRegistryArtifact[];
  [key: string]: unknown;
}

export interface PrefillResultsReviewOptions {
  planDir: string;
  gitDiffFiles: string[];
  standingRegistryPath: string;
  featureSlug: string;
  reviewDate?: string;
  gitDiffWithStatus?: DiffEntry[];
}

export interface TaskStatus {
  taskId: string;
  status: string;
  description?: string;
}

export interface StandingUpdateMatch {
  filePath: string;
  artifactId: string;
}

export interface DiffEntry {
  status: "A" | "M" | "D";
  path: string;
}

export type Verdict = "Met" | "Partially Met" | null;

// --- Logging ---

function log(message: string): void {
  process.stderr.write(`[pre-fill] ${message}\n`);
}

// --- Sub-routines ---

/** Reads standing-registry.json. Returns empty array on any error. */
export function parseStandingRegistry(registryPath: string): StandingRegistryArtifact[] {
  try {
    const raw = fs.readFileSync(registryPath, "utf-8");
    const parsed = JSON.parse(raw) as StandingRegistry;
    if (!Array.isArray(parsed.artifacts)) {
      log(`standing-registry: no artifacts array found at ${registryPath}`);
      return [];
    }
    return parsed.artifacts.filter((a) => a.active);
  } catch (error) {
    log(`standing-registry: failed to parse ${registryPath} — ${String(error)}`);
    return [];
  }
}

/** Extracts task statuses (and optional descriptions) from the Task Summary table in plan.md. */
export function parsePlanTaskStatuses(planDir: string): TaskStatus[] {
  const planPath = path.join(planDir, "plan.md");
  try {
    const content = fs.readFileSync(planPath, "utf-8");
    const tasks: TaskStatus[] = [];
    for (const line of content.split("\n")) {
      // Group 1: taskId, Group 2: description (column 3), Group 3: status (column 6)
      const match = line.match(
        /^\|\s*(TASK-\d+)\s*\|\s*[^|]*\s*\|\s*([^|]+?)\s*\|\s*[^|]*\s*\|\s*[^|]*\s*\|\s*([^|]+?)\s*\|/,
      );
      if (match) {
        tasks.push({
          taskId: match[1].trim(),
          status: match[3].trim(),
          description: match[2].trim(),
        });
      }
    }
    return tasks;
  } catch {
    log(`plan-tasks: plan.md not found at ${planPath}`);
    return [];
  }
}

/**
 * Returns the HTML comment preamble for the ## New Idea Candidates section.
 * Category lines are now constructed individually in prefillResultsReview().
 */
export function scanIdeaCategories(): string[] {
  return [
    "<!-- Scan for signals in these five categories. For each, cite a \"Trigger observation\" from this build. Use \"None.\" if no evidence found for any category.",
    "  1. New standing data source — external feed, API, or dataset suitable for Layer A standing intelligence",
    "  2. New open-source package — library to replace custom code or add capability",
    "  3. New skill — recurring agent workflow ready to be codified as a named skill",
    "  4. New loop process — missing stage, gate, or feedback path in the startup loop",
    "  5. AI-to-mechanistic — LLM reasoning step replaceable with a deterministic script",
    "-->",
  ];
}

/** Intersects gitDiffFiles with standing-registry artifact paths. */
export function detectStandingUpdates(
  gitDiffFiles: string[],
  registryArtifacts: StandingRegistryArtifact[],
): { lines: string[]; matches: StandingUpdateMatch[] } {
  const noChange = {
    lines: ["- No standing updates: no registered artifacts changed"],
    matches: [] as StandingUpdateMatch[],
  };

  if (registryArtifacts.length === 0 || gitDiffFiles.length === 0) {
    log("standing-updates: 0 artifacts changed");
    return noChange;
  }

  const normalize = (f: string) => f.replace(/^\/+/, "").replace(/\\/g, "/");
  const diffSet = new Set(gitDiffFiles.map(normalize));
  const matches: StandingUpdateMatch[] = [];

  for (const artifact of registryArtifacts) {
    const np = normalize(artifact.path);
    if (diffSet.has(np)) {
      matches.push({ filePath: np, artifactId: artifact.artifact_id });
    }
  }

  log(`standing-updates: ${matches.length} artifacts changed`);
  if (matches.length === 0) return noChange;

  return {
    lines: matches.map((m) => `- ${m.filePath}: ${m.artifactId} changed`),
    matches,
  };
}

/** Computes auto-verdict from build-event intended_outcome + task completion. */
export function computeVerdict(
  buildEvent: BuildEvent | null,
  taskStatuses: TaskStatus[],
): { verdict: Verdict; intendedStatement: string | null; rationale: string } {
  const placeholder = "<!-- Pre-filled: LLM should populate verdict rationale -->";

  if (!buildEvent || !buildEvent.intended_outcome) {
    log("verdict: Placeholder (no build-event or no intended outcome)");
    return { verdict: null, intendedStatement: null, rationale: placeholder };
  }

  const intendedStatement = buildEvent.intended_outcome.statement;

  if (taskStatuses.length === 0) {
    log("verdict: Placeholder (no task statuses found)");
    return { verdict: null, intendedStatement, rationale: placeholder };
  }

  const total = taskStatuses.length;
  const complete = taskStatuses.filter(
    (t) => t.status.toLowerCase().startsWith("complete"),
  ).length;

  if (complete === total) {
    log("verdict: Met");
    return {
      verdict: "Met",
      intendedStatement,
      rationale: `All ${total} tasks completed successfully.`,
    };
  }

  log(`verdict: Partially Met (${complete}/${total} tasks complete)`);
  return {
    verdict: "Partially Met",
    intendedStatement,
    rationale: `${complete} of ${total} tasks completed.`,
  };
}

export function renderObservedOutcomesStub(): string {
  return "- <!-- Pre-filled: LLM should populate observed outcomes from build context -->";
}

// --- TASK-01: detectChangedPackages ---

/**
 * Returns one bullet per unique top-level package/app root that appears in
 * gitDiffFiles.  Only paths under `packages/` or `apps/` are considered.
 */
export function detectChangedPackages(gitDiffFiles: string[]): string[] {
  const fallback = ["- No package changes detected"];
  if (gitDiffFiles.length === 0) {
    log("changed-packages: 0 packages changed");
    return fallback;
  }

  const normalize = (f: string) => f.replace(/^\/+/, "").replace(/\\/g, "/");
  const seen = new Set<string>();

  for (const raw of gitDiffFiles) {
    const f = normalize(raw);
    const segments = f.split("/");
    if (
      segments.length >= 2 &&
      (segments[0] === "packages" || segments[0] === "apps")
    ) {
      seen.add(`${segments[0]}/${segments[1]}`);
    }
  }

  if (seen.size === 0) {
    log("changed-packages: 0 packages changed");
    return fallback;
  }

  const sorted = [...seen].sort();
  log(`changed-packages: ${sorted.length} packages changed`);
  return sorted.map((pkg) => `- ${pkg}: changed`);
}

// --- TASK-02: getGitDiffWithStatus + detectNewSkills ---

/**
 * Returns git diff --name-status entries for HEAD~1..HEAD.
 * Skips rename lines (split length !== 2) and falls back to [] on error.
 */
export function getGitDiffWithStatus(): DiffEntry[] {
  try {
    const { execSync } = require("node:child_process") as typeof import("node:child_process");
    const output = execSync("git diff --name-status HEAD~1 HEAD", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const entries: DiffEntry[] = [];
    for (const line of output.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const parts = trimmed.split("\t");
      if (parts.length !== 2) continue; // skip renames and other multi-field lines
      const rawStatus = parts[0].trim();
      const filePath = parts[1].trim();
      if (!filePath) continue;
      const statusChar = rawStatus[0] as string;
      if (statusChar !== "A" && statusChar !== "M" && statusChar !== "D") continue;
      entries.push({ status: statusChar as "A" | "M" | "D", path: filePath });
    }
    return entries;
  } catch {
    log("git-diff-status: failed to read git diff --name-status, using empty list");
    return [];
  }
}

/**
 * Returns category-3 bullet(s) for newly added SKILL.md files.
 * Only `status === 'A'` entries matching `.claude/skills/<name>/SKILL.md` are reported.
 */
export function detectNewSkills(diffWithStatus: DiffEntry[]): string[] {
  const fallback = ["- New skill — None."];
  if (diffWithStatus.length === 0) {
    log("new-skills: 0 new SKILL.md files");
    return fallback;
  }

  const matches: string[] = [];
  for (const entry of diffWithStatus) {
    if (entry.status !== "A") continue;
    const normalized = entry.path.replace(/\\/g, "/");
    // Pattern: .claude/skills/<skill-name>/SKILL.md (exactly one level deep)
    if (/^\.claude\/skills\/[^/]+\/SKILL\.md$/.test(normalized)) {
      matches.push(normalized);
    }
  }

  if (matches.length === 0) {
    log("new-skills: 0 new SKILL.md files");
    return fallback;
  }

  log(`new-skills: ${matches.length} new SKILL.md file(s) added`);
  return matches.map((p) => `- New skill — ${p} added`);
}

// --- TASK-03: detectStartupLoopContractChanges ---

/**
 * Returns category-4 bullet(s) for changes to startup-loop contracts/specs
 * and lp-do-* skill SKILL.md files.
 */
export function detectStartupLoopContractChanges(gitDiffFiles: string[]): string[] {
  const fallback = ["- New loop process — None."];
  if (gitDiffFiles.length === 0) {
    log("contract-changes: 0 contract/spec files changed");
    return fallback;
  }

  const matches: string[] = [];
  for (const raw of gitDiffFiles) {
    const f = raw.replace(/^\/+/, "").replace(/\\/g, "/");
    if (
      f.startsWith("docs/business-os/startup-loop/contracts/") ||
      f.startsWith("docs/business-os/startup-loop/specifications/") ||
      f.startsWith(".claude/skills/lp-do-")
    ) {
      matches.push(f);
    }
  }

  if (matches.length === 0) {
    log("contract-changes: 0 contract/spec files changed");
    return fallback;
  }

  log(`contract-changes: ${matches.length} contract/spec file(s) changed`);
  return matches.map((p) => `- New loop process — ${p} changed`);
}

// --- TASK-04: detectSchemaValidatorAdditions ---

const SCHEMA_VALIDATOR_SUFFIXES = [
  "-validator.ts",
  "-lint.ts",
  "-lint.cjs",
  "-linter.ts",
  ".schema.md",
  ".schema.json",
  ".schema.ts",
];

/**
 * Returns category-5 bullet(s) for new schema/validator files in scripts/src/startup-loop/.
 */
export function detectSchemaValidatorAdditions(gitDiffFiles: string[]): string[] {
  const fallback = ["- AI-to-mechanistic — None."];
  if (gitDiffFiles.length === 0) {
    log("schema-validators: 0 schema/validator files detected");
    return fallback;
  }

  const matches: string[] = [];
  for (const raw of gitDiffFiles) {
    const f = raw.replace(/^\/+/, "").replace(/\\/g, "/");
    if (!f.startsWith("scripts/src/startup-loop/")) continue;
    const base = f.split("/").pop() ?? "";
    if (SCHEMA_VALIDATOR_SUFFIXES.some((suffix) => base.endsWith(suffix))) {
      matches.push(f);
    }
  }

  if (matches.length === 0) {
    log("schema-validators: 0 schema/validator files detected");
    return fallback;
  }

  log(`schema-validators: ${matches.length} schema/validator file(s) detected`);
  return matches.map((p) => `- AI-to-mechanistic — ${p} added`);
}

// --- TASK-05 helpers: sanitiseDescription + renderObservedOutcomes ---

function sanitiseDescription(description: string): string {
  // Strip markdown bold (**text** → text), inline code (`text` → text)
  return description
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

/**
 * Renders task-completion bullets for ## Observed Outcomes.
 * Falls back to the LLM stub when no tasks are provided.
 */
export function renderObservedOutcomes(taskStatuses: TaskStatus[]): string {
  if (taskStatuses.length === 0) {
    return renderObservedOutcomesStub();
  }

  const complete = taskStatuses.filter((t) =>
    t.status.toLowerCase().startsWith("complete"),
  );

  if (complete.length === 0) {
    return renderObservedOutcomesStub();
  }

  const bullets = complete.map((t) => {
    const desc = t.description ? ` — ${sanitiseDescription(t.description)}` : "";
    return `- ${t.taskId}: ${t.status}${desc}`;
  });

  const total = taskStatuses.length;
  const summary = `- ${complete.length} of ${total} tasks completed.`;
  return [...bullets, summary].join("\n");
}

export function renderStandingExpansion(): string {
  return "- No standing expansion: no new external data sources or artifacts identified";
}

// --- Main pre-fill function ---

/** Generates a pre-filled results-review.user.md markdown string. Pure function. */
export function prefillResultsReview(options: PrefillResultsReviewOptions): string {
  const {
    planDir,
    gitDiffFiles,
    standingRegistryPath,
    featureSlug,
    reviewDate = new Date().toISOString().slice(0, 10),
    gitDiffWithStatus = [],
  } = options;

  const registryArtifacts = parseStandingRegistry(standingRegistryPath);
  const buildEvent = readBuildEvent(planDir);
  const taskStatuses = parsePlanTaskStatuses(planDir);

  // --- Observed Outcomes: changed packages (static context) + task-completion bullets ---
  const changedPackageLines = detectChangedPackages(gitDiffFiles);
  const taskCompletionLines = renderObservedOutcomes(taskStatuses);
  // Combine: packages first (static context), then completions, separated by blank if both present
  const observedOutcomesLines: string[] = [];
  const hasPackages = !(changedPackageLines.length === 1 && changedPackageLines[0] === "- No package changes detected");
  const hasCompletions = taskCompletionLines !== renderObservedOutcomesStub();
  if (hasPackages) {
    observedOutcomesLines.push(...changedPackageLines);
  }
  if (hasCompletions) {
    if (observedOutcomesLines.length > 0) observedOutcomesLines.push("");
    observedOutcomesLines.push(taskCompletionLines);
  }
  if (observedOutcomesLines.length === 0) {
    observedOutcomesLines.push(renderObservedOutcomesStub());
  }

  const { lines: standingUpdateLines } = detectStandingUpdates(gitDiffFiles, registryArtifacts);

  // --- New Idea Candidates: categories 1+2 always None; 3/4/5 from extractors ---
  const cat1Lines = ["- New standing data source — None."];
  const cat2Lines = ["- New open-source package — None."];
  const cat3Lines = detectNewSkills(gitDiffWithStatus);
  const cat4Lines = detectStartupLoopContractChanges(gitDiffFiles);
  const cat5Lines = detectSchemaValidatorAdditions(gitDiffFiles);

  const ideaCommentLines = scanIdeaCategories();

  const standingExpansion = renderStandingExpansion();
  const { verdict, intendedStatement, rationale } = computeVerdict(buildEvent, taskStatuses);

  const intendedLine = intendedStatement
    ? `- **Intended:** ${intendedStatement}`
    : "- **Intended:** <!-- Pre-filled: LLM should populate from build-record Outcome Contract -->";
  const observedLine = "- **Observed:** <!-- Pre-filled: LLM should populate -->";
  const verdictLine = verdict
    ? `- **Verdict:** ${verdict}`
    : "- **Verdict:** <!-- Pre-filled: LLM should populate verdict -->";
  const notesLine = `- **Notes:** ${rationale}`;

  return [
    "---",
    "Type: Results-Review",
    "Status: Draft",
    `Feature-Slug: ${featureSlug}`,
    `Review-date: ${reviewDate}`,
    "artifact: results-review",
    "---",
    "",
    "# Results Review",
    "",
    "## Observed Outcomes",
    ...observedOutcomesLines,
    "",
    "## Standing Updates",
    ...standingUpdateLines,
    "",
    "## New Idea Candidates",
    ...ideaCommentLines,
    ...cat1Lines,
    ...cat2Lines,
    ...cat3Lines,
    ...cat4Lines,
    ...cat5Lines,
    "",
    "## Standing Expansion",
    standingExpansion,
    "",
    "## Intended Outcome Check",
    "",
    "<!--",
    "Warn mode (introduced TASK-06, startup-loop-why-intended-outcome-automation, 2026-02-25).",
    "This section is non-blocking during the warn window. After one loop cycle (~14 days) it",
    "will be promoted to a hard gate. A valid verdict keyword is required to clear the warn.",
    "-->",
    "",
    intendedLine,
    observedLine,
    verdictLine,
    notesLine,
    "",
  ].join("\n");
}

// --- CLI entrypoint ---

function parseCliArgs(argv: string[]): { slug: string; planDir: string } {
  let slug = "";
  let planDir = "";

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--slug" && i + 1 < argv.length) {
      slug = argv[++i];
    } else if (argv[i] === "--plan-dir" && i + 1 < argv.length) {
      planDir = argv[++i];
    }
  }

  if (!slug) throw new Error("--slug is required");
  if (!planDir) throw new Error("--plan-dir is required");
  return { slug, planDir };
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

function getGitDiffFiles(): string[] {
  try {
    const { execSync } = require("node:child_process") as typeof import("node:child_process");
    const output = execSync("git diff --name-only HEAD~1 HEAD", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return output.split("\n").map((l) => l.trim()).filter(Boolean);
  } catch {
    log("git-diff: failed to read git diff, using empty file list");
    return [];
  }
}

export async function main(): Promise<void> {
  const { slug, planDir } = parseCliArgs(process.argv.slice(2));
  log(`starting pre-fill for slug=${slug} planDir=${planDir}`);

  const repoRoot = getRepoRoot();
  const standingRegistryPath = path.join(
    repoRoot,
    "docs/business-os/startup-loop/ideas/standing-registry.json",
  );

  const gitDiffFiles = getGitDiffFiles();
  log(`git-diff: ${gitDiffFiles.length} files changed`);

  const gitDiffWithStatus = getGitDiffWithStatus();
  log(`git-diff-status: ${gitDiffWithStatus.length} entries`);

  const resolvedPlanDir = path.resolve(repoRoot, planDir);
  const markdown = prefillResultsReview({
    planDir: resolvedPlanDir,
    gitDiffFiles,
    standingRegistryPath,
    featureSlug: slug,
    gitDiffWithStatus,
  });

  const outputPath = path.join(resolvedPlanDir, "results-review.user.md");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, markdown, "utf-8");
  log(`wrote ${outputPath}`);
}

// Run when invoked directly
const isDirectInvocation = typeof require !== "undefined" && require.main === module;
const isTsxInvocation =
  process.argv[1]?.replace(/\\/g, "/").includes("lp-do-build-results-review-prefill");

if (isDirectInvocation || isTsxInvocation) {
  main().catch((error) => {
    log(`fatal: ${String(error)}`);
    process.exit(1);
  });
}
