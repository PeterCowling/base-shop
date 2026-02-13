/**
 * BL-04 Tests: Diagnosis snapshot generation with deterministic prior comparison
 *
 * Test coverage:
 * - TC-01: Happy path with prior run — snapshot includes populated comparison
 * - TC-02: Constraint changed — prior S6B/cac, current S3/cvr → constraint_changed=true
 * - TC-03: First run — no prior → comparison_to_prior_run=null
 * - TC-04: Deterministic prior selection — unsorted directory still picks correct prior
 * - TC-05: Write path — snapshot written to canonical path with valid JSON
 * - TC-06: Skip invalid prior — prior run without diagnosis snapshot is skipped
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { generateDiagnosisSnapshot } from "../diagnosis-snapshot";

describe("BL-04: Diagnosis Snapshot Generation", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "diagnosis-snapshot-test-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  /**
   * Helper: Create run directory with manifest and artifacts
   */
  function createRunFixture(
    business: string,
    runId: string,
    opts: {
      s3Forecast?: Record<string, number>;
      s10Readout?: { actuals: Record<string, number>; targets: Record<string, number> };
      blockedStages?: Array<{ stage: string; reason: string; timestamp: string }>;
      priorDiagnosis?: any;
    } = {}
  ): void {
    const runDir = path.join(tempDir, "docs/business-os/startup-baselines", business, "runs", runId);
    fs.mkdirSync(runDir, { recursive: true });

    // Create baseline manifest
    const manifest = {
      schema_version: 1,
      run_id: runId,
      business,
      created_at: new Date().toISOString(),
      loop_spec_version: "v1",
      stages: {},
    };
    fs.writeFileSync(path.join(runDir, "baseline.manifest.json"), JSON.stringify(manifest, null, 2));

    // Create S3 stage-result with forecast artifact pointer
    if (opts.s3Forecast) {
      const s3StageResult = {
        schema_version: 1,
        run_id: runId,
        stage: "S3",
        status: "completed",
        artifacts: { forecast: "s3-forecast.json" },
      };
      fs.writeFileSync(path.join(runDir, "stage-result-S3.json"), JSON.stringify(s3StageResult, null, 2));

      const forecastData = { targets: opts.s3Forecast };
      fs.writeFileSync(path.join(runDir, "s3-forecast.json"), JSON.stringify(forecastData, null, 2));
    }

    // Create S10 stage-result with readout artifact pointer
    if (opts.s10Readout) {
      const s10StageResult = {
        schema_version: 1,
        run_id: runId,
        stage: "S10",
        status: "completed",
        artifacts: { readout: "s10-readout.json" },
      };
      fs.writeFileSync(path.join(runDir, "stage-result-S10.json"), JSON.stringify(s10StageResult, null, 2));

      fs.writeFileSync(path.join(runDir, "s10-readout.json"), JSON.stringify(opts.s10Readout, null, 2));
    }

    // Create events ledger with blocked stages
    if (opts.blockedStages) {
      const events = opts.blockedStages.map((blocked) => ({
        schema_version: 1,
        event: "stage_blocked",
        run_id: runId,
        stage: blocked.stage,
        timestamp: blocked.timestamp,
        loop_spec_version: "v1",
        artifacts: null,
        blocking_reason: blocked.reason,
      }));
      fs.writeFileSync(path.join(runDir, "events.jsonl"), events.map((e) => JSON.stringify(e)).join("\n"));
    }

    // Create prior diagnosis snapshot if provided
    if (opts.priorDiagnosis) {
      fs.writeFileSync(
        path.join(runDir, "bottleneck-diagnosis.json"),
        JSON.stringify(opts.priorDiagnosis, null, 2)
      );
    }
  }

  // TC-01: Happy path with prior run — snapshot includes populated comparison
  test("TC-01: Happy path with prior run", () => {
    const business = "HEAD";
    const priorRunId = "SFS-HEAD-20260206-1200";
    const currentRunId = "SFS-HEAD-20260213-1500";

    // Create prior run with diagnosis
    createRunFixture(business, priorRunId, {
      s3Forecast: { traffic: 10000, cvr: 0.05, aov: 150, cac: 50 },
      s10Readout: {
        actuals: { traffic: 9000, cvr: 0.03, aov: 145, cac: 45, orders: 270, revenue: 39150 },
        targets: { orders: 500, revenue: 75000 },
      },
      priorDiagnosis: {
        diagnosis_schema_version: "v1",
        run_id: priorRunId,
        business,
        timestamp: "2026-02-06T12:30:00Z",
        diagnosis_status: "ok",
        identified_constraint: {
          constraint_key: "S3/cvr",
          constraint_type: "metric",
          stage: "S3",
          metric: "cvr",
          reason_code: null,
          severity: "critical",
          miss: 0.40,
        },
        funnel_metrics: {
          traffic: { miss: 0.10 },
          cvr: { miss: 0.40 },
          aov: { miss: 0.033 },
          cac: { miss: 0.0 },
          orders: { miss: 0.46 },
          revenue: { miss: 0.478 },
        },
      },
    });

    // Create current run
    createRunFixture(business, currentRunId, {
      s3Forecast: { traffic: 10000, cvr: 0.05, aov: 150, cac: 50 },
      s10Readout: {
        actuals: { traffic: 8500, cvr: 0.025, aov: 145, cac: 45, orders: 213, revenue: 30885 },
        targets: { orders: 500, revenue: 75000 },
      },
    });

    const snapshot = generateDiagnosisSnapshot(currentRunId, business, tempDir);

    // Verify snapshot structure
    expect(snapshot.diagnosis_schema_version).toBe("v1");
    expect(snapshot.run_id).toBe(currentRunId);
    expect(snapshot.business).toBe(business);
    expect(snapshot.diagnosis_status).toBe("ok");

    // Verify identified constraint
    expect(snapshot.identified_constraint).not.toBeNull();
    expect(snapshot.identified_constraint?.constraint_key).toBe("S3/cvr");

    // Verify comparison to prior run
    expect(snapshot.comparison_to_prior_run).not.toBeNull();
    expect(snapshot.comparison_to_prior_run?.prior_run_id).toBe(priorRunId);
    expect(snapshot.comparison_to_prior_run?.constraint_changed).toBe(false);
    expect(snapshot.comparison_to_prior_run?.prior_constraint_key).toBe("S3/cvr");
    expect(snapshot.comparison_to_prior_run?.metric_trends).toBeDefined();
    expect(snapshot.comparison_to_prior_run?.metric_trends.cvr).toBe("worsening");

    // Verify file written
    const snapshotPath = path.join(
      tempDir,
      "docs/business-os/startup-baselines",
      business,
      "runs",
      currentRunId,
      "bottleneck-diagnosis.json"
    );
    expect(fs.existsSync(snapshotPath)).toBe(true);

    const savedSnapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
    expect(savedSnapshot.run_id).toBe(currentRunId);
  });

  // TC-02: Constraint changed — prior S6B/cac, current S3/cvr → constraint_changed=true
  test("TC-02: Constraint changed", () => {
    const business = "BRIK";
    const priorRunId = "SFS-BRIK-20260206-1000";
    const currentRunId = "SFS-BRIK-20260213-1000";

    // Prior run with S6B/cac constraint
    createRunFixture(business, priorRunId, {
      s3Forecast: { traffic: 5000, cvr: 0.03, aov: 200, cac: 50 },
      s10Readout: {
        actuals: { traffic: 4800, cvr: 0.028, aov: 210, cac: 90, orders: 134, revenue: 28140 },
        targets: { orders: 150, revenue: 30000 },
      },
      priorDiagnosis: {
        diagnosis_schema_version: "v1",
        run_id: priorRunId,
        business,
        timestamp: "2026-02-06T10:45:00Z",
        diagnosis_status: "ok",
        identified_constraint: {
          constraint_key: "S6B/cac",
          constraint_type: "metric",
          stage: "S6B",
          metric: "cac",
          reason_code: null,
          severity: "critical",
          miss: 0.80,
        },
        funnel_metrics: {
          traffic: { miss: 0.04 },
          cvr: { miss: 0.067 },
          aov: { miss: 0.0 },
          cac: { miss: 0.80 },
          orders: { miss: 0.107 },
          revenue: { miss: 0.062 },
        },
      },
    });

    // Current run with S3/cvr constraint
    // CVR miss = (0.03 - 0.012) / 0.03 = 0.60 (critical, higher than orders)
    // Traffic miss = (5000 - 4750) / 5000 = 0.05 (minor, meets threshold)
    // Orders miss = (150 - 57) / 150 = 0.62, but should be filtered due to traffic+cvr being available
    createRunFixture(business, currentRunId, {
      s3Forecast: { traffic: 5000, cvr: 0.03, aov: 200, cac: 50 },
      s10Readout: {
        actuals: { traffic: 4750, cvr: 0.012, aov: 210, cac: 45, orders: 57, revenue: 11970 },
        targets: { orders: 150, revenue: 30000 },
      },
    });

    const snapshot = generateDiagnosisSnapshot(currentRunId, business, tempDir);

    // Verify constraint changed
    expect(snapshot.comparison_to_prior_run).not.toBeNull();
    expect(snapshot.comparison_to_prior_run?.constraint_changed).toBe(true);
    expect(snapshot.comparison_to_prior_run?.prior_constraint_key).toBe("S6B/cac");
    expect(snapshot.identified_constraint?.constraint_key).toBe("S3/cvr");
  });

  // TC-03: First run — no prior → comparison_to_prior_run=null
  test("TC-03: First run (no prior)", () => {
    const business = "PET";
    const runId = "SFS-PET-20260213-1400";

    createRunFixture(business, runId, {
      s3Forecast: { traffic: 8000, cvr: 0.04, aov: 180, cac: 55 },
      s10Readout: {
        actuals: { traffic: 8200, cvr: 0.041, aov: 175, cac: 52, orders: 336, revenue: 58800 },
        targets: { orders: 320, revenue: 57600 },
      },
    });

    const snapshot = generateDiagnosisSnapshot(runId, business, tempDir);

    // Verify no prior comparison
    expect(snapshot.comparison_to_prior_run).toBeNull();
    expect(snapshot.diagnosis_status).toBe("no_bottleneck"); // All metrics near target
  });

  // TC-04: Deterministic prior selection — unsorted directory still picks correct prior
  test("TC-04: Deterministic prior selection", () => {
    const business = "HEAD";
    const run1Id = "SFS-HEAD-20260130-0900";
    const run2Id = "SFS-HEAD-20260206-1200";
    const run3Id = "SFS-HEAD-20260209-1400"; // No diagnosis
    const run4Id = "SFS-HEAD-20260213-1500"; // Current

    // Create runs in random order (filesystem listing order should not matter)
    createRunFixture(business, run3Id, {
      s3Forecast: { traffic: 10000, cvr: 0.05, aov: 150, cac: 50 },
      s10Readout: {
        actuals: { traffic: 9500, cvr: 0.04, aov: 145, cac: 48, orders: 380, revenue: 55100 },
        targets: { orders: 500, revenue: 75000 },
      },
      // No diagnosis snapshot
    });

    createRunFixture(business, run1Id, {
      s3Forecast: { traffic: 10000, cvr: 0.05, aov: 150, cac: 50 },
      s10Readout: {
        actuals: { traffic: 9200, cvr: 0.032, aov: 148, cac: 46, orders: 294, revenue: 43512 },
        targets: { orders: 500, revenue: 75000 },
      },
      priorDiagnosis: {
        diagnosis_schema_version: "v1",
        run_id: run1Id,
        business,
        timestamp: "2026-01-30T09:30:00Z",
        diagnosis_status: "ok",
        identified_constraint: {
          constraint_key: "S3/cvr",
          constraint_type: "metric",
          stage: "S3",
          metric: "cvr",
          reason_code: null,
          severity: "critical",
          miss: 0.36,
        },
        funnel_metrics: {
          traffic: { miss: 0.08 },
          cvr: { miss: 0.36 },
          aov: { miss: 0.013 },
          cac: { miss: 0.0 },
          orders: { miss: 0.412 },
          revenue: { miss: 0.42 },
        },
      },
    });

    createRunFixture(business, run2Id, {
      s3Forecast: { traffic: 10000, cvr: 0.05, aov: 150, cac: 50 },
      s10Readout: {
        actuals: { traffic: 9000, cvr: 0.03, aov: 145, cac: 45, orders: 270, revenue: 39150 },
        targets: { orders: 500, revenue: 75000 },
      },
      priorDiagnosis: {
        diagnosis_schema_version: "v1",
        run_id: run2Id,
        business,
        timestamp: "2026-02-06T12:30:00Z",
        diagnosis_status: "ok",
        identified_constraint: {
          constraint_key: "S3/cvr",
          constraint_type: "metric",
          stage: "S3",
          metric: "cvr",
          reason_code: null,
          severity: "critical",
          miss: 0.40,
        },
        funnel_metrics: {
          traffic: { miss: 0.10 },
          cvr: { miss: 0.40 },
          aov: { miss: 0.033 },
          cac: { miss: 0.0 },
          orders: { miss: 0.46 },
          revenue: { miss: 0.478 },
        },
      },
    });

    createRunFixture(business, run4Id, {
      s3Forecast: { traffic: 10000, cvr: 0.05, aov: 150, cac: 50 },
      s10Readout: {
        actuals: { traffic: 8500, cvr: 0.025, aov: 145, cac: 45, orders: 213, revenue: 30885 },
        targets: { orders: 500, revenue: 75000 },
      },
    });

    const snapshot = generateDiagnosisSnapshot(run4Id, business, tempDir);

    // Should select run2 (most recent prior with diagnosis)
    expect(snapshot.comparison_to_prior_run).not.toBeNull();
    expect(snapshot.comparison_to_prior_run?.prior_run_id).toBe(run2Id);
  });

  // TC-05: Write path — snapshot written to canonical path with valid JSON
  test("TC-05: Write path validation", () => {
    const business = "HEAD";
    const runId = "SFS-HEAD-20260213-1500";

    createRunFixture(business, runId, {
      s3Forecast: { traffic: 10000, cvr: 0.05, aov: 150, cac: 50 },
      s10Readout: {
        actuals: { traffic: 8500, cvr: 0.03, aov: 145, cac: 45, orders: 255, revenue: 36975 },
        targets: { orders: 500, revenue: 75000 },
      },
    });

    const snapshot = generateDiagnosisSnapshot(runId, business, tempDir);

    const expectedPath = path.join(
      tempDir,
      "docs/business-os/startup-baselines",
      business,
      "runs",
      runId,
      "bottleneck-diagnosis.json"
    );

    // Verify file exists at canonical path
    expect(fs.existsSync(expectedPath)).toBe(true);

    // Verify valid JSON
    const savedContent = fs.readFileSync(expectedPath, "utf8");
    const parsed = JSON.parse(savedContent);
    expect(parsed.run_id).toBe(runId);
    expect(parsed.diagnosis_schema_version).toBe("v1");

    // Verify snapshot matches saved content
    expect(parsed).toEqual(snapshot);
  });

  // TC-06: Skip invalid prior — prior run without diagnosis snapshot is skipped
  test("TC-06: Skip invalid prior", () => {
    const business = "BRIK";
    const run1Id = "SFS-BRIK-20260130-1000"; // Has diagnosis
    const run2Id = "SFS-BRIK-20260206-1000"; // No diagnosis (should be skipped)
    const run3Id = "SFS-BRIK-20260209-1200"; // No diagnosis (should be skipped)
    const run4Id = "SFS-BRIK-20260213-1000"; // Current

    createRunFixture(business, run1Id, {
      s3Forecast: { traffic: 5000, cvr: 0.03, aov: 200, cac: 50 },
      s10Readout: {
        actuals: { traffic: 4500, cvr: 0.025, aov: 195, cac: 48, orders: 113, revenue: 22035 },
        targets: { orders: 150, revenue: 30000 },
      },
      priorDiagnosis: {
        diagnosis_schema_version: "v1",
        run_id: run1Id,
        business,
        timestamp: "2026-01-30T10:45:00Z",
        diagnosis_status: "ok",
        identified_constraint: {
          constraint_key: "S3/cvr",
          constraint_type: "metric",
          stage: "S3",
          metric: "cvr",
          reason_code: null,
          severity: "moderate",
          miss: 0.167,
        },
        funnel_metrics: {
          traffic: { miss: 0.10 },
          cvr: { miss: 0.167 },
          aov: { miss: 0.025 },
          cac: { miss: 0.0 },
          orders: { miss: 0.247 },
          revenue: { miss: 0.266 },
        },
      },
    });

    // Create run2 and run3 without diagnosis snapshots
    createRunFixture(business, run2Id, {
      s3Forecast: { traffic: 5000, cvr: 0.03, aov: 200, cac: 50 },
      s10Readout: {
        actuals: { traffic: 4800, cvr: 0.028, aov: 210, cac: 52, orders: 134, revenue: 28140 },
        targets: { orders: 150, revenue: 30000 },
      },
      // No diagnosis
    });

    createRunFixture(business, run3Id, {
      s3Forecast: { traffic: 5000, cvr: 0.03, aov: 200, cac: 50 },
      s10Readout: {
        actuals: { traffic: 4750, cvr: 0.027, aov: 205, cac: 51, orders: 128, revenue: 26240 },
        targets: { orders: 150, revenue: 30000 },
      },
      // No diagnosis
    });

    createRunFixture(business, run4Id, {
      s3Forecast: { traffic: 5000, cvr: 0.03, aov: 200, cac: 50 },
      s10Readout: {
        actuals: { traffic: 4800, cvr: 0.024, aov: 210, cac: 45, orders: 115, revenue: 24150 },
        targets: { orders: 150, revenue: 30000 },
      },
    });

    const snapshot = generateDiagnosisSnapshot(run4Id, business, tempDir);

    // Should skip run2 and run3, select run1 as prior
    expect(snapshot.comparison_to_prior_run).not.toBeNull();
    expect(snapshot.comparison_to_prior_run?.prior_run_id).toBe(run1Id);
  });
});
