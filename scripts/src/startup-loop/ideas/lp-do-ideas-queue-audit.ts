import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type MissingArtifactEntry = {
  dispatch_id: string;
  fact_find_path: string;
  queue_state: string | undefined;
};

type QueueDispatchRecord = {
  dispatch_id?: unknown;
  queue_state?: unknown;
  processed_by?: unknown;
};

type QueueStateRecord = Record<string, unknown> & {
  dispatches?: unknown;
};

function topLevelKeysLabel(parsed: unknown): string {
  if (typeof parsed !== "object" || parsed === null) {
    return "(non-object JSON)";
  }

  const keys = Object.keys(parsed);
  return keys.length > 0 ? keys.join(", ") : "(none)";
}

export function detectMissingArtifacts(options: {
  queueStatePath: string;
  basedir: string;
  existsSync?: (path: string) => boolean;
  readFileSyncFn?: (path: string, encoding: BufferEncoding) => string;
}): MissingArtifactEntry[] {
  const {
    queueStatePath,
    basedir,
    existsSync: existsSyncFn = existsSync,
    readFileSyncFn = readFileSync,
  } = options;

  let queueStateRaw: string;
  try {
    queueStateRaw = readFileSyncFn(queueStatePath, "utf-8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to read queue-state.json at "${queueStatePath}": ${message}`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(queueStateRaw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to parse queue-state.json at "${queueStatePath}": ${message}`,
    );
  }

  const queueState = parsed as QueueStateRecord;
  if (!Array.isArray(queueState.dispatches)) {
    throw new Error(
      `Invalid queue-state.json: expected top-level "dispatches" array (queue.v1 format). Got: ${topLevelKeysLabel(parsed)}.`,
    );
  }

  const missing: MissingArtifactEntry[] = [];
  for (const dispatch of queueState.dispatches as QueueDispatchRecord[]) {
    if (typeof dispatch !== "object" || dispatch === null) {
      continue;
    }

    if (typeof dispatch.processed_by !== "object" || dispatch.processed_by === null) {
      continue;
    }

    const processedBy = dispatch.processed_by as Record<string, unknown>;
    const factFindPathRaw = processedBy.fact_find_path;
    if (typeof factFindPathRaw !== "string" || factFindPathRaw.trim() === "") {
      continue;
    }

    const resolvedFactFindPath = join(basedir, factFindPathRaw);
    if (existsSyncFn(resolvedFactFindPath)) {
      continue;
    }

    missing.push({
      dispatch_id:
        typeof dispatch.dispatch_id === "string" ? dispatch.dispatch_id : "",
      fact_find_path: factFindPathRaw,
      queue_state:
        typeof dispatch.queue_state === "string" ? dispatch.queue_state : undefined,
    });
  }

  return missing;
}
