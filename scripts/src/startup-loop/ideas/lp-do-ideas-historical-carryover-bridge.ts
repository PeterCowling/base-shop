import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

import { detectRepoRoot, toRepoRelativePath } from "../build/build-origin-signal.js";

import { computeClusterFingerprint } from "./lp-do-ideas-fingerprint.js";
import {
  IDEAS_TRIAL_QUEUE_STATE_PATH,
  IDEAS_TRIAL_TELEMETRY_PATH,
} from "./lp-do-ideas-paths.js";
import { appendTelemetry, type PersistedTelemetryRecord } from "./lp-do-ideas-persistence.js";
import { validateDispatchContent } from "./lp-do-ideas-queue-admission.js";
import {
  atomicWriteQueueState,
  buildCounts,
  type QueueFileShape,
  readQueueStateFile,
} from "./lp-do-ideas-queue-state-file.js";
import { routeDispatchV2 } from "./lp-do-ideas-routing-adapter.js";
import {
  buildDispatchId,
  type TrialDispatchPacketV2,
  validateDispatchV2,
} from "./lp-do-ideas-trial.js";

type HistoricalCategory =
  | "new_loop_process"
  | "ai_to_mechanistic"
  | "new_skill"
  | "new_standing_data_source";

type HistoricalCurrentState =
  | "worthwhile_unresolved"
  | "resolved"
  | "superseded"
  | "moot";

type HistoricalCarryForwardDecision = "carry_forward" | "do_not_carry";

interface HistoricalQueueMapping {
  business: string;
  route: "lp-do-fact-find" | "lp-do-plan" | "lp-do-build" | "lp-do-briefing";
  status: "fact_find_ready" | "plan_ready" | "micro_build_ready" | "briefing_ready";
  target_slug: string;
  target_path: string;
  provenance: {
    schema_version: "dispatch-historical-carryover.v1";
    historical_candidate_id: string;
    source_audit_path: string;
    source_plan_slugs: string[];
    source_paths: string[];
    backfilled_at: string | null;
  };
}

interface HistoricalAdmissionResult {
  dispatch_id: string | null;
  queue_state: "enqueued" | "suppressed";
  telemetry_reason: string;
  admitted_at: string;
  suppression_reason: string | null;
}

interface HistoricalManifestItem {
  historical_candidate_id: string;
  title: string;
  category: HistoricalCategory;
  source_plan_slugs: string[];
  source_paths: string[];
  source_titles: string[];
  current_state: HistoricalCurrentState;
  carry_forward_decision: HistoricalCarryForwardDecision;
  decision_reason: string;
  manual_judgment_notes: string;
  queue_mapping: HistoricalQueueMapping | null;
  admission_result: HistoricalAdmissionResult | null;
}

interface HistoricalManifestFile {
  schema_version: "historical-carryover-manifest.v1";
  generated_at: string;
  source_audit_path: string;
  items: HistoricalManifestItem[];
}

export interface HistoricalCarryoverBridgeOptions {
  rootDir?: string;
  manifestPath?: string;
  queueStatePath?: string;
  telemetryPath?: string;
  clock?: () => Date;
  write?: boolean;
}

export interface HistoricalCarryoverBridgeItemResult {
  historical_candidate_id: string;
  title: string;
  action: "enqueued" | "suppressed" | "skipped";
  dispatch_id: string | null;
  queue_state: "enqueued" | "suppressed" | null;
  reason: string | null;
}

export interface HistoricalCarryoverBridgeResult {
  ok: boolean;
  manifest_path: string;
  candidates_considered: number;
  eligible_items: number;
  dispatches_prepared: number;
  dispatches_enqueued: number;
  suppressed: number;
  skipped: number;
  warnings: string[];
  items: HistoricalCarryoverBridgeItemResult[];
  error?: string;
}

const DEFAULT_MANIFEST_PATH =
  "docs/plans/startup-loop-results-review-historical-carryover/artifacts/historical-carryover-manifest.json";
const TELEMETRY_REASON = "historical_carryover_bridge";

function normalizeKeyToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "historical-carryover";
}

function uniqueStrings(values: readonly string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter((value) => value.length > 0)),
  );
}

function atomicWriteJson(targetPath: string, value: unknown): void {
  mkdirSync(path.dirname(targetPath), { recursive: true });
  const tmpPath = path.join(
    path.dirname(targetPath),
    `.${path.basename(targetPath)}.tmp.${randomBytes(4).toString("hex")}`,
  );
  writeFileSync(tmpPath, JSON.stringify(value, null, 2) + "\n", "utf8");
  renameSync(tmpPath, targetPath);
}

function readManifest(manifestPath: string): HistoricalManifestFile {
  const parsed = JSON.parse(readFileSync(manifestPath, "utf8")) as HistoricalManifestFile;
  if (
    parsed.schema_version !== "historical-carryover-manifest.v1" ||
    !Array.isArray(parsed.items)
  ) {
    throw new Error(
      `Manifest at ${manifestPath} is not a valid historical-carryover-manifest.v1 file.`,
    );
  }
  return parsed;
}

function priorityForCategory(category: HistoricalCategory): "P1" | "P2" | "P3" {
  if (category === "new_loop_process" || category === "new_standing_data_source") {
    return "P2";
  }
  return "P3";
}

function confidenceForCategory(category: HistoricalCategory): number {
  if (category === "new_loop_process" || category === "new_standing_data_source") {
    return 0.62;
  }
  if (category === "new_skill") {
    return 0.56;
  }
  return 0.58;
}

function eligibleItem(item: HistoricalManifestItem): boolean {
  return (
    item.current_state === "worthwhile_unresolved" &&
    item.carry_forward_decision === "carry_forward" &&
    item.queue_mapping !== null
  );
}

function buildPacket(
  item: HistoricalManifestItem,
  manifestRelativePath: string,
  sourceAuditPath: string,
  now: Date,
  sequence: number,
): TrialDispatchPacketV2 {
  if (!item.queue_mapping) {
    throw new Error(`Historical item ${item.historical_candidate_id} is missing queue_mapping.`);
  }

  const anchorKey = normalizeKeyToken(item.title).slice(0, 80);
  const rootEventId = `historical-carryover:${normalizeKeyToken(item.queue_mapping.business)}:${item.historical_candidate_id}`;
  const clusterKey = `${item.queue_mapping.business}:historical-carryover:${item.historical_candidate_id}:${anchorKey}`;
  const evidenceRefs = uniqueStrings([sourceAuditPath, ...item.source_paths]) as [string, ...string[]];
  const clusterFingerprint = computeClusterFingerprint({
    root_event_id: rootEventId,
    anchor_key: anchorKey,
    evidence_ref_ids: [item.historical_candidate_id, ...evidenceRefs],
    normalized_semantic_diff_hash: createHash("sha1")
      .update(`${item.historical_candidate_id}::${item.queue_mapping.target_slug}`)
      .digest("hex"),
  });
  const locationAnchors = uniqueStrings([
    sourceAuditPath,
    ...item.source_paths,
    item.queue_mapping.target_path,
  ]) as [string, ...string[]];
  const backfilledAt = now.toISOString();

  const packet: TrialDispatchPacketV2 = {
    schema_version: "dispatch.v2",
    dispatch_id: buildDispatchId(now, sequence),
    mode: "trial",
    business: item.queue_mapping.business,
    trigger: "operator_idea",
    artifact_id: null,
    before_sha: null,
    after_sha: item.historical_candidate_id,
    root_event_id: rootEventId,
    anchor_key: anchorKey,
    cluster_key: clusterKey,
    cluster_fingerprint: clusterFingerprint,
    lineage_depth: 0,
    area_anchor: item.title,
    location_anchors: locationAnchors,
    provisional_deliverable_family: "multi",
    current_truth: item.decision_reason,
    next_scope_now:
      item.queue_mapping.route === "lp-do-plan"
        ? `Produce a guarded plan for historical carry-over candidate "${item.title}".`
        : `Validate the historical carry-over candidate "${item.title}" against current repo state and decide the next action.`,
    adjacent_later: [],
    recommended_route: item.queue_mapping.route,
    status: item.queue_mapping.status,
    priority: priorityForCategory(item.category),
    confidence: confidenceForCategory(item.category),
    evidence_refs: evidenceRefs,
    created_at: backfilledAt,
    queue_state: "enqueued",
    why:
      `Historical carry-over audit found archived backlog item "${item.title}" still worthwhile and unresolved. ` +
      `Backfilling it into the canonical queue prevents the old archive-only backlog rail from surviving outside queue state.`,
    intended_outcome: {
      type: "operational",
      statement:
        item.queue_mapping.route === "lp-do-plan"
          ? `Produce a guarded plan for historical carry-over candidate "${item.title}".`
          : `Produce a validated fact-find and next action for historical carry-over candidate "${item.title}".`,
      source: "auto",
    },
    historical_carryover: {
      schema_version: "dispatch-historical-carryover.v1",
      manifest_path: manifestRelativePath,
      historical_candidate_id: item.historical_candidate_id,
      source_audit_path: sourceAuditPath,
      source_plan_slugs: [...item.source_plan_slugs],
      source_paths: [...item.source_paths],
      backfilled_at: backfilledAt,
    },
  };

  const validation = validateDispatchV2(
    packet as Partial<TrialDispatchPacketV2> & Record<string, unknown>,
  );
  if (!validation.valid) {
    throw new Error(
      `Historical carry-over packet for ${item.historical_candidate_id} failed dispatch.v2 validation: ${validation.errors.join(" | ")}`,
    );
  }
  const routeResult = routeDispatchV2(packet);
  if (!routeResult.ok) {
    throw new Error(
      `Historical carry-over packet for ${item.historical_candidate_id} failed routing validation: ${routeResult.code} ${routeResult.error}`,
    );
  }

  return packet;
}

function duplicateReason(
  packet: TrialDispatchPacketV2,
  queue: QueueFileShape,
): string | null {
  const dispatchIdMatch = queue.dispatches.find((entry) => entry.dispatch_id === packet.dispatch_id);
  if (dispatchIdMatch) {
    return `dispatch_id already present (${packet.dispatch_id})`;
  }
  const clusterMatch = queue.dispatches.find(
    (entry) =>
      entry.cluster_key === packet.cluster_key &&
      entry.cluster_fingerprint === packet.cluster_fingerprint,
  );
  if (clusterMatch) {
    return `cluster already present (${packet.cluster_key}:${packet.cluster_fingerprint})`;
  }
  return null;
}

function resolvePath(rootDir: string, candidatePath: string): string {
  return path.isAbsolute(candidatePath) ? candidatePath : path.join(rootDir, candidatePath);
}

export function runHistoricalCarryoverBridge(
  options: HistoricalCarryoverBridgeOptions = {},
): HistoricalCarryoverBridgeResult {
  const rootDir = options.rootDir ? detectRepoRoot(options.rootDir) : detectRepoRoot(process.cwd());
  const manifestPath = resolvePath(rootDir, options.manifestPath ?? DEFAULT_MANIFEST_PATH);
  const queueStatePath = resolvePath(rootDir, options.queueStatePath ?? IDEAS_TRIAL_QUEUE_STATE_PATH);
  const telemetryPath = resolvePath(rootDir, options.telemetryPath ?? IDEAS_TRIAL_TELEMETRY_PATH);
  const clock = options.clock ?? (() => new Date());
  const write = options.write ?? true;
  const manifestRelativePath = toRepoRelativePath(rootDir, manifestPath);

  try {
    if (!existsSync(manifestPath)) {
      return {
        ok: false,
        manifest_path: manifestRelativePath,
        candidates_considered: 0,
        eligible_items: 0,
        dispatches_prepared: 0,
        dispatches_enqueued: 0,
        suppressed: 0,
        skipped: 0,
        warnings: [],
        items: [],
        error: `Historical carry-over manifest not found at ${manifestRelativePath}`,
      };
    }

    const manifest = readManifest(manifestPath);
    const queueRead = readQueueStateFile(queueStatePath);
    const queue: QueueFileShape =
      queueRead.ok
        ? queueRead.queue
        : queueRead.reason === "file_not_found"
          ? { dispatches: [] }
          : (() => {
              throw new Error(
                `Queue state at ${toRepoRelativePath(rootDir, queueStatePath)} could not be loaded: ${queueRead.error ?? queueRead.reason}`,
              );
            })();
    const now = clock();
    const nowIso = now.toISOString();
    const warnings: string[] = [];
    const items: HistoricalCarryoverBridgeItemResult[] = [];
    const telemetryRecords: PersistedTelemetryRecord[] = [];
    const updatedManifest: HistoricalManifestFile = {
      ...manifest,
      items: manifest.items.map((item) => ({
        ...item,
        source_plan_slugs: [...item.source_plan_slugs],
        source_paths: [...item.source_paths],
        source_titles: [...item.source_titles],
        queue_mapping: item.queue_mapping
          ? {
              ...item.queue_mapping,
              provenance: {
                ...item.queue_mapping.provenance,
                source_plan_slugs: [...item.queue_mapping.provenance.source_plan_slugs],
                source_paths: [...item.queue_mapping.provenance.source_paths],
              },
            }
          : null,
        admission_result: item.admission_result ? { ...item.admission_result } : null,
      })),
    };

    let dispatchesPrepared = 0;
    let dispatchesEnqueued = 0;
    let suppressed = 0;
    let skipped = 0;
    let sequence = 1;

    for (const item of updatedManifest.items) {
      if (!eligibleItem(item)) {
        skipped += 1;
        items.push({
          historical_candidate_id: item.historical_candidate_id,
          title: item.title,
          action: "skipped",
          dispatch_id: null,
          queue_state: null,
          reason: "not eligible for historical queue admission",
        });
        continue;
      }
      if (item.admission_result) {
        skipped += 1;
        items.push({
          historical_candidate_id: item.historical_candidate_id,
          title: item.title,
          action: "skipped",
          dispatch_id: item.admission_result.dispatch_id,
          queue_state: item.admission_result.queue_state,
          reason: "already carries admission_result in manifest",
        });
        continue;
      }

      const packet = buildPacket(item, manifestRelativePath, manifest.source_audit_path, now, sequence);
      sequence += 1;
      dispatchesPrepared += 1;

      const duplicate = duplicateReason(packet, queue);
      if (duplicate) {
        suppressed += 1;
        item.admission_result = {
          dispatch_id: null,
          queue_state: "suppressed",
          telemetry_reason: TELEMETRY_REASON,
          admitted_at: nowIso,
          suppression_reason: duplicate,
        };
        items.push({
          historical_candidate_id: item.historical_candidate_id,
          title: item.title,
          action: "suppressed",
          dispatch_id: null,
          queue_state: "suppressed",
          reason: duplicate,
        });
        warnings.push(`Suppressed duplicate historical carry-over item ${item.historical_candidate_id}: ${duplicate}`);
        continue;
      }

      // Content guard check (TASK-02: protect direct-write path)
      const existingAnchors = queue.dispatches
        .map((d) => (typeof d.area_anchor === "string" ? d.area_anchor : ""))
        .filter((a) => a.length > 0);
      const guardResult = validateDispatchContent(
        {
          area_anchor: packet.area_anchor,
          trigger: packet.trigger,
          domain: (packet as unknown as Record<string, unknown>).domain as string | undefined,
        },
        existingAnchors,
      );
      if (!guardResult.accepted) {
        suppressed += 1;
        item.admission_result = {
          dispatch_id: null,
          queue_state: "suppressed",
          telemetry_reason: TELEMETRY_REASON,
          admitted_at: nowIso,
          suppression_reason: `content_guard: ${guardResult.reason}`,
        };
        items.push({
          historical_candidate_id: item.historical_candidate_id,
          title: item.title,
          action: "suppressed",
          dispatch_id: null,
          queue_state: "suppressed",
          reason: `content_guard: ${guardResult.reason}`,
        });
        telemetryRecords.push({
          recorded_at: nowIso,
          dispatch_id: packet.dispatch_id,
          mode: "trial",
          business: packet.business,
          queue_state: "error",
          kind: "validation_rejected",
          reason: guardResult.reason ?? "content_guard",
        });
        warnings.push(`Content guard rejected historical carry-over item ${item.historical_candidate_id}: ${guardResult.reason}`);
        continue;
      }

      if (item.queue_mapping) {
        item.queue_mapping.provenance.backfilled_at = nowIso;
      }
      item.admission_result = {
        dispatch_id: packet.dispatch_id,
        queue_state: "enqueued",
        telemetry_reason: TELEMETRY_REASON,
        admitted_at: nowIso,
        suppression_reason: null,
      };
      queue.dispatches.push(packet as unknown as QueueFileShape["dispatches"][number]);
      telemetryRecords.push({
        recorded_at: nowIso,
        dispatch_id: packet.dispatch_id,
        mode: "trial",
        business: packet.business,
        queue_state: "enqueued",
        kind: "enqueued",
        reason: TELEMETRY_REASON,
      });
      dispatchesEnqueued += 1;
      items.push({
        historical_candidate_id: item.historical_candidate_id,
        title: item.title,
        action: "enqueued",
        dispatch_id: packet.dispatch_id,
        queue_state: "enqueued",
        reason: null,
      });
    }

    if (write) {
      if (dispatchesEnqueued > 0) {
        queue.last_updated = nowIso;
        queue.counts = buildCounts(queue.dispatches);
        const writeResult = atomicWriteQueueState(queueStatePath, queue);
        if (!writeResult.ok) {
          throw new Error(
            `Failed to write queue state at ${toRepoRelativePath(rootDir, queueStatePath)}: ${writeResult.error}`,
          );
        }
        appendTelemetry(telemetryPath, telemetryRecords);
      }
      updatedManifest.generated_at = nowIso;
      atomicWriteJson(manifestPath, updatedManifest);
    }

    return {
      ok: true,
      manifest_path: manifestRelativePath,
      candidates_considered: updatedManifest.items.length,
      eligible_items: updatedManifest.items.filter(eligibleItem).length,
      dispatches_prepared: dispatchesPrepared,
      dispatches_enqueued: dispatchesEnqueued,
      suppressed,
      skipped,
      warnings,
      items,
    };
  } catch (error) {
    return {
      ok: false,
      manifest_path: manifestRelativePath,
      candidates_considered: 0,
      eligible_items: 0,
      dispatches_prepared: 0,
      dispatches_enqueued: 0,
      suppressed: 0,
      skipped: 0,
      warnings: [],
      items: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function parseFlags(argv: readonly string[]): Map<string, string | true> {
  const flags = new Map<string, string | true>();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token?.startsWith("--")) {
      continue;
    }
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      flags.set(key, true);
      continue;
    }
    flags.set(key, next);
    index += 1;
  }
  return flags;
}

export function main(argv: readonly string[]): number {
  const flags = parseFlags(argv);
  const result = runHistoricalCarryoverBridge({
    rootDir: typeof flags.get("root-dir") === "string" ? (flags.get("root-dir") as string) : undefined,
    manifestPath:
      typeof flags.get("manifest-path") === "string"
        ? (flags.get("manifest-path") as string)
        : undefined,
    queueStatePath:
      typeof flags.get("queue-state-path") === "string"
        ? (flags.get("queue-state-path") as string)
        : undefined,
    telemetryPath:
      typeof flags.get("telemetry-path") === "string"
        ? (flags.get("telemetry-path") as string)
        : undefined,
    write: flags.get("dry-run") !== true,
  });

  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  return result.ok ? 0 : 1;
}

if (process.argv[1]?.includes("lp-do-ideas-historical-carryover-bridge")) {
  process.exitCode = main(process.argv.slice(2));
}
