import { describe, expect, it } from "@jest/globals";

import { type DerivedState, deriveState, type RunEvent } from "../derive-state";

/**
 * LPSP-04A: Event schema + derived state + deterministic derivation
 *
 * Tests cover:
 * - VC-04A-01: Happy-path derivation (7-stage event stream → correct statuses)
 * - VC-04A-02: Manual resume (stage_started for Blocked stage)
 * - VC-04A-03: Launch-QA contract (active_stage, per-stage status, artifacts)
 * - VC-04A-04: Deterministic replay (same events → byte-identical state)
 */

// -- Fixture helpers --

function makeEvent(overrides: Partial<RunEvent>): RunEvent {
  return {
    schema_version: 1,
    event: "stage_started",
    run_id: "SFS-TEST-20260213-1200",
    stage: "S0",
    timestamp: "2026-02-13T12:00:00Z",
    loop_spec_version: "1.0.0",
    artifacts: null,
    blocking_reason: null,
    ...overrides,
  };
}

const HAPPY_PATH_EVENTS: RunEvent[] = [
  // S0 → S2B → S3 (parallel) → S6B (parallel) → S4 → S5A → S5B
  makeEvent({ event: "stage_started", stage: "S0", timestamp: "2026-02-13T12:00:00Z" }),
  makeEvent({ event: "stage_completed", stage: "S0", timestamp: "2026-02-13T12:01:00Z", artifacts: {} }),
  makeEvent({ event: "stage_started", stage: "S2B", timestamp: "2026-02-13T12:01:30Z" }),
  makeEvent({ event: "stage_completed", stage: "S2B", timestamp: "2026-02-13T12:02:00Z", artifacts: { offer: "stages/S2B/offer.md" } }),
  makeEvent({ event: "stage_started", stage: "S3", timestamp: "2026-02-13T12:02:30Z" }),
  makeEvent({ event: "stage_started", stage: "S6B", timestamp: "2026-02-13T12:02:30Z" }),
  makeEvent({ event: "stage_completed", stage: "S3", timestamp: "2026-02-13T12:04:00Z", artifacts: { forecast: "stages/S3/forecast.md" } }),
  makeEvent({ event: "stage_completed", stage: "S6B", timestamp: "2026-02-13T12:05:00Z", artifacts: { channels: "stages/S6B/channels.md" } }),
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
  // (S0→S2B→S3→S6B→S4→S5A→S5B) → derivation produces expected stage statuses.
  describe("VC-04A-01: happy-path derivation", () => {
    it("derives correct statuses from a multi-stage event stream", () => {
      const state = deriveState(HAPPY_PATH_EVENTS, STATE_OPTIONS);

      expect(state.stages.S0.status).toBe("Done");
      expect(state.stages.S2B.status).toBe("Done");
      expect(state.stages.S3.status).toBe("Done");
      expect(state.stages.S6B.status).toBe("Done");
      expect(state.stages.S4.status).toBe("Done");
      expect(state.stages.S5A.status).toBe("Done");
      expect(state.stages.S5B.status).toBe("Done");

      // Stages not in the event stream remain Pending
      expect(state.stages.S6.status).toBe("Pending");
      expect(state.stages.S7.status).toBe("Pending");
      expect(state.stages.S10.status).toBe("Pending");
    });

    it("sets active_stage to the most recently started stage", () => {
      const state = deriveState(HAPPY_PATH_EVENTS, STATE_OPTIONS);
      // S5B was the last stage_started event
      expect(state.active_stage).toBe("S5B");
    });

    it("records artifact paths on completed stages", () => {
      const state = deriveState(HAPPY_PATH_EVENTS, STATE_OPTIONS);

      expect(state.stages.S2B.artifacts).toEqual(["stages/S2B/offer.md"]);
      expect(state.stages.S3.artifacts).toEqual(["stages/S3/forecast.md"]);
      expect(state.stages.S6B.artifacts).toEqual(["stages/S6B/channels.md"]);
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

    it("includes all 22 stages from loop-spec", () => {
      const state = deriveState([], STATE_OPTIONS);
      const stageIds = Object.keys(state.stages);
      expect(stageIds).toHaveLength(22);
      expect(stageIds).toContain("S0");
      expect(stageIds).toContain("S0A");
      expect(stageIds).toContain("S0B");
      expect(stageIds).toContain("S0C");
      expect(stageIds).toContain("S0D");
      expect(stageIds).toContain("S3B");
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
});
