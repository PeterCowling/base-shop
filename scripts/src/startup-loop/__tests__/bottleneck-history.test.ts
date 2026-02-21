/**
 * Tests for BL-05: Idempotent bottleneck history ledger
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import {
  appendBottleneckHistory,
  type BottleneckEntry,
  checkConstraintPersistence,
  getRecentBottlenecks,
} from "../bottleneck-history";
import { type DiagnosisSnapshot } from "../diagnosis-snapshot";

// Test helpers
function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "bottleneck-history-test-"));
}

function cleanupTempDir(dir: string): void {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function createMockDiagnosis(
  runId: string,
  business: string,
  status: "ok" | "no_bottleneck" | "insufficient_data",
  constraintKey?: string,
  constraintStage?: string,
  constraintMetric?: string
): DiagnosisSnapshot {
  const identifiedConstraint =
    status === "ok" && constraintKey
      ? {
          constraint_key: constraintKey,
          constraint_type: "metric" as const,
          stage: constraintStage ?? "S3",
          metric: constraintMetric ?? "traffic",
          reason_code: null as any,
          severity: "critical" as any,
          miss: 0.25,
          reasoning: "Test constraint",
        }
      : null;

  return {
    diagnosis_schema_version: "v1",
    constraint_key_version: "v1",
    metric_catalog_version: "v1",
    run_id: runId,
    business,
    timestamp: new Date().toISOString(),
    diagnosis_status: status,
    data_quality: {
      missing_targets: [],
      missing_actuals: [],
      excluded_metrics: [],
    },
    funnel_metrics: {},
    identified_constraint: identifiedConstraint,
    ranked_constraints: [],
    comparison_to_prior_run: null,
  };
}

describe("bottleneck-history", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  describe("TC-01: Append happy path", () => {
    it("should append valid diagnosis with correct fields", () => {
      const diagnosis = createMockDiagnosis(
        "R001",
        "HEAD",
        "ok",
        "S3/traffic",
        "S3",
        "traffic",
        undefined,
        "critical"
      );

      const result = appendBottleneckHistory("HEAD", diagnosis, tempDir);

      expect(result.appended).toBe(true);

      const historyPath = path.join(tempDir, "docs/business-os/startup-baselines/HEAD/bottleneck-history.jsonl");
      expect(fs.existsSync(historyPath)).toBe(true);

      const content = fs.readFileSync(historyPath, "utf-8");
      const lines = content.trim().split("\n");
      expect(lines).toHaveLength(1);

      const entry: BottleneckEntry = JSON.parse(lines[0]);
      expect(entry.run_id).toBe("R001");
      expect(entry.diagnosis_status).toBe("ok");
      expect(entry.constraint_key).toBe("S3/traffic");
      expect(entry.constraint_stage).toBe("S3");
      expect(entry.constraint_metric).toBe("traffic");
      expect(entry.reason_code).toBeNull();
      expect(entry.severity).toBe("critical");
      expect(entry.timestamp).toBeDefined();
    });

    it("should encode no_bottleneck with constraint_key=none and severity=none", () => {
      const diagnosis = createMockDiagnosis("R002", "HEAD", "no_bottleneck");

      const result = appendBottleneckHistory("HEAD", diagnosis, tempDir);

      expect(result.appended).toBe(true);

      const historyPath = path.join(tempDir, "docs/business-os/startup-baselines/HEAD/bottleneck-history.jsonl");
      const content = fs.readFileSync(historyPath, "utf-8");
      const entry: BottleneckEntry = JSON.parse(content.trim());

      expect(entry.diagnosis_status).toBe("no_bottleneck");
      expect(entry.constraint_key).toBe("none");
      expect(entry.severity).toBe("none");
      expect(entry.constraint_stage).toBeNull();
      expect(entry.constraint_metric).toBeNull();
      expect(entry.reason_code).toBeNull();
    });

    it("should encode insufficient_data with constraint_key=insufficient_data and severity=none", () => {
      const diagnosis = createMockDiagnosis("R003", "HEAD", "insufficient_data");

      const result = appendBottleneckHistory("HEAD", diagnosis, tempDir);

      expect(result.appended).toBe(true);

      const historyPath = path.join(tempDir, "docs/business-os/startup-baselines/HEAD/bottleneck-history.jsonl");
      const content = fs.readFileSync(historyPath, "utf-8");
      const entry: BottleneckEntry = JSON.parse(content.trim());

      expect(entry.diagnosis_status).toBe("insufficient_data");
      expect(entry.constraint_key).toBe("insufficient_data");
      expect(entry.severity).toBe("none");
      expect(entry.constraint_stage).toBeNull();
      expect(entry.constraint_metric).toBeNull();
      expect(entry.reason_code).toBeNull();
    });
  });

  describe("TC-02: Idempotent duplicate", () => {
    it("should skip append for duplicate run_id", () => {
      const diagnosis = createMockDiagnosis("R001", "HEAD", "ok", "S3/traffic", "S3", "traffic");

      const result1 = appendBottleneckHistory("HEAD", diagnosis, tempDir);
      expect(result1.appended).toBe(true);

      const result2 = appendBottleneckHistory("HEAD", diagnosis, tempDir);
      expect(result2.appended).toBe(false);

      const historyPath = path.join(tempDir, "docs/business-os/startup-baselines/HEAD/bottleneck-history.jsonl");
      const content = fs.readFileSync(historyPath, "utf-8");
      const lines = content.trim().split("\n");
      expect(lines).toHaveLength(1);
    });
  });

  describe("TC-03: Rolling window", () => {
    it("should return last N entries in order", () => {
      // Append 5 entries
      for (let i = 1; i <= 5; i++) {
        const diagnosis = createMockDiagnosis(
          `R00${i}`,
          "HEAD",
          "ok",
          `S3/traffic${i}`,
          "S3",
          "traffic"
        );
        appendBottleneckHistory("HEAD", diagnosis, tempDir);
      }

      const recent = getRecentBottlenecks("HEAD", 3, tempDir);

      expect(recent).toHaveLength(3);
      expect(recent[0].run_id).toBe("R003");
      expect(recent[1].run_id).toBe("R004");
      expect(recent[2].run_id).toBe("R005");
    });

    it("should return all entries if N is greater than total", () => {
      for (let i = 1; i <= 3; i++) {
        const diagnosis = createMockDiagnosis(`R00${i}`, "HEAD", "ok", `S3/traffic${i}`, "S3", "traffic");
        appendBottleneckHistory("HEAD", diagnosis, tempDir);
      }

      const recent = getRecentBottlenecks("HEAD", 10, tempDir);

      expect(recent).toHaveLength(3);
      expect(recent[0].run_id).toBe("R001");
      expect(recent[1].run_id).toBe("R002");
      expect(recent[2].run_id).toBe("R003");
    });

    it("should return empty array for non-existent history", () => {
      const recent = getRecentBottlenecks("NONEXISTENT", 5, tempDir);

      expect(recent).toEqual([]);
    });
  });

  describe("TC-04: Persistent constraint", () => {
    it("should return persistent=true when last N have same constraint_key", () => {
      for (let i = 1; i <= 5; i++) {
        const diagnosis = createMockDiagnosis(`R00${i}`, "HEAD", "ok", "S3/traffic", "S3", "traffic");
        appendBottleneckHistory("HEAD", diagnosis, tempDir);
      }

      const persistence = checkConstraintPersistence("HEAD", 3, tempDir);

      expect(persistence.persistent).toBe(true);
      expect(persistence.constraint_key).toBe("S3/traffic");
    });

    it("should work with N=1", () => {
      const diagnosis = createMockDiagnosis("R001", "HEAD", "ok", "S3/traffic", "S3", "traffic");
      appendBottleneckHistory("HEAD", diagnosis, tempDir);

      const persistence = checkConstraintPersistence("HEAD", 1, tempDir);

      expect(persistence.persistent).toBe(true);
      expect(persistence.constraint_key).toBe("S3/traffic");
    });
  });

  describe("TC-05: Non-persistent", () => {
    it("should return persistent=false for mixed constraint_keys", () => {
      const diagnoses = [
        createMockDiagnosis("R001", "HEAD", "ok", "S3/traffic", "S3", "traffic"),
        createMockDiagnosis("R002", "HEAD", "ok", "S3/cvr", "S3", "cvr"),
        createMockDiagnosis("R003", "HEAD", "ok", "S3/traffic", "S3", "traffic"),
      ];

      diagnoses.forEach((d) => appendBottleneckHistory("HEAD", d, tempDir));

      const persistence = checkConstraintPersistence("HEAD", 3, tempDir);

      expect(persistence.persistent).toBe(false);
      expect(persistence.constraint_key).toBeNull();
    });
  });

  describe("TC-06: Empty history", () => {
    it("should return persistent=false and null key for empty history", () => {
      const persistence = checkConstraintPersistence("NONEXISTENT", 3, tempDir);

      expect(persistence.persistent).toBe(false);
      expect(persistence.constraint_key).toBeNull();
    });

    it("should return persistent=false when N exceeds history length", () => {
      const diagnosis = createMockDiagnosis("R001", "HEAD", "ok", "S3/traffic", "S3", "traffic");
      appendBottleneckHistory("HEAD", diagnosis, tempDir);

      const persistence = checkConstraintPersistence("HEAD", 5, tempDir);

      expect(persistence.persistent).toBe(false);
      expect(persistence.constraint_key).toBeNull();
    });
  });

  describe("TC-07: No-bottleneck breaker", () => {
    it("should break persistence when none appears in window", () => {
      const diagnoses = [
        createMockDiagnosis("R001", "HEAD", "ok", "S3/traffic", "S3", "traffic"),
        createMockDiagnosis("R002", "HEAD", "ok", "S3/traffic", "S3", "traffic"),
        createMockDiagnosis("R003", "HEAD", "no_bottleneck"),
        createMockDiagnosis("R004", "HEAD", "ok", "S3/traffic", "S3", "traffic"),
      ];

      diagnoses.forEach((d) => appendBottleneckHistory("HEAD", d, tempDir));

      const persistence = checkConstraintPersistence("HEAD", 3, tempDir);

      expect(persistence.persistent).toBe(false);
      expect(persistence.constraint_key).toBeNull();
    });

    it("should break persistence when insufficient_data appears in window", () => {
      const diagnoses = [
        createMockDiagnosis("R001", "HEAD", "ok", "S3/traffic", "S3", "traffic"),
        createMockDiagnosis("R002", "HEAD", "insufficient_data"),
        createMockDiagnosis("R003", "HEAD", "ok", "S3/traffic", "S3", "traffic"),
        createMockDiagnosis("R004", "HEAD", "ok", "S3/traffic", "S3", "traffic"),
      ];

      diagnoses.forEach((d) => appendBottleneckHistory("HEAD", d, tempDir));

      const persistence = checkConstraintPersistence("HEAD", 3, tempDir);

      expect(persistence.persistent).toBe(false);
      expect(persistence.constraint_key).toBeNull();
    });

    it("should return persistent=true when all last N are same non-breaker constraint", () => {
      const diagnoses = [
        createMockDiagnosis("R001", "HEAD", "no_bottleneck"),
        createMockDiagnosis("R002", "HEAD", "ok", "S3/traffic", "S3", "traffic"),
        createMockDiagnosis("R003", "HEAD", "ok", "S3/traffic", "S3", "traffic"),
        createMockDiagnosis("R004", "HEAD", "ok", "S3/traffic", "S3", "traffic"),
      ];

      diagnoses.forEach((d) => appendBottleneckHistory("HEAD", d, tempDir));

      const persistence = checkConstraintPersistence("HEAD", 3, tempDir);

      expect(persistence.persistent).toBe(true);
      expect(persistence.constraint_key).toBe("S3/traffic");
    });
  });

  describe("Stage blocked constraints", () => {
    it("should handle stage_blocked constraint with reason_code", () => {
      const diagnosis: DiagnosisSnapshot = {
        diagnosis_schema_version: "v1",
        constraint_key_version: "v1",
        metric_catalog_version: "v1",
        run_id: "R001",
        business: "HEAD",
        timestamp: new Date().toISOString(),
        diagnosis_status: "ok",
        data_quality: {
          missing_targets: [],
          missing_actuals: [],
          excluded_metrics: [],
        },
        funnel_metrics: {},
        identified_constraint: {
          constraint_key: "S2/stage_blocked/data_missing",
          constraint_type: "stage_blocked",
          stage: "S2",
          metric: null,
          reason_code: "data_missing",
          severity: "critical",
          miss: 1.0,
          reasoning: "Stage blocked",
        },
        ranked_constraints: [],
        comparison_to_prior_run: null,
      };

      const result = appendBottleneckHistory("HEAD", diagnosis, tempDir);

      expect(result.appended).toBe(true);

      const historyPath = path.join(tempDir, "docs/business-os/startup-baselines/HEAD/bottleneck-history.jsonl");
      const content = fs.readFileSync(historyPath, "utf-8");
      const entry: BottleneckEntry = JSON.parse(content.trim());

      expect(entry.constraint_key).toBe("S2/stage_blocked/data_missing");
      expect(entry.constraint_stage).toBe("S2");
      expect(entry.constraint_metric).toBeNull();
      expect(entry.reason_code).toBe("data_missing");
      expect(entry.severity).toBe("critical");
    });
  });
});
