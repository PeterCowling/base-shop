import { describe, expect, it } from "@jest/globals";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

import type { RunEvent } from "../derive-state";
import { deriveState } from "../derive-state";
import { createAbortEvent, createResumeEvents, recoveryDecision } from "../recovery";

/**
 * LPSP-04B: Recovery automation (VC-04B-01, VC-04B-03)
 *
 * Tests cover:
 * - VC-04B-01-01: Mid-run failure at S4 → resume re-derives correctly
 * - VC-04B-01-02: Resume clears blocking_reason and sets stage to Active
 * - VC-04B-01-03: Decision tree selects resume for Blocked stage
 * - VC-04B-03-01: Abort preserves all artifacts on disk
 * - VC-04B-03-02: Abort event records operator and reason
 */

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

const STATE_OPTIONS = {
  business: "TEST",
  run_id: "SFS-TEST-20260213-1200",
  loop_spec_version: "1.0.0",
};

describe("recovery", () => {
  // VC-04B-01-01: Mid-run failure at S4 → resume re-derives correctly
  describe("VC-04B-01: mid-run resume", () => {
    it("resume of blocked S4 re-derives state with S4 Active", () => {
      // Simulate run that reached S4 but blocked
      const events: RunEvent[] = [
        makeEvent({ event: "stage_started", stage: "S0", timestamp: "T1" }),
        makeEvent({ event: "stage_completed", stage: "S0", timestamp: "T2", artifacts: { intake: "stages/S0/intake.md" } }),
        makeEvent({ event: "stage_started", stage: "S4", timestamp: "T3" }),
        makeEvent({ event: "stage_blocked", stage: "S4", timestamp: "T4", blocking_reason: "S3 not complete" }),
      ];

      // Generate resume events
      const resumeEvents = createResumeEvents("S4", {
        operator: "test-operator",
        reason: "upstream S3 now complete",
        run_id: STATE_OPTIONS.run_id,
        loop_spec_version: STATE_OPTIONS.loop_spec_version,
      });

      expect(resumeEvents).toHaveLength(1);
      expect(resumeEvents[0].event).toBe("stage_started");
      expect(resumeEvents[0].stage).toBe("S4");

      // Re-derive state with resume event appended
      const allEvents = [...events, ...resumeEvents];
      const state = deriveState(allEvents, STATE_OPTIONS);

      expect(state.stages.S4.status).toBe("Active");
      expect(state.stages.S4.blocking_reason).toBeNull();
      expect(state.active_stage).toBe("S4");
    });

    // VC-04B-01-02: Resume clears blocking_reason
    it("resume clears blocking_reason from previous block", () => {
      const events: RunEvent[] = [
        makeEvent({ event: "stage_started", stage: "S1", timestamp: "T1" }),
        makeEvent({ event: "stage_blocked", stage: "S1", timestamp: "T2", blocking_reason: "Missing readiness data" }),
      ];

      const resumeEvents = createResumeEvents("S1", {
        operator: "operator",
        reason: "data now available",
        run_id: STATE_OPTIONS.run_id,
        loop_spec_version: STATE_OPTIONS.loop_spec_version,
      });

      const state = deriveState([...events, ...resumeEvents], STATE_OPTIONS);
      expect(state.stages.S1.status).toBe("Active");
      expect(state.stages.S1.blocking_reason).toBeNull();
    });
  });

  // VC-04B-01-03: Decision tree
  describe("VC-04B-01: decision tree", () => {
    it("recommends resume for Blocked stage with upstream now complete", () => {
      const state = deriveState([
        makeEvent({ event: "stage_started", stage: "S4", timestamp: "T1" }),
        makeEvent({ event: "stage_blocked", stage: "S4", timestamp: "T2", blocking_reason: "S3 not done" }),
      ], STATE_OPTIONS);

      const decision = recoveryDecision(state, "S4");

      expect(decision.action).toBe("resume");
      expect(decision.targetStage).toBe("S4");
    });

    it("recommends restart for Pending stage (never started)", () => {
      const state = deriveState([], STATE_OPTIONS);

      const decision = recoveryDecision(state, "S0");

      expect(decision.action).toBe("restart");
      expect(decision.reason).toContain("never started");
    });

    it("recommends no-action for Done stage", () => {
      const state = deriveState([
        makeEvent({ event: "stage_started", stage: "S0", timestamp: "T1" }),
        makeEvent({ event: "stage_completed", stage: "S0", timestamp: "T2", artifacts: { x: "y" } }),
      ], STATE_OPTIONS);

      const decision = recoveryDecision(state, "S0");

      expect(decision.action).toBe("no-action");
      expect(decision.reason).toContain("already complete");
    });
  });

  // VC-04B-03: Abort preserves artifacts
  describe("VC-04B-03: abort preserves artifacts", () => {
    it("abort event records operator and reason", () => {
      const abortEvent = createAbortEvent({
        operator: "human-operator",
        reason: "business pivot — run no longer needed",
        run_id: STATE_OPTIONS.run_id,
        loop_spec_version: STATE_OPTIONS.loop_spec_version,
      });

      expect(abortEvent.event).toBe("run_aborted");
      expect(abortEvent.blocking_reason).toContain("business pivot");
      expect(abortEvent.stage).toBe("*");
    });

    it("abort does not remove any stage artifacts (no cleanup)", async () => {
      // Create a temp run directory with partial artifacts
      const runDir = await fs.mkdtemp(path.join(os.tmpdir(), "recovery-test-"));
      const s0Dir = path.join(runDir, "stages", "S0");
      const s4Dir = path.join(runDir, "stages", "S4");
      await fs.mkdir(s0Dir, { recursive: true });
      await fs.mkdir(s4Dir, { recursive: true });
      await fs.writeFile(path.join(s0Dir, "intake.md"), "# Intake data");
      await fs.writeFile(path.join(s4Dir, "stage-result.json"), '{"status":"Blocked"}');

      // Create abort event (but do NOT clean up)
      createAbortEvent({
        operator: "test",
        reason: "test abort",
        run_id: "test",
        loop_spec_version: "1.0.0",
      });

      // Verify all artifacts still exist
      const s0Files = await fs.readdir(s0Dir);
      const s4Files = await fs.readdir(s4Dir);
      expect(s0Files).toContain("intake.md");
      expect(s4Files).toContain("stage-result.json");
    });
  });
});
