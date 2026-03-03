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
}

export interface TaskStatus {
  taskId: string;
  status: string;
}

export interface StandingUpdateMatch {
  filePath: string;
  artifactId: string;
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

/** Extracts task statuses from the Task Summary table in plan.md. */
export function parsePlanTaskStatuses(planDir: string): TaskStatus[] {
  const planPath = path.join(planDir, "plan.md");
  try {
    const content = fs.readFileSync(planPath, "utf-8");
    const tasks: TaskStatus[] = [];
    for (const line of content.split("\n")) {
      const match = line.match(
        /^\|\s*(TASK-\d+)\s*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|\s*([^|]+?)\s*\|/,
      );
      if (match) {
        tasks.push({ taskId: match[1].trim(), status: match[2].trim() });
      }
    }
    return tasks;
  } catch {
    log(`plan-tasks: plan.md not found at ${planPath}`);
    return [];
  }
}

/** 5-category idea scan. Returns "None." for each — LLM refines in Step 2. */
export function scanIdeaCategories(): string[] {
  const categories = [
    "New standing data source",
    "New open-source package",
    "New skill",
    "New loop process",
    "AI-to-mechanistic",
  ];
  const lines = categories.map((c) => `- ${c} — None.`);
  log(`idea-scan: ${categories.length}/5 categories None`);
  return lines;
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
  } = options;

  const registryArtifacts = parseStandingRegistry(standingRegistryPath);
  const buildEvent = readBuildEvent(planDir);
  const taskStatuses = parsePlanTaskStatuses(planDir);

  const observedOutcomes = renderObservedOutcomesStub();
  const { lines: standingUpdateLines } = detectStandingUpdates(gitDiffFiles, registryArtifacts);
  const ideaCategoryLines = scanIdeaCategories();
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
    observedOutcomes,
    "",
    "## Standing Updates",
    ...standingUpdateLines,
    "",
    "## New Idea Candidates",
    "<!-- Scan for signals in these five categories. For each, cite a \"Trigger observation\" from this build. Use \"None.\" if no evidence found for any category.",
    "  1. New standing data source — external feed, API, or dataset suitable for Layer A standing intelligence",
    "  2. New open-source package — library to replace custom code or add capability",
    "  3. New skill — recurring agent workflow ready to be codified as a named skill",
    "  4. New loop process — missing stage, gate, or feedback path in the startup loop",
    "  5. AI-to-mechanistic — LLM reasoning step replaceable with a deterministic script",
    "-->",
    ...ideaCategoryLines,
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

  const resolvedPlanDir = path.resolve(repoRoot, planDir);
  const markdown = prefillResultsReview({
    planDir: resolvedPlanDir,
    gitDiffFiles,
    standingRegistryPath,
    featureSlug: slug,
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
