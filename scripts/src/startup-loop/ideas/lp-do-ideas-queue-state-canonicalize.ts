import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { PersistedPacket, PersistedQueueState } from "./lp-do-ideas-persistence.js";

interface LegacyDispatch {
  dispatch_id: string;
  queue_state?: string;
  created_at?: string;
  business?: string;
  [key: string]: unknown;
}

interface LegacyQueueFile {
  dispatches?: LegacyDispatch[];
  last_updated?: string;
}

interface CanonicalizeOptions {
  rootDir: string;
  inputPath: string;
  outputPath: string;
  business: string;
  mode: "trial" | "live";
  write: boolean;
}

interface CanonicalizeResult {
  ok: boolean;
  source_format: "legacy_dispatches" | "canonical_entries" | "unknown";
  input_dispatches: number;
  output_entries: number;
  state_map_counts: Record<string, number>;
  warnings: string[];
  output_path?: string;
  error?: string;
}

function parseArgs(argv: string[]): CanonicalizeOptions {
  const flags = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token?.startsWith("--")) continue;
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) continue;
    flags.set(token.slice(2), value);
    i += 1;
  }

  const write = argv.includes("--write");

  const defaultRootDir = process.cwd().endsWith(`${path.sep}scripts`)
    ? path.resolve(process.cwd(), "..")
    : process.cwd();
  const rootDir = flags.get("root-dir") ?? defaultRootDir;
  const inputRel =
    flags.get("input") ??
    path.join("docs", "business-os", "startup-loop", "ideas", "trial", "queue-state.json");
  const outputRel =
    flags.get("output") ??
    path.join(
      "docs",
      "business-os",
      "startup-loop",
      "ideas",
      "trial",
      "queue-state.canonical.v1.json",
    );

  return {
    rootDir,
    inputPath: path.isAbsolute(inputRel) ? inputRel : path.join(rootDir, inputRel),
    outputPath: path.isAbsolute(outputRel) ? outputRel : path.join(rootDir, outputRel),
    business: flags.get("business") ?? "BOS",
    mode: flags.get("mode") === "live" ? "live" : "trial",
    write,
  };
}

function mapQueueState(raw: string | undefined): "enqueued" | "processed" | "skipped" | "error" {
  switch (raw) {
    case "enqueued":
      return "enqueued";
    case "processed":
    case "completed":
    case "auto_executed":
      return "processed";
    case "skipped":
      return "skipped";
    case "error":
      return "error";
    default:
      return "error";
  }
}

function fromLegacy(
  legacy: LegacyQueueFile,
  options: CanonicalizeOptions,
): { state: PersistedQueueState; stateMapCounts: Record<string, number> } {
  const stateMapCounts: Record<string, number> = {
    enqueued: 0,
    processed: 0,
    skipped: 0,
    error: 0,
  };

  const entries = (legacy.dispatches ?? []).map((dispatch) => {
    const mapped = mapQueueState(dispatch.queue_state);
    stateMapCounts[mapped] += 1;
    return {
      dispatch_id: dispatch.dispatch_id,
      queue_state: mapped,
      dispatched_at: dispatch.created_at ?? new Date().toISOString(),
      packet: dispatch as unknown as PersistedPacket,
    };
  });

  return {
    state: {
      schema_version: "queue-state.v1",
      mode: options.mode,
      business: options.business,
      generated_at: new Date().toISOString(),
      entries,
    },
    stateMapCounts,
  };
}

export function canonicalizeQueueState(options: CanonicalizeOptions): CanonicalizeResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(options.inputPath, "utf-8"));
  } catch (error) {
    return {
      ok: false,
      source_format: "unknown",
      input_dispatches: 0,
      output_entries: 0,
      state_map_counts: {},
      warnings: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const warnings: string[] = [];

  if (
    typeof parsed === "object" &&
    parsed !== null &&
    (parsed as { schema_version?: string }).schema_version === "queue-state.v1" &&
    Array.isArray((parsed as { entries?: unknown[] }).entries)
  ) {
    const canonical = parsed as PersistedQueueState;
    if (options.write) {
      mkdirSync(path.dirname(options.outputPath), { recursive: true });
      writeFileSync(options.outputPath, `${JSON.stringify(canonical, null, 2)}\n`, "utf-8");
    }

    return {
      ok: true,
      source_format: "canonical_entries",
      input_dispatches: canonical.entries.length,
      output_entries: canonical.entries.length,
      state_map_counts: {
        enqueued: canonical.entries.filter((entry) => entry.queue_state === "enqueued").length,
        processed: canonical.entries.filter((entry) => entry.queue_state === "processed").length,
        skipped: canonical.entries.filter((entry) => entry.queue_state === "skipped").length,
        error: canonical.entries.filter((entry) => entry.queue_state === "error").length,
      },
      warnings,
      ...(options.write ? { output_path: options.outputPath } : {}),
    };
  }

  if (
    typeof parsed === "object" &&
    parsed !== null &&
    Array.isArray((parsed as LegacyQueueFile).dispatches)
  ) {
    const { state, stateMapCounts } = fromLegacy(parsed as LegacyQueueFile, options);
    warnings.push(
      "Converted legacy dispatches[] format to canonical queue-state.v1 entries[]. Legacy-only fields are retained inside packet payloads.",
    );

    if (options.write) {
      mkdirSync(path.dirname(options.outputPath), { recursive: true });
      writeFileSync(options.outputPath, `${JSON.stringify(state, null, 2)}\n`, "utf-8");
    }

    return {
      ok: true,
      source_format: "legacy_dispatches",
      input_dispatches: (parsed as LegacyQueueFile).dispatches?.length ?? 0,
      output_entries: state.entries.length,
      state_map_counts: stateMapCounts,
      warnings,
      ...(options.write ? { output_path: options.outputPath } : {}),
    };
  }

  return {
    ok: false,
    source_format: "unknown",
    input_dispatches: 0,
    output_entries: 0,
    state_map_counts: {},
    warnings,
    error: "Unsupported queue-state input shape.",
  };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const result = canonicalizeQueueState(args);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1]?.includes("lp-do-ideas-queue-state-canonicalize")) {
  main();
}
