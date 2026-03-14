import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "@jest/globals";

import { loadActivePlans } from "./active-plans";

const ACTIVE_PLAN_CONTENT = `---
Type: Plan
Status: Active
Business-Unit: BOS
Domain: BOS
Execution-Track: code
Overall-confidence: 91%
Created: 2026-03-12
Last-updated: 2026-03-12
---

# Active Plan Example Plan

## Summary
Short summary for the active plan card.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Ship the activity ring. | 91% | S | Pending | - | - |
`;

describe("loadActivePlans", () => {
  it("TC-01: derives activity from the newest file inside the plan directory", async () => {
    const repoRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "active-plans-recent-")
    );

    try {
      const planDir = path.join(repoRoot, "docs/plans/example-plan");
      const planPath = path.join(planDir, "plan.md");
      const factFindPath = path.join(planDir, "fact-find.md");
      await fs.mkdir(planDir, { recursive: true });
      await fs.writeFile(planPath, ACTIVE_PLAN_CONTENT, "utf8");
      await fs.writeFile(factFindPath, "# Fact find\n", "utf8");

      const recentTime = new Date(Date.now() - 2 * 60 * 1000);
      const staleTime = new Date(Date.now() - 20 * 60 * 1000);
      await fs.utimes(planPath, staleTime, staleTime);
      await fs.utimes(factFindPath, recentTime, recentTime);

      const plans = loadActivePlans({ repoRoot });

      expect(plans).toHaveLength(1);
      expect(plans[0]).toEqual(
        expect.objectContaining({
          slug: "example-plan",
          isActiveNow: true,
          lastModifiedPath: "docs/plans/example-plan/fact-find.md",
        })
      );
      expect(Date.parse(plans[0]!.lastModifiedAt)).toBeGreaterThan(
        staleTime.getTime()
      );
    } finally {
      await fs.rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("TC-02: leaves idle plans static when the latest touch is outside the active window", async () => {
    const repoRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "active-plans-idle-")
    );

    try {
      const planDir = path.join(repoRoot, "docs/plans/idle-plan");
      const planPath = path.join(planDir, "plan.md");
      await fs.mkdir(planDir, { recursive: true });
      await fs.writeFile(planPath, ACTIVE_PLAN_CONTENT, "utf8");

      const staleTime = new Date(Date.now() - 10 * 60 * 1000);
      await fs.utimes(planPath, staleTime, staleTime);

      const plans = loadActivePlans({ repoRoot });

      expect(plans).toHaveLength(1);
      expect(plans[0]).toEqual(
        expect.objectContaining({
          slug: "idle-plan",
          isActiveNow: false,
          lastModifiedPath: "docs/plans/idle-plan/plan.md",
        })
      );
    } finally {
      await fs.rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("TC-03: marks a plan as handoff-in-flight when a pending decision maps to its processed target path", async () => {
    const repoRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "active-plans-pending-")
    );

    try {
      const planDir = path.join(repoRoot, "docs/plans/example-plan");
      const planPath = path.join(planDir, "plan.md");
      const queuePath = path.join(
        repoRoot,
        "docs/business-os/startup-loop/ideas/trial/queue-state.json"
      );
      const ledgerPath = path.join(
        repoRoot,
        "docs/business-os/process-improvements/operator-decisions.jsonl"
      );

      await fs.mkdir(planDir, { recursive: true });
      await fs.writeFile(planPath, ACTIVE_PLAN_CONTENT, "utf8");
      await fs.mkdir(path.dirname(queuePath), { recursive: true });
      await fs.writeFile(
        queuePath,
        JSON.stringify(
          {
            dispatches: [
              {
                dispatch_id: "DISPATCH-1",
                processed_by: {
                  target_path: "docs/plans/example-plan/fact-find.md",
                },
              },
            ],
          },
          null,
          2
        ),
        "utf8"
      );
      await fs.mkdir(path.dirname(ledgerPath), { recursive: true });
      await fs.writeFile(
        ledgerPath,
        JSON.stringify({
          schema_version: "process-improvements.decision.v1",
          event_id: "event-1",
          idea_key: "idea-1",
          dispatch_id: "DISPATCH-1",
          business: "BOS",
          source_path: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
          queue_mode: "trial",
          decision: "do",
          actor_id: "operator",
          actor_name: "Operator",
          decided_at: "2026-03-12T12:00:00.000Z",
          execution_result: "pending",
        }) + "\n",
        "utf8"
      );

      const plans = loadActivePlans({ repoRoot });

      expect(plans).toHaveLength(1);
      expect(plans[0]).toEqual(
        expect.objectContaining({
          slug: "example-plan",
          hasPendingExecution: true,
          pendingExecutionCount: 1,
        })
      );
    } finally {
      await fs.rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("TC-04: records a recent agent observation only when the context path targets the same plan slug", async () => {
    const repoRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "active-plans-observed-")
    );

    try {
      const planDir = path.join(repoRoot, "docs/plans/example-plan");
      const planPath = path.join(planDir, "plan.md");
      const observationsPath = path.join(
        repoRoot,
        "docs/business-os/startup-loop/self-evolving/BOS/observations.jsonl"
      );

      await fs.mkdir(planDir, { recursive: true });
      await fs.writeFile(planPath, ACTIVE_PLAN_CONTENT, "utf8");
      await fs.mkdir(path.dirname(observationsPath), { recursive: true });
      await fs.writeFile(
        observationsPath,
        [
          JSON.stringify({
            schema_version: "meta-observation.v1",
            observation_id: "obs-older",
            observation_type: "execution_event",
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            business: "BOS",
            actor_type: "agent",
            run_id: "run-1",
            session_id: "session-1",
            skill_id: "lp-do-build",
            container_id: null,
            artifact_refs: ["docs/plans/example-plan/build-record.user.md"],
            context_path: "lp-do-build/example-plan/build-record",
            hard_signature: "sig-1",
            soft_cluster_id: null,
            fingerprint_version: "1",
            repeat_count_window: 1,
            operator_minutes_estimate: 8,
            quality_impact_estimate: 0.35,
            detector_confidence: 0.7,
            severity: 0.35,
            inputs_hash: "inputs-1",
            outputs_hash: "outputs-1",
            toolchain_version: "v1",
            model_version: null,
            kpi_name: null,
            kpi_value: null,
            kpi_unit: null,
            aggregation_method: null,
            sample_size: null,
            data_quality_status: null,
            data_quality_reason_code: null,
            baseline_ref: null,
            measurement_window: null,
            traffic_segment: null,
            evidence_refs: ["docs/plans/example-plan/build-record.user.md"],
          }),
          JSON.stringify({
            schema_version: "meta-observation.v1",
            observation_id: "obs-current",
            observation_type: "execution_event",
            timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            business: "BOS",
            actor_type: "agent",
            run_id: "run-2",
            session_id: "session-2",
            skill_id: "lp-do-build",
            container_id: null,
            artifact_refs: ["docs/plans/example-plan/build-record.user.md"],
            context_path: "lp-do-build/example-plan/build-record",
            hard_signature: "sig-2",
            soft_cluster_id: null,
            fingerprint_version: "1",
            repeat_count_window: 1,
            operator_minutes_estimate: 8,
            quality_impact_estimate: 0.35,
            detector_confidence: 0.7,
            severity: 0.35,
            inputs_hash: "inputs-2",
            outputs_hash: "outputs-2",
            toolchain_version: "v1",
            model_version: null,
            kpi_name: null,
            kpi_value: null,
            kpi_unit: null,
            aggregation_method: null,
            sample_size: null,
            data_quality_status: null,
            data_quality_reason_code: null,
            baseline_ref: null,
            measurement_window: null,
            traffic_segment: null,
            evidence_refs: ["docs/plans/example-plan/build-record.user.md"],
          }),
          JSON.stringify({
            schema_version: "meta-observation.v1",
            observation_id: "obs-other-plan",
            observation_type: "execution_event",
            timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
            business: "BOS",
            actor_type: "agent",
            run_id: "run-3",
            session_id: "session-3",
            skill_id: "lp-do-build",
            container_id: null,
            artifact_refs: ["docs/plans/other-plan/build-record.user.md"],
            context_path: "lp-do-build/other-plan/build-record",
            hard_signature: "sig-3",
            soft_cluster_id: null,
            fingerprint_version: "1",
            repeat_count_window: 1,
            operator_minutes_estimate: 8,
            quality_impact_estimate: 0.35,
            detector_confidence: 0.7,
            severity: 0.35,
            inputs_hash: "inputs-3",
            outputs_hash: "outputs-3",
            toolchain_version: "v1",
            model_version: null,
            kpi_name: null,
            kpi_value: null,
            kpi_unit: null,
            aggregation_method: null,
            sample_size: null,
            data_quality_status: null,
            data_quality_reason_code: null,
            baseline_ref: null,
            measurement_window: null,
            traffic_segment: null,
            evidence_refs: ["docs/plans/other-plan/build-record.user.md"],
          }),
        ].join("\n") + "\n",
        "utf8"
      );

      const plans = loadActivePlans({ repoRoot });

      expect(plans).toHaveLength(1);
      expect(plans[0]).toEqual(
        expect.objectContaining({
          slug: "example-plan",
          lastObservedContextPath: "lp-do-build/example-plan/build-record",
          lastObservedSkillId: "lp-do-build",
          isObservedNow: true,
        })
      );
      expect(Date.parse(plans[0]!.lastObservedAt ?? "")).toBeGreaterThan(
        Date.now() - 5 * 60 * 1000
      );
    } finally {
      await fs.rm(repoRoot, { recursive: true, force: true });
    }
  });
});
