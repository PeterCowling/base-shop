import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { load as loadYaml } from "js-yaml";

import {
  type ReflectionRequiredSection,
  REQUIRED_REFLECTION_SECTIONS,
  validateResultsReviewFile,
} from "./lp-do-build-reflection-debt.js";
import { backfillSyntheticDispatch } from "../ideas/lp-do-ideas-synthetic-dispatch-narrative.js";
import type { DispatchBuildOriginProvenance } from "../ideas/lp-do-ideas-trial.js";
import {
  IDEAS_COMPLETED_IDEAS_PATH,
  IDEAS_TRIAL_QUEUE_STATE_PATH,
  IDEAS_TRIAL_TELEMETRY_PATH,
} from "../ideas/lp-do-ideas-paths.js";
import {
  MISSING_VALUE,
  classifyIdeaItem,
  normalizeNewlines,
  parseSections,
  sanitizeText,
  toIsoDate,
} from "./lp-do-build-results-review-parse.js";
import { runBuildOriginSignalsBridge } from "../ideas/lp-do-ideas-build-origin-bridge.js";
import { runCodebaseSignalsBridge } from "../ideas/lp-do-ideas-codebase-signals-bridge.js";
import { runAgentSessionSignalsBridge } from "../ideas/lp-do-ideas-agent-session-bridge.js";
import {
  SIGNAL_REVIEW_REQUIRED_SCHEMA_VERSION,
  type SignalReviewReviewRequiredItem,
} from "../diagnostics/signal-review-review-required.js";

const PROCESS_HTML_RELATIVE_PATH = "docs/business-os/process-improvements.user.html";
const PROCESS_DATA_RELATIVE_PATH = "docs/business-os/_data/process-improvements.json";
export const COMPLETED_IDEAS_RELATIVE_PATH = IDEAS_COMPLETED_IDEAS_PATH;
const PLANS_ROOT = "docs/plans";
const STRATEGY_ROOT = "docs/business-os/strategy";
export const QUEUE_STATE_RELATIVE_PATH = IDEAS_TRIAL_QUEUE_STATE_PATH;
const QUEUE_TELEMETRY_RELATIVE_PATH = IDEAS_TRIAL_TELEMETRY_PATH;

export type ProcessImprovementType = "idea" | "risk" | "pending-review";

export interface ProcessImprovementItem {
  type: ProcessImprovementType;
  business: string;
  title: string;
  body: string;
  suggested_action?: string;
  source: string;
  date: string;
  path: string;
  idea_key?: string;
  /** Priority tier from the canonical classification policy (P0–P5). Only set for idea items. */
  priority_tier?: string;
  /** Numeric rank (1=P0 highest … 10=P5 lowest). Lower = higher priority. Only set for idea items. */
  own_priority_rank?: number;
  /** Urgency from the classifier (U0–U3). U0 = critical/now, U3 = no urgency. Only set for idea items. */
  urgency?: string;
  /** Effort estimate from the classifier (XS/S/M/L/XL). Only set for idea items. */
  effort?: string;
  /** Proximity for P1-tier ideas (Direct/Near/Indirect). Null for non-P1 tiers. Only set for idea items. */
  proximity?: string | null;
  /** Reason code from the classifier decision tree. Only set for idea items. */
  reason_code?: string;
  /** Review owner when the item is an operator work item. */
  owner?: string;
  /** Due date for operator review work. */
  due_date?: string;
  /** Review/escalation state for pending operator work. */
  escalation_state?: string;
  /** Stable dedupe identity for review work. */
  fingerprint?: string;
  /** Current workflow state for review work. */
  workflow_status?: string;
  /** First time the recurring issue appeared. */
  first_seen_date?: string;
  /** Most recent time the recurring issue appeared. */
  latest_seen_date?: string;
  /** Count of review occurrences observed so far. */
  recurrence_count?: number;
  /** Canonical build-review provenance for queue-backed build-origin ideas. */
  build_origin?: DispatchBuildOriginProvenance;
}

export interface CompletedIdeaEntry {
  idea_key: string;
  title: string;
  source_path: string;
  plan_slug: string;
  completed_at: string;
  output_link?: string;
}

export interface CompletedIdeasRegistry {
  schema_version: "completed-ideas.v1";
  entries: CompletedIdeaEntry[];
}

interface ReflectionDebtLedgerItem {
  status?: string;
  feature_slug?: string;
  business_scope?: string | null;
  due_at?: string;
  updated_at?: string;
  source_paths?: {
    results_review_path?: string;
  };
  minimum_reflection?: {
    missing_sections?: string[];
  };
}

interface ReflectionDebtLedger {
  items?: ReflectionDebtLedgerItem[];
}

interface DispatchPacket {
  dispatch_id?: string;
  artifact_id?: string | null;
  business?: string;
  area_anchor?: string;
  current_truth?: string;
  next_scope_now?: string;
  why?: string;
  priority?: string;
  queue_state?: string;
  created_at?: string;
  build_origin?: DispatchBuildOriginProvenance;
}

interface QueueStateFile {
  dispatches?: DispatchPacket[];
}

interface SignalReviewReviewRequiredSidecarFile {
  schema_version?: string;
  source_path?: string;
  items?: SignalReviewReviewRequiredItem[];
}

export interface BuildOriginBridgeSummary {
  ok: boolean;
  plans_scanned: number;
  plans_considered: number;
  signals_considered: number;
  signals_admitted: number;
  dispatches_enqueued: number;
  suppressed: number;
  noop: number;
  warnings: string[];
}

interface BugScanFindingItem {
  ruleId?: string;
  severity?: string;
  message?: string;
  suggestion?: string;
  file?: string;
  line?: number;
  column?: number;
}

interface BugScanFindingsArtifact {
  schema_version?: string;
  generated_at?: string;
  business_scope?: string | null;
  findings?: BugScanFindingItem[];
}

interface FrontmatterParseResult {
  frontmatter: Record<string, unknown>;
  body: string;
}

function toPosixPath(value: string): string {
  return value.split(path.sep).join("/");
}

const SECTION_PLAIN_NAMES: Readonly<Record<string, string>> = {
  "Observed Outcomes": "what the build achieved",
  "Standing Updates": "what needs updating in standing docs",
  "New Idea Candidates": "new ideas spotted",
  "Standing Expansion": "expansion opportunities",
};

function plainSectionName(section: string): string {
  return SECTION_PLAIN_NAMES[section] ?? section.toLowerCase();
}

function describeMissingSections(sections: readonly string[]): string {
  const named = sections.map(plainSectionName);
  if (named.length === 0) return "some required sections are incomplete";
  if (named.length === 1) return `the "${named[0]}" section is missing`;
  if (named.length === 2) return `"${named[0]}" and "${named[1]}" are missing`;
  return `${named.length} sections are missing`;
}

function parseFrontmatter(content: string): FrontmatterParseResult {
  const normalized = normalizeNewlines(content);
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return { frontmatter: {}, body: normalized };
  }

  let frontmatter: Record<string, unknown> = {};
  try {
    const parsed = loadYaml(match[1]);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      frontmatter = parsed as Record<string, unknown>;
    }
  } catch {
    // Invalid frontmatter should not break generation.
  }

  return {
    frontmatter,
    body: normalized.slice(match[0].length),
  };
}

function extractFrontmatterString(
  frontmatter: Record<string, unknown>,
  keys: readonly string[],
): string | null {
  const map = new Map<string, string>();
  for (const [key, value] of Object.entries(frontmatter)) {
    if (typeof value !== "string") {
      continue;
    }
    const normalized = key.trim().toLowerCase();
    map.set(normalized, value.trim());
    map.set(normalized.replace(/\s+/g, "_"), value.trim());
  }

  for (const key of keys) {
    const normalized = key.trim().toLowerCase();
    const value = map.get(normalized) ?? map.get(normalized.replace(/\s+/g, "_"));
    if (value && value.length > 0) {
      return value;
    }
  }
  return null;
}

function listFilesRecursive(absDir: string, output: string[], repoRoot: string): void {
  const entries = readdirSync(absDir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  for (const entry of entries) {
    const absPath = path.join(absDir, entry.name);
    if (entry.isDirectory()) {
      listFilesRecursive(absPath, output, repoRoot);
      continue;
    }
    if (entry.isFile()) {
      output.push(toPosixPath(path.relative(repoRoot, absPath)));
    }
  }
}

function inferBusinessFromFrontmatter(frontmatter: Record<string, unknown>): string {
  const business =
    extractFrontmatterString(frontmatter, ["Business-Unit", "business", "business_scope"]) ??
    "BOS";
  const normalized = sanitizeText(business).toUpperCase();
  return normalized.length > 0 ? normalized : "BOS";
}

function inferFeatureSlugFromPath(sourcePath: string): string {
  const parts = sourcePath.split("/");
  const plansIndex = parts.indexOf("plans");
  if (plansIndex < 0 || parts.length <= plansIndex + 1) {
    return "unknown-feature";
  }
  const first = parts[plansIndex + 1] ?? "unknown-feature";
  if (first === "_archive" && parts.length > plansIndex + 2) {
    return parts[plansIndex + 2] ?? "unknown-feature";
  }
  return first;
}

function normalizeOptionalPathValue(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = sanitizeText(value);
  return normalized.length > 0 ? normalized : null;
}

function normalizeBuildOriginProvenance(
  value: DispatchBuildOriginProvenance | undefined,
): DispatchBuildOriginProvenance | undefined {
  if (!value || value.schema_version !== "dispatch-build-origin.v1") {
    return undefined;
  }

  const buildSignalId = sanitizeText(value.build_signal_id);
  const recurrenceKey = sanitizeText(value.recurrence_key);
  const reviewCycleKey = sanitizeText(value.review_cycle_key);
  const planSlug = sanitizeText(value.plan_slug);
  const canonicalTitle = sanitizeText(value.canonical_title);
  const primarySource = sanitizeText(value.primary_source);
  const mergeState = sanitizeText(value.merge_state);

  if (
    buildSignalId.length === 0 ||
    recurrenceKey.length === 0 ||
    reviewCycleKey.length === 0 ||
    planSlug.length === 0 ||
    canonicalTitle.length === 0 ||
    (primarySource !== "pattern-reflection.entries.json" &&
      primarySource !== "results-review.signals.json") ||
    (mergeState !== "single_source" && mergeState !== "merged_cross_sidecar")
  ) {
    return undefined;
  }

  const reflectionFields = value.reflection_fields
    ? {
        category: normalizeOptionalPathValue(value.reflection_fields.category),
        routing_target: normalizeOptionalPathValue(value.reflection_fields.routing_target),
        occurrence_count:
          typeof value.reflection_fields.occurrence_count === "number" &&
            Number.isInteger(value.reflection_fields.occurrence_count) &&
            value.reflection_fields.occurrence_count >= 0
            ? value.reflection_fields.occurrence_count
            : null,
      }
    : undefined;

  return {
    schema_version: "dispatch-build-origin.v1",
    build_signal_id: buildSignalId,
    recurrence_key: recurrenceKey,
    review_cycle_key: reviewCycleKey,
    plan_slug: planSlug,
    canonical_title: canonicalTitle,
    primary_source:
      primarySource === "pattern-reflection.entries.json"
        ? "pattern-reflection.entries.json"
        : "results-review.signals.json",
    merge_state:
      mergeState === "merged_cross_sidecar" ? "merged_cross_sidecar" : "single_source",
    source_presence: {
      results_review_signal: value.source_presence?.results_review_signal === true,
      pattern_reflection_entry: value.source_presence?.pattern_reflection_entry === true,
    },
    results_review_path: normalizeOptionalPathValue(value.results_review_path),
    results_review_sidecar_path: normalizeOptionalPathValue(value.results_review_sidecar_path),
    pattern_reflection_path: normalizeOptionalPathValue(value.pattern_reflection_path),
    pattern_reflection_sidecar_path: normalizeOptionalPathValue(
      value.pattern_reflection_sidecar_path,
    ),
    reflection_fields: reflectionFields,
  };
}

function parseReflectionDebtItems(markdown: string): ReflectionDebtLedgerItem[] {
  const match = markdown.match(
    /<!--\s*REFLECTION_DEBT_LEDGER_START\s*-->\s*```json\s*([\s\S]*?)\s*```\s*<!--\s*REFLECTION_DEBT_LEDGER_END\s*-->/m,
  );
  if (!match) {
    return [];
  }

  try {
    const parsed = JSON.parse(match[1]) as ReflectionDebtLedger;
    if (!Array.isArray(parsed.items)) {
      return [];
    }
    return parsed.items;
  } catch {
    return [];
  }
}

function suggestedActionRank(action: string | undefined): number {
  if (!action) return 4;
  const lower = action.toLowerCase();
  if (/create card now|urgent/i.test(lower)) return 1;
  if (/create card/i.test(lower)) return 2;
  if (/spike|investigate/i.test(lower)) return 3;
  if (/defer/i.test(lower)) return 5;
  return 4;
}

function compareDateOnly(left: string, right: string): number {
  return left.localeCompare(right);
}

function sortItems(items: ProcessImprovementItem[]): ProcessImprovementItem[] {
  return [...items].sort((left, right) => {
    const dateOrder = right.date.localeCompare(left.date);
    if (dateOrder !== 0) {
      return dateOrder;
    }
    return left.title.localeCompare(right.title);
  });
}

function sortIdeaItems(items: ProcessImprovementItem[]): ProcessImprovementItem[] {
  return [...items].sort((left, right) => {
    // Primary: canonical priority rank (lower integer = higher priority; unclassified → lowest)
    const rankLeft = left.own_priority_rank ?? 999;
    const rankRight = right.own_priority_rank ?? 999;
    if (rankLeft !== rankRight) return rankLeft - rankRight;
    // Secondary: suggested action urgency (create card now > create card > spike > other > defer)
    const actionLeft = suggestedActionRank(left.suggested_action);
    const actionRight = suggestedActionRank(right.suggested_action);
    if (actionLeft !== actionRight) return actionLeft - actionRight;
    // Tertiary: date descending (most recent first)
    const dateOrder = right.date.localeCompare(left.date);
    if (dateOrder !== 0) return dateOrder;
    return left.title.localeCompare(right.title);
  });
}

export interface ProcessImprovementsData {
  ideaItems: ProcessImprovementItem[];
  riskItems: ProcessImprovementItem[];
  pendingReviewItems: ProcessImprovementItem[];
}

/**
 * Derive a stable, deterministic key for an idea based on its source file path and title.
 * The key is the SHA-1 hash of `${sourcePath}::${title}`.
 * This function has no filesystem side effects and is safe to call in tests and check mode.
 */
export function deriveIdeaKey(sourcePath: string, title: string): string {
  return createHash("sha1").update(`${sourcePath}::${title}`).digest("hex");
}

/**
 * Load the completed-ideas registry from disk.
 * Returns an empty Set if the file does not exist or cannot be parsed —
 * preserving existing behavior for repos that have not yet created the registry.
 */
export function loadCompletedIdeasRegistry(repoRoot: string): Set<string> {
  const filePath = path.join(repoRoot, COMPLETED_IDEAS_RELATIVE_PATH);
  if (!existsSync(filePath)) {
    return new Set<string>();
  }
  try {
    const raw = readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as CompletedIdeasRegistry;
    if (!Array.isArray(parsed.entries)) {
      return new Set<string>();
    }
    return new Set<string>(parsed.entries.map((e) => e.idea_key));
  } catch {
    return new Set<string>();
  }
}

/**
 * Append a completed idea entry to the registry file.
 * Derives `idea_key` from `entry.source_path` and `entry.title`.
 * Idempotent: if an entry with the same `idea_key` already exists, does nothing.
 * Creates the registry file (and its parent directory) if it does not yet exist.
 */
export function appendCompletedIdea(
  repoRoot: string,
  entry: Omit<CompletedIdeaEntry, "idea_key">,
): void {
  const ideaKey = deriveIdeaKey(entry.source_path, entry.title);
  const filePath = path.join(repoRoot, COMPLETED_IDEAS_RELATIVE_PATH);

  let registry: CompletedIdeasRegistry;
  if (existsSync(filePath)) {
    try {
      const raw = readFileSync(filePath, "utf8");
      registry = JSON.parse(raw) as CompletedIdeasRegistry;
      if (!Array.isArray(registry.entries)) {
        registry.entries = [];
      }
    } catch {
      registry = { schema_version: "completed-ideas.v1", entries: [] };
    }
  } else {
    registry = { schema_version: "completed-ideas.v1", entries: [] };
  }

  // Idempotency check
  if (registry.entries.some((e) => e.idea_key === ideaKey)) {
    return;
  }

  registry.entries.push({ ...entry, idea_key: ideaKey });
  writeFileAtomic(filePath, `${JSON.stringify(registry, null, 2)}\n`);
}

export function collectProcessImprovements(repoRoot: string): ProcessImprovementsData {
  const absPlansRoot = path.join(repoRoot, PLANS_ROOT);
  const absStrategyRoot = path.join(repoRoot, STRATEGY_ROOT);
  const allPaths: string[] = [];
  const strategyPaths: string[] = [];
  try {
    listFilesRecursive(absPlansRoot, allPaths, repoRoot);
  } catch {
    return {
      ideaItems: [],
      riskItems: [],
      pendingReviewItems: [],
    };
  }
  try {
    listFilesRecursive(absStrategyRoot, strategyPaths, repoRoot);
  } catch {
    // Signal Review review-required sidecars are optional.
  }

  const buildRecordPaths = allPaths.filter((sourcePath) =>
    sourcePath.endsWith("/build-record.user.md"),
  );
  const reflectionDebtPaths = allPaths.filter((sourcePath) =>
    sourcePath.endsWith("/reflection-debt.user.md"),
  );
  const bugScanPaths = allPaths.filter((sourcePath) =>
    sourcePath.endsWith("/bug-scan-findings.user.json"),
  );
  const signalReviewRequiredPaths = strategyPaths.filter((sourcePath) =>
    /signal-review-.*\.review-required\.json$/u.test(sourcePath),
  );

  const ideaItems: ProcessImprovementItem[] = [];
  const riskItems: ProcessImprovementItem[] = [];
  const pendingReviewItems: ProcessImprovementItem[] = [];
  const signalReviewPendingByFingerprint = new Map<string, ProcessImprovementItem>();

  for (const sourcePath of bugScanPaths) {
    const absPath = path.join(repoRoot, sourcePath);
    let parsed: BugScanFindingsArtifact | null = null;
    try {
      const raw = readFileSync(absPath, "utf8");
      parsed = JSON.parse(raw) as BugScanFindingsArtifact;
    } catch {
      parsed = null;
    }
    if (!parsed || !Array.isArray(parsed.findings)) {
      continue;
    }

    const business =
      sanitizeText(parsed.business_scope ?? "").toUpperCase() ||
      sanitizeText(inferFeatureSlugFromPath(sourcePath).split("-")[0] ?? "").toUpperCase() ||
      "BOS";
    const ideaDate = toIsoDate(parsed.generated_at ?? statSync(absPath).mtime.toISOString());

    for (const finding of parsed.findings) {
      const ruleId = sanitizeText(finding.ruleId ?? "");
      const file = sanitizeText(finding.file ?? "");
      const line = Number.isFinite(finding.line) ? Number(finding.line) : 0;
      const column = Number.isFinite(finding.column) ? Number(finding.column) : 0;
      const message = sanitizeText(finding.message ?? "");
      const suggestion = sanitizeText(finding.suggestion ?? "");
      const severity = sanitizeText(finding.severity ?? "").toLowerCase();
      if (!ruleId || !file || !message) {
        continue;
      }

      const location =
        line > 0 ? `${file}:${line}${column > 0 ? `:${column}` : ""}` : file;
      const title = `Bug scan ${ruleId} at ${location}`;
      const ideaItem: ProcessImprovementItem = {
        type: "idea",
        business,
        title,
        body: `${message} (${severity || "warning"})`,
        suggested_action:
          `${suggestion || "Fix the flagged pattern at source."} Re-run: pnpm bug-scan -- --only-rules=${ruleId} ${file}`,
        source: "bug-scan-findings.user.json",
        date: ideaDate,
        path: sourcePath,
        idea_key: deriveIdeaKey(sourcePath, title),
      };
      classifyIdeaItem(ideaItem);
      ideaItems.push(ideaItem);
    }
  }

  // --- Dispatch queue collection (queue-state.json) ---
  const queueStatePath = path.join(repoRoot, QUEUE_STATE_RELATIVE_PATH);
  try {
    if (existsSync(queueStatePath)) {
      const raw = readFileSync(queueStatePath, "utf8");
      const parsed = JSON.parse(raw) as QueueStateFile;
      if (Array.isArray(parsed.dispatches)) {
        for (const dispatch of parsed.dispatches) {
          if (dispatch.queue_state !== "enqueued") {
            continue;
          }
          const enrichedDispatch = backfillSyntheticDispatch(dispatch, {
            rootDir: repoRoot,
          }).dispatch as DispatchPacket;
          const buildOrigin = normalizeBuildOriginProvenance(enrichedDispatch.build_origin);
          const title =
            sanitizeText(enrichedDispatch.current_truth ?? "") ||
            sanitizeText(enrichedDispatch.area_anchor ?? "") ||
            (buildOrigin?.canonical_title ?? "");
          if (!title) {
            continue;
          }
          const dispatchId = dispatch.dispatch_id ?? "";
          if (!dispatchId) {
            continue;
          }
          const business = sanitizeText(dispatch.business ?? "BOS").toUpperCase() || "BOS";
          const body = sanitizeText(enrichedDispatch.why ?? "") || MISSING_VALUE;
          const date = toIsoDate(dispatch.created_at ?? new Date().toISOString());

          if (title.length > 100) {
            process.stderr.write(
              `[generate-process-improvements] warn: dispatch title exceeds 100 chars — shorten at source: "${title.slice(0, 60)}..."\n`,
            );
          }
          const ideaItem: ProcessImprovementItem = {
            type: "idea",
            business,
            title,
            body,
            source: "queue-state.json",
            date,
            path: QUEUE_STATE_RELATIVE_PATH,
            idea_key: deriveIdeaKey(QUEUE_STATE_RELATIVE_PATH, dispatchId),
            build_origin: buildOrigin,
          };
          classifyIdeaItem(ideaItem);
          ideaItems.push(ideaItem);
        }
      }
    }
  } catch {
    // Missing or unparseable queue-state.json — no dispatch items, no error.
  }

  for (const sourcePath of reflectionDebtPaths) {
    const absPath = path.join(repoRoot, sourcePath);
    const markdown = readFileSync(absPath, "utf8");
    const items = parseReflectionDebtItems(markdown);
    for (const item of items) {
      if (item.status !== "open") {
        continue;
      }
      const missing = (item.minimum_reflection?.missing_sections ?? [])
        .map((section) => sanitizeText(section))
        .filter((section) => section.length > 0);
      const featureSlug = sanitizeText(item.feature_slug ?? inferFeatureSlugFromPath(sourcePath));
      const business = sanitizeText(item.business_scope ?? "BOS").toUpperCase() || "BOS";
      const due = item.due_at ? toIsoDate(item.due_at) : MISSING_VALUE;
      const rawResultsReviewPath = sanitizeText(
        item.source_paths?.results_review_path ?? sourcePath.replace("reflection-debt.user.md", "results-review.user.md"),
      );
      const resultsReviewPath = path.isAbsolute(rawResultsReviewPath)
        ? toPosixPath(path.relative(repoRoot, rawResultsReviewPath))
        : rawResultsReviewPath;
      riskItems.push({
        type: "risk",
        business,
        title: `Results review overdue: ${featureSlug}`,
        body:
          missing.length > 0
            ? `The results review exists but ${describeMissingSections(missing)}.`
            : "The results review is incomplete.",
        suggested_action: `Open ${resultsReviewPath} and fill in the missing sections. Due: ${due.slice(0, 10)}.`,
        source: "reflection-debt.user.md",
        date: toIsoDate(item.updated_at ?? statSync(absPath).mtime.toISOString()),
        path: sourcePath,
      });
    }
  }

  for (const sourcePath of buildRecordPaths) {
    const absPath = path.join(repoRoot, sourcePath);
    const raw = readFileSync(absPath, "utf8");
    const parsed = parseFrontmatter(raw);
    const featureSlug =
      extractFrontmatterString(parsed.frontmatter, ["Feature-Slug", "Plan"]) ??
      inferFeatureSlugFromPath(sourcePath);
    const siblingResultsReviewPath = path.join(path.dirname(absPath), "results-review.user.md");
    const validation = validateResultsReviewFile(siblingResultsReviewPath);
    if (validation.valid) {
      continue;
    }

    const business = inferBusinessFromFrontmatter(parsed.frontmatter);
    pendingReviewItems.push({
      type: "pending-review",
      business,
      title: `Pending results review: ${sanitizeText(featureSlug)}`,
      body: validation.results_review_exists
        ? `Results review exists but ${describeMissingSections(validation.missing_sections)}.`
        : "Build is complete but no results review has been written yet.",
      suggested_action: `${validation.results_review_exists ? "Complete" : "Write"} ${toPosixPath(path.relative(repoRoot, siblingResultsReviewPath))} — four sections: what the build achieved, what needs updating in standing docs, new ideas spotted, and expansion opportunities.`,
      source: "build-record.user.md",
      date: toIsoDate(statSync(absPath).mtime.toISOString()),
      path: sourcePath,
    });
  }

  for (const sourcePath of signalReviewRequiredPaths) {
    const absPath = path.join(repoRoot, sourcePath);
    let parsed: SignalReviewReviewRequiredSidecarFile | null = null;
    try {
      const raw = readFileSync(absPath, "utf8");
      parsed = JSON.parse(raw) as SignalReviewReviewRequiredSidecarFile;
    } catch {
      parsed = null;
    }

    if (
      !parsed ||
      parsed.schema_version !== SIGNAL_REVIEW_REQUIRED_SCHEMA_VERSION ||
      !Array.isArray(parsed.items)
    ) {
      continue;
    }

    for (const item of parsed.items) {
      const fingerprint = sanitizeText(item.fingerprint);
      if (!fingerprint) {
        continue;
      }
      const business = sanitizeText(item.business).toUpperCase() || "BOS";
      const latestSeenDate = toIsoDate(item.latest_seen_run_date);
      const candidate: ProcessImprovementItem = {
        type: "pending-review",
        business,
        title: `Review required: ${sanitizeText(item.title)}`,
        body: sanitizeText(item.body),
        suggested_action: sanitizeText(item.suggested_action),
        source: "signal-review.review-required.json",
        date: latestSeenDate,
        path: sourcePath,
        owner: sanitizeText(item.owner),
        due_date: toIsoDate(item.due_date),
        escalation_state: sanitizeText(item.escalation_state),
        fingerprint,
        workflow_status: sanitizeText(item.workflow_status),
        first_seen_date: toIsoDate(item.first_seen_run_date),
        latest_seen_date: latestSeenDate,
        recurrence_count: item.recurrence_count,
      };

      const dedupeKey = `${candidate.business}:${fingerprint}`;
      const existing = signalReviewPendingByFingerprint.get(dedupeKey);
      if (!existing) {
        signalReviewPendingByFingerprint.set(dedupeKey, candidate);
        continue;
      }

      const pickCandidate = compareDateOnly(candidate.date, existing.date) >= 0;
      const nextItem = pickCandidate ? candidate : existing;
      nextItem.first_seen_date =
        [existing.first_seen_date, candidate.first_seen_date]
          .filter((value): value is string => typeof value === "string" && value.length > 0)
          .sort(compareDateOnly)[0] ?? nextItem.first_seen_date;
      nextItem.latest_seen_date =
        [existing.latest_seen_date, candidate.latest_seen_date]
          .filter((value): value is string => typeof value === "string" && value.length > 0)
          .sort(compareDateOnly)
          .at(-1) ?? nextItem.latest_seen_date;
      nextItem.recurrence_count = Math.max(existing.recurrence_count ?? 0, candidate.recurrence_count ?? 0);
      signalReviewPendingByFingerprint.set(dedupeKey, nextItem);
    }
  }

  pendingReviewItems.push(...signalReviewPendingByFingerprint.values());

  return {
    ideaItems: sortIdeaItems(ideaItems),
    riskItems: sortItems(riskItems),
    pendingReviewItems: sortItems(pendingReviewItems),
  };
}

export function runBuildOriginBridgeForProcessImprovements(repoRoot: string): BuildOriginBridgeSummary {
  const plansRoot = path.join(repoRoot, PLANS_ROOT);
  const summary: BuildOriginBridgeSummary = {
    ok: true,
    plans_scanned: 0,
    plans_considered: 0,
    signals_considered: 0,
    signals_admitted: 0,
    dispatches_enqueued: 0,
    suppressed: 0,
    noop: 0,
    warnings: [],
  };

  if (!existsSync(plansRoot)) {
    return summary;
  }

  const planEntries = readdirSync(plansRoot, { withFileTypes: true }).filter(
    (entry) => entry.isDirectory() && entry.name !== "_archive",
  );
  summary.plans_scanned = planEntries.length;

  for (const planEntry of planEntries) {
    const planDirAbs = path.join(plansRoot, planEntry.name);
    const hasResultsReviewSidecar = existsSync(path.join(planDirAbs, "results-review.signals.json"));
    const hasPatternReflectionSidecar = existsSync(
      path.join(planDirAbs, "pattern-reflection.entries.json"),
    );
    if (!hasResultsReviewSidecar && !hasPatternReflectionSidecar) {
      continue;
    }

    summary.plans_considered += 1;

    const planDir = toPosixPath(path.join(PLANS_ROOT, planEntry.name));
    const result = runBuildOriginSignalsBridge({
      rootDir: repoRoot,
      planDir,
      queueStatePath: QUEUE_STATE_RELATIVE_PATH,
      telemetryPath: QUEUE_TELEMETRY_RELATIVE_PATH,
    });

    summary.ok &&= result.ok;
    summary.signals_considered += result.signals_considered;
    summary.signals_admitted += result.signals_admitted;
    summary.dispatches_enqueued += result.dispatches_enqueued;
    summary.suppressed += result.suppressed;
    summary.noop += result.noop;

    for (const warning of result.warnings) {
      summary.warnings.push(`[${planDir}] ${warning}`);
    }
    if (result.error) {
      summary.warnings.push(`[${planDir}] ${result.error}`);
    }
  }

  return summary;
}

function replaceArrayAssignment(html: string, variableName: string, items: ProcessImprovementItem[]): string {
  const serialized = JSON.stringify(items, null, 2)
    .split("\n")
    .map((line, index) => (index === 0 ? line : `  ${line}`))
    .join("\n");
  const startToken = `var ${variableName} =`;
  const start = html.indexOf(startToken);
  if (start < 0) {
    throw new Error(`Unable to locate ${variableName} assignment in process improvements HTML.`);
  }
  const openBracket = html.indexOf("[", start);
  const close = html.indexOf("];", openBracket);
  if (openBracket < 0 || close < 0) {
    throw new Error(`Unable to locate ${variableName} array bounds in process improvements HTML.`);
  }
  const assignment = `var ${variableName} = ${serialized};`;
  return `${html.slice(0, start)}${assignment}${html.slice(close + 2)}`;
}

function replaceGenTs(html: string, genTs: string): string {
  const pattern = /var GEN_TS = "[^"]*";/;
  if (!pattern.test(html)) {
    process.stderr.write(
      "[generate-process-improvements] warn: GEN_TS placeholder not found in HTML — skipping timestamp embed\n",
    );
    return html;
  }
  return html.replace(pattern, `var GEN_TS = "${genTs}";`);
}

function updateLastClearedFooter(html: string, dateIso: string): string {
  const pattern = /Last cleared:\s*[^<]+/;
  if (!pattern.test(html)) {
    return html;
  }
  return html.replace(
    pattern,
    `Last cleared: ${dateIso} — extracted from build records, reflection debt, and results reviews`,
  );
}

export function updateProcessImprovementsHtml(
  html: string,
  data: ProcessImprovementsData,
  dateIso: string,
  genTs?: string,
): string {
  let next = html;
  next = replaceArrayAssignment(next, "IDEA_ITEMS", data.ideaItems);
  next = replaceArrayAssignment(next, "RISK_ITEMS", data.riskItems);
  next = replaceArrayAssignment(next, "PENDING_REVIEW_ITEMS", data.pendingReviewItems);
  next = updateLastClearedFooter(next, dateIso);
  if (genTs !== undefined) {
    next = replaceGenTs(next, genTs);
  }
  return next;
}

/**
 * Extract a single `var NAME = [...];` assignment block from an HTML string.
 * Returns the block text or null if the variable is not found.
 */
function extractArrayAssignmentBlock(html: string, variableName: string): string | null {
  const startToken = `var ${variableName} =`;
  const start = html.indexOf(startToken);
  if (start < 0) return null;
  const openBracket = html.indexOf("[", start);
  const close = html.indexOf("];", openBracket);
  if (openBracket < 0 || close < 0) return null;
  return html.slice(start, close + 2);
}

/**
 * Build the canonical `var NAME = [...];` assignment string for a given variable and items array.
 * Mirrors the serialization used by replaceArrayAssignment.
 */
function buildArrayAssignmentBlock(variableName: string, items: ProcessImprovementItem[]): string {
  const serialized = JSON.stringify(items, null, 2)
    .split("\n")
    .map((line, index) => (index === 0 ? line : `  ${line}`))
    .join("\n");
  return `var ${variableName} = ${serialized};`;
}

/**
 * Check mode: compare only the three array variable assignment blocks in the committed HTML
 * (avoids false positives from the date-stamp footer) plus the full JSON data file.
 * Exits 0 if up-to-date, exits 1 if drift detected.
 *
 * The drift check works by re-running `collectProcessImprovements` and comparing the
 * fresh output against committed files. Active idea backlog now comes from canonical
 * queue state plus bug-scan artifacts; `completed-ideas.json` remains a derived
 * compatibility artifact and no longer suppresses active backlog visibility here.
 */
export function runCheck(repoRoot: string): void {
  const htmlPath = path.join(repoRoot, PROCESS_HTML_RELATIVE_PATH);
  const dataPath = path.join(repoRoot, PROCESS_DATA_RELATIVE_PATH);

  const data = collectProcessImprovements(repoRoot);
  const expectedDataJson = `${JSON.stringify(data, null, 2)}\n`;

  let drifted = false;

  if (!existsSync(htmlPath)) {
    process.stderr.write(
      `[generate-process-improvements] DRIFT: ${PROCESS_HTML_RELATIVE_PATH} does not exist — re-run generator\n`,
    );
    drifted = true;
  } else {
    const committedHtml = readFileSync(htmlPath, "utf8");
    for (const [variableName, items] of [
      ["IDEA_ITEMS", data.ideaItems],
      ["RISK_ITEMS", data.riskItems],
      ["PENDING_REVIEW_ITEMS", data.pendingReviewItems],
    ] as [string, ProcessImprovementItem[]][]) {
      const expected = buildArrayAssignmentBlock(variableName, items);
      const committed = extractArrayAssignmentBlock(committedHtml, variableName);
      if (committed === null) {
        process.stderr.write(
          `[generate-process-improvements] DRIFT: ${PROCESS_HTML_RELATIVE_PATH} is missing ${variableName} — re-run generator\n`,
        );
        drifted = true;
      } else if (committed !== expected) {
        process.stderr.write(
          `[generate-process-improvements] DRIFT: ${PROCESS_HTML_RELATIVE_PATH} has stale ${variableName} — re-run generator\n`,
        );
        drifted = true;
      }
    }
  }

  if (!existsSync(dataPath)) {
    process.stderr.write(
      `[generate-process-improvements] DRIFT: ${PROCESS_DATA_RELATIVE_PATH} does not exist — re-run generator\n`,
    );
    drifted = true;
  } else {
    const committedData = readFileSync(dataPath, "utf8");
    if (committedData !== expectedDataJson) {
      process.stderr.write(
        `[generate-process-improvements] DRIFT: ${PROCESS_DATA_RELATIVE_PATH} is stale — re-run generator\n`,
      );
      drifted = true;
    }
  }

  if (drifted) {
    process.exit(1);
  }
  process.stdout.write(
    "[generate-process-improvements] CHECK OK — generated files are up-to-date\n",
  );
}

function writeFileAtomic(filePath: string, content: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  writeFileSync(tempPath, content, "utf8");
  renameSync(tempPath, filePath);
}

function runCli(): void {
  const repoRoot = path.resolve(process.cwd(), "..");
  const buildOriginBridgeResult = runBuildOriginBridgeForProcessImprovements(repoRoot);
  const htmlPath = path.join(repoRoot, PROCESS_HTML_RELATIVE_PATH);
  const dataPath = path.join(repoRoot, PROCESS_DATA_RELATIVE_PATH);
  const now = new Date();
  const dateIso = now.toISOString().slice(0, 10);
  const genTs = now.toISOString();

  const data = collectProcessImprovements(repoRoot);
  const html = readFileSync(htmlPath, "utf8");
  const updatedHtml = updateProcessImprovementsHtml(html, data, dateIso, genTs);

  writeFileAtomic(htmlPath, updatedHtml);
  mkdirSync(path.dirname(dataPath), { recursive: true });
  writeFileSync(dataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");

  process.stdout.write(
    `[generate-process-improvements] updated ${PROCESS_HTML_RELATIVE_PATH} (ideas=${data.ideaItems.length}, risks=${data.riskItems.length}, pending=${data.pendingReviewItems.length})\n`,
  );
  process.stdout.write(
    `[generate-process-improvements] wrote ${PROCESS_DATA_RELATIVE_PATH}\n`,
  );
  process.stdout.write(
    `[generate-process-improvements] build-origin bridge: ok=${buildOriginBridgeResult.ok} plans=${buildOriginBridgeResult.plans_considered}/${buildOriginBridgeResult.plans_scanned} signals=${buildOriginBridgeResult.signals_considered} admitted=${buildOriginBridgeResult.signals_admitted} enqueued=${buildOriginBridgeResult.dispatches_enqueued}\n`,
  );
  if (buildOriginBridgeResult.warnings.length > 0) {
    for (const warning of buildOriginBridgeResult.warnings) {
      process.stdout.write(`[generate-process-improvements] build-origin bridge warning: ${warning}\n`);
    }
  }

  const latestBugScanArtifactPath =
    data.ideaItems.find((item) => item.source === "bug-scan-findings.user.json")?.path ?? null;
  const bridgeResult = runCodebaseSignalsBridge({
    rootDir: repoRoot,
    business: "BOS",
    registryPath: "docs/business-os/startup-loop/ideas/standing-registry.json",
    queueStatePath: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
    telemetryPath: "docs/business-os/startup-loop/ideas/trial/telemetry.jsonl",
    statePath: "docs/business-os/startup-loop/ideas/trial/codebase-signal-bridge-state.json",
    bugScanArtifactPath: latestBugScanArtifactPath,
    fromRef: "HEAD~1",
    toRef: "HEAD",
    bugSeverityThreshold: "critical",
  });
  process.stdout.write(
    `[generate-process-improvements] signal bridge: ok=${bridgeResult.ok} events=${bridgeResult.events_considered} admitted=${bridgeResult.events_admitted} enqueued=${bridgeResult.dispatches_enqueued}\n`,
  );
  if (bridgeResult.warnings.length > 0) {
    for (const warning of bridgeResult.warnings) {
      process.stdout.write(`[generate-process-improvements] signal bridge warning: ${warning}\n`);
    }
  }

  const sessionBridgeResult = runAgentSessionSignalsBridge({
    rootDir: repoRoot,
    business: "BOS",
    registryPath: "docs/business-os/startup-loop/ideas/standing-registry.json",
    queueStatePath: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
    telemetryPath: "docs/business-os/startup-loop/ideas/trial/telemetry.jsonl",
    statePath: "docs/business-os/startup-loop/ideas/trial/agent-session-signal-bridge-state.json",
    artifactPath: "docs/business-os/startup-loop/ideas/trial/agent-session-findings.latest.json",
    transcriptsRoot: path.join(os.homedir(), ".claude", "projects", "-Users-petercowling-base-shop"),
    sessionLimit: 20,
  });
  process.stdout.write(
    `[generate-process-improvements] agent-session bridge: ok=${sessionBridgeResult.ok} scanned=${sessionBridgeResult.sessions_scanned} with_findings=${sessionBridgeResult.sessions_with_findings} enqueued=${sessionBridgeResult.dispatches_enqueued}\n`,
  );
  if (sessionBridgeResult.warnings.length > 0) {
    for (const warning of sessionBridgeResult.warnings) {
      process.stdout.write(`[generate-process-improvements] agent-session bridge warning: ${warning}\n`);
    }
  }
}

if (process.argv.includes("--check")) {
  const repoRoot = path.resolve(process.cwd(), "..");
  runCheck(repoRoot);
  process.exit(0);
}

if (process.argv[1]?.includes("generate-process-improvements")) {
  runCli();
}
