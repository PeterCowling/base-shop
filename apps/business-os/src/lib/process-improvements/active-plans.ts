import fs from "node:fs";
import path from "node:path";

import { getRepoRoot } from "@/lib/get-repo-root";
import { PROCESS_IMPROVEMENTS_DECISION_LEDGER_PATH } from "@/lib/process-improvements/decision-ledger";
import {
  PROCESS_IMPROVEMENTS_LIVE_QUEUE_STATE_PATH,
  PROCESS_IMPROVEMENTS_TRIAL_QUEUE_STATE_PATH,
} from "@/lib/process-improvements/queue-path";

export interface ActivePlanTask {
  id: string;
  type: string;
  description: string;
  status: "complete" | "blocked" | "pending";
  blockedReason?: string;
}

export interface ActivePlanProgress {
  slug: string;
  title: string;
  summary: string;
  business: string;
  domain: string;
  executionTrack: string;
  overallConfidence: string;
  created: string;
  lastUpdated: string;
  tasksComplete: number;
  tasksTotal: number;
  tasksPending: number;
  tasksBlocked: number;
  currentTask: ActivePlanTask | null;
  recentlyCompleted: ActivePlanTask | null;
  blockedTasks: ActivePlanTask[];
  relatedArtifacts: string[];
  planPath: string;
  lastModifiedAt: string;
  lastModifiedPath: string;
  isActiveNow: boolean;
  lastObservedAt: string | null;
  lastObservedContextPath: string | null;
  lastObservedSkillId: string | null;
  isObservedNow: boolean;
  hasPendingExecution: boolean;
  pendingExecutionCount: number;
}

const FRONTMATTER_FENCE = "---";
const ACTIVE_PLAN_ACTIVITY_WINDOW_MS = 5 * 60 * 1000;
const ACTIVE_PLAN_OBSERVATION_WINDOW_MS = 5 * 60 * 1000;

function parseFrontmatter(content: string): Record<string, string> {
  const lines = content.split("\n");
  if (lines[0]?.trim() !== FRONTMATTER_FENCE) return {};

  const result: Record<string, string> = {};
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.trim() === FRONTMATTER_FENCE) break;
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      result[key] = value;
    }
  }
  return result;
}

function extractTitle(content: string): string {
  const match = /^# (.+)$/m.exec(content);
  return match?.[1]?.replace(/ Plan$/, "") ?? "Untitled";
}

function extractSummary(content: string): string {
  const summaryMatch = /^## Summary\s*\n([\s\S]*?)(?=\n## )/m.exec(content);
  if (!summaryMatch?.[1]) return "";
  const raw = summaryMatch[1].trim();
  if (raw.length <= 180) return raw;
  const truncated = raw.slice(0, 180);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 120 ? truncated.slice(0, lastSpace) : truncated) + "...";
}

const TASK_ROW_PATTERN = /^\|\s*(TASK-\d+)\s*\|\s*(\w+)\s*\|\s*([^|]+)\|/;
const COMPLETE_PATTERN = /\bComplete\b/i;
const BLOCKED_PATTERN = /\bBlocked\b/i;
const PENDING_EXECUTION_RESULT = "pending";

interface QueueDispatchProcessedByRecord {
  target_path?: string;
}

interface QueueDispatchRecord {
  dispatch_id?: string;
  anchor_key?: string;
  queue_state?: string;
  processed_by?: QueueDispatchProcessedByRecord;
}

interface QueueFileRecord {
  dispatches?: QueueDispatchRecord[];
}

interface ActivePlanObservation {
  observedAt: string;
  observedAtMs: number;
  contextPath: string;
  skillId: string | null;
}

function parseTasks(content: string): {
  all: ActivePlanTask[];
  total: number;
  complete: number;
  pending: number;
  blocked: number;
} {
  const all: ActivePlanTask[] = [];
  const seen = new Set<string>();

  for (const line of content.split("\n")) {
    const match = TASK_ROW_PATTERN.exec(line);
    if (!match) continue;
    const [, id, type, description] = match;
    if (!id || !type || !description) continue;
    if (seen.has(id)) continue;
    seen.add(id);

    let status: ActivePlanTask["status"] = "pending";
    let blockedReason: string | undefined;
    if (COMPLETE_PATTERN.test(line)) {
      status = "complete";
    } else if (BLOCKED_PATTERN.test(line)) {
      status = "blocked";
      const reasonMatch = /Blocked\s*\(([^)]+)\)/i.exec(line);
      blockedReason = reasonMatch?.[1]?.trim();
    }

    all.push({ id: id.trim(), type: type.trim(), description: description.trim(), status, blockedReason });
  }

  return {
    all,
    total: all.length,
    complete: all.filter((t) => t.status === "complete").length,
    pending: all.filter((t) => t.status === "pending").length,
    blocked: all.filter((t) => t.status === "blocked").length,
  };
}

function listRelatedArtifacts(planDir: string): string[] {
  const known = ["fact-find.md", "build-record.user.md", "critique-history.md", "analysis.md", "replan-notes.md"];
  const found: string[] = [];
  for (const name of known) {
    try {
      fs.accessSync(path.join(planDir, name), fs.constants.R_OK);
      found.push(name.replace(/\.md$/, "").replace(".user", ""));
    } catch {
      // not present
    }
  }
  return found;
}

function toRepoRelativePath(repoRoot: string, absolutePath: string): string {
  return path.relative(repoRoot, absolutePath).replaceAll(path.sep, "/");
}

function collectPlanActivity(
  planDir: string,
  repoRoot: string
): Pick<ActivePlanProgress, "lastModifiedAt" | "lastModifiedPath" | "isActiveNow"> {
  const fallbackPath = path.join(planDir, "plan.md");
  let latestPath = fallbackPath;
  let latestMtimeMs = 0;
  const pendingDirs = [planDir];

  while (pendingDirs.length > 0) {
    const currentDir = pendingDirs.pop();
    if (!currentDir) continue;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;

      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        pendingDirs.push(absolutePath);
        continue;
      }

      if (!entry.isFile()) continue;

      try {
        const stats = fs.statSync(absolutePath);
        if (stats.mtimeMs > latestMtimeMs) {
          latestMtimeMs = stats.mtimeMs;
          latestPath = absolutePath;
        }
      } catch {
        // Ignore unreadable siblings and keep scanning.
      }
    }
  }

  if (latestMtimeMs === 0) {
    try {
      latestMtimeMs = fs.statSync(fallbackPath).mtimeMs;
      latestPath = fallbackPath;
    } catch {
      latestMtimeMs = Date.now();
    }
  }

  return {
    lastModifiedAt: new Date(latestMtimeMs).toISOString(),
    lastModifiedPath: toRepoRelativePath(repoRoot, latestPath),
    isActiveNow: Date.now() - latestMtimeMs <= ACTIVE_PLAN_ACTIVITY_WINDOW_MS,
  };
}

function extractPlanSlugFromObservationContext(
  contextPath: string
): string | null {
  const segments = contextPath
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (segments.length < 2) {
    return null;
  }

  if (!segments[0]?.startsWith("lp-do-")) {
    return null;
  }

  return segments[1] ?? null;
}

function readLatestPlanObservations(
  repoRoot: string,
  business: string
): Map<string, ActivePlanObservation> {
  const observationsPath = path.join(
    repoRoot,
    "docs/business-os/startup-loop/self-evolving",
    business,
    "observations.jsonl"
  );

  let raw: string;
  try {
    raw = fs.readFileSync(observationsPath, "utf-8");
  } catch {
    return new Map();
  }

  const latest = new Map<string, ActivePlanObservation>();
  for (const line of raw.split("\n")) {
    if (line.trim().length === 0) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      continue;
    }

    if (!parsed || typeof parsed !== "object") continue;
    const record = parsed as Record<string, unknown>;
    const contextPath =
      typeof record.context_path === "string" ? record.context_path.trim() : "";
    const observedAt =
      typeof record.timestamp === "string" ? record.timestamp.trim() : "";

    if (!contextPath || !observedAt) continue;

    const planSlug = extractPlanSlugFromObservationContext(contextPath);
    if (!planSlug) continue;

    const observedAtMs = Date.parse(observedAt);
    if (!Number.isFinite(observedAtMs)) continue;

    const current = latest.get(planSlug);
    if (current && current.observedAtMs >= observedAtMs) {
      continue;
    }

    latest.set(planSlug, {
      observedAt: new Date(observedAtMs).toISOString(),
      observedAtMs,
      contextPath,
      skillId:
        typeof record.skill_id === "string" && record.skill_id.trim().length > 0
          ? record.skill_id.trim()
          : null,
    });
  }

  return latest;
}

function readPendingDecisionDispatchIds(repoRoot: string): Set<string> {
  const ledgerPath = path.join(repoRoot, PROCESS_IMPROVEMENTS_DECISION_LEDGER_PATH);
  let raw: string;
  try {
    raw = fs.readFileSync(ledgerPath, "utf-8");
  } catch {
    return new Set();
  }

  const pendingDispatchIds = new Set<string>();
  for (const line of raw.split("\n")) {
    if (line.trim().length === 0) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      continue;
    }

    if (!parsed || typeof parsed !== "object") continue;
    const record = parsed as Record<string, unknown>;
    if (record.execution_result !== PENDING_EXECUTION_RESULT) continue;

    const dispatchId =
      typeof record.dispatch_id === "string" ? record.dispatch_id.trim() : "";
    if (dispatchId.length > 0) {
      pendingDispatchIds.add(dispatchId);
    }
  }

  return pendingDispatchIds;
}

function readQueueDispatchPlanDirs(
  repoRoot: string,
  queueRelativePath: string,
  pendingDispatchIds: ReadonlySet<string>
): string[] {
  if (pendingDispatchIds.size === 0) {
    return [];
  }

  const queuePath = path.join(repoRoot, queueRelativePath);
  let raw: string;
  try {
    raw = fs.readFileSync(queuePath, "utf-8");
  } catch {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!parsed || typeof parsed !== "object") {
    return [];
  }

  const queue = parsed as QueueFileRecord;
  if (!Array.isArray(queue.dispatches)) {
    return [];
  }

  const planDirs: string[] = [];
  for (const dispatch of queue.dispatches) {
    const dispatchId =
      typeof dispatch.dispatch_id === "string" ? dispatch.dispatch_id.trim() : "";
    if (!dispatchId || !pendingDispatchIds.has(dispatchId)) {
      continue;
    }

    const targetPath =
      typeof dispatch.processed_by?.target_path === "string"
        ? dispatch.processed_by.target_path.trim()
        : "";
    if (!targetPath.startsWith("docs/plans/")) {
      continue;
    }

    planDirs.push(path.posix.dirname(targetPath));
  }

  return planDirs;
}

function readAllDispatchPlanDirMap(
  repoRoot: string,
  queueRelativePath: string
): Map<string, string> {
  const queuePath = path.join(repoRoot, queueRelativePath);
  let raw: string;
  try {
    raw = fs.readFileSync(queuePath, "utf-8");
  } catch {
    return new Map();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new Map();
  }

  if (!parsed || typeof parsed !== "object") {
    return new Map();
  }

  const queue = parsed as QueueFileRecord;
  if (!Array.isArray(queue.dispatches)) {
    return new Map();
  }

  const result = new Map<string, string>();
  for (const dispatch of queue.dispatches) {
    const dispatchId =
      typeof dispatch.dispatch_id === "string" ? dispatch.dispatch_id.trim() : "";
    if (!dispatchId) continue;

    const targetPath =
      typeof dispatch.processed_by?.target_path === "string"
        ? dispatch.processed_by.target_path.trim()
        : "";
    if (!targetPath.startsWith("docs/plans/")) continue;

    result.set(dispatchId, path.posix.dirname(targetPath));
  }

  return result;
}

function readSupersededAnchorKeys(
  repoRoot: string,
  queueRelativePath: string
): Set<string> {
  const queuePath = path.join(repoRoot, queueRelativePath);
  let raw: string;
  try {
    raw = fs.readFileSync(queuePath, "utf-8");
  } catch {
    return new Set();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new Set();
  }

  if (!parsed || typeof parsed !== "object") return new Set();
  const queue = parsed as QueueFileRecord;
  if (!Array.isArray(queue.dispatches)) return new Set();

  const result = new Set<string>();
  for (const dispatch of queue.dispatches) {
    if (dispatch.queue_state !== "superseded") continue;
    const anchorKey =
      typeof dispatch.anchor_key === "string" ? dispatch.anchor_key.trim() : "";
    if (anchorKey.length > 0) result.add(anchorKey);
  }
  return result;
}

function collectPendingExecutionCounts(repoRoot: string): Map<string, number> {
  const pendingDispatchIds = readPendingDecisionDispatchIds(repoRoot);
  if (pendingDispatchIds.size === 0) {
    return new Map();
  }

  const planDirs = [
    ...readQueueDispatchPlanDirs(
      repoRoot,
      PROCESS_IMPROVEMENTS_TRIAL_QUEUE_STATE_PATH,
      pendingDispatchIds
    ),
    ...readQueueDispatchPlanDirs(
      repoRoot,
      PROCESS_IMPROVEMENTS_LIVE_QUEUE_STATE_PATH,
      pendingDispatchIds
    ),
  ];

  const counts = new Map<string, number>();
  for (const planDir of planDirs) {
    counts.set(planDir, (counts.get(planDir) ?? 0) + 1);
  }

  return counts;
}

function getBusinessObservations(
  repoRoot: string,
  business: string,
  observationCache: Map<string, Map<string, ActivePlanObservation>>
): Map<string, ActivePlanObservation> {
  const cached = observationCache.get(business);
  if (cached) {
    return cached;
  }

  const loaded = readLatestPlanObservations(repoRoot, business);
  observationCache.set(business, loaded);
  return loaded;
}

function parseActivePlanRecord(content: string): {
  frontmatter: Record<string, string>;
  tasks: ReturnType<typeof parseTasks>;
} | null {
  const frontmatter = parseFrontmatter(content);
  if (frontmatter["Status"] !== "Active") {
    return null;
  }

  const tasks = parseTasks(content);
  if (tasks.total === 0) {
    return null;
  }

  return { frontmatter, tasks };
}

// eslint-disable-next-line complexity -- BOS-PI-103 pre-existing complexity; refactor tracked separately [ttl=2026-09-30]
function buildActivePlanProgress(input: {
  content: string;
  entry: string;
  planDir: string;
  repoRoot: string;
  pendingExecutionCounts: ReadonlyMap<string, number>;
  observationCache: Map<string, Map<string, ActivePlanObservation>>;
  supersededAnchorKeys: ReadonlySet<string>;
}): ActivePlanProgress | null {
  const parsed = parseActivePlanRecord(input.content);
  if (!parsed) return null;

  const featureSlug = parsed.frontmatter["Feature-Slug"]?.trim() ?? "";
  if (featureSlug.length > 0 && input.supersededAnchorKeys.has(featureSlug)) {
    return null;
  }

  const fm = parsed.frontmatter;
  const tasks = parsed.tasks;
  const pendingTasks = tasks.all.filter((task) => task.status === "pending");
  const completeTasks = tasks.all.filter((task) => task.status === "complete");
  const blockedTasks = tasks.all.filter((task) => task.status === "blocked");
  const activity = collectPlanActivity(input.planDir, input.repoRoot);
  const business = fm["Business-Unit"] ?? "unknown";
  const pendingExecutionCount =
    input.pendingExecutionCounts.get(`docs/plans/${input.entry}`) ?? 0;
  const observation =
    getBusinessObservations(
      input.repoRoot,
      business,
      input.observationCache
    ).get(input.entry) ?? null;

  return {
    slug: input.entry,
    title: extractTitle(input.content),
    summary: extractSummary(input.content),
    business,
    domain: fm["Domain"] ?? "",
    executionTrack: fm["Execution-Track"] ?? "unknown",
    overallConfidence: fm["Overall-confidence"] ?? "—",
    created: fm["Created"] ?? "",
    lastUpdated: fm["Last-updated"] ?? fm["Last-reviewed"] ?? "",
    tasksComplete: tasks.complete,
    tasksTotal: tasks.total,
    tasksPending: tasks.pending,
    tasksBlocked: tasks.blocked,
    currentTask: pendingTasks[0] ?? null,
    recentlyCompleted: completeTasks[completeTasks.length - 1] ?? null,
    blockedTasks,
    relatedArtifacts: listRelatedArtifacts(input.planDir),
    planPath: `docs/plans/${input.entry}/plan.md`,
    lastModifiedAt: activity.lastModifiedAt,
    lastModifiedPath: activity.lastModifiedPath,
    isActiveNow: activity.isActiveNow,
    lastObservedAt: observation?.observedAt ?? null,
    lastObservedContextPath: observation?.contextPath ?? null,
    lastObservedSkillId: observation?.skillId ?? null,
    isObservedNow:
      observation !== null &&
      Date.now() - observation.observedAtMs <= ACTIVE_PLAN_OBSERVATION_WINDOW_MS,
    hasPendingExecution: pendingExecutionCount > 0,
    pendingExecutionCount,
  };
}

export function loadActivePlans(
  options: { repoRoot?: string } = {}
): ActivePlanProgress[] {
  const repoRoot = options.repoRoot ?? getRepoRoot();
  const plansDir = path.join(repoRoot, "docs/plans");
  const pendingExecutionCounts = collectPendingExecutionCounts(repoRoot);
  const observationCache = new Map<string, Map<string, ActivePlanObservation>>();
  const supersededAnchorKeys = new Set([
    ...readSupersededAnchorKeys(repoRoot, PROCESS_IMPROVEMENTS_TRIAL_QUEUE_STATE_PATH),
    ...readSupersededAnchorKeys(repoRoot, PROCESS_IMPROVEMENTS_LIVE_QUEUE_STATE_PATH),
  ]);

  let entries: string[];
  try {
    entries = fs.readdirSync(plansDir);
  } catch {
    return [];
  }

  const results: ActivePlanProgress[] = [];

  for (const entry of entries) {
    if (entry.startsWith("_")) continue;
    const planDir = path.join(plansDir, entry);
    const planPath = path.join(planDir, "plan.md");
    let content: string;
    try {
      content = fs.readFileSync(planPath, "utf-8");
    } catch {
      continue;
    }

    const progress = buildActivePlanProgress({
      content,
      entry,
      planDir,
      repoRoot,
      pendingExecutionCounts,
      observationCache,
      supersededAnchorKeys,
    });

    if (progress) {
      results.push(progress);
    }
  }

  results.sort((a, b) => {
    if (a.tasksBlocked > 0 && b.tasksBlocked === 0) return -1;
    if (b.tasksBlocked > 0 && a.tasksBlocked === 0) return 1;
    const aRatio = a.tasksTotal > 0 ? a.tasksComplete / a.tasksTotal : 0;
    const bRatio = b.tasksTotal > 0 ? b.tasksComplete / b.tasksTotal : 0;
    if (aRatio !== bRatio) return aRatio - bRatio;
    return (b.lastUpdated || "").localeCompare(a.lastUpdated || "");
  });

  return results;
}

/**
 * Returns the set of dispatch IDs whose processed_by.target_path
 * points to a directory containing an active plan.
 */
export function collectInProgressDispatchIds(
  activePlans: ActivePlanProgress[],
  options: { repoRoot?: string } = {}
): Set<string> {
  if (activePlans.length === 0) return new Set();

  const repoRoot = options.repoRoot ?? getRepoRoot();
  const activePlanDirs = new Set(
    activePlans.map((p) => `docs/plans/${p.slug}`)
  );

  const allMaps = [
    readAllDispatchPlanDirMap(repoRoot, PROCESS_IMPROVEMENTS_TRIAL_QUEUE_STATE_PATH),
    readAllDispatchPlanDirMap(repoRoot, PROCESS_IMPROVEMENTS_LIVE_QUEUE_STATE_PATH),
  ];

  const result = new Set<string>();
  for (const dispatchMap of allMaps) {
    for (const [dispatchId, planDir] of dispatchMap) {
      if (activePlanDirs.has(planDir)) {
        result.add(dispatchId);
      }
    }
  }

  return result;
}
