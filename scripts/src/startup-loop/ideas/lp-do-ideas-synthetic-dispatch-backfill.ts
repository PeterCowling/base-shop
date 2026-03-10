import path from "node:path";

import {
  atomicWriteQueueState,
  buildCounts,
  type QueueDispatch,
  readQueueStateFile,
} from "./lp-do-ideas-queue-state-file.js";
import { backfillSyntheticDispatch } from "./lp-do-ideas-synthetic-dispatch-narrative.js";

interface BackfillOptions {
  rootDir: string;
  queueStatePath: string;
  transcriptsRoot?: string;
  write: boolean;
}

interface BackfillResult {
  ok: boolean;
  queue_state_path: string;
  dispatches_scanned: number;
  synthetic_dispatches_seen: number;
  dispatches_updated: number;
  fields_updated: Record<string, number>;
  writes_applied: boolean;
  error?: string;
}

function parseArgs(argv: string[]): BackfillOptions {
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
    queueStatePath:
      flags.get("queue-state-path") ??
      "docs/business-os/startup-loop/ideas/trial/queue-state.json",
    transcriptsRoot: flags.get("transcripts-root"),
    write: argv.includes("--write"),
  };
}

export function runSyntheticDispatchBackfill(options: BackfillOptions): BackfillResult {
  const queue = readQueueStateFile(options.queueStatePath);
  if (!queue.ok) {
    return {
      ok: false,
      queue_state_path: options.queueStatePath,
      dispatches_scanned: 0,
      synthetic_dispatches_seen: 0,
      dispatches_updated: 0,
      fields_updated: {},
      writes_applied: false,
      error:
        queue.error ??
        `Unable to read queue state (${queue.reason}) at ${options.queueStatePath}.`,
    };
  }

  let syntheticDispatchesSeen = 0;
  let dispatchesUpdated = 0;
  const fieldsUpdated: Record<string, number> = {};
  const nextDispatches = queue.queue.dispatches.map((dispatch) => {
    const result = backfillSyntheticDispatch(dispatch as QueueDispatch, {
      rootDir: options.rootDir,
      transcriptsRoot: options.transcriptsRoot,
    });
    if (!result.narrative) {
      return dispatch;
    }

    syntheticDispatchesSeen += 1;
    if (!result.changed) {
      return dispatch;
    }

    dispatchesUpdated += 1;
    for (const field of result.changed_fields) {
      fieldsUpdated[field] = (fieldsUpdated[field] ?? 0) + 1;
    }
    return result.dispatch;
  });

  if (options.write && dispatchesUpdated > 0) {
    const writeResult = atomicWriteQueueState(options.queueStatePath, {
      ...queue.queue,
      last_updated: new Date().toISOString(),
      dispatches: nextDispatches,
      counts: buildCounts(nextDispatches),
    });
    if (!writeResult.ok) {
      return {
        ok: false,
        queue_state_path: options.queueStatePath,
        dispatches_scanned: queue.queue.dispatches.length,
        synthetic_dispatches_seen: syntheticDispatchesSeen,
        dispatches_updated: dispatchesUpdated,
        fields_updated: fieldsUpdated,
        writes_applied: false,
        error: writeResult.error,
      };
    }
  }

  return {
    ok: true,
    queue_state_path: options.queueStatePath,
    dispatches_scanned: queue.queue.dispatches.length,
    synthetic_dispatches_seen: syntheticDispatchesSeen,
    dispatches_updated: dispatchesUpdated,
    fields_updated: fieldsUpdated,
    writes_applied: options.write && dispatchesUpdated > 0,
  };
}

function main(): void {
  const result = runSyntheticDispatchBackfill(parseArgs(process.argv.slice(2)));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) {
    process.exitCode = 1;
  }
}

if (process.argv[1]?.includes("lp-do-ideas-synthetic-dispatch-backfill")) {
  main();
}

