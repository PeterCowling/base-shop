/**
 * lp-do-ideas live orchestrator.
 *
 * Ingests standing-artifact delta events and emits dispatch.v1 packets
 * with mode="live". Operates in mode="live" only — rejects mode="trial"
 * and all other modes fail-closed.
 *
 * Does NOT mutate startup-loop stage state. Advisory-only in v1 live mode.
 *
 * Implementation delegates to the trial orchestrator core computation engine,
 * then re-tags dispatched packets as mode="live". This ensures live routing
 * reuses the same anti-loop, deduplication, and cutover-phase logic as trial.
 *
 * Contract: docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md
 * Seam:     docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-seam.md
 * Schema:   docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json
 */

import {
  runTrialOrchestrator,
  type ShadowTelemetrySnapshot,
  type TrialDispatchPacket,
  type TrialOrchestratorOptions,
} from "./lp-do-ideas-trial.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A dispatch packet emitted in live mode.
 * Identical to TrialDispatchPacket except mode is always "live".
 */
export type LiveDispatchPacket = Omit<TrialDispatchPacket, "mode"> & {
  mode: "live";
};

/**
 * Options for the live orchestrator.
 * Same shape as TrialOrchestratorOptions — mode must be "live".
 */
export type LiveOrchestratorOptions = TrialOrchestratorOptions;

export interface LiveOrchestratorResult {
  ok: true;
  dispatched: LiveDispatchPacket[];
  suppressed: number;
  noop: number;
  warnings: string[];
  shadow_telemetry: ShadowTelemetrySnapshot;
}

export interface LiveOrchestratorError {
  ok: false;
  error: string;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Runs the lp-do-ideas live orchestrator.
 *
 * Pure function — no file I/O. Queue/telemetry writes are handled by
 * the persistence adapter (lp-do-ideas-live-hook.ts).
 *
 * Returns LiveDispatchPacket[] with mode="live" on success.
 * Returns a fail-closed error if mode is not "live".
 */
export function runLiveOrchestrator(
  options: LiveOrchestratorOptions,
): LiveOrchestratorResult | LiveOrchestratorError {
  if (options.mode !== "live") {
    return {
      ok: false,
      error:
        `[lp-do-ideas-live] mode "${options.mode}" is not permitted in this module. ` +
        `Only mode="live" is supported. Use lp-do-ideas-trial.ts for mode="trial".`,
    };
  }

  // Delegate to the trial orchestrator core (passing mode: "trial" internally
  // to satisfy its mode guard). The live module owns its own mode validation;
  // the trial orchestrator is used as a pure computation engine.
  const trialResult = runTrialOrchestrator({ ...options, mode: "trial" });

  if (!trialResult.ok) {
    return { ok: false, error: trialResult.error };
  }

  // Re-tag all dispatched packets as mode="live".
  const liveDispatched: LiveDispatchPacket[] = trialResult.dispatched.map(
    (packet) => ({ ...packet, mode: "live" as const }),
  );

  return {
    ok: true,
    dispatched: liveDispatched,
    suppressed: trialResult.suppressed,
    noop: trialResult.noop,
    warnings: trialResult.warnings,
    shadow_telemetry: trialResult.shadow_telemetry,
  };
}
