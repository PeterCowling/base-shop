/**
 * lp-do-ideas live hook for SIGNALS advisory intake.
 *
 * Standalone advisory CLI module. Reads the standing registry from disk, runs
 * the live orchestrator with the provided events, and returns a result.
 *
 * Advisory posture: all errors are returned as result fields — never thrown.
 * SIGNALS advance is never blocked by hook errors.
 *
 * Persistence (queue-state, telemetry) paths are accepted as options but writes
 * are delegated to the persistence adapter (lp-do-ideas-persistence.ts).
 * This module performs NO file writes in its pure `runLiveHook` export.
 *
 * CLI invocation:
 *   node --import tsx scripts/src/startup-loop/lp-do-ideas-live-hook.ts \
 *     --business <BUSINESS> \
 *     --registry-path <path> \
 *     --queue-state-path <path> \
 *     --telemetry-path <path> \
 *     [--events-path <path>]
 *
 * Exit code: always 0 (advisory — hook failure must not block SIGNALS advance).
 *
 * Contract:  docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md
 * Seam:      docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-seam.md
 * Boundary:  docs/plans/lp-do-ideas-live-autonomous-activation/artifacts/live-hook-boundary-decision.md
 */

import { readFileSync } from "node:fs";

import type { LiveDispatchPacket, LiveOrchestratorOptions } from "./lp-do-ideas-live.js";
import { runLiveOrchestrator } from "./lp-do-ideas-live.js";
import type { RegistryV2ArtifactEntry } from "./lp-do-ideas-registry-migrate-v1-v2.js";
import type { ArtifactDeltaEvent } from "./lp-do-ideas-trial.js";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Options for the live advisory hook. */
export interface LiveHookOptions {
  /** Business identifier (e.g. "BRIK", "HBAG"). Used in log messages. */
  business: string;
  /** Path to the standing registry JSON file (required). */
  registryPath: string;
  /**
   * Path for queue-state output.
   * Accepted but not written by this module (persistence is in TASK-04).
   */
  queueStatePath: string;
  /**
   * Path for telemetry JSONL output.
   * Accepted but not written by this module (persistence is in TASK-04).
   */
  telemetryPath: string;
  /**
   * Artifact delta events to process.
   * If omitted or empty, the orchestrator runs in noop mode (no dispatches).
   */
  events?: ArtifactDeltaEvent[];
  /** Injectable clock for deterministic tests. */
  clock?: () => Date;
}

/** Result returned by the live advisory hook. */
export interface LiveHookResult {
  /** True when the hook ran without errors. */
  ok: boolean;
  /** Dispatch packets emitted by the orchestrator. Empty on error. */
  dispatched: LiveDispatchPacket[];
  /** Number of events suppressed by loop-guard logic. */
  suppressed: number;
  /** Number of events that produced no dispatch (noop). */
  noop: number;
  /** Non-fatal warnings accumulated during the run. */
  warnings: string[];
  /**
   * Present when ok is false. Machine-readable error description.
   * SIGNALS callers MUST NOT throw on presence of this field.
   */
  error?: string;
}

// ---------------------------------------------------------------------------
// Registry loading
// ---------------------------------------------------------------------------

interface RegistryJson {
  artifacts: RegistryV2ArtifactEntry[];
}

/**
 * Loads and validates a standing registry JSON file from disk.
 * Returns the registry on success, or an error object.
 */
function loadRegistryFromDisk(
  registryPath: string,
): RegistryJson | { error: string } {
  let raw: string;
  try {
    raw = readFileSync(registryPath, "utf-8");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      error: `[live-hook] Failed to read registry at "${registryPath}": ${message}`,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      error: `[live-hook] Registry at "${registryPath}" is not valid JSON: ${message}`,
    };
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as Record<string, unknown>).artifacts)
  ) {
    return {
      error:
        `[live-hook] Registry at "${registryPath}" must have an "artifacts" array at the root. ` +
        `Got: ${typeof parsed === "object" ? JSON.stringify(Object.keys(parsed as object)) : typeof parsed}`,
    };
  }

  return parsed as RegistryJson;
}

// ---------------------------------------------------------------------------
// Main export: runLiveHook
// ---------------------------------------------------------------------------

/**
 * Runs the lp-do-ideas live advisory hook.
 *
 * Pure advisory function: reads registry from disk, delegates to
 * `runLiveOrchestrator`, and returns a result. No file writes are performed.
 *
 * All errors are caught and returned in the result — this function never
 * throws. SIGNALS advance must never be blocked by hook exceptions.
 */
export async function runLiveHook(
  options: LiveHookOptions,
): Promise<LiveHookResult> {
  const { business, registryPath, events = [], clock } = options;

  // Load standing registry from disk
  const registryResult = loadRegistryFromDisk(registryPath);
  if ("error" in registryResult) {
    return {
      ok: false,
      dispatched: [],
      suppressed: 0,
      noop: 0,
      warnings: [registryResult.error],
      error: registryResult.error,
    };
  }

  // Invoke the live orchestrator (pure — no I/O)
  let orchestratorResult;
  try {
    const orchestratorOptions: LiveOrchestratorOptions = {
      mode: "live",
      events,
      standingRegistry: registryResult,
      clock,
    };
    orchestratorResult = runLiveOrchestrator(orchestratorOptions);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : `non-Error thrown: ${String(err)}`;
    const warning = `[live-hook] Orchestrator threw unexpectedly for business "${business}": ${message}`;
    return {
      ok: false,
      dispatched: [],
      suppressed: 0,
      noop: 0,
      warnings: [warning],
      error: message,
    };
  }

  if (!orchestratorResult.ok) {
    const warning = `[live-hook] Orchestrator returned error for business "${business}": ${orchestratorResult.error}`;
    return {
      ok: false,
      dispatched: [],
      suppressed: 0,
      noop: 0,
      warnings: [warning],
      error: orchestratorResult.error,
    };
  }

  return {
    ok: true,
    dispatched: orchestratorResult.dispatched,
    suppressed: orchestratorResult.suppressed,
    noop: orchestratorResult.noop,
    warnings: orchestratorResult.warnings,
  };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

function parseCliArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const current = argv[i];
    if (current.startsWith("--") && i + 1 < argv.length) {
      const key = current.slice(2).replace(/-([a-z])/g, (_, c: string) =>
        c.toUpperCase(),
      );
      args[key] = argv[i + 1];
      i++;
    }
  }
  return args;
}

const isMain =
  process.argv[1] != null &&
  (process.argv[1].endsWith("lp-do-ideas-live-hook.ts") ||
    process.argv[1].endsWith("lp-do-ideas-live-hook.js"));

if (isMain) {
  const args = parseCliArgs(process.argv.slice(2));
  const { business, registryPath, queueStatePath, telemetryPath } = args;

  if (!business || !registryPath || !queueStatePath || !telemetryPath) {
    process.stderr.write(
      JSON.stringify({
        ok: false,
        error:
          "Missing required args: --business, --registry-path, --queue-state-path, --telemetry-path",
      }) + "\n",
    );
    process.exit(0); // advisory: always exit 0
  }

  runLiveHook({ business, registryPath, queueStatePath, telemetryPath })
    .then((result) => {
      process.stderr.write(
        JSON.stringify({
          ok: result.ok,
          business,
          dispatched_count: result.dispatched.length,
          suppressed: result.suppressed,
          noop: result.noop,
          warnings: result.warnings,
          ...(result.error != null ? { error: result.error } : {}),
        }) + "\n",
      );
      process.exit(0); // advisory: always exit 0
    })
    .catch((err: unknown) => {
      // Should never reach here — runLiveHook catches all errors internally
      const message =
        err instanceof Error ? err.message : `non-Error: ${String(err)}`;
      process.stderr.write(
        JSON.stringify({ ok: false, error: `fatal: ${message}` }) + "\n",
      );
      process.exit(0); // advisory: always exit 0
    });
}
