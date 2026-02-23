import { describe, expect, it } from "@jest/globals";

import { type DerivedState, deriveState, type RunEvent } from "../derive-state";
import stageOperatorMap from "../../../../docs/business-os/startup-loop/_generated/stage-operator-map.json";

/**
 * LPSP-04A: Event schema + derived state + deterministic derivation
 *
 * Tests cover:
 * - VC-04A-01: Happy-path derivation (7-stage event stream → correct statuses)
 * - VC-04A-02: Manual resume (stage_started for Blocked stage)
 * - VC-04A-03: Launch-QA contract (active_stage, per-stage status, artifacts)
 * - VC-04A-04: Deterministic replay (same events → byte-identical state)
 * - VC-04A-05: run_aborted handling — clears active_stage, preserves stage statuses (TASK-06)
 */

// -- Fixture helpers --

function makeEvent(overrides: Partial<RunEvent>): RunEvent {
  return {
    schema_version: 1,
    event: "stage_started",
    run_id: "SFS-TEST-20260213-1200",
    stage: "ASSESSMENT-09",
    timestamp: "2026-02-13T12:00:00Z",
    loop_spec_version: "1.0.0",
    artifacts: null,
    blocking_reason: null,
    ...overrides,
  };
}

const HAPPY_PATH_EVENTS: RunEvent[] = [
  // ASSESSMENT-09 → MARKET-06 → S3 (parallel) → SELL-01 (parallel) → S4 → S5A → S5B
  makeEvent({ event: "stage_started", stage: "ASSESSMENT-09", timestamp: "2026-02-13T12:00:00Z" }),
  makeEvent({ event: "stage_completed", stage: "ASSESSMENT-09", timestamp: "2026-02-13T12:01:00Z", artifacts: {} }),
  makeEvent({ event: "stage_started", stage: "MARKET-06", timestamp: "2026-02-13T12:01:30Z" }),
  makeEvent({
    event: "stage_completed",
    stage: "MARKET-06",
    timestamp: "2026-02-13T12:02:00Z",
    artifacts: { offer: "stages/MARKET-06/offer.md" },
  }),
  makeEvent({ event: "stage_started", stage: "S3", timestamp: "2026-02-13T12:02:30Z" }),
  makeEvent({ event: "stage_started", stage: "SELL-01", timestamp: "2026-02-13T12:02:30Z" }),
  makeEvent({ event: "stage_completed", stage: "S3", timestamp: "2026-02-13T12:04:00Z", artifacts: { forecast: "stages/S3/forecast.md" } }),
  makeEvent({
    event: "stage_completed",
    stage: "SELL-01",
    timestamp: "2026-02-13T12:05:00Z",
    artifacts: { channels: "stages/SELL-01/channels.md" },
  }),
  makeEvent({ event: "stage_started", stage: "S4", timestamp: "2026-02-13T12:05:30Z" }),
  makeEvent({ event: "stage_completed", stage: "S4", timestamp: "2026-02-13T12:06:00Z", artifacts: { baseline_snapshot: "stages/S4/baseline.snapshot.md" } }),
  makeEvent({ event: "stage_started", stage: "S5A", timestamp: "2026-02-13T12:06:30Z" }),
  makeEvent({ event: "stage_completed", stage: "S5A", timestamp: "2026-02-13T12:07:00Z", artifacts: { prioritized_items: "stages/S5A/prioritized-items.md" } }),
  makeEvent({ event: "stage_started", stage: "S5B", timestamp: "2026-02-13T12:07:30Z" }),
  makeEvent({ event: "stage_completed", stage: "S5B", timestamp: "2026-02-13T12:08:00Z", artifacts: {} }),
];

const STATE_OPTIONS = {
  business: "TEST",
  run_id: "SFS-TEST-20260213-1200",
  loop_spec_version: "1.0.0",
};

describe("deriveState", () => {
  // VC-04A-01: Happy-path derivation — given a valid event stream
  // (ASSESSMENT-09→MARKET-06→S3→SELL-01→S4→S5A→S5B) → derivation produces expected stage statuses.
  describe("VC-04A-01: happy-path derivation", () => {
    it("derives correct statuses from a multi-stage event stream", () => {
      const state = deriveState(HAPPY_PATH_EVENTS, STATE_OPTIONS);

      expect(state.stages["ASSESSMENT-09"].status).toBe("Done");
      expect(state.stages["MARKET-06"].status).toBe("Done");
      expect(state.stages.S3.status).toBe("Done");
      expect(state.stages["SELL-01"].status).toBe("Done");
      expect(state.stages.S4.status).toBe("Done");
      expect(state.stages.S5A.status).toBe("Done");
      expect(state.stages.S5B.status).toBe("Done");

      // Stages not in the event stream remain Pending
      expect(state.stages.S6.status).toBe("Pending");
      expect(state.stages.DO.status).toBe("Pending");
      expect(state.stages.S10.status).toBe("Pending");
    });

    it("sets active_stage to the most recently started stage", () => {
      const state = deriveState(HAPPY_PATH_EVENTS, STATE_OPTIONS);
      // S5B was the last stage_started event
      expect(state.active_stage).toBe("S5B");
    });

    it("records artifact paths on completed stages", () => {
      const state = deriveState(HAPPY_PATH_EVENTS, STATE_OPTIONS);

      expect(state.stages["MARKET-06"].artifacts).toEqual(["stages/MARKET-06/offer.md"]);
      expect(state.stages.S3.artifacts).toEqual(["stages/S3/forecast.md"]);
      expect(state.stages["SELL-01"].artifacts).toEqual(["stages/SELL-01/channels.md"]);
      expect(state.stages.S4.artifacts).toEqual(["stages/S4/baseline.snapshot.md"]);
    });
  });

  // VC-04A-02: Manual resume — inject stage_started event for a Blocked stage
  // → re-derive state → stage status updates to Active.
  describe("VC-04A-02: manual resume", () => {
    it("resumes a Blocked stage to Active via stage_started event", () => {
      const events: RunEvent[] = [
        makeEvent({ event: "stage_started", stage: "S4", timestamp: "2026-02-13T12:05:30Z" }),
        makeEvent({
          event: "stage_blocked",
          stage: "S4",
          timestamp: "2026-02-13T12:06:00Z",
          blocking_reason: "S3 stage-result.json not found",
        }),
        // Manual resume: operator adds stage_started
        makeEvent({ event: "stage_started", stage: "S4", timestamp: "2026-02-13T13:00:00Z" }),
      ];

      const state = deriveState(events, STATE_OPTIONS);

      expect(state.stages.S4.status).toBe("Active");
      expect(state.stages.S4.blocking_reason).toBeNull();
      expect(state.active_stage).toBe("S4");
    });
  });

  // VC-04A-03: Launch-QA contract — derived state includes all fields
  // expected by `/lp-launch-qa` (active_stage, per-stage status, artifacts).
  describe("VC-04A-03: launch-QA contract compatibility", () => {
    it("includes active_stage field", () => {
      const state = deriveState(HAPPY_PATH_EVENTS, STATE_OPTIONS);
      expect(state).toHaveProperty("active_stage");
      expect(typeof state.active_stage).toBe("string");
    });

    it("includes per-stage name, status, and artifacts", () => {
      const state = deriveState(HAPPY_PATH_EVENTS, STATE_OPTIONS);

      // Every stage has the required fields
      for (const [stageId, stageState] of Object.entries(state.stages)) {
        expect(stageState).toHaveProperty("name");
        expect(stageState).toHaveProperty("status");
        expect(typeof stageState.name).toBe("string");
        expect(stageState.name.length).toBeGreaterThan(0);
        expect(["Pending", "Active", "Done", "Blocked"]).toContain(stageState.status);
      }
    });

    it("includes all generated stages from stage-operator-map", () => {
      const state = deriveState([], STATE_OPTIONS);
      const stageIds = Object.keys(state.stages);
      expect(stageIds).toHaveLength(stageOperatorMap.stages.length);
      expect(stageIds).toContain("ASSESSMENT-09");
      expect(stageIds).toContain("ASSESSMENT-01");
      expect(stageIds).toContain("ASSESSMENT-02");
      expect(stageIds).toContain("ASSESSMENT-03");
      expect(stageIds).toContain("ASSESSMENT-04");
      expect(stageIds).toContain("ASSESSMENT-06");
      expect(stageIds).toContain("PRODUCT-02");
      expect(stageIds).toContain("MARKET-06");
      expect(stageIds).toContain("SELL-01");
      expect(stageIds).toContain("S10");
      expect(stageIds).toContain("S4");
      expect(stageIds).toContain("S5A");
      expect(stageIds).toContain("S5B");
    });
  });

  // VC-04A-04: Deterministic replay — replay identical event stream twice
  // → byte-identical derived state output.
  describe("VC-04A-04: deterministic replay", () => {
    it("produces identical state from identical events", () => {
      const state1 = deriveState(HAPPY_PATH_EVENTS, STATE_OPTIONS);
      const state2 = deriveState(HAPPY_PATH_EVENTS, STATE_OPTIONS);

      // Byte-identical JSON output
      const json1 = JSON.stringify(state1, null, 2);
      const json2 = JSON.stringify(state2, null, 2);
      expect(json1).toBe(json2);
    });

    it("sorts stage keys alphabetically", () => {
      const state = deriveState(HAPPY_PATH_EVENTS, STATE_OPTIONS);
      const stageKeys = Object.keys(state.stages);
      const sorted = [...stageKeys].sort();
      expect(stageKeys).toEqual(sorted);
    });
  });

  // VC-04A-05: run_aborted handling — run-level abort event clears active_stage
  // and does not revert completed stage statuses (TASK-06).
  describe("VC-04A-05: run_aborted handling", () => {
    it("clears active_stage on run_aborted event", () => {
      const events: RunEvent[] = [
        makeEvent({ event: "stage_started", stage: "ASSESSMENT-09", timestamp: "2026-02-13T12:00:00Z" }),
        makeEvent({ event: "run_aborted", stage: "*", timestamp: "2026-02-13T12:01:00Z" }),
      ];

      const state = deriveState(events, STATE_OPTIONS);

      expect(state.active_stage).toBeNull();
      // Stage status is not reverted by run_aborted
      expect(state.stages["ASSESSMENT-09"].status).toBe("Active");
    });

    it("preserves completed stage statuses on mid-run abort", () => {
      const events: RunEvent[] = [
        makeEvent({ event: "stage_started", stage: "ASSESSMENT-09", timestamp: "2026-02-13T12:00:00Z" }),
        makeEvent({ event: "stage_completed", stage: "ASSESSMENT-09", timestamp: "2026-02-13T12:01:00Z", artifacts: {} }),
        makeEvent({ event: "stage_started", stage: "MEASURE-01", timestamp: "2026-02-13T12:01:30Z" }),
        makeEvent({ event: "run_aborted", stage: "*", timestamp: "2026-02-13T12:02:00Z" }),
      ];

      const state = deriveState(events, STATE_OPTIONS);

      // active_stage cleared — run is terminated
      expect(state.active_stage).toBeNull();
      // Completed stages retain their Done status
      expect(state.stages["ASSESSMENT-09"].status).toBe("Done");
      // In-progress stage retains Active status; run_aborted does not revert stages
      expect(state.stages["MEASURE-01"].status).toBe("Active");
    });
  });
});
