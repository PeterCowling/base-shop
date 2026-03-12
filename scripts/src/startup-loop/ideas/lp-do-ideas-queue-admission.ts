import type { PersistedTelemetryRecord } from "./lp-do-ideas-persistence.js";
import { appendTelemetry } from "./lp-do-ideas-persistence.js";
import {
  atomicWriteQueueState,
  buildCounts,
  type QueueFileShape,
  readQueueStateFile,
} from "./lp-do-ideas-queue-state-file.js";

// ---------------------------------------------------------------------------
// Content guard types and constants
// ---------------------------------------------------------------------------

const ARTIFACT_DOMAIN_VALUES = new Set([
  "ASSESSMENT",
  "MARKET",
  "SELL",
  "PRODUCTS",
  "LOGISTICS",
  "LEGAL",
  "STRATEGY",
  "BOS",
]);

const FORBIDDEN_PATTERNS: readonly RegExp[] = [
  /^(Now|Here are|But it|Let me|Looking at|Based on|Step \d)\s/i,
  /TASK-\d+/,
  /\bdepends\s+on\s+TASK/i,
  /Confidence\s+Inputs\s+section/i,
  /^\s*\|/, // table row
  /^###?\s/, // markdown heading
  /…$/, // truncated text
  /[✓✗✔✕]/u, // completion markers
  /structural changes$/i, // auto-generated codebase signal label
];

const MIN_WORD_COUNT_ARTIFACT_DELTA = 5;

export interface ContentGuardResult {
  accepted: boolean;
  reason?: string;
}

/**
 * Pure content-quality guard for dispatch packets.
 *
 * Checks:
 * 1. Forbidden patterns on area_anchor (agent reasoning, malformed content)
 * 2. Minimum word count (≥5 for artifact_delta trigger)
 * 3. Area_anchor exact-match dedup against existing queue entries
 * 4. Domain canonical check (ArtifactDomain enum) when domain field is present
 *
 * @param packet - Object with area_anchor, trigger, and optional domain
 * @param existingAreaAnchors - Normalized area_anchors already in the queue
 */
export function validateDispatchContent(
  packet: { area_anchor: string; trigger: string; domain?: string },
  existingAreaAnchors: string[],
): ContentGuardResult {
  const trimmedAnchor = packet.area_anchor.trim();
  const normalizedAnchor = trimmedAnchor.toLowerCase();

  // 1. Forbidden patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(trimmedAnchor)) {
      return { accepted: false, reason: "forbidden_pattern" };
    }
  }

  // 2. Minimum word count (artifact_delta only)
  if (packet.trigger === "artifact_delta") {
    const wordCount = trimmedAnchor.split(/\s+/).filter((w) => w.length > 0).length;
    if (wordCount < MIN_WORD_COUNT_ARTIFACT_DELTA) {
      return { accepted: false, reason: "min_word_count" };
    }
  }

  // 3. Area_anchor dedup
  const normalizedExisting = new Set(existingAreaAnchors.map((a) => a.trim().toLowerCase()));
  if (normalizedExisting.has(normalizedAnchor)) {
    return { accepted: false, reason: "area_anchor_duplicate" };
  }

  // 4. Domain canonical check (only when domain is present)
  if (
    packet.domain !== undefined &&
    packet.domain !== null &&
    typeof packet.domain === "string" &&
    packet.domain.length > 0
  ) {
    if (!ARTIFACT_DOMAIN_VALUES.has(packet.domain)) {
      return { accepted: false, reason: "domain_non_canonical" };
    }
  }

  return { accepted: true };
}

// ---------------------------------------------------------------------------
// Queue admission
// ---------------------------------------------------------------------------

export interface EnqueueQueueDispatchesOptions<
  TPacket extends {
    dispatch_id: string;
    business: string;
    cluster_key: string;
    cluster_fingerprint: string;
    area_anchor: string;
    trigger: string;
  },
> {
  queueStatePath: string;
  telemetryPath: string;
  telemetryReason: string;
  packets: TPacket[];
  clock?: () => Date;
}

export interface EnqueueQueueDispatchesResult {
  appended: number;
  suppressed: number;
}

export function enqueueQueueDispatches(
  options: EnqueueQueueDispatchesOptions<{
    dispatch_id: string;
    business: string;
    cluster_key: string;
    cluster_fingerprint: string;
    area_anchor: string;
    trigger: string;
  }>,
): EnqueueQueueDispatchesResult {
  const existing = readQueueStateFile(options.queueStatePath);
  const queue: QueueFileShape =
    existing.ok
      ? existing.queue
      : existing.reason === "file_not_found"
        ? { dispatches: [] }
        : (() => {
            throw new Error(
              `Queue state at ${options.queueStatePath} could not be loaded: ${existing.error ?? existing.reason}`,
            );
          })();

  const seenDispatchIds = new Set(
    queue.dispatches
      .map((entry) => entry.dispatch_id)
      .filter((value): value is string => typeof value === "string" && value.length > 0),
  );
  const seenClusters = new Set(
    queue.dispatches
      .map((entry) => {
        if (
          typeof entry.cluster_key !== "string" ||
          typeof entry.cluster_fingerprint !== "string" ||
          entry.cluster_key.length === 0 ||
          entry.cluster_fingerprint.length === 0
        ) {
          return null;
        }
        return `${entry.cluster_key}:${entry.cluster_fingerprint}`;
      })
      .filter((value): value is string => value !== null),
  );

  // Build area_anchor dedup set from existing queue entries
  const seenAreaAnchors = new Set(
    queue.dispatches
      .map((entry) => {
        const anchor = entry.area_anchor;
        return typeof anchor === "string" && anchor.length > 0
          ? anchor.trim().toLowerCase()
          : null;
      })
      .filter((value): value is string => value !== null),
  );

  const appendedPackets: Array<{
    dispatch_id: string;
    business: string;
    cluster_key: string;
    cluster_fingerprint: string;
    area_anchor: string;
    trigger: string;
  }> = [];
  const rejectedPackets: Array<{
    dispatch_id: string;
    business: string;
    reason: string;
  }> = [];
  let suppressed = 0;
  const nowIso = (options.clock ? options.clock() : new Date()).toISOString();

  for (const packet of options.packets) {
    // Existing dispatch_id + cluster dedup
    const clusterKey = `${packet.cluster_key}:${packet.cluster_fingerprint}`;
    if (seenDispatchIds.has(packet.dispatch_id) || seenClusters.has(clusterKey)) {
      suppressed += 1;
      continue;
    }

    // Content guard check
    const existingAnchors = Array.from(seenAreaAnchors);
    const guardResult = validateDispatchContent(
      {
        area_anchor: packet.area_anchor,
        trigger: packet.trigger,
        domain: (packet as Record<string, unknown>).domain as string | undefined,
      },
      existingAnchors,
    );

    if (!guardResult.accepted) {
      suppressed += 1;
      rejectedPackets.push({
        dispatch_id: packet.dispatch_id,
        business: packet.business,
        reason: guardResult.reason ?? "content_guard",
      });
      continue;
    }

    queue.dispatches.push(packet as QueueFileShape["dispatches"][number]);
    seenDispatchIds.add(packet.dispatch_id);
    seenClusters.add(clusterKey);
    seenAreaAnchors.add(packet.area_anchor.trim().toLowerCase());
    appendedPackets.push(packet);
  }

  if (appendedPackets.length === 0 && rejectedPackets.length === 0) {
    return { appended: 0, suppressed };
  }

  if (appendedPackets.length > 0) {
    queue.last_updated = nowIso;
    queue.counts = buildCounts(queue.dispatches);

    const writeResult = atomicWriteQueueState(options.queueStatePath, queue);
    if (!writeResult.ok) {
      throw new Error(
        `Failed to write queue state at ${options.queueStatePath}: ${writeResult.error}`,
      );
    }
  }

  // Telemetry: enqueued records
  const telemetryRecords: PersistedTelemetryRecord[] = appendedPackets.map((packet) => ({
    recorded_at: nowIso,
    dispatch_id: packet.dispatch_id,
    mode: "trial",
    business: packet.business,
    queue_state: "enqueued",
    kind: "enqueued",
    reason: options.telemetryReason,
  }));

  // Telemetry: rejection records
  for (const rejected of rejectedPackets) {
    telemetryRecords.push({
      recorded_at: nowIso,
      dispatch_id: rejected.dispatch_id,
      mode: "trial",
      business: rejected.business,
      queue_state: "error",
      kind: "validation_rejected",
      reason: rejected.reason,
    });
  }

  if (telemetryRecords.length > 0) {
    appendTelemetry(options.telemetryPath, telemetryRecords);
  }

  return {
    appended: appendedPackets.length,
    suppressed,
  };
}
