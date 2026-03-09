import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

import { finalizeSelfEvolvingCompletionIfMatured } from "./lp-do-ideas-queue-state-completion.js";
import {
  atomicWriteQueueState,
  buildCounts,
  type QueueDispatch,
  type QueueFileShape,
  readQueueStateFile,
} from "./lp-do-ideas-queue-state-file.js";

export interface IdeaCompletionReconcileOptions {
  rootDir: string;
  queueStatePath: string;
  completedIdeasPath: string;
  write: boolean;
}

interface CompletedIdeaEntry {
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

interface CompletionEvidence {
  dispatch_id: string;
  feature_slug: string;
  completion_kind: "plan" | "micro-build";
  completion_path?: string;
  completed_at: string;
  outcome: string;
  source: "dispatch_link" | "processed_by" | "completed_by" | "completed_registry";
}

export interface ReconcileResult {
  ok: boolean;
  queue_state_path: string;
  completed_ideas_path: string;
  dispatches_scanned: number;
  evidentiary_matches: number;
  queue_dispatches_completed: number;
  completed_registry_added: number;
  already_completed_matches: number;
  unresolved_dispatches: number;
  source_counts: Record<string, number>;
  error?: string;
}

export interface IdeaCompletionReconcileSnapshot {
  queue: QueueFileShape;
  completed_registry: CompletedIdeasRegistry;
  dispatches_scanned: number;
  evidentiary_matches: number;
  queue_dispatches_completed: number;
  completed_registry_added: number;
  already_completed_matches: number;
  unresolved_dispatches: number;
  source_counts: Record<string, number>;
}

export type IdeaCompletionReconcileSnapshotResult =
  | {
      ok: true;
      queue_state_path: string;
      completed_ideas_path: string;
      snapshot: IdeaCompletionReconcileSnapshot;
    }
  | (Omit<ReconcileResult, "ok"> & { ok: false });

const DEFAULT_QUEUE_STATE_PATH = "docs/business-os/startup-loop/ideas/trial/queue-state.json";
const DEFAULT_COMPLETED_IDEAS_PATH = "docs/business-os/_data/completed-ideas.json";
const QUEUE_SOURCE_PATH = "docs/business-os/startup-loop/ideas/trial/queue-state.json";
const PLAN_ROOT = "docs/plans";

function parseArgs(argv: string[]): IdeaCompletionReconcileOptions {
  const flags = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];
    if (!token?.startsWith("--") || !value || value.startsWith("--")) {
      continue;
    }
    flags.set(token.slice(2), value);
    index += 1;
  }

  const defaultRootDir = process.cwd().endsWith(`${path.sep}scripts`)
    ? path.resolve(process.cwd(), "..")
    : process.cwd();

  return {
    rootDir: flags.get("root-dir") ?? defaultRootDir,
    queueStatePath: flags.get("queue-state-path") ?? DEFAULT_QUEUE_STATE_PATH,
    completedIdeasPath: flags.get("completed-ideas-path") ?? DEFAULT_COMPLETED_IDEAS_PATH,
    write: argv.includes("--write"),
  };
}

function resolvePath(rootDir: string, relativeOrAbsolutePath: string): string {
  return path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : path.join(rootDir, relativeOrAbsolutePath);
}

function readUtf8(filePath: string): string {
  return readFileSync(filePath, "utf8");
}

function extractFrontmatterValue(markdown: string, key: string): string | null {
  for (const line of markdown.split(/\r?\n/)) {
    if (!line.startsWith(`${key}:`)) {
      continue;
    }
    const value = line.slice(key.length + 1).trim();
    return value.length > 0 ? value : null;
  }
  return null;
}

function extractDispatchIds(markdown: string): string[] {
  const single = extractFrontmatterValue(markdown, "Dispatch-ID");
  const multiple = extractFrontmatterValue(markdown, "Dispatch-IDs");
  const dispatchIds = new Set<string>();
  if (single) {
    dispatchIds.add(single);
  }
  if (multiple) {
    for (const entry of multiple.split(",")) {
      const normalized = entry.trim();
      if (normalized.length > 0) {
        dispatchIds.add(normalized);
      }
    }
  }
  return Array.from(dispatchIds);
}

function toRepoRelative(rootDir: string, absolutePath: string): string {
  return path.relative(rootDir, absolutePath).split(path.sep).join("/");
}

function deriveIdeaKey(dispatchId: string): string {
  return createHash("sha1").update(`${QUEUE_SOURCE_PATH}::${dispatchId}`).digest("hex");
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function extractOutcomeFromBuildRecord(buildRecordPath: string, featureSlug: string): string {
  if (!existsSync(buildRecordPath)) {
    return `Completed via ${featureSlug}.`;
  }

  const raw = readUtf8(buildRecordPath);
  const sectionMatch = raw.match(
    /## What Was Built\s*([\s\S]*?)(?:\n## |\n# |$)/,
  );
  if (!sectionMatch) {
    return `Completed via ${featureSlug}.`;
  }

  const lines = sectionMatch[1]
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*]\s+/, "").trim())
    .filter((line) => line.length > 0);
  const summary = lines.join(" ").replace(/\s+/g, " ").trim();
  if (summary.length === 0) {
    return `Completed via ${featureSlug}.`;
  }
  return summary.slice(0, 240);
}

function determineCompletedAt(filePaths: string[]): string {
  const existing = filePaths
    .filter((filePath) => existsSync(filePath))
    .map((filePath) => statSync(filePath).mtime.toISOString())
    .sort((left, right) => right.localeCompare(left));
  return existing[0] ?? new Date().toISOString();
}

function buildCompletionEvidenceFallback(
  dispatch: QueueDispatch,
  source: CompletionEvidence["source"],
  featureSlug: string,
  completionKind: CompletionEvidence["completion_kind"],
  completionPath?: string,
): CompletionEvidence | null {
  const dispatchId = readString(dispatch.dispatch_id);
  if (!dispatchId) {
    return null;
  }

  const completedBy = readRecord(dispatch.completed_by);
  const completedAt =
    readString(completedBy?.completed_at) ??
    readString(dispatch.completed_at) ??
    new Date().toISOString();
  const outcome =
    readString(completedBy?.outcome) ??
    readString(dispatch.outcome) ??
    `Completed via ${featureSlug}.`;

  return {
    dispatch_id: dispatchId,
    feature_slug: featureSlug,
    completion_kind: completionKind,
    completion_path: completionPath,
    completed_at: completedAt,
    outcome,
    source,
  };
}

function completionCandidatesForSlug(featureSlug: string): string[] {
  return [
    path.join(PLAN_ROOT, "_archive", featureSlug, "plan.md"),
    path.join(PLAN_ROOT, featureSlug, "plan.md"),
    path.join(PLAN_ROOT, "_archive", featureSlug, "micro-build.md"),
    path.join(PLAN_ROOT, featureSlug, "micro-build.md"),
    path.join(PLAN_ROOT, "_archive", featureSlug, "fact-find.md"),
    path.join(PLAN_ROOT, featureSlug, "fact-find.md"),
  ];
}

function completionEvidenceFromTarget(
  rootDir: string,
  targetPath: string,
  source: CompletionEvidence["source"],
  dispatchId: string,
): CompletionEvidence | null {
  const absoluteTargetPath = resolvePath(rootDir, targetPath);
  if (!existsSync(absoluteTargetPath)) {
    return null;
  }
  if (!statSync(absoluteTargetPath).isFile()) {
    return null;
  }

  const targetRaw = readUtf8(absoluteTargetPath);
  const status = extractFrontmatterValue(targetRaw, "Status") ?? "";
  const featureSlug =
    extractFrontmatterValue(targetRaw, "Feature-Slug") ?? path.basename(path.dirname(absoluteTargetPath));
  const archived = toRepoRelative(rootDir, absoluteTargetPath).includes("docs/plans/_archive/");
  const complete = archived || status === "Complete" || status === "Archived";
  if (!complete) {
    return null;
  }

  const buildRecordPath = path.join(path.dirname(absoluteTargetPath), "build-record.user.md");
  const hasBuildEvidence =
    existsSync(buildRecordPath) || path.basename(absoluteTargetPath) === "micro-build.md";
  if (!hasBuildEvidence) {
    return null;
  }

  const completionPath = toRepoRelative(rootDir, absoluteTargetPath);
  return {
    dispatch_id: dispatchId,
    feature_slug: featureSlug,
    completion_kind: completionPath.endsWith("micro-build.md") ? "micro-build" : "plan",
    completion_path: completionPath,
    completed_at: determineCompletedAt([buildRecordPath, absoluteTargetPath]),
    outcome: extractOutcomeFromBuildRecord(buildRecordPath, featureSlug),
    source,
  };
}

function collectExplicitDispatchEvidence(rootDir: string): Map<string, CompletionEvidence> {
  const evidence = new Map<string, CompletionEvidence>();
  const plansRoot = resolvePath(rootDir, PLAN_ROOT);
  if (!existsSync(plansRoot)) {
    return evidence;
  }

  const artifactPaths: string[] = [];
  const walk = (dir: string): void => {
    for (const dirent of readdirSync(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, dirent.name);
      if (dirent.isDirectory()) {
        walk(absolute);
        continue;
      }
      if (dirent.isFile() && (dirent.name === "fact-find.md" || dirent.name === "micro-build.md")) {
        artifactPaths.push(absolute);
      }
    }
  };
  walk(plansRoot);

  for (const absoluteArtifactPath of artifactPaths) {
    const raw = readUtf8(absoluteArtifactPath);
    const dispatchIds = extractDispatchIds(raw);
    if (dispatchIds.length === 0) {
      continue;
    }

    const parentDir = path.dirname(absoluteArtifactPath);
    const targetPath =
      path.basename(absoluteArtifactPath) === "micro-build.md"
        ? absoluteArtifactPath
        : existsSync(path.join(parentDir, "plan.md"))
          ? path.join(parentDir, "plan.md")
          : existsSync(path.join(parentDir, "micro-build.md"))
            ? path.join(parentDir, "micro-build.md")
            : null;
    if (!targetPath) {
      continue;
    }

    for (const dispatchId of dispatchIds) {
      if (evidence.has(dispatchId)) {
        continue;
      }
      const completion = completionEvidenceFromTarget(
        rootDir,
        targetPath,
        "dispatch_link",
        dispatchId,
      );
      if (completion) {
        evidence.set(dispatchId, completion);
      }
    }
  }

  return evidence;
}

function readCompletedIdeasRegistry(rootDir: string, completedIdeasPath: string): CompletedIdeasRegistry {
  const absolutePath = resolvePath(rootDir, completedIdeasPath);
  if (!existsSync(absolutePath)) {
    return { schema_version: "completed-ideas.v1", entries: [] };
  }

  try {
    const parsed = JSON.parse(readUtf8(absolutePath)) as CompletedIdeasRegistry;
    return Array.isArray(parsed.entries)
      ? parsed
      : { schema_version: "completed-ideas.v1", entries: [] };
  } catch {
    return { schema_version: "completed-ideas.v1", entries: [] };
  }
}

function writeCompletedIdeasRegistry(rootDir: string, completedIdeasPath: string, registry: CompletedIdeasRegistry): void {
  const absolutePath = resolvePath(rootDir, completedIdeasPath);
  writeFileSync(absolutePath, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
}

function pruneMalformedQueueRegistryEntries(
  queue: QueueFileShape,
  registry: CompletedIdeasRegistry,
): void {
  const openQueueTitles = new Set(
    queue.dispatches
      .filter((dispatch) => dispatch.queue_state !== "completed")
      .map((dispatch) => readString(dispatch.area_anchor))
      .filter((title): title is string => Boolean(title)),
  );

  registry.entries = registry.entries.filter((entry) => {
    if (entry.source_path !== QUEUE_SOURCE_PATH) {
      return true;
    }
    if (/^IDEA-DISPATCH-/.test(entry.title)) {
      return true;
    }
    return !openQueueTitles.has(entry.title);
  });
}

function completionEvidenceFromProcessedBy(
  rootDir: string,
  dispatch: QueueDispatch,
): CompletionEvidence | null {
  const processedBy = dispatch.processed_by;
  if (!processedBy || typeof processedBy !== "object") {
    return null;
  }

  const dispatchId = typeof dispatch.dispatch_id === "string" ? dispatch.dispatch_id : "";
  if (!dispatchId) {
    return null;
  }

  const microBuildPath =
    typeof processedBy.micro_build_path === "string" ? processedBy.micro_build_path : null;
  if (microBuildPath) {
    return completionEvidenceFromTarget(rootDir, microBuildPath, "processed_by", dispatchId);
  }

  const targetPath =
    typeof processedBy.target_path === "string"
      ? processedBy.target_path
      : typeof processedBy.fact_find_path === "string"
        ? processedBy.fact_find_path.replace(/fact-find\.md$/, "plan.md")
        : null;
  const targetSlug =
    typeof processedBy.target_slug === "string"
      ? processedBy.target_slug
      : typeof processedBy.fact_find_slug === "string"
        ? processedBy.fact_find_slug
        : null;

  if (targetPath) {
    const direct = completionEvidenceFromTarget(rootDir, targetPath, "processed_by", dispatchId);
    if (direct) {
      return direct;
    }
  }
  if (!targetSlug) {
    return null;
  }

  const archivePlanPath = path.join(PLAN_ROOT, "_archive", targetSlug, "plan.md");
  const activePlanPath = path.join(PLAN_ROOT, targetSlug, "plan.md");
  const archiveMicroBuildPath = path.join(PLAN_ROOT, "_archive", targetSlug, "micro-build.md");
  const activeMicroBuildPath = path.join(PLAN_ROOT, targetSlug, "micro-build.md");
  for (const candidate of [
    archivePlanPath,
    activePlanPath,
    archiveMicroBuildPath,
    activeMicroBuildPath,
  ]) {
    const completion = completionEvidenceFromTarget(rootDir, candidate, "processed_by", dispatchId);
    if (completion) {
      return completion;
    }
  }
  return null;
}

function completionEvidenceFromCompletedBy(
  rootDir: string,
  dispatch: QueueDispatch,
): CompletionEvidence | null {
  if (dispatch.queue_state !== "completed") {
    return null;
  }

  const dispatchId = readString(dispatch.dispatch_id);
  if (!dispatchId) {
    return null;
  }

  const completedBy = readRecord(dispatch.completed_by);
  const processedBy = readRecord(dispatch.processed_by);
  const explicitPlanPath = readString(completedBy?.plan_path);
  const explicitMicroBuildPath = readString(completedBy?.micro_build_path);
  const explicitFeatureSlug =
    readString(completedBy?.fact_find_slug) ??
    readString(processedBy?.target_slug) ??
    readString(processedBy?.fact_find_slug) ??
    readString(dispatch.feature_slug) ??
    readString(dispatch.anchor_key);

  if (explicitMicroBuildPath) {
    const direct = completionEvidenceFromTarget(
      rootDir,
      explicitMicroBuildPath,
      "completed_by",
      dispatchId,
    );
    if (direct) {
      return direct;
    }
    if (explicitFeatureSlug) {
      return buildCompletionEvidenceFallback(
        dispatch,
        "completed_by",
        explicitFeatureSlug,
        "micro-build",
        explicitMicroBuildPath,
      );
    }
  }

  if (explicitPlanPath) {
    const direct = completionEvidenceFromTarget(rootDir, explicitPlanPath, "completed_by", dispatchId);
    if (direct) {
      return direct;
    }
    if (explicitFeatureSlug) {
      return buildCompletionEvidenceFallback(
        dispatch,
        "completed_by",
        explicitFeatureSlug,
        "plan",
        explicitPlanPath,
      );
    }
  }

  if (!explicitFeatureSlug) {
    return null;
  }

  for (const candidate of completionCandidatesForSlug(explicitFeatureSlug)) {
    const completion = completionEvidenceFromTarget(rootDir, candidate, "completed_by", dispatchId);
    if (completion) {
      return completion;
    }
  }

  for (const candidate of [
    path.join(PLAN_ROOT, "_archive", explicitFeatureSlug, "fact-find.md"),
    path.join(PLAN_ROOT, explicitFeatureSlug, "fact-find.md"),
  ]) {
    const absoluteCandidate = resolvePath(rootDir, candidate);
    if (existsSync(absoluteCandidate)) {
      return buildCompletionEvidenceFallback(
        dispatch,
        "completed_by",
        explicitFeatureSlug,
        "plan",
        toRepoRelative(rootDir, absoluteCandidate),
      );
    }
  }

  return buildCompletionEvidenceFallback(
    dispatch,
    "completed_by",
    explicitFeatureSlug,
    "plan",
  );
}

function completionEvidenceFromCompletedRegistry(
  rootDir: string,
  registry: CompletedIdeasRegistry,
  dispatch: QueueDispatch,
): CompletionEvidence | null {
  const dispatchId = typeof dispatch.dispatch_id === "string" ? dispatch.dispatch_id : "";
  if (!dispatchId) {
    return null;
  }
  const matched = registry.entries.find(
    (entry) => entry.source_path === QUEUE_SOURCE_PATH && entry.title === dispatchId,
  );
  if (!matched) {
    return null;
  }

  const outputLink = matched.output_link ?? "";
  const candidates = [
    outputLink.endsWith(".md") ? outputLink : "",
    path.join(PLAN_ROOT, "_archive", matched.plan_slug, "plan.md"),
    path.join(PLAN_ROOT, matched.plan_slug, "plan.md"),
    path.join(PLAN_ROOT, "_archive", matched.plan_slug, "micro-build.md"),
    path.join(PLAN_ROOT, matched.plan_slug, "micro-build.md"),
  ].filter((entry) => entry.length > 0);

  for (const candidate of candidates) {
    const completion = completionEvidenceFromTarget(
      rootDir,
      candidate,
      "completed_registry",
      dispatchId,
    );
    if (completion) {
      return completion;
    }
  }

  return {
    dispatch_id: dispatchId,
    feature_slug: matched.plan_slug,
    completion_kind: outputLink.endsWith("micro-build.md") ? "micro-build" : "plan",
    completion_path: outputLink || path.join(PLAN_ROOT, "_archive", matched.plan_slug, "plan.md"),
    completed_at: matched.completed_at,
    outcome: `Completed via ${matched.plan_slug}.`,
    source: "completed_registry",
  };
}

function applyCompletionEvidence(
  rootDir: string,
  queue: QueueFileShape,
  registry: CompletedIdeasRegistry,
  evidenceByDispatchId: Map<string, CompletionEvidence>,
): {
  queueMutated: number;
  registryAdded: number;
  alreadyCompleted: number;
  sourceCounts: Record<string, number>;
} {
  const existingIdeaKeys = new Set(registry.entries.map((entry) => entry.idea_key));
  let queueMutated = 0;
  let registryAdded = 0;
  let alreadyCompleted = 0;
  const sourceCounts: Record<string, number> = {};

  for (const dispatch of queue.dispatches) {
    const dispatchId = typeof dispatch.dispatch_id === "string" ? dispatch.dispatch_id : "";
    if (!dispatchId) {
      continue;
    }
    const evidence = evidenceByDispatchId.get(dispatchId);
    if (!evidence) {
      continue;
    }

    sourceCounts[evidence.source] = (sourceCounts[evidence.source] ?? 0) + 1;
    if (!dispatch.processed_by || typeof dispatch.processed_by !== "object") {
      dispatch.processed_by = {};
    }
    if (evidence.completion_kind === "micro-build") {
      dispatch.processed_by.target_route ??= "lp-do-build";
      dispatch.processed_by.target_kind ??= "build";
      dispatch.processed_by.target_slug ??= evidence.feature_slug;
      if (evidence.completion_path) {
        dispatch.processed_by.micro_build_path ??= evidence.completion_path;
      }
    } else {
      dispatch.processed_by.target_route ??= "lp-do-fact-find";
      dispatch.processed_by.target_kind ??= "fact-find";
      dispatch.processed_by.target_slug ??= evidence.feature_slug;
      dispatch.processed_by.fact_find_slug ??= evidence.feature_slug;
      if (evidence.completion_path) {
        dispatch.processed_by.target_path ??= evidence.completion_path;
      }
    }
    if (!dispatch.processed_by.self_evolving && dispatch.self_evolving) {
      dispatch.processed_by.self_evolving = dispatch.self_evolving;
    }

    if (dispatch.queue_state === "completed") {
      const completedBy = readRecord(dispatch.completed_by);
      if (!completedBy) {
        dispatch.completed_by = (
          evidence.completion_kind === "micro-build"
            ? {
                micro_build_path: evidence.completion_path,
                completed_at: evidence.completed_at,
                outcome: evidence.outcome,
              }
            : {
                plan_path: evidence.completion_path,
                completed_at: evidence.completed_at,
                outcome: evidence.outcome,
            }
        ) as QueueDispatch["completed_by"];
      } else {
        if (evidence.completion_kind === "micro-build" && evidence.completion_path) {
          completedBy.micro_build_path ??= evidence.completion_path;
        }
        if (evidence.completion_kind === "plan" && evidence.completion_path) {
          completedBy.plan_path ??= evidence.completion_path;
        }
        completedBy.completed_at ??= evidence.completed_at;
        completedBy.outcome ??= evidence.outcome;
      }
      const completedPath =
        typeof dispatch.completed_by?.plan_path === "string"
          ? dispatch.completed_by.plan_path
          : typeof dispatch.completed_by?.micro_build_path === "string"
            ? dispatch.completed_by.micro_build_path
            : evidence.completion_path ?? "";
      const finalized = finalizeSelfEvolvingCompletionIfMatured({
        rootDir,
        business: typeof dispatch.business === "string" ? dispatch.business : "unknown",
        dispatch,
        planPath: completedPath,
        completedAt: evidence.completed_at,
      });
      if (finalized) {
        dispatch.completed_by = {
          ...(dispatch.completed_by ?? {}),
          self_evolving: finalized,
        } as QueueDispatch["completed_by"];
      }
      alreadyCompleted += 1;
    } else {
      dispatch.queue_state = "completed";
      dispatch.status = "completed";
      dispatch.completed_by = (
        evidence.completion_kind === "micro-build"
          ? {
              micro_build_path: evidence.completion_path,
              completed_at: evidence.completed_at,
              outcome: evidence.outcome,
            }
          : {
              plan_path: evidence.completion_path,
              completed_at: evidence.completed_at,
              outcome: evidence.outcome,
            }
      ) as QueueDispatch["completed_by"];
      const completedRecord = dispatch.completed_by;
      const completedPath =
        evidence.completion_path ??
        (evidence.completion_kind === "micro-build"
          ? completedRecord?.micro_build_path
          : completedRecord?.plan_path) ??
        "";
      const finalized = finalizeSelfEvolvingCompletionIfMatured({
        rootDir,
        business: typeof dispatch.business === "string" ? dispatch.business : "unknown",
        dispatch,
        planPath: completedPath,
        completedAt: evidence.completed_at,
      });
      if (finalized) {
        dispatch.completed_by = {
          ...dispatch.completed_by,
          self_evolving: finalized,
        } as QueueDispatch["completed_by"];
      }
      queueMutated += 1;
    }

    const ideaKey = deriveIdeaKey(dispatchId);
    if (!existingIdeaKeys.has(ideaKey)) {
      registry.entries.push({
        idea_key: ideaKey,
        title: dispatchId,
        source_path: QUEUE_SOURCE_PATH,
        plan_slug: evidence.feature_slug,
        completed_at: evidence.completed_at.slice(0, 10),
        ...(evidence.completion_path ? { output_link: evidence.completion_path } : {}),
      });
      existingIdeaKeys.add(ideaKey);
      registryAdded += 1;
    }
  }

  return { queueMutated, registryAdded, alreadyCompleted, sourceCounts };
}

export function buildIdeaCompletionReconcileSnapshot(
  options: IdeaCompletionReconcileOptions,
): IdeaCompletionReconcileSnapshotResult {
  const queueResult = readQueueStateFile(options.queueStatePath);
  if (!queueResult.ok) {
    return {
      ok: false,
      queue_state_path: options.queueStatePath,
      completed_ideas_path: options.completedIdeasPath,
      dispatches_scanned: 0,
      evidentiary_matches: 0,
      queue_dispatches_completed: 0,
      completed_registry_added: 0,
      already_completed_matches: 0,
      unresolved_dispatches: 0,
      source_counts: {},
      error: queueResult.error ?? queueResult.reason,
    };
  }

  const registry = readCompletedIdeasRegistry(options.rootDir, options.completedIdeasPath);
  pruneMalformedQueueRegistryEntries(queueResult.queue, registry);
  const evidenceByDispatchId = collectExplicitDispatchEvidence(options.rootDir);

  for (const dispatch of queueResult.queue.dispatches) {
    const dispatchId = typeof dispatch.dispatch_id === "string" ? dispatch.dispatch_id : "";
    if (!dispatchId || evidenceByDispatchId.has(dispatchId)) {
      continue;
    }
    const fromProcessedBy = completionEvidenceFromProcessedBy(options.rootDir, dispatch);
    if (fromProcessedBy) {
      evidenceByDispatchId.set(dispatchId, fromProcessedBy);
      continue;
    }
    const fromCompletedBy = completionEvidenceFromCompletedBy(options.rootDir, dispatch);
    if (fromCompletedBy) {
      evidenceByDispatchId.set(dispatchId, fromCompletedBy);
      continue;
    }
    const fromRegistry = completionEvidenceFromCompletedRegistry(options.rootDir, registry, dispatch);
    if (fromRegistry) {
      evidenceByDispatchId.set(dispatchId, fromRegistry);
    }
  }

  const { queueMutated, registryAdded, alreadyCompleted, sourceCounts } = applyCompletionEvidence(
    options.rootDir,
    queueResult.queue,
    registry,
    evidenceByDispatchId,
  );
  const unresolvedDispatches = queueResult.queue.dispatches.length - evidenceByDispatchId.size;

  return {
    ok: true,
    queue_state_path: options.queueStatePath,
    completed_ideas_path: options.completedIdeasPath,
    snapshot: {
      queue: queueResult.queue,
      completed_registry: registry,
      dispatches_scanned: queueResult.queue.dispatches.length,
      evidentiary_matches: evidenceByDispatchId.size,
      queue_dispatches_completed: queueMutated,
      completed_registry_added: registryAdded,
      already_completed_matches: alreadyCompleted,
      unresolved_dispatches: unresolvedDispatches,
      source_counts: sourceCounts,
    },
  };
}

export function runIdeaCompletionReconcile(options: IdeaCompletionReconcileOptions): ReconcileResult {
  const snapshotResult = buildIdeaCompletionReconcileSnapshot(options);
  if (!snapshotResult.ok) {
    return snapshotResult;
  }

  const { snapshot } = snapshotResult;

  if (options.write) {
    snapshot.queue.counts = buildCounts(snapshot.queue.dispatches);
    snapshot.queue.last_updated = new Date().toISOString();
    const writeQueueResult = atomicWriteQueueState(options.queueStatePath, snapshot.queue);
    if (!writeQueueResult.ok) {
      return {
        ok: false,
        queue_state_path: options.queueStatePath,
        completed_ideas_path: options.completedIdeasPath,
        dispatches_scanned: snapshot.dispatches_scanned,
        evidentiary_matches: snapshot.evidentiary_matches,
        queue_dispatches_completed: snapshot.queue_dispatches_completed,
        completed_registry_added: snapshot.completed_registry_added,
        already_completed_matches: snapshot.already_completed_matches,
        unresolved_dispatches: snapshot.unresolved_dispatches,
        source_counts: snapshot.source_counts,
        error: writeQueueResult.error,
      };
    }
    writeCompletedIdeasRegistry(options.rootDir, options.completedIdeasPath, snapshot.completed_registry);
  }

  return {
    ok: true,
    queue_state_path: options.queueStatePath,
    completed_ideas_path: options.completedIdeasPath,
    dispatches_scanned: snapshot.dispatches_scanned,
    evidentiary_matches: snapshot.evidentiary_matches,
    queue_dispatches_completed: snapshot.queue_dispatches_completed,
    completed_registry_added: snapshot.completed_registry_added,
    already_completed_matches: snapshot.already_completed_matches,
    unresolved_dispatches: snapshot.unresolved_dispatches,
    source_counts: snapshot.source_counts,
  };
}

function main(): void {
  const result = runIdeaCompletionReconcile(parseArgs(process.argv.slice(2)));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) {
    process.exitCode = 1;
  }
}

if (process.argv[1]?.includes("lp-do-ideas-completion-reconcile")) {
  main();
}
