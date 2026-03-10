import path from "node:path";

import {
  atomicWriteQueueState,
  buildCounts,
  type QueueDispatch,
  type QueueFileShape,
  readQueueStateFile,
} from "./lp-do-ideas-queue-state-file.js";

export interface WorkPackageCandidate {
  work_package_key: string;
  business: string;
  recommended_route: string;
  provisional_deliverable_family: string;
  location_root: string;
  feature_slug_hint: string;
  dispatch_ids: string[];
  area_anchors: string[];
  candidate_reason: string;
  created_at_from: string;
  created_at_to: string;
}

export interface WorkPackageCandidateOptions {
  business?: string;
  recommendedRoute?: string;
  minDispatches?: number;
  maxDispatches?: number;
}

export interface MarkDispatchesProcessedOptions {
  queueStatePath: string;
  dispatchIds: string[];
  featureSlug?: string;
  factFindPath?: string;
  targetSlug?: string;
  targetPath?: string;
  targetRoute?: "lp-do-fact-find" | "lp-do-plan" | "lp-do-build" | "lp-do-briefing";
  route?: "dispatch-routed" | "direct-inject";
  business?: string;
  clock?: () => Date;
}

export type MarkDispatchesProcessedResult =
  | { ok: true; mutated: number; skipped: number }
  | {
      ok: false;
      reason: "file_not_found" | "parse_error" | "write_error" | "no_match" | "conflict";
      error?: string;
    };

function resolveProcessedTarget(
  options: MarkDispatchesProcessedOptions,
): {
  targetRoute: "lp-do-fact-find" | "lp-do-plan" | "lp-do-build" | "lp-do-briefing";
  targetKind: "fact-find" | "plan" | "build" | "briefing";
  targetSlug: string;
  targetPath: string;
} | {
  ok: false;
  reason: "conflict";
  error: string;
} {
  const targetRoute = options.targetRoute ?? "lp-do-fact-find";
  const targetSlug = options.targetSlug ?? options.featureSlug;
  const targetPath = options.targetPath ?? options.factFindPath;

  if (!targetSlug || targetSlug.trim() === "") {
    return {
      ok: false,
      reason: "conflict",
      error: "targetSlug (or legacy featureSlug) is required for queue processed_by updates.",
    };
  }

  if (!targetPath || targetPath.trim() === "") {
    return {
      ok: false,
      reason: "conflict",
      error: "targetPath (or legacy factFindPath) is required for queue processed_by updates.",
    };
  }

  const targetKind =
    targetRoute === "lp-do-build"
      ? "build"
      : targetRoute === "lp-do-plan"
        ? "plan"
      : targetRoute === "lp-do-briefing"
        ? "briefing"
        : "fact-find";

  return {
    targetRoute,
    targetKind,
    targetSlug,
    targetPath,
  };
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "app",
  "audit",
  "book",
  "booking",
  "brik",
  "brikette",
  "bug",
  "code",
  "component",
  "coverage",
  "dispatch",
  "email",
  "fact",
  "find",
  "flow",
  "for",
  "from",
  "gap",
  "hardening",
  "idea",
  "ideas",
  "logging",
  "missing",
  "no",
  "not",
  "operator",
  "plan",
  "process",
  "queue",
  "route",
  "test",
  "tests",
  "the",
  "to",
  "ui",
  "untested",
  "workflow",
]);

function normalizeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function tokenizeAreaAnchor(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function deriveLocationRoot(anchor: string): string | null {
  const normalized = anchor.trim();
  if (!normalized.includes("/")) {
    return null;
  }

  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 0) {
    return null;
  }

  if ((segments[0] === "apps" || segments[0] === "packages") && segments.length >= 2) {
    return `${segments[0]}/${segments[1]}`;
  }
  if (segments[0] === "scripts" && segments.length >= 2) {
    return `${segments[0]}/${segments[1]}`;
  }
  if (segments[0] === "docs" && segments.length >= 3) {
    return `${segments[0]}/${segments[1]}/${segments[2]}`;
  }

  return path.dirname(normalized);
}

function dominantLocationRoot(dispatches: QueueDispatch[]): string | null {
  const counts = new Map<string, number>();

  for (const dispatch of dispatches) {
    const anchors = Array.isArray(dispatch.location_anchors) ? dispatch.location_anchors : [];
    for (const anchor of anchors) {
      if (typeof anchor !== "string") continue;
      const root = deriveLocationRoot(anchor);
      if (!root) continue;
      counts.set(root, (counts.get(root) ?? 0) + 1);
    }
  }

  if (counts.size === 0) {
    return null;
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0][0];
}

function featureSlugHint(locationRoot: string, dispatches: QueueDispatch[]): string {
  const locationStem = normalizeToken(locationRoot.split("/").slice(-1)[0] ?? "work-package");
  const tokenCounts = new Map<string, number>();

  for (const dispatch of dispatches) {
    if (typeof dispatch.area_anchor !== "string") continue;
    const seen = new Set<string>();
    for (const token of tokenizeAreaAnchor(dispatch.area_anchor)) {
      if (seen.has(token)) continue;
      seen.add(token);
      tokenCounts.set(token, (tokenCounts.get(token) ?? 0) + 1);
    }
  }

  const rankedTokens = [...tokenCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .filter(([, count]) => count >= 2)
    .slice(0, 2)
    .map(([token]) => token);

  const parts = [locationStem, ...rankedTokens].filter(Boolean);
  return normalizeToken(parts.join("-")) || "work-package";
}

function createdAtRange(dispatches: QueueDispatch[]): { from: string; to: string } {
  const timestamps = dispatches
    .map((dispatch) => dispatch.created_at)
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .sort((left, right) => left.localeCompare(right));

  return {
    from: timestamps[0] ?? "unknown",
    to: timestamps[timestamps.length - 1] ?? "unknown",
  };
}

function buildCandidateReason(
  dispatches: QueueDispatch[],
  locationRoot: string,
  route: string,
  family: string,
  dateBucket: string,
): string {
  return (
    `${dispatches.length} queued dispatches share ` +
    `business ${dispatches[0]?.business ?? "unknown"}, route ${route}, ` +
    `deliverable family ${family}, location root ${locationRoot}, and UTC day ${dateBucket}.`
  );
}

function candidateKey(
  dispatch: QueueDispatch,
  locationRoot: string,
  dateBucket: string,
): string {
  return [
    normalizeToken(dispatch.business ?? "unknown"),
    normalizeToken(dispatch.recommended_route ?? "unknown"),
    normalizeToken(dispatch.provisional_deliverable_family ?? "unknown"),
    normalizeToken(locationRoot),
    normalizeToken(dateBucket),
  ].join(":");
}

function isPendingFactFindDispatch(dispatch: QueueDispatch): boolean {
  return (
    typeof dispatch.dispatch_id === "string" &&
    dispatch.dispatch_id.length > 0 &&
    dispatch.queue_state === "enqueued" &&
    dispatch.status === "fact_find_ready" &&
    dispatch.recommended_route === "lp-do-fact-find" &&
    dispatch.processed_by == null
  );
}

export function deriveWorkPackageCandidates(
  queue: QueueFileShape,
  options: WorkPackageCandidateOptions = {},
): WorkPackageCandidate[] {
  const minDispatches = options.minDispatches ?? 2;
  const maxDispatches = options.maxDispatches ?? 7;
  const grouped = new Map<string, QueueDispatch[]>();

  for (const dispatch of queue.dispatches) {
    if (!isPendingFactFindDispatch(dispatch)) continue;
    if (options.business && dispatch.business !== options.business) continue;
    if (
      options.recommendedRoute &&
      dispatch.recommended_route !== options.recommendedRoute
    ) {
      continue;
    }

    const locationRoot = dominantLocationRoot([dispatch]);
    if (!locationRoot) continue;

    const dateBucket =
      typeof dispatch.created_at === "string" && dispatch.created_at.length >= 10
        ? dispatch.created_at.slice(0, 10)
        : "unknown-date";
    const key = candidateKey(dispatch, locationRoot, dateBucket);
    const current = grouped.get(key) ?? [];
    current.push(dispatch);
    grouped.set(key, current);
  }

  return [...grouped.entries()]
    .map(([key, dispatches]) => {
      const locationRoot = dominantLocationRoot(dispatches);
      if (!locationRoot) return null;
      if (dispatches.length < minDispatches || dispatches.length > maxDispatches) {
        return null;
      }

      const range = createdAtRange(dispatches);
      const dateBucket =
        range.from !== "unknown" && range.from.length >= 10
          ? range.from.slice(0, 10)
          : "unknown-date";

      const ordered = [...dispatches].sort((left, right) =>
        (left.dispatch_id ?? "").localeCompare(right.dispatch_id ?? ""),
      );

      return {
        work_package_key: key,
        business: ordered[0]?.business ?? "unknown",
        recommended_route: ordered[0]?.recommended_route ?? "lp-do-fact-find",
        provisional_deliverable_family:
          ordered[0]?.provisional_deliverable_family ?? "code-change",
        location_root: locationRoot,
        feature_slug_hint: featureSlugHint(locationRoot, ordered),
        dispatch_ids: ordered
          .map((dispatch) => dispatch.dispatch_id)
          .filter((value): value is string => typeof value === "string"),
        area_anchors: ordered
          .map((dispatch) => dispatch.area_anchor)
          .filter((value): value is string => typeof value === "string"),
        candidate_reason: buildCandidateReason(
          ordered,
          locationRoot,
          ordered[0]?.recommended_route ?? "lp-do-fact-find",
          ordered[0]?.provisional_deliverable_family ?? "code-change",
          dateBucket,
        ),
        created_at_from: range.from,
        created_at_to: range.to,
      } satisfies WorkPackageCandidate;
    })
    .filter((candidate): candidate is WorkPackageCandidate => candidate !== null)
    .sort(
      (left, right) =>
        right.dispatch_ids.length - left.dispatch_ids.length ||
        left.work_package_key.localeCompare(right.work_package_key),
    );
}

export function markDispatchesProcessed(
  options: MarkDispatchesProcessedOptions,
): MarkDispatchesProcessedResult {
  const clock = options.clock ?? (() => new Date());
  const target = resolveProcessedTarget(options);
  if ("reason" in target) {
    return target;
  }
  const queueResult = readQueueStateFile(options.queueStatePath);
  if (!queueResult.ok) {
    return queueResult;
  }

  const wantedIds = new Set(options.dispatchIds);
  let matched = 0;
  let mutated = 0;
  let skipped = 0;

  for (const dispatch of queueResult.queue.dispatches) {
    if (!dispatch.dispatch_id || !wantedIds.has(dispatch.dispatch_id)) {
      continue;
    }
    if (options.business && dispatch.business !== options.business) {
      continue;
    }

    matched += 1;

    const processedBy = dispatch.processed_by;
    const sameTarget =
      (processedBy?.target_slug === target.targetSlug &&
        processedBy?.target_path === target.targetPath &&
        processedBy?.target_route === target.targetRoute) ||
      (target.targetRoute === "lp-do-build" &&
        processedBy?.feature_slug === target.targetSlug &&
        processedBy?.target_path == null &&
        processedBy?.micro_build_path == null) ||
      (target.targetRoute === "lp-do-fact-find" &&
        processedBy?.fact_find_slug === target.targetSlug &&
        processedBy?.fact_find_path === target.targetPath);

    if (sameTarget && (dispatch.queue_state === "processed" || dispatch.queue_state === "completed")) {
      let normalized = false;
      if (!dispatch.processed_by || typeof dispatch.processed_by !== "object") {
        dispatch.processed_by = {};
      }
      dispatch.processed_by.route ??= options.route ?? "dispatch-routed";
      dispatch.processed_by.processed_at ??= clock().toISOString();
      if (dispatch.processed_by.target_route !== target.targetRoute) {
        dispatch.processed_by.target_route = target.targetRoute;
        normalized = true;
      }
      if (dispatch.processed_by.target_kind !== target.targetKind) {
        dispatch.processed_by.target_kind = target.targetKind;
        normalized = true;
      }
      if (dispatch.processed_by.target_slug !== target.targetSlug) {
        dispatch.processed_by.target_slug = target.targetSlug;
        normalized = true;
      }
      if (dispatch.processed_by.target_path !== target.targetPath) {
        dispatch.processed_by.target_path = target.targetPath;
        normalized = true;
      }
      if (target.targetRoute === "lp-do-fact-find") {
        if (dispatch.processed_by.fact_find_slug !== target.targetSlug) {
          dispatch.processed_by.fact_find_slug = target.targetSlug;
          normalized = true;
        }
        if (dispatch.processed_by.fact_find_path !== target.targetPath) {
          dispatch.processed_by.fact_find_path = target.targetPath;
          normalized = true;
        }
      }
      if (normalized) {
        mutated += 1;
      } else {
        skipped += 1;
      }
      continue;
    }

    if (processedBy && !sameTarget) {
      return {
        ok: false,
        reason: "conflict",
        error:
          `Dispatch ${dispatch.dispatch_id} already points at ${processedBy.target_slug ?? processedBy.fact_find_slug ?? "unknown"} ` +
          `and cannot be reassigned automatically.`,
      };
    }

    const canRepairProcessedWithoutClaim =
      dispatch.queue_state === "processed" &&
      (processedBy == null ||
        (typeof processedBy === "object" &&
          processedBy !== null &&
          Object.keys(processedBy).length === 0));

    if (dispatch.queue_state && dispatch.queue_state !== "enqueued" && !canRepairProcessedWithoutClaim) {
      return {
        ok: false,
        reason: "conflict",
        error:
          `Dispatch ${dispatch.dispatch_id} is in queue_state=${dispatch.queue_state} and cannot be promoted automatically.`,
      };
    }

    dispatch.queue_state = "processed";
    dispatch.processed_by = {
      route: options.route ?? "dispatch-routed",
      target_route: target.targetRoute,
      target_kind: target.targetKind,
      target_slug: target.targetSlug,
      target_path: target.targetPath,
      processed_at: processedBy?.processed_at ?? clock().toISOString(),
      ...(target.targetRoute === "lp-do-fact-find"
        ? {
            fact_find_slug: target.targetSlug,
            fact_find_path: target.targetPath,
          }
        : target.targetRoute === "lp-do-build"
          ? {
              micro_build_path: target.targetPath,
            }
          : {}),
    };
    mutated += 1;
  }

  if (matched === 0) {
    return { ok: false, reason: "no_match" };
  }

  if (mutated === 0) {
    return { ok: true, mutated: 0, skipped };
  }

  queueResult.queue.counts = buildCounts(queueResult.queue.dispatches);
  queueResult.queue.last_updated = clock().toISOString();

  const writeResult = atomicWriteQueueState(options.queueStatePath, queueResult.queue);
  if (!writeResult.ok) {
    return { ok: false, reason: "write_error", error: writeResult.error };
  }

  return { ok: true, mutated, skipped };
}

interface CliOptions {
  queueStatePath: string;
  business?: string;
  recommendedRoute?: string;
  minDispatches?: number;
}

function parseArgs(argv: string[]): CliOptions {
  const flags = new Map<string, string>();

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token?.startsWith("--")) continue;
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) continue;
    flags.set(token.slice(2), value);
    index += 1;
  }

  return {
    queueStatePath:
      flags.get("queue-state-path") ??
      path.join("docs", "business-os", "startup-loop", "ideas", "trial", "queue-state.json"),
    business: flags.get("business"),
    recommendedRoute: flags.get("route"),
    minDispatches: flags.get("min-dispatches")
      ? Number(flags.get("min-dispatches"))
      : undefined,
  };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const queueResult = readQueueStateFile(args.queueStatePath);
  if (!queueResult.ok) {
    process.stdout.write(`${JSON.stringify(queueResult, null, 2)}\n`);
    return;
  }

  const candidates = deriveWorkPackageCandidates(queueResult.queue, {
    business: args.business,
    recommendedRoute: args.recommendedRoute,
    minDispatches: args.minDispatches,
  });

  process.stdout.write(`${JSON.stringify({ ok: true, candidates }, null, 2)}\n`);
}

if (process.argv[1]?.includes("lp-do-ideas-work-packages")) {
  main();
}
