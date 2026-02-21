/**
 * Recovery automation — resume/restart/abort decision tree (LPSP-04B).
 *
 * Generates recovery events for operator-driven run recovery. Recovery
 * events are standard events that the existing derive-state function
 * handles natively (stage_started for resume, run_aborted for abort).
 *
 * Key design principles:
 * - No hidden cleanup: partial artifacts remain on disk for forensics.
 * - Recovery actions are recorded as explicit events in events.jsonl.
 * - Decision tree is deterministic: same state → same recommendation.
 *
 * @see docs/business-os/startup-loop/event-state-schema.md
 * @see docs/business-os/startup-loop/autonomy-policy.md
 */

import type { DerivedState,RunEvent } from "./derive-state";

// -- Types --

export interface RecoveryContext {
  operator: string;
  reason: string;
  run_id: string;
  loop_spec_version: string;
}

export interface RecoveryDecision {
  action: "resume" | "restart" | "abort" | "no-action";
  targetStage: string;
  reason: string;
}

// -- Resume --

/**
 * Create events to resume a blocked/failed stage.
 *
 * Generates a `stage_started` event for the target stage. When appended
 * to events.jsonl and re-derived, this transitions the stage from
 * Blocked → Active (clearing blocking_reason).
 */
export function createResumeEvents(
  targetStage: string,
  context: RecoveryContext,
): RunEvent[] {
  return [
    {
      schema_version: 1,
      event: "stage_started",
      run_id: context.run_id,
      stage: targetStage,
      timestamp: new Date().toISOString(),
      loop_spec_version: context.loop_spec_version,
      artifacts: null,
      blocking_reason: null,
    },
  ];
}

// -- Abort --

/**
 * Create an abort event for the entire run.
 *
 * Records the operator decision to abandon the run. Does NOT delete
 * any artifacts — partial results remain on disk for forensics.
 *
 * The `stage: "*"` convention indicates a run-level event (not stage-specific).
 */
export function createAbortEvent(
  context: RecoveryContext,
): RunEvent {
  return {
    schema_version: 1,
    event: "run_aborted" as RunEvent["event"],
    run_id: context.run_id,
    stage: "*",
    timestamp: new Date().toISOString(),
    loop_spec_version: context.loop_spec_version,
    artifacts: null,
    blocking_reason: `Aborted by ${context.operator}: ${context.reason}`,
  };
}

// -- Decision Tree --

/**
 * Deterministic recovery decision tree.
 *
 * Given current derived state and a target stage, recommends the
 * appropriate recovery action.
 *
 * Decision logic:
 * - Done → no-action (already complete)
 * - Blocked → resume (re-emit stage_started)
 * - Active → resume (may have stalled; re-emit stage_started)
 * - Pending → restart (stage never started; need to start from beginning)
 */
export function recoveryDecision(
  state: DerivedState,
  targetStage: string,
): RecoveryDecision {
  const stageState = state.stages[targetStage];

  if (!stageState) {
    return {
      action: "no-action",
      targetStage,
      reason: `Unknown stage '${targetStage}' — not in loop-spec`,
    };
  }

  switch (stageState.status) {
    case "Done":
      return {
        action: "no-action",
        targetStage,
        reason: `Stage ${targetStage} is already complete — no recovery needed`,
      };

    case "Blocked":
      return {
        action: "resume",
        targetStage,
        reason: `Stage ${targetStage} is Blocked (${stageState.blocking_reason ?? "unknown reason"}) — resume will re-start the stage`,
      };

    case "Active":
      return {
        action: "resume",
        targetStage,
        reason: `Stage ${targetStage} is Active but may be stalled — resume will re-emit stage_started`,
      };

    case "Pending":
      return {
        action: "restart",
        targetStage,
        reason: `Stage ${targetStage} was never started — restart the run from this stage`,
      };

    default:
      return {
        action: "no-action",
        targetStage,
        reason: `Unexpected status '${stageState.status}' for stage ${targetStage}`,
      };
  }
}
