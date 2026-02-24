/**
 * Tests for BL-06: Guarded replan trigger with severity gate and lifecycle state
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { type BottleneckEntry } from "../bottleneck-history";
import { type DiagnosisSnapshot } from "../diagnosis-snapshot";
import { checkAndTriggerReplan, type ReplanTrigger } from "../replan-trigger";

// Test helpers
function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "replan-trigger-test-"));
}

function cleanupTempDir(dir: string): void {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function createMockDiagnosis(
  runId: string,
  business: string,
  constraintKey: string,
  severity: "critical" | "moderate" | "minor",
  stage: string = "S3",
  metric: string | null = "cvr"
): DiagnosisSnapshot {
  return {
    diagnosis_schema_version: "v1",
    constraint_key_version: "v1",
    metric_catalog_version: "v1",
    run_id: runId,
    business,
    timestamp: new Date().toISOString(),
    diagnosis_status: "ok",
    data_quality: {
      missing_targets: [],
      missing_actuals: [],
      excluded_metrics: [],
    },
    funnel_metrics: {},
    identified_constraint: {
      constraint_key: constraintKey,
      constraint_type: metric ? "metric" : "stage_blocked",
      stage,
      metric,
      reason_code: metric ? null : "data_missing",
      severity,
      miss: severity === "critical" ? 0.55 : severity === "moderate" ? 0.25 : 0.08,
      reasoning: `Test constraint ${constraintKey}`,
    },
    ranked_constraints: [],
    comparison_to_prior_run: null,
  };
}

function setupBottleneckHistory(
  tempDir: string,
  business: string,
  entries: Array<{ runId: string; constraintKey: string; severity: string }>
): void {
  const historyPath = path.join(
    tempDir,
    "docs/business-os/startup-baselines",
    business,
    "bottleneck-history.jsonl"
  );
  const historyDir = path.dirname(historyPath);

  fs.mkdirSync(historyDir, { recursive: true });

  const lines = entries.map((entry) => {
    const bottleneckEntry: BottleneckEntry = {
      timestamp: new Date().toISOString(),
      run_id: entry.runId,
      diagnosis_status: "ok",
      constraint_key: entry.constraintKey,
      constraint_stage: entry.constraintKey.split("/")[0],
      constraint_metric: entry.constraintKey.includes("stage_blocked")
        ? null
        : entry.constraintKey.split("/")[1],
      reason_code: entry.constraintKey.includes("stage_blocked") ? "data_missing" : null,
      severity: entry.severity,
    };
    return JSON.stringify(bottleneckEntry);
  });

  fs.writeFileSync(historyPath, lines.join("\n") + "\n", "utf-8");
}

function setupExistingTrigger(
  tempDir: string,
  business: string,
  trigger: ReplanTrigger
): void {
  const triggerPath = path.join(
    tempDir,
    "docs/business-os/startup-baselines",
    business,
    "replan-trigger.json"
  );
  const triggerDir = path.dirname(triggerPath);

  fs.mkdirSync(triggerDir, { recursive: true });
  fs.writeFileSync(triggerPath, JSON.stringify(trigger, null, 2), "utf-8");
}

describe("replan-trigger", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  describe("TC-01: Open trigger — 3 persistent moderate+ runs create status=open trigger file", () => {
    it("should create open trigger when 3 persistent moderate runs detected", () => {
      // Setup: 3 runs with same constraint (S3/cvr, moderate)
      setupBottleneckHistory(tempDir, "HEAD", [
        { runId: "R001", constraintKey: "S3/cvr", severity: "moderate" },
        { runId: "R002", constraintKey: "S3/cvr", severity: "moderate" },
        { runId: "R003", constraintKey: "S3/cvr", severity: "moderate" },
      ]);

      const diagnosis = createMockDiagnosis("R003", "HEAD", "S3/cvr", "moderate", "S3", "cvr");

      const trigger = checkAndTriggerReplan("HEAD", diagnosis, { baseDir: tempDir });

      expect(trigger).not.toBeNull();
      expect(trigger!.status).toBe("open");
      expect(trigger!.constraint.constraint_key).toBe("S3/cvr");
      expect(trigger!.constraint.stage).toBe("S3");
      expect(trigger!.constraint.metric).toBe("cvr");
      expect(trigger!.constraint.severity).toBe("moderate");
      expect(trigger!.run_history).toEqual(["R001", "R002", "R003"]);
      expect(trigger!.reopened_count).toBe(0);
      expect(trigger!.last_reopened_at).toBeNull();
      expect(trigger!.resolved_at).toBeNull();
      expect(trigger!.persistence_threshold).toBe(3);
      expect(trigger!.min_severity).toBe("moderate");

      // Verify file was written
      const triggerPath = path.join(
        tempDir,
        "docs/business-os/startup-baselines/HEAD/replan-trigger.json"
      );
      expect(fs.existsSync(triggerPath)).toBe(true);

      const writtenTrigger = JSON.parse(fs.readFileSync(triggerPath, "utf-8"));
      expect(writtenTrigger.status).toBe("open");
    });

    it("should create open trigger when 3 persistent critical runs detected", () => {
      setupBottleneckHistory(tempDir, "BRIK", [
        { runId: "R001", constraintKey: "SELL-01/traffic", severity: "critical" },
        { runId: "R002", constraintKey: "SELL-01/traffic", severity: "critical" },
        { runId: "R003", constraintKey: "SELL-01/traffic", severity: "critical" },
      ]);

      const diagnosis = createMockDiagnosis("R003", "BRIK", "SELL-01/traffic", "critical", "SELL-01", "traffic");

      const trigger = checkAndTriggerReplan("BRIK", diagnosis, { baseDir: tempDir });

      expect(trigger).not.toBeNull();
      expect(trigger!.status).toBe("open");
      expect(trigger!.constraint.severity).toBe("critical");
    });
  });

  describe("TC-02: Severity gate — persistent minor constraint does not open trigger when minSeverity=moderate", () => {
    it("should not create trigger for persistent minor severity when gate is moderate", () => {
      setupBottleneckHistory(tempDir, "HEAD", [
        { runId: "R001", constraintKey: "S3/cvr", severity: "minor" },
        { runId: "R002", constraintKey: "S3/cvr", severity: "minor" },
        { runId: "R003", constraintKey: "S3/cvr", severity: "minor" },
      ]);

      const diagnosis = createMockDiagnosis("R003", "HEAD", "S3/cvr", "minor", "S3", "cvr");

      const trigger = checkAndTriggerReplan("HEAD", diagnosis, {
        baseDir: tempDir,
        minSeverity: "moderate",
      });

      expect(trigger).toBeNull();

      // Verify no file was written
      const triggerPath = path.join(
        tempDir,
        "docs/business-os/startup-baselines/HEAD/replan-trigger.json"
      );
      expect(fs.existsSync(triggerPath)).toBe(false);
    });

    it("should not create trigger for persistent moderate severity when gate is critical", () => {
      setupBottleneckHistory(tempDir, "HEAD", [
        { runId: "R001", constraintKey: "S3/cvr", severity: "moderate" },
        { runId: "R002", constraintKey: "S3/cvr", severity: "moderate" },
        { runId: "R003", constraintKey: "S3/cvr", severity: "moderate" },
      ]);

      const diagnosis = createMockDiagnosis("R003", "HEAD", "S3/cvr", "moderate", "S3", "cvr");

      const trigger = checkAndTriggerReplan("HEAD", diagnosis, {
        baseDir: tempDir,
        minSeverity: "critical",
      });

      expect(trigger).toBeNull();
    });

    it("should create trigger for persistent critical severity when gate is critical", () => {
      setupBottleneckHistory(tempDir, "HEAD", [
        { runId: "R001", constraintKey: "S3/cvr", severity: "critical" },
        { runId: "R002", constraintKey: "S3/cvr", severity: "critical" },
        { runId: "R003", constraintKey: "S3/cvr", severity: "critical" },
      ]);

      const diagnosis = createMockDiagnosis("R003", "HEAD", "S3/cvr", "critical", "S3", "cvr");

      const trigger = checkAndTriggerReplan("HEAD", diagnosis, {
        baseDir: tempDir,
        minSeverity: "critical",
      });

      expect(trigger).not.toBeNull();
      expect(trigger!.status).toBe("open");
    });
  });

  describe("TC-03: Non-persistent single run — existing open trigger remains open with updated last_evaluated_at", () => {
    it("should update last_evaluated_at when constraint no longer persistent", () => {
      // Setup: existing open trigger
      const existingTrigger: ReplanTrigger = {
        status: "open",
        created_at: "2026-02-10T10:00:00.000Z",
        last_evaluated_at: "2026-02-10T10:00:00.000Z",
        resolved_at: null,
        reopened_count: 0,
        last_reopened_at: null,
        constraint: {
          constraint_key: "S3/cvr",
          stage: "S3",
          metric: "cvr",
          severity: "moderate",
        },
        run_history: ["R001", "R002", "R003"],
        reason: "Test reason",
        recommended_focus: "Improve conversion rate through offer clarity, trust signals, or checkout optimization",
        min_severity: "moderate",
        persistence_threshold: 3,
      };
      setupExistingTrigger(tempDir, "HEAD", existingTrigger);

      // Setup: history with different constraint (breaks persistence)
      setupBottleneckHistory(tempDir, "HEAD", [
        { runId: "R001", constraintKey: "S3/cvr", severity: "moderate" },
        { runId: "R002", constraintKey: "S3/cvr", severity: "moderate" },
        { runId: "R003", constraintKey: "SELL-01/traffic", severity: "moderate" },
      ]);

      const diagnosis = createMockDiagnosis("R003", "HEAD", "SELL-01/traffic", "moderate", "SELL-01", "traffic");

      const trigger = checkAndTriggerReplan("HEAD", diagnosis, { baseDir: tempDir });

      expect(trigger).not.toBeNull();
      expect(trigger!.status).toBe("open");
      expect(trigger!.last_evaluated_at).not.toBe("2026-02-10T10:00:00.000Z");
      expect(trigger!.resolved_at).toBeNull();
    });
  });

  describe("TC-04: Auto-resolve — after configured non-persistent streak, status transitions to resolved", () => {
    it("should resolve trigger after 2 non-persistent runs (default)", () => {
      // Setup: existing open trigger
      const existingTrigger: ReplanTrigger = {
        status: "open",
        created_at: "2026-02-10T10:00:00.000Z",
        last_evaluated_at: "2026-02-10T10:00:00.000Z",
        resolved_at: null,
        reopened_count: 0,
        last_reopened_at: null,
        constraint: {
          constraint_key: "S3/cvr",
          stage: "S3",
          metric: "cvr",
          severity: "moderate",
        },
        run_history: ["R001", "R002", "R003"],
        reason: "Test reason",
        recommended_focus: "Improve conversion rate through offer clarity, trust signals, or checkout optimization",
        min_severity: "moderate",
        persistence_threshold: 3,
      };
      setupExistingTrigger(tempDir, "HEAD", existingTrigger);

      // First non-persistent run
      setupBottleneckHistory(tempDir, "HEAD", [
        { runId: "R001", constraintKey: "S3/cvr", severity: "moderate" },
        { runId: "R002", constraintKey: "S3/cvr", severity: "moderate" },
        { runId: "R003", constraintKey: "SELL-01/traffic", severity: "moderate" },
      ]);

      let diagnosis = createMockDiagnosis("R004", "HEAD", "SELL-01/traffic", "moderate", "SELL-01", "traffic");
      let trigger = checkAndTriggerReplan("HEAD", diagnosis, { baseDir: tempDir });

      expect(trigger!.status).toBe("open");
      expect(trigger!.resolved_at).toBeNull();

      // Second non-persistent run — should resolve
      setupBottleneckHistory(tempDir, "HEAD", [
        { runId: "R002", constraintKey: "S3/cvr", severity: "moderate" },
        { runId: "R003", constraintKey: "SELL-01/traffic", severity: "moderate" },
        { runId: "R004", constraintKey: "SELL-01/cac", severity: "moderate" },
      ]);

      diagnosis = createMockDiagnosis("R005", "HEAD", "SELL-01/cac", "moderate", "SELL-01", "cac");
      trigger = checkAndTriggerReplan("HEAD", diagnosis, { baseDir: tempDir });

      expect(trigger!.status).toBe("resolved");
      expect(trigger!.resolved_at).not.toBeNull();
    });

    it("should respect custom autoResolveAfterNonPersistentRuns threshold", () => {
      const existingTrigger: ReplanTrigger = {
        status: "open",
        created_at: "2026-02-10T10:00:00.000Z",
        last_evaluated_at: "2026-02-10T10:00:00.000Z",
        resolved_at: null,
        reopened_count: 0,
        last_reopened_at: null,
        constraint: {
          constraint_key: "S3/cvr",
          stage: "S3",
          metric: "cvr",
          severity: "moderate",
        },
        run_history: ["R001", "R002", "R003"],
        reason: "Test reason",
        recommended_focus: "Improve conversion rate through offer clarity, trust signals, or checkout optimization",
        min_severity: "moderate",
        persistence_threshold: 3,
      };
      setupExistingTrigger(tempDir, "HEAD", existingTrigger);

      // First non-persistent run
      setupBottleneckHistory(tempDir, "HEAD", [
        { runId: "R001", constraintKey: "S3/cvr", severity: "moderate" },
        { runId: "R002", constraintKey: "S3/cvr", severity: "moderate" },
        { runId: "R003", constraintKey: "SELL-01/traffic", severity: "moderate" },
      ]);

      let diagnosis = createMockDiagnosis("R004", "HEAD", "SELL-01/traffic", "moderate", "SELL-01", "traffic");
      let trigger = checkAndTriggerReplan("HEAD", diagnosis, {
        baseDir: tempDir,
        autoResolveAfterNonPersistentRuns: 3,
      });

      expect(trigger!.status).toBe("open");

      // Second non-persistent run — still open
      setupBottleneckHistory(tempDir, "HEAD", [
        { runId: "R002", constraintKey: "S3/cvr", severity: "moderate" },
        { runId: "R003", constraintKey: "SELL-01/traffic", severity: "moderate" },
        { runId: "R004", constraintKey: "SELL-01/cac", severity: "moderate" },
      ]);

      diagnosis = createMockDiagnosis("R005", "HEAD", "SELL-01/cac", "moderate", "SELL-01", "cac");
      trigger = checkAndTriggerReplan("HEAD", diagnosis, {
        baseDir: tempDir,
        autoResolveAfterNonPersistentRuns: 3,
      });

      expect(trigger!.status).toBe("open");

      // Third non-persistent run — should resolve
      setupBottleneckHistory(tempDir, "HEAD", [
        { runId: "R003", constraintKey: "SELL-01/traffic", severity: "moderate" },
        { runId: "R004", constraintKey: "SELL-01/cac", severity: "moderate" },
        { runId: "R005", constraintKey: "MARKET-06/aov", severity: "moderate" },
      ]);

      diagnosis = createMockDiagnosis("R006", "HEAD", "MARKET-06/aov", "moderate", "MARKET-06", "aov");
      trigger = checkAndTriggerReplan("HEAD", diagnosis, {
        baseDir: tempDir,
        autoResolveAfterNonPersistentRuns: 3,
      });

      expect(trigger!.status).toBe("resolved");
      expect(trigger!.resolved_at).not.toBeNull();
    });
  });

  describe("TC-05: Custom threshold — persistenceThreshold=5 with 4 runs does not trigger", () => {
    it("should not create trigger when runs < persistenceThreshold", () => {
      setupBottleneckHistory(tempDir, "HEAD", [
        { runId: "R001", constraintKey: "S3/cvr", severity: "moderate" },
        { runId: "R002", constraintKey: "S3/cvr", severity: "moderate" },
        { runId: "R003", constraintKey: "S3/cvr", severity: "moderate" },
        { runId: "R004", constraintKey: "S3/cvr", severity: "moderate" },
      ]);

      const diagnosis = createMockDiagnosis("R004", "HEAD", "S3/cvr", "moderate", "S3", "cvr");

      const trigger = checkAndTriggerReplan("HEAD", diagnosis, {
        baseDir: tempDir,
        persistenceThreshold: 5,
      });

      expect(trigger).toBeNull();
    });

    it("should create trigger when runs >= persistenceThreshold", () => {
      setupBottleneckHistory(tempDir, "HEAD", [
        { runId: "R001", constraintKey: "S3/cvr", severity: "moderate" },
        { runId: "R002", constraintKey: "S3/cvr", severity: "moderate" },
        { runId: "R003", constraintKey: "S3/cvr", severity: "moderate" },
        { runId: "R004", constraintKey: "S3/cvr", severity: "moderate" },
        { runId: "R005", constraintKey: "S3/cvr", severity: "moderate" },
      ]);

      const diagnosis = createMockDiagnosis("R005", "HEAD", "S3/cvr", "moderate", "S3", "cvr");

      const trigger = checkAndTriggerReplan("HEAD", diagnosis, {
        baseDir: tempDir,
        persistenceThreshold: 5,
      });

      expect(trigger).not.toBeNull();
      expect(trigger!.status).toBe("open");
      expect(trigger!.persistence_threshold).toBe(5);
    });
  });

  describe("TC-06: Recommended focus — known constraints map to deterministic recommendations", () => {
    it("should map S3/cvr to conversion optimization recommendation", () => {
      setupBottleneckHistory(tempDir, "HEAD", [
        { runId: "R001", constraintKey: "S3/cvr", severity: "moderate" },
        { runId: "R002", constraintKey: "S3/cvr", severity: "moderate" },
        { runId: "R003", constraintKey: "S3/cvr", severity: "moderate" },
      ]);

      const diagnosis = createMockDiagnosis("R003", "HEAD", "S3/cvr", "moderate", "S3", "cvr");
      const trigger = checkAndTriggerReplan("HEAD", diagnosis, { baseDir: tempDir });

      expect(trigger!.recommended_focus).toBe(
        "Improve conversion rate through offer clarity, trust signals, or checkout optimization"
      );
    });

    it("should map SELL-01/traffic to traffic acquisition recommendation", () => {
      setupBottleneckHistory(tempDir, "HEAD", [
        { runId: "R001", constraintKey: "SELL-01/traffic", severity: "moderate" },
        { runId: "R002", constraintKey: "SELL-01/traffic", severity: "moderate" },
        { runId: "R003", constraintKey: "SELL-01/traffic", severity: "moderate" },
      ]);

      const diagnosis = createMockDiagnosis("R003", "HEAD", "SELL-01/traffic", "moderate", "SELL-01", "traffic");
      const trigger = checkAndTriggerReplan("HEAD", diagnosis, { baseDir: tempDir });

      expect(trigger!.recommended_focus).toBe(
        "Increase traffic through SEO, paid acquisition, or content marketing"
      );
    });

    it("should map SELL-01/cac to cost optimization recommendation", () => {
      setupBottleneckHistory(tempDir, "HEAD", [
        { runId: "R001", constraintKey: "SELL-01/cac", severity: "moderate" },
        { runId: "R002", constraintKey: "SELL-01/cac", severity: "moderate" },
        { runId: "R003", constraintKey: "SELL-01/cac", severity: "moderate" },
      ]);

      const diagnosis = createMockDiagnosis("R003", "HEAD", "SELL-01/cac", "moderate", "SELL-01", "cac");
      const trigger = checkAndTriggerReplan("HEAD", diagnosis, { baseDir: tempDir });

      expect(trigger!.recommended_focus).toBe(
        "Reduce customer acquisition cost through channel optimization or targeting"
      );
    });

    it("should map MARKET-06/aov to AOV optimization recommendation", () => {
      setupBottleneckHistory(tempDir, "HEAD", [
        { runId: "R001", constraintKey: "MARKET-06/aov", severity: "moderate" },
        { runId: "R002", constraintKey: "MARKET-06/aov", severity: "moderate" },
        { runId: "R003", constraintKey: "MARKET-06/aov", severity: "moderate" },
      ]);

      const diagnosis = createMockDiagnosis("R003", "HEAD", "MARKET-06/aov", "moderate", "MARKET-06", "aov");
      const trigger = checkAndTriggerReplan("HEAD", diagnosis, { baseDir: tempDir });

      expect(trigger!.recommended_focus).toBe(
        "Increase average order value through upsells, bundles, or pricing"
      );
    });

    it("should map stage_blocked to blocker resolution recommendation", () => {
      setupBottleneckHistory(tempDir, "HEAD", [
        { runId: "R001", constraintKey: "MARKET-01/stage_blocked/data_missing", severity: "critical" },
        { runId: "R002", constraintKey: "MARKET-01/stage_blocked/data_missing", severity: "critical" },
        { runId: "R003", constraintKey: "MARKET-01/stage_blocked/data_missing", severity: "critical" },
      ]);

      const diagnosis = createMockDiagnosis(
        "R003",
        "HEAD",
        "MARKET-01/stage_blocked/data_missing",
        "critical",
        "MARKET-01",
        null
      );
      const trigger = checkAndTriggerReplan("HEAD", diagnosis, { baseDir: tempDir });

      expect(trigger!.recommended_focus).toBe(
        "Resolve stage blocker before addressing metric constraints"
      );
    });

    it("should provide default recommendation for unknown constraint", () => {
      setupBottleneckHistory(tempDir, "HEAD", [
        { runId: "R001", constraintKey: "DO/unknown", severity: "moderate" },
        { runId: "R002", constraintKey: "DO/unknown", severity: "moderate" },
        { runId: "R003", constraintKey: "DO/unknown", severity: "moderate" },
      ]);

      const diagnosis = createMockDiagnosis("R003", "HEAD", "DO/unknown", "moderate", "DO", "unknown");
      const trigger = checkAndTriggerReplan("HEAD", diagnosis, { baseDir: tempDir });

      expect(trigger!.recommended_focus).toBe(
        "Review constraint and plan targeted intervention"
      );
    });
  });

  describe("TC-07: Reopen semantics — resolved trigger + renewed persistence reopens trigger and increments reopened_count", () => {
    it("should reopen resolved trigger when constraint persists again", () => {
      // Setup: existing resolved trigger
      const existingTrigger: ReplanTrigger = {
        status: "resolved",
        created_at: "2026-02-10T10:00:00.000Z",
        last_evaluated_at: "2026-02-12T10:00:00.000Z",
        resolved_at: "2026-02-12T10:00:00.000Z",
        reopened_count: 0,
        last_reopened_at: null,
        constraint: {
          constraint_key: "S3/cvr",
          stage: "S3",
          metric: "cvr",
          severity: "moderate",
        },
        run_history: ["R001", "R002", "R003"],
        reason: "Test reason",
        recommended_focus: "Improve conversion rate through offer clarity, trust signals, or checkout optimization",
        min_severity: "moderate",
        persistence_threshold: 3,
      };
      setupExistingTrigger(tempDir, "HEAD", existingTrigger);

      // Setup: same constraint is now persistent again
      setupBottleneckHistory(tempDir, "HEAD", [
        { runId: "R007", constraintKey: "S3/cvr", severity: "moderate" },
        { runId: "R008", constraintKey: "S3/cvr", severity: "moderate" },
        { runId: "R009", constraintKey: "S3/cvr", severity: "moderate" },
      ]);

      const diagnosis = createMockDiagnosis("R009", "HEAD", "S3/cvr", "moderate", "S3", "cvr");
      const trigger = checkAndTriggerReplan("HEAD", diagnosis, { baseDir: tempDir });

      expect(trigger).not.toBeNull();
      expect(trigger!.status).toBe("open");
      expect(trigger!.reopened_count).toBe(1);
      expect(trigger!.last_reopened_at).not.toBeNull();
      expect(trigger!.resolved_at).toBeNull();
      expect(trigger!.run_history).toEqual(["R007", "R008", "R009"]);
    });

    it("should increment reopened_count on multiple reopens", () => {
      // Setup: existing trigger with previous reopen
      const existingTrigger: ReplanTrigger = {
        status: "resolved",
        created_at: "2026-02-10T10:00:00.000Z",
        last_evaluated_at: "2026-02-12T10:00:00.000Z",
        resolved_at: "2026-02-12T10:00:00.000Z",
        reopened_count: 1,
        last_reopened_at: "2026-02-11T10:00:00.000Z",
        constraint: {
          constraint_key: "S3/cvr",
          stage: "S3",
          metric: "cvr",
          severity: "moderate",
        },
        run_history: ["R004", "R005", "R006"],
        reason: "Test reason",
        recommended_focus: "Improve conversion rate through offer clarity, trust signals, or checkout optimization",
        min_severity: "moderate",
        persistence_threshold: 3,
      };
      setupExistingTrigger(tempDir, "HEAD", existingTrigger);

      setupBottleneckHistory(tempDir, "HEAD", [
        { runId: "R010", constraintKey: "S3/cvr", severity: "moderate" },
        { runId: "R011", constraintKey: "S3/cvr", severity: "moderate" },
        { runId: "R012", constraintKey: "S3/cvr", severity: "moderate" },
      ]);

      const diagnosis = createMockDiagnosis("R012", "HEAD", "S3/cvr", "moderate", "S3", "cvr");
      const trigger = checkAndTriggerReplan("HEAD", diagnosis, { baseDir: tempDir });

      expect(trigger!.status).toBe("open");
      expect(trigger!.reopened_count).toBe(2);
    });
  });

  describe("Edge cases and lifecycle transitions", () => {
    it("should preserve acknowledged status when persistence continues", () => {
      const existingTrigger: ReplanTrigger = {
        status: "acknowledged",
        created_at: "2026-02-10T10:00:00.000Z",
        last_evaluated_at: "2026-02-10T10:00:00.000Z",
        resolved_at: null,
        reopened_count: 0,
        last_reopened_at: null,
        constraint: {
          constraint_key: "S3/cvr",
          stage: "S3",
          metric: "cvr",
          severity: "moderate",
        },
        run_history: ["R001", "R002", "R003"],
        reason: "Test reason",
        recommended_focus: "Improve conversion rate through offer clarity, trust signals, or checkout optimization",
        min_severity: "moderate",
        persistence_threshold: 3,
      };
      setupExistingTrigger(tempDir, "HEAD", existingTrigger);

      setupBottleneckHistory(tempDir, "HEAD", [
        { runId: "R002", constraintKey: "S3/cvr", severity: "moderate" },
        { runId: "R003", constraintKey: "S3/cvr", severity: "moderate" },
        { runId: "R004", constraintKey: "S3/cvr", severity: "moderate" },
      ]);

      const diagnosis = createMockDiagnosis("R004", "HEAD", "S3/cvr", "moderate", "S3", "cvr");
      const trigger = checkAndTriggerReplan("HEAD", diagnosis, { baseDir: tempDir });

      expect(trigger!.status).toBe("acknowledged");
      expect(trigger!.last_evaluated_at).not.toBe("2026-02-10T10:00:00.000Z");
      expect(trigger!.run_history).toEqual(["R002", "R003", "R004"]);
    });

    it("should return null when no persistence and no existing trigger", () => {
      setupBottleneckHistory(tempDir, "HEAD", [
        { runId: "R001", constraintKey: "S3/cvr", severity: "moderate" },
        { runId: "R002", constraintKey: "SELL-01/traffic", severity: "moderate" },
        { runId: "R003", constraintKey: "MARKET-06/aov", severity: "moderate" },
      ]);

      const diagnosis = createMockDiagnosis("R003", "HEAD", "MARKET-06/aov", "moderate", "MARKET-06", "aov");
      const trigger = checkAndTriggerReplan("HEAD", diagnosis, { baseDir: tempDir });

      expect(trigger).toBeNull();
    });

    it("should handle empty history gracefully", () => {
      const diagnosis = createMockDiagnosis("R001", "HEAD", "S3/cvr", "moderate", "S3", "cvr");
      const trigger = checkAndTriggerReplan("HEAD", diagnosis, { baseDir: tempDir });

      expect(trigger).toBeNull();
    });
  });
});
