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

// ---------------------------------------------------------------------------
// Semantic similarity helpers
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "can", "for", "of", "in", "on", "at", "to",
  "from", "with", "by", "as", "that", "this", "it", "its", "not", "and",
  "or", "but", "so", "when", "where", "how", "what", "which", "who",
  "any", "all", "some", "no", "get", "got", "go", "just", "than", "they",
  "their", "there", "then", "now", "more", "also", "even", "up", "out",
  "into", "only", "already", "still", "too", "very", "if", "about",
  "after", "before", "during", "need", "needs", "make", "use",
]);

/**
 * Strips the leading "Business Name — " prefix that ideas carry
 * (e.g., "Brikette — ", "XA — ", "Business OS — ").
 */
function stripBusinessPrefix(anchor: string): string {
  return anchor.replace(/^[^—–\-]+[—–\-]\s*/, "").trim();
}

/**
 * Returns the set of meaningful content words from an anchor string.
 * Strips business prefix, lowercases, splits on non-word chars, and
 * removes stop words and tokens shorter than 3 characters.
 */
export function extractContentWords(anchor: string): string[] {
  const stripped = stripBusinessPrefix(anchor.toLowerCase());
  return stripped
    .split(/\W+/)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

/**
 * Jaccard similarity over two word lists (treats each list as a set).
 * Returns 0 if both are empty; 1 if both are empty (degenerate case handled
 * before call-site).
 */
function jaccardSimilarity(wordsA: string[], wordsB: string[]): number {
  const setA = new Set(wordsA);
  const setB = new Set(wordsB);
  let intersect = 0;
  for (const word of setA) {
    if (setB.has(word)) intersect += 1;
  }
  const union = setA.size + setB.size - intersect;
  return union === 0 ? 0 : intersect / union;
}

/**
 * Returns true if the incoming anchor is semantically too similar to any
 * of the existing anchors.  Uses Jaccard similarity on content-word sets.
 * Only fires when both sides yield ≥ MIN_CONTENT_WORDS_FOR_SEMANTIC tokens
 * (prevents false positives on very short anchors).
 */
function isSemanticallyDuplicate(
  incomingAnchor: string,
  existingAnchorList: string[],
): boolean {
  const incomingWords = extractContentWords(incomingAnchor);
  if (incomingWords.length < SEMANTIC_SIMILARITY_THRESHOLD_MIN_WORDS) {
    return false;
  }

  for (const existing of existingAnchorList) {
    const existingWords = extractContentWords(existing);
    if (existingWords.length < SEMANTIC_SIMILARITY_THRESHOLD_MIN_WORDS) {
      continue;
    }
    if (jaccardSimilarity(incomingWords, existingWords) >= SEMANTIC_SIMILARITY_JACCARD_THRESHOLD) {
      return true;
    }
  }

  return false;
}

/** Minimum content words required on both sides before semantic check fires. */
const SEMANTIC_SIMILARITY_THRESHOLD_MIN_WORDS = 3;

/**
 * Jaccard threshold for semantic duplicate detection.
 * At 0.30, two anchors sharing roughly 30 % of their unique content words
 * are considered the same underlying idea.
 */
const SEMANTIC_SIMILARITY_JACCARD_THRESHOLD = 0.30;

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
 * 3.5. Semantic similarity dedup — Jaccard on content words catches the same
 *      idea reworded (e.g., "Choose a name" vs "Select the trading name").
 *      Requires ≥ SEMANTIC_SIMILARITY_THRESHOLD_MIN_WORDS content words on
 *      both sides; fires at SEMANTIC_SIMILARITY_JACCARD_THRESHOLD (0.30).
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

  // 3.5 Semantic similarity dedup
  // Catches the same underlying idea re-submitted with different wording
  // (e.g., "Choose a name for the business" vs "Select the trading name").
  // Uses Jaccard similarity on content-word sets; both sides must have at
  // least SEMANTIC_SIMILARITY_THRESHOLD_MIN_WORDS tokens before the check fires.
  if (isSemanticallyDuplicate(trimmedAnchor, existingAreaAnchors)) {
    return { accepted: false, reason: "semantic_duplicate" };
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
        domain: (packet as unknown as Record<string, unknown>).domain as string | undefined,
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
