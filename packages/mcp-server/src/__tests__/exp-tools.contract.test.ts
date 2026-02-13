/** @jest-environment node */

import { handleBosTool } from "../tools/bos";

function parsePayload(result: { content: Array<{ text: string }> }) {
  return JSON.parse(result.content[0].text);
}

describe("experiment runtime contract tools", () => {
  it("TC-01: exp_allocate_id returns deterministic identifier for same seed", async () => {
    const args = {
      business: "BRIK",
      runId: "run-001",
      current_stage: "S8",
      hypothesisId: "HYP-001",
      seed: "baseline-a",
    };

    const first = await handleBosTool("exp_allocate_id", args);
    const second = await handleBosTool("exp_allocate_id", args);
    const firstPayload = parsePayload(first);
    const secondPayload = parsePayload(second);

    expect(firstPayload.schemaVersion).toBe("exp.allocate-id.v1");
    expect(firstPayload.experimentId).toBe(secondPayload.experimentId);
    expect(firstPayload.experimentId).toMatch(/^EXP-[A-Z0-9]{10}$/);
  });

  it("TC-02: exp_rollout_status returns bounded rollout contract with audit context", async () => {
    const result = await handleBosTool("exp_rollout_status", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "S8",
      experimentId: "EXP-1234567890",
      requestedBy: "startup-loop",
      plannedRolloutPercent: 15,
      activeRolloutPercent: 10,
      assignmentCount: 412,
    });

    const payload = parsePayload(result);
    expect(payload.schemaVersion).toBe("exp.rollout-status.v1");
    expect(payload.experimentId).toBe("EXP-1234567890");
    expect(payload.rollout).toEqual(
      expect.objectContaining({
        plannedPercent: 15,
        activePercent: 10,
        assignmentCount: 412,
      })
    );
    expect(payload.audit).toEqual(
      expect.objectContaining({
        auditTag: "exp:rollout:status",
        requestedBy: "startup-loop",
      })
    );
  });

  it("TC-03: exp_results_snapshot returns deterministic effect-size math and quality", async () => {
    const result = await handleBosTool("exp_results_snapshot", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "S8",
      experimentId: "EXP-1234567890",
      control: {
        exposures: 1000,
        conversions: 100,
        revenue: 10000,
      },
      treatment: {
        exposures: 1000,
        conversions: 120,
        revenue: 11800,
      },
    });

    const payload = parsePayload(result);
    expect(payload.schemaVersion).toBe("exp.results-snapshot.v1");
    expect(payload.quality).toBe("ok");
    expect(payload.results.control.conversionRate).toBeCloseTo(0.1, 5);
    expect(payload.results.treatment.conversionRate).toBeCloseTo(0.12, 5);
    expect(payload.results.effect.absoluteLift).toBeCloseTo(0.02, 5);
    expect(payload.results.effect.relativeLift).toBeCloseTo(0.2, 5);
  });
});
