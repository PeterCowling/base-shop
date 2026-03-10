import type { PersistedTelemetryRecord } from "./lp-do-ideas-persistence.js";
import { appendTelemetry } from "./lp-do-ideas-persistence.js";
import {
  atomicWriteQueueState,
  buildCounts,
  type QueueFileShape,
  readQueueStateFile,
} from "./lp-do-ideas-queue-state-file.js";

export interface EnqueueQueueDispatchesOptions<
  TPacket extends {
    dispatch_id: string;
    business: string;
    cluster_key: string;
    cluster_fingerprint: string;
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

  const appendedPackets: Array<{
    dispatch_id: string;
    business: string;
    cluster_key: string;
    cluster_fingerprint: string;
  }> = [];
  let suppressed = 0;

  for (const packet of options.packets) {
    const clusterKey = `${packet.cluster_key}:${packet.cluster_fingerprint}`;
    if (seenDispatchIds.has(packet.dispatch_id) || seenClusters.has(clusterKey)) {
      suppressed += 1;
      continue;
    }
    queue.dispatches.push(packet as QueueFileShape["dispatches"][number]);
    seenDispatchIds.add(packet.dispatch_id);
    seenClusters.add(clusterKey);
    appendedPackets.push(packet);
  }

  if (appendedPackets.length === 0) {
    return { appended: 0, suppressed };
  }

  const nowIso = (options.clock ? options.clock() : new Date()).toISOString();
  queue.last_updated = nowIso;
  queue.counts = buildCounts(queue.dispatches);

  const writeResult = atomicWriteQueueState(options.queueStatePath, queue);
  if (!writeResult.ok) {
    throw new Error(
      `Failed to write queue state at ${options.queueStatePath}: ${writeResult.error}`,
    );
  }

  const telemetryRecords: PersistedTelemetryRecord[] = appendedPackets.map((packet) => ({
    recorded_at: nowIso,
    dispatch_id: packet.dispatch_id,
    mode: "trial",
    business: packet.business,
    queue_state: "enqueued",
    kind: "enqueued",
    reason: options.telemetryReason,
  }));
  appendTelemetry(options.telemetryPath, telemetryRecords);

  return {
    appended: appendedPackets.length,
    suppressed,
  };
}
