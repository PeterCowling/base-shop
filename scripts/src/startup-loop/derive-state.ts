/**
 * Deterministic state derivation from event ledger (LPSP-04A).
 *
 * Replays events from events.jsonl to produce a deterministic derived
 * state (state.json). The derivation is pure: same events → same state.
 *
 * @see docs/business-os/startup-loop/event-state-schema.md
 */

import stageOperatorMap from "../../../docs/business-os/startup-loop/_generated/stage-operator-map.json";

// -- Types --

export interface RunEvent {
  schema_version: number;
  event: "stage_started" | "stage_completed" | "stage_blocked" | "run_aborted";
  run_id: string;
  stage: string;
  timestamp: string;
  loop_spec_version: string;
  artifacts: Record<string, string> | null;
  blocking_reason: string | null;
}

export interface StageState {
  name: string;
  status: "Pending" | "Active" | "Done" | "Blocked";
  timestamp: string | null;
  artifacts: string[] | null;
  blocking_reason: string | null;
}

export interface DerivedState {
  schema_version: number;
  business: string;
  run_id: string;
  loop_spec_version: string;
  active_stage: string | null;
  stages: Record<string, StageState>;
}

export interface DeriveStateOptions {
  business: string;
  run_id: string;
  loop_spec_version: string;
}

// -- Stage name map (sourced from generated stage-operator-map) --
// Canonical source: docs/business-os/startup-loop/_generated/stage-operator-map.json
// Re-generate with: node --import tsx scripts/src/startup-loop/generate-stage-operator-views.ts

const STAGE_NAMES: Record<string, string> = Object.fromEntries(
  stageOperatorMap.stages.map((s) => [s.id, s.label_operator_short]),
);

/** All stage IDs, sorted alphabetically for deterministic output. */
const ALL_STAGE_IDS = Object.keys(STAGE_NAMES).sort();

// -- Derivation --

/**
 * Derive run state from an event stream.
 *
 * Pure function: same events + options → identical output.
 * No I/O — caller is responsible for reading/writing files.
 */
export function deriveState(
  events: RunEvent[],
  options: DeriveStateOptions,
): DerivedState {
  // Initialize all stages as Pending
  const stages: Record<string, StageState> = {};
  for (const stageId of ALL_STAGE_IDS) {
    stages[stageId] = {
      name: STAGE_NAMES[stageId],
      status: "Pending",
      timestamp: null,
      artifacts: null,
      blocking_reason: null,
    };
  }

  let activeStage: string | null = null;

  // Replay events in order
  for (const event of events) {
    // Run-level events use stage: "*" which is not a valid stage ID.
    // Handle them before the stage lookup guard to avoid being skipped.
    if (event.event === "run_aborted") {
      activeStage = null;
      continue;
    }

    const stage = stages[event.stage];
    if (!stage) continue; // Unknown stage — skip

    switch (event.event) {
      case "stage_started":
        stage.status = "Active";
        stage.timestamp = event.timestamp;
        stage.blocking_reason = null; // Clear on resume
        activeStage = event.stage;
        break;

      case "stage_completed":
        stage.status = "Done";
        stage.timestamp = event.timestamp;
        stage.artifacts = event.artifacts
          ? Object.values(event.artifacts).sort()
          : [];
        stage.blocking_reason = null;
        break;

      case "stage_blocked":
        stage.status = "Blocked";
        stage.timestamp = event.timestamp;
        stage.blocking_reason = event.blocking_reason;
        break;
    }
  }

  return {
    schema_version: 1,
    business: options.business,
    run_id: options.run_id,
    loop_spec_version: options.loop_spec_version,
    active_stage: activeStage,
    stages,
  };
}
