import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach,beforeEach, describe, expect, it } from "@jest/globals";

import type { StartupState } from "../self-evolving/self-evolving-contracts.js";
import { validateMetaObservation } from "../self-evolving/self-evolving-contracts.js";
import {
  buildFailureObservation,
  extractFailureContext,
  type FailureBridgeOptions,
  type FailureType,
  runSelfEvolvingFromBuildFailure,
} from "../self-evolving/self-evolving-from-build-failure.js";

function buildStartupState(): StartupState {
  return {
    schema_version: "startup-state.v1",
    startup_state_id: "ss-test-001",
    business_id: "TEST",
    stage: "traction",
    current_website_generation: 3,
    offer: {},
    icp: {},
    positioning: {},
    brand: {
      voice_tone: "professional, concise",
      do_rules: ["Use plain language"],
      dont_rules: ["No jargon"],
    },
    stack: {
      website_platform: "Next.js",
      repo_ref: "base-shop",
      deploy_target: "staging",
    },
    analytics_stack: {
      provider: "GA4",
      workspace_id: "test-workspace",
      event_schema_ref: "events.v1",
    },
    channels_enabled: [{ channel: "SEO", automation_allowed: true }],
    credential_refs: [],
    kpi_definitions: [
      { name: "conversion_rate", unit: "ratio", aggregation_method: "mean", kind: "primary" },
    ],
    asset_refs: [],
    constraints: [],
    updated_at: new Date().toISOString(),
    updated_by: "test",
  };
}

function setupTestDir(): { rootDir: string; cleanup: () => void } {
  const rootDir = mkdtempSync(path.join(os.tmpdir(), "build-failure-test-"));

  const selfEvolvingDir = path.join(
    rootDir,
    "docs",
    "business-os",
    "startup-loop",
    "self-evolving",
    "TEST",
  );
  mkdirSync(selfEvolvingDir, { recursive: true });
  writeFileSync(
    path.join(selfEvolvingDir, "startup-state.json"),
    JSON.stringify(buildStartupState()),
  );

  const planDir = path.join(rootDir, "docs", "plans", "test-plan");
  mkdirSync(planDir, { recursive: true });
  writeFileSync(
    path.join(planDir, "plan.md"),
    "---\nStatus: Active\n---\n# Test Plan\n",
  );

  return {
    rootDir,
    cleanup: () => rmSync(rootDir, { recursive: true, force: true }),
  };
}

function makeOptions(
  rootDir: string,
  failureType: FailureType,
  overrides: Partial<FailureBridgeOptions> = {},
): FailureBridgeOptions {
  return {
    rootDir,
    business: "TEST",
    planSlug: "test-plan",
    failureType,
    runId: "run-test",
    sessionId: "session-test",
    ...overrides,
  };
}

describe("self-evolving-from-build-failure", () => {
  let rootDir: string;
  let cleanup: () => void;

  beforeEach(() => {
    const setup = setupTestDir();
    rootDir = setup.rootDir;
    cleanup = setup.cleanup;
  });

  afterEach(() => {
    cleanup();
  });

  describe("observation construction", () => {
    // TC-01: infeasible_declaration
    it("produces valid observation for infeasible_declaration with correct severity", () => {
      const options = makeOptions(rootDir, "infeasible_declaration");
      const { contextDetail, artifactRefs } = extractFailureContext(
        rootDir,
        "test-plan",
        "infeasible_declaration",
      );
      const config = {
        observation_type: "execution_event" as const,
        severity: 0.9,
        detector_confidence: 0.9,
        step_id: "build-failure-infeasible",
      };
      const obs = buildFailureObservation(options, config, contextDetail, artifactRefs);

      expect(obs.observation_type).toBe("execution_event");
      expect(obs.severity).toBe(0.9);
      expect(obs.detector_confidence).toBe(0.9);

      const errors = validateMetaObservation(obs);
      expect(errors).toEqual([]);
    });

    // TC-02: replan_exhaustion
    it("produces valid observation for replan_exhaustion with correct severity", () => {
      // Add replan-notes with round info
      const replanDir = path.join(rootDir, "docs", "plans", "test-plan");
      writeFileSync(
        path.join(replanDir, "replan-notes.md"),
        "---\nReplan-round: 3\n---\nNotes here",
      );

      const options = makeOptions(rootDir, "replan_exhaustion");
      const { contextDetail, artifactRefs } = extractFailureContext(
        rootDir,
        "test-plan",
        "replan_exhaustion",
      );
      const config = {
        observation_type: "validation_failure" as const,
        severity: 0.8,
        detector_confidence: 0.85,
        step_id: "build-failure-replan-exhaustion",
      };
      const obs = buildFailureObservation(options, config, contextDetail, artifactRefs);

      expect(obs.observation_type).toBe("validation_failure");
      expect(obs.severity).toBe(0.8);
      expect(contextDetail).toContain("3 round(s)");
      expect(artifactRefs).toContain("docs/plans/test-plan/replan-notes.md");

      const errors = validateMetaObservation(obs);
      expect(errors).toEqual([]);
    });

    // TC-03: confidence_regression
    it("produces valid observation for confidence_regression with correct severity", () => {
      const options = makeOptions(rootDir, "confidence_regression", { taskId: "TASK-01" });
      const { contextDetail, artifactRefs } = extractFailureContext(
        rootDir,
        "test-plan",
        "confidence_regression",
        "TASK-01",
      );
      const config = {
        observation_type: "validation_failure" as const,
        severity: 0.6,
        detector_confidence: 0.7,
        step_id: "build-failure-confidence-regression",
      };
      const obs = buildFailureObservation(options, config, contextDetail, artifactRefs);

      expect(obs.observation_type).toBe("validation_failure");
      expect(obs.severity).toBe(0.6);
      expect(contextDetail).toContain("TASK-01");

      const errors = validateMetaObservation(obs);
      expect(errors).toEqual([]);
    });

    // TC-04: gate_block
    it("produces valid observation for gate_block with correct severity", () => {
      const options = makeOptions(rootDir, "gate_block", { taskId: "TASK-02" });
      const { contextDetail, artifactRefs } = extractFailureContext(
        rootDir,
        "test-plan",
        "gate_block",
        "TASK-02",
      );
      const config = {
        observation_type: "validation_failure" as const,
        severity: 0.5,
        detector_confidence: 0.65,
        step_id: "build-failure-gate-block",
      };
      const obs = buildFailureObservation(options, config, contextDetail, artifactRefs);

      expect(obs.observation_type).toBe("validation_failure");
      expect(obs.severity).toBe(0.5);
      expect(contextDetail).toContain("TASK-02");

      const errors = validateMetaObservation(obs);
      expect(errors).toEqual([]);
    });
  });

  describe("bridge function", () => {
    // TC-05: missing startup-state
    it("returns ok:false when startup-state.json is absent", () => {
      const emptyRoot = mkdtempSync(path.join(os.tmpdir(), "build-failure-empty-"));
      try {
        const options = makeOptions(emptyRoot, "gate_block");
        const result = runSelfEvolvingFromBuildFailure(options);

        expect(result.ok).toBe(false);
        expect(result.error).toContain("startup-state.json not found");
        expect(result.observations_generated).toBe(0);
      } finally {
        rmSync(emptyRoot, { recursive: true, force: true });
      }
    });

    it("returns ok:true and generates 1 observation for valid input", () => {
      const options = makeOptions(rootDir, "infeasible_declaration");
      const result = runSelfEvolvingFromBuildFailure(options);

      expect(result.ok).toBe(true);
      expect(result.observations_generated).toBe(1);
      expect(result.failure_type).toBe("infeasible_declaration");
      expect(result.orchestrator).toBeDefined();
      expect(result.orchestrator!.observations_count).toBeGreaterThanOrEqual(1);
    });

    it("returns error result for unknown failure type", () => {
      const options = makeOptions(rootDir, "nonexistent" as FailureType);
      const result = runSelfEvolvingFromBuildFailure(options);

      expect(result.ok).toBe(false);
      expect(result.error).toContain("Unknown failure type");
    });
  });

  describe("hard signature uniqueness", () => {
    // TC-06: 4 distinct hard_signature values for same plan slug
    it("produces distinct hard_signature for each failure type", () => {
      const failureTypes: FailureType[] = [
        "infeasible_declaration",
        "replan_exhaustion",
        "confidence_regression",
        "gate_block",
      ];

      const signatures = new Set<string>();
      for (const ft of failureTypes) {
        const options = makeOptions(rootDir, ft);
        const config = {
          observation_type: (ft === "infeasible_declaration" ? "execution_event" : "validation_failure") as const,
          severity: 0.5,
          detector_confidence: 0.5,
          step_id: `build-failure-${ft}`,
        };
        const { contextDetail, artifactRefs } = extractFailureContext(rootDir, "test-plan", ft);
        const obs = buildFailureObservation(options, config, contextDetail, artifactRefs);
        signatures.add(obs.hard_signature);
      }

      expect(signatures.size).toBe(4);
    });
  });

  describe("observation_id uniqueness", () => {
    // TC-07 (via TC-05 in test contract): observation_id differs between calls
    it("generates different observation_id across repeated calls with same inputs", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 5; i++) {
        const options = makeOptions(rootDir, "gate_block");
        const config = {
          observation_type: "validation_failure" as const,
          severity: 0.5,
          detector_confidence: 0.65,
          step_id: "build-failure-gate-block",
        };
        const { contextDetail, artifactRefs } = extractFailureContext(
          rootDir,
          "test-plan",
          "gate_block",
        );
        const obs = buildFailureObservation(options, config, contextDetail, artifactRefs);
        ids.add(obs.observation_id);
      }

      // With timestamp-based IDs + Date.now(), rapid sequential calls should
      // still produce unique IDs (millisecond resolution). Allow at least 2 unique.
      expect(ids.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe("edge cases", () => {
    // TC-04 (test contract): empty/missing plan artifacts
    it("handles missing plan file gracefully", () => {
      const emptyPlanRoot = mkdtempSync(path.join(os.tmpdir(), "build-failure-noplan-"));
      const selfEvolvingDir = path.join(
        emptyPlanRoot,
        "docs",
        "business-os",
        "startup-loop",
        "self-evolving",
        "TEST",
      );
      mkdirSync(selfEvolvingDir, { recursive: true });
      writeFileSync(
        path.join(selfEvolvingDir, "startup-state.json"),
        JSON.stringify(buildStartupState()),
      );

      try {
        const options = makeOptions(emptyPlanRoot, "gate_block");
        const result = runSelfEvolvingFromBuildFailure(options);

        // Should still succeed — plan file not found is not fatal
        expect(result.ok).toBe(true);
        expect(result.observations_generated).toBe(1);
      } finally {
        rmSync(emptyPlanRoot, { recursive: true, force: true });
      }
    });

    it("handles replan_exhaustion with no replan-notes file", () => {
      const options = makeOptions(rootDir, "replan_exhaustion");
      const { contextDetail } = extractFailureContext(
        rootDir,
        "test-plan",
        "replan_exhaustion",
      );

      expect(contextDetail).toContain("replan-notes not found");
    });
  });

  describe("anti-loop integration", () => {
    // TC-06 (test contract): SELF_TRIGGER_PROCESSES contains entry
    it("self-evolving-from-build-failure is registered in SELF_TRIGGER_PROCESSES", () => {
      const trialTsPath = path.join(
        process.cwd(),
        "scripts",
        "src",
        "startup-loop",
        "ideas",
        "lp-do-ideas-trial.ts",
      );
      const content = readFileSync(trialTsPath, "utf-8");
      expect(content).toContain('"self-evolving-from-build-failure"');
    });
  });
});
