import { describe, expect, it } from "@jest/globals";

import {
  buildPropagationPlan,
  buildSourceTaskIdempotencyKey,
} from "../lp-do-ideas-propagation.js";
import type { RegistryV2ArtifactEntry } from "../lp-do-ideas-registry-migrate-v1-v2.js";
import { type ArtifactDeltaEvent,runTrialOrchestrator } from "../lp-do-ideas-trial.js";

const SOURCE_ARTIFACT_BASE: RegistryV2ArtifactEntry = {
  artifact_id: "HBAG-STRATEGY-INSIGHT_LOG",
  path: "docs/business-os/strategy/HBAG/insight-log.user.md",
  domain: "STRATEGY",
  business: "HBAG",
  artifact_class: "source_process",
  trigger_policy: "eligible",
  propagation_mode: "source_task",
  depends_on: [],
  produces: ["HBAG-MARKET-SUMMARY"],
  active: true,
};

const SOURCE_EVENT: ArtifactDeltaEvent = {
  artifact_id: "HBAG-STRATEGY-INSIGHT_LOG",
  business: "HBAG",
  before_sha: "aaa1111",
  after_sha: "bbb2222",
  path: "docs/business-os/strategy/HBAG/insight-log.user.md",
  domain: "STRATEGY",
  changed_sections: ["ICP Definition"],
};

describe("buildPropagationPlan", () => {
  it("TC-05B-01: projection_auto writes are tagged and intake suppresses tagged projection events", () => {
    const plan = buildPropagationPlan({
      sourceArtifact: {
        ...SOURCE_ARTIFACT_BASE,
        propagation_mode: "projection_auto",
      },
      sourceAfterSha: "bbb2222",
    });

    expect(plan.ok).toBe(true);
    expect(plan.operations).toHaveLength(1);
    expect(plan.operations[0].kind).toBe("projection_update");
    expect(plan.operations[0].updated_by_process).toBe("projection_auto");

    const intakeResult = runTrialOrchestrator({
      mode: "trial",
      cutoverPhase: "P2",
      standingRegistry: { artifacts: [SOURCE_ARTIFACT_BASE] },
      events: [{ ...SOURCE_EVENT, updated_by_process: "projection_auto" }],
    });

    expect(intakeResult.ok).toBe(true);
    if (!intakeResult.ok) return;
    expect(intakeResult.dispatched).toHaveLength(0);
    expect(intakeResult.noop).toBeGreaterThanOrEqual(1);
  });

  it("TC-05B-02: source_task emits deterministic standing-update task artifacts", () => {
    const sourceArtifact = {
      ...SOURCE_ARTIFACT_BASE,
      propagation_mode: "source_task" as const,
      produces: ["HBAG-MARKET-SUMMARY", "HBAG-SELL-SUMMARY"],
    };

    const runA = buildPropagationPlan({
      sourceArtifact,
      sourceAfterSha: "bbb2222",
    });
    const runB = buildPropagationPlan({
      sourceArtifact,
      sourceAfterSha: "bbb2222",
    });

    expect(runA.ok).toBe(true);
    expect(runA.operations).toHaveLength(2);
    expect(runA.operations.every((op) => op.kind === "standing_update_task")).toBe(
      true,
    );
    expect(runA.operations).toEqual(runB.operations);

    const expectedKey = buildSourceTaskIdempotencyKey({
      source_artifact_id: sourceArtifact.artifact_id,
      source_after_sha: "bbb2222",
      target_artifact_id: "HBAG-MARKET-SUMMARY",
    });

    const taskOp = runA.operations.find(
      (operation) =>
        operation.kind === "standing_update_task" &&
        operation.target_artifact_id === "HBAG-MARKET-SUMMARY",
    );
    expect(taskOp?.kind).toBe("standing_update_task");
    if (taskOp?.kind !== "standing_update_task") return;
    expect(taskOp.idempotency_key).toBe(expectedKey);
  });

  it("TC-05B-03: non-allowlisted mechanical updates are rejected", () => {
    const result = buildPropagationPlan({
      sourceArtifact: {
        ...SOURCE_ARTIFACT_BASE,
        propagation_mode: "source_mechanical_auto",
      },
      sourceAfterSha: "bbb2222",
      allowlistedMechanicalOperations: ["refresh_index_links"],
      mechanicalAttempts: [
        {
          operation_id: "rewrite_semantic_sections",
          target_artifact_id: "HBAG-STRATEGY-COMPETITOR_SCAN",
          before_truth_fingerprint: "same",
          after_truth_fingerprint: "same",
        },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.operations).toHaveLength(0);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0].reason).toBe("operation_not_allowlisted");
  });

  it("TC-05B-04: allowlisted mechanical updates require unchanged semantic fingerprints", () => {
    const passing = buildPropagationPlan({
      sourceArtifact: {
        ...SOURCE_ARTIFACT_BASE,
        propagation_mode: "source_mechanical_auto",
      },
      sourceAfterSha: "bbb2222",
      allowlistedMechanicalOperations: ["refresh_index_links"],
      mechanicalAttempts: [
        {
          operation_id: "refresh_index_links",
          target_artifact_id: "HBAG-STRATEGY-COMPETITOR_SCAN",
          before_truth_fingerprint: "fingerprint-1",
          after_truth_fingerprint: "fingerprint-1",
        },
      ],
    });

    expect(passing.ok).toBe(true);
    expect(passing.rejected).toHaveLength(0);
    expect(passing.operations).toHaveLength(1);
    expect(passing.operations[0].kind).toBe("mechanical_update");

    const failing = buildPropagationPlan({
      sourceArtifact: {
        ...SOURCE_ARTIFACT_BASE,
        propagation_mode: "source_mechanical_auto",
      },
      sourceAfterSha: "bbb2222",
      allowlistedMechanicalOperations: ["refresh_index_links"],
      mechanicalAttempts: [
        {
          operation_id: "refresh_index_links",
          target_artifact_id: "HBAG-STRATEGY-COMPETITOR_SCAN",
          before_truth_fingerprint: "fingerprint-1",
          after_truth_fingerprint: "fingerprint-2",
        },
      ],
    });

    expect(failing.ok).toBe(false);
    expect(failing.operations).toHaveLength(0);
    expect(failing.rejected[0].reason).toBe("semantic_fingerprint_changed");
  });
});
