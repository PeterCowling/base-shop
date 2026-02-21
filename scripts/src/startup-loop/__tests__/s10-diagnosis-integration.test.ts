/**
 * BL-07 Tests: S10 diagnosis pipeline integration
 *
 * Test coverage:
 * - TC-01: Happy path — S10 completion generates snapshot, updates history, evaluates trigger
 * - TC-02: First run — snapshot generated with null prior comparison, history appended, no trigger
 * - TC-03: Persistence path — 3 persistent moderate+ runs results in open trigger
 * - TC-04: Missing artifact path — generateDiagnosisSnapshot throws, pipeline logs warning and returns partial result
 * - TC-05: Stage-result artifact pointer — bottleneck_diagnosis path present in stage-result JSON after pipeline completes
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { appendBottleneckHistory, checkConstraintPersistence } from "../bottleneck-history";
import { type DiagnosisSnapshot } from "../diagnosis-snapshot";
import { generateDiagnosisSnapshot } from "../diagnosis-snapshot";
import { runMcpPreflight } from "../mcp-preflight";
import { checkAndTriggerReplan, type ReplanTrigger } from "../replan-trigger";
import { runDiagnosisPipeline } from "../s10-diagnosis-integration";

// Mock the imported modules
jest.mock("../diagnosis-snapshot");
jest.mock("../bottleneck-history");
jest.mock("../replan-trigger");
jest.mock("../mcp-preflight");

const mockGenerateDiagnosisSnapshot = generateDiagnosisSnapshot as jest.MockedFunction<
  typeof generateDiagnosisSnapshot
>;
const mockAppendBottleneckHistory = appendBottleneckHistory as jest.MockedFunction<
  typeof appendBottleneckHistory
>;
const mockCheckConstraintPersistence = checkConstraintPersistence as jest.MockedFunction<
  typeof checkConstraintPersistence
>;
const mockCheckAndTriggerReplan = checkAndTriggerReplan as jest.MockedFunction<
  typeof checkAndTriggerReplan
>;
const mockRunMcpPreflight = runMcpPreflight as jest.MockedFunction<
  typeof runMcpPreflight
>;

describe("BL-07: S10 Diagnosis Pipeline Integration", () => {
  let tempDir: string;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "s10-diagnosis-integration-test-"));
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    jest.clearAllMocks();
    mockRunMcpPreflight.mockReturnValue({
      ok: true,
      profile: "local",
      errors: [],
      warnings: [],
      checks: [],
    });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    consoleWarnSpy.mockRestore();
  });

  /**
   * Helper: Create mock diagnosis snapshot
   */
  function createMockSnapshot(
    runId: string,
    business: string,
    constraintKey: string | null = "S3/cvr",
    severity: "critical" | "moderate" | "minor" | "none" = "moderate"
  ): DiagnosisSnapshot {
    return {
      diagnosis_schema_version: "v1",
      constraint_key_version: "v1",
      metric_catalog_version: "v1",
      run_id: runId,
      business,
      timestamp: new Date().toISOString(),
      diagnosis_status: constraintKey ? "ok" : "no_bottleneck",
      data_quality: {
        missing_targets: [],
        missing_actuals: [],
        excluded_metrics: [],
      },
      funnel_metrics: {
        traffic: { target: 1000, actual: 800, miss: -0.2 },
        cvr: { target: 0.05, actual: 0.03, miss: -0.4 },
        aov: { target: 100, actual: 95, miss: -0.05 },
        cac: { target: 50, actual: 55, miss: 0.1 },
        orders: { target: 40, actual: 24, miss: -0.4 },
        revenue: { target: 4000, actual: 2280, miss: -0.43 },
      },
      identified_constraint: constraintKey
        ? {
            constraint_key: constraintKey,
            stage: "S3",
            metric: "cvr",
            severity,
            reason_code: "highest_miss",
            ranked_metrics: [],
          }
        : null,
      ranked_constraints: [],
      comparison_to_prior_run: null,
    };
  }

  /**
   * Helper: Create stage-result directory
   */
  function createStageResultDir(business: string, runId: string): string {
    const stageResultDir = path.join(
      tempDir,
      "docs/business-os/startup-baselines",
      business,
      "runs",
      runId,
      "stages/S10"
    );
    fs.mkdirSync(stageResultDir, { recursive: true });
    return stageResultDir;
  }

  /**
   * TC-01: Happy path — S10 completion generates snapshot, updates history, evaluates trigger
   */
  test("TC-01: happy path pipeline execution", async () => {
    const runId = "2026-02-13-001";
    const business = "HEAD";

    // Setup mocks
    const mockSnapshot = createMockSnapshot(runId, business, "S3/cvr", "moderate");
    mockGenerateDiagnosisSnapshot.mockReturnValue(mockSnapshot);
    mockAppendBottleneckHistory.mockReturnValue({ appended: true });
    mockCheckConstraintPersistence.mockReturnValue({ persistent: false, constraint_key: null });
    mockCheckAndTriggerReplan.mockReturnValue(null);

    // Create stage-result directory
    createStageResultDir(business, runId);

    // Execute pipeline
    const result = await runDiagnosisPipeline(runId, business, { baseDir: tempDir });

    // Verify all pipeline steps were called
    expect(mockGenerateDiagnosisSnapshot).toHaveBeenCalledWith(runId, business, tempDir);
    expect(mockAppendBottleneckHistory).toHaveBeenCalledWith(business, mockSnapshot, tempDir);
    expect(mockCheckAndTriggerReplan).toHaveBeenCalledWith(business, mockSnapshot, {
      baseDir: tempDir,
    });

    // Verify result structure
    expect(result.snapshot).toEqual(mockSnapshot);
    expect(result.historyAppended).toBe(true);
    expect(result.persistenceCheck).toEqual({ persistent: false, constraint_key: null });
    expect(result.replanTrigger).toBeNull();
    expect(result.artifactPointer).toBe("bottleneck-diagnosis.json");
    expect(result.warnings).toEqual([]);

    // Verify stage-result artifact pointer was written
    const stageResultPath = path.join(
      tempDir,
      "docs/business-os/startup-baselines",
      business,
      "runs",
      runId,
      "stages/S10/stage-result.json"
    );
    expect(fs.existsSync(stageResultPath)).toBe(true);

    const stageResult = JSON.parse(fs.readFileSync(stageResultPath, "utf-8"));
    expect(stageResult.artifacts.bottleneck_diagnosis).toBe("bottleneck-diagnosis.json");
  });

  /**
   * TC-02: First run — snapshot generated with null prior comparison, history appended, no trigger
   */
  test("TC-02: first run with no prior", async () => {
    const runId = "2026-02-13-001";
    const business = "HEAD";

    // Setup mocks — first run scenario
    const mockSnapshot = createMockSnapshot(runId, business, "S6B/traffic", "moderate");
    mockSnapshot.comparison_to_prior_run = null;

    mockGenerateDiagnosisSnapshot.mockReturnValue(mockSnapshot);
    mockAppendBottleneckHistory.mockReturnValue({ appended: true });
    mockCheckConstraintPersistence.mockReturnValue({ persistent: false, constraint_key: null });
    mockCheckAndTriggerReplan.mockReturnValue(null);

    // Create stage-result directory
    createStageResultDir(business, runId);

    // Execute pipeline
    const result = await runDiagnosisPipeline(runId, business, { baseDir: tempDir });

    // Verify snapshot has null comparison (first run)
    expect(result.snapshot.comparison_to_prior_run).toBeNull();

    // Verify history was appended
    expect(result.historyAppended).toBe(true);

    // Verify no trigger (not enough persistence)
    expect(result.replanTrigger).toBeNull();
    expect(result.persistenceCheck.persistent).toBe(false);

    // Verify no warnings
    expect(result.warnings).toEqual([]);
  });

  /**
   * TC-03: Persistence path — 3 persistent moderate+ runs results in open trigger
   */
  test("TC-03: persistent constraint triggers replan", async () => {
    const runId = "2026-02-13-003";
    const business = "HEAD";

    // Setup mocks — persistent constraint scenario
    const mockSnapshot = createMockSnapshot(runId, business, "S3/cvr", "moderate");
    const mockTrigger: ReplanTrigger = {
      status: "open",
      created_at: new Date().toISOString(),
      last_evaluated_at: new Date().toISOString(),
      resolved_at: null,
      reopened_count: 0,
      last_reopened_at: null,
      constraint: {
        constraint_key: "S3/cvr",
        stage: "S3",
        metric: "cvr",
        severity: "moderate",
      },
      run_history: ["2026-02-13-001", "2026-02-13-002", "2026-02-13-003"],
      reason: "Constraint S3/cvr persisted for 3 runs with moderate severity",
      recommended_focus: "Improve conversion rate through offer clarity, trust signals, or checkout optimization",
      min_severity: "moderate",
      persistence_threshold: 3,
      non_persistent_count: 0,
    };

    mockGenerateDiagnosisSnapshot.mockReturnValue(mockSnapshot);
    mockAppendBottleneckHistory.mockReturnValue({ appended: true });
    mockCheckConstraintPersistence.mockReturnValue({ persistent: true, constraint_key: "S3/cvr" });
    mockCheckAndTriggerReplan.mockReturnValue(mockTrigger);

    // Create stage-result directory
    createStageResultDir(business, runId);

    // Execute pipeline
    const result = await runDiagnosisPipeline(runId, business, { baseDir: tempDir });

    // Verify persistence check returned persistent
    expect(result.persistenceCheck.persistent).toBe(true);
    expect(result.persistenceCheck.constraint_key).toBe("S3/cvr");

    // Verify trigger was created
    expect(result.replanTrigger).toEqual(mockTrigger);
    expect(result.replanTrigger?.status).toBe("open");
    expect(result.replanTrigger?.constraint.constraint_key).toBe("S3/cvr");

    // Verify no warnings
    expect(result.warnings).toEqual([]);
  });

  /**
   * TC-04: Missing artifact path — generateDiagnosisSnapshot throws, pipeline logs warning and returns partial result
   */
  test("TC-04: pipeline continues on diagnosis snapshot error", async () => {
    const runId = "2026-02-13-001";
    const business = "HEAD";

    // Setup mocks — snapshot generation fails
    const error = new Error("Missing S10 readout artifact");
    mockGenerateDiagnosisSnapshot.mockImplementation(() => {
      throw error;
    });

    // Create stage-result directory
    createStageResultDir(business, runId);

    // Execute pipeline — should not throw
    const result = await runDiagnosisPipeline(runId, business, { baseDir: tempDir });

    // Verify snapshot is null
    expect(result.snapshot).toBeNull();

    // Verify downstream steps were not called
    expect(mockAppendBottleneckHistory).not.toHaveBeenCalled();
    expect(mockCheckAndTriggerReplan).not.toHaveBeenCalled();

    // Verify partial result returned
    expect(result.historyAppended).toBe(false);
    expect(result.persistenceCheck).toBeNull();
    expect(result.replanTrigger).toBeNull();

    // Verify warning was logged
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("Diagnosis snapshot generation failed");
    expect(result.warnings[0]).toContain("Missing S10 readout artifact");

    // Verify console.warn was called
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Diagnosis snapshot generation failed")
    );

    // Verify stage-result was NOT written (since snapshot failed)
    const stageResultPath = path.join(
      tempDir,
      "docs/business-os/startup-baselines",
      business,
      "runs",
      runId,
      "stages/S10/stage-result.json"
    );
    expect(fs.existsSync(stageResultPath)).toBe(false);
  });

  /**
   * TC-05: Stage-result artifact pointer — bottleneck_diagnosis path present in stage-result JSON after pipeline completes
   */
  test("TC-05: stage-result artifact pointer is written", async () => {
    const runId = "2026-02-13-001";
    const business = "HEAD";

    // Setup mocks
    const mockSnapshot = createMockSnapshot(runId, business, "S3/cvr", "moderate");
    mockGenerateDiagnosisSnapshot.mockReturnValue(mockSnapshot);
    mockAppendBottleneckHistory.mockReturnValue({ appended: true });
    mockCheckConstraintPersistence.mockReturnValue({ persistent: false, constraint_key: null });
    mockCheckAndTriggerReplan.mockReturnValue(null);

    // Create stage-result directory with existing stage-result.json
    const stageResultDir = createStageResultDir(business, runId);
    const existingStageResult = {
      stage: "S10",
      status: "completed",
      artifacts: {
        readout: "readout.json",
      },
    };
    fs.writeFileSync(
      path.join(stageResultDir, "stage-result.json"),
      JSON.stringify(existingStageResult, null, 2)
    );

    // Execute pipeline
    await runDiagnosisPipeline(runId, business, { baseDir: tempDir });

    // Verify stage-result was updated (not overwritten)
    const stageResultPath = path.join(stageResultDir, "stage-result.json");
    const updatedStageResult = JSON.parse(fs.readFileSync(stageResultPath, "utf-8"));

    // Verify existing fields preserved
    expect(updatedStageResult.stage).toBe("S10");
    expect(updatedStageResult.status).toBe("completed");
    expect(updatedStageResult.artifacts.readout).toBe("readout.json");

    // Verify new artifact pointer added
    expect(updatedStageResult.artifacts.bottleneck_diagnosis).toBe("bottleneck-diagnosis.json");
  });

  /**
   * TC-05b: Stage-result created if missing
   */
  test("TC-05b: stage-result created if missing", async () => {
    const runId = "2026-02-13-001";
    const business = "HEAD";

    // Setup mocks
    const mockSnapshot = createMockSnapshot(runId, business, "S3/cvr", "moderate");
    mockGenerateDiagnosisSnapshot.mockReturnValue(mockSnapshot);
    mockAppendBottleneckHistory.mockReturnValue({ appended: true });
    mockCheckConstraintPersistence.mockReturnValue({ persistent: false, constraint_key: null });
    mockCheckAndTriggerReplan.mockReturnValue(null);

    // Create stage-result directory WITHOUT existing stage-result.json
    createStageResultDir(business, runId);

    // Execute pipeline
    await runDiagnosisPipeline(runId, business, { baseDir: tempDir });

    // Verify stage-result was created
    const stageResultPath = path.join(
      tempDir,
      "docs/business-os/startup-baselines",
      business,
      "runs",
      runId,
      "stages/S10/stage-result.json"
    );
    expect(fs.existsSync(stageResultPath)).toBe(true);

    const stageResult = JSON.parse(fs.readFileSync(stageResultPath, "utf-8"));
    expect(stageResult.artifacts.bottleneck_diagnosis).toBe("bottleneck-diagnosis.json");
  });

  /**
   * TC-06: History append failure — pipeline continues and logs warning
   */
  test("TC-06: pipeline continues on history append error", async () => {
    const runId = "2026-02-13-001";
    const business = "HEAD";

    // Setup mocks — history append fails
    const mockSnapshot = createMockSnapshot(runId, business, "S3/cvr", "moderate");
    mockGenerateDiagnosisSnapshot.mockReturnValue(mockSnapshot);
    mockAppendBottleneckHistory.mockImplementation(() => {
      throw new Error("EACCES: permission denied");
    });
    mockCheckConstraintPersistence.mockReturnValue({ persistent: false, constraint_key: null });
    mockCheckAndTriggerReplan.mockReturnValue(null);

    // Create stage-result directory
    createStageResultDir(business, runId);

    // Execute pipeline — should not throw
    const result = await runDiagnosisPipeline(runId, business, { baseDir: tempDir });

    // Verify snapshot was generated
    expect(result.snapshot).toEqual(mockSnapshot);

    // Verify historyAppended is false
    expect(result.historyAppended).toBe(false);

    // Verify warning was logged
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("History append failed");
    expect(result.warnings[0]).toContain("EACCES: permission denied");

    // Verify downstream steps still executed
    expect(mockCheckAndTriggerReplan).toHaveBeenCalled();

    // Verify stage-result was still written
    const stageResultPath = path.join(
      tempDir,
      "docs/business-os/startup-baselines",
      business,
      "runs",
      runId,
      "stages/S10/stage-result.json"
    );
    expect(fs.existsSync(stageResultPath)).toBe(true);
  });

  /**
   * TC-07: Replan trigger evaluation failure — pipeline continues and logs warning
   */
  test("TC-07: pipeline continues on replan trigger error", async () => {
    const runId = "2026-02-13-001";
    const business = "HEAD";

    // Setup mocks — replan trigger fails
    const mockSnapshot = createMockSnapshot(runId, business, "S3/cvr", "moderate");
    mockGenerateDiagnosisSnapshot.mockReturnValue(mockSnapshot);
    mockAppendBottleneckHistory.mockReturnValue({ appended: true });
    mockCheckConstraintPersistence.mockReturnValue({ persistent: true, constraint_key: "S3/cvr" });
    mockCheckAndTriggerReplan.mockImplementation(() => {
      throw new Error("Failed to write trigger file");
    });

    // Create stage-result directory
    createStageResultDir(business, runId);

    // Execute pipeline — should not throw
    const result = await runDiagnosisPipeline(runId, business, { baseDir: tempDir });

    // Verify snapshot and history were successful
    expect(result.snapshot).toEqual(mockSnapshot);
    expect(result.historyAppended).toBe(true);

    // Verify replanTrigger is null
    expect(result.replanTrigger).toBeNull();

    // Verify warning was logged
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("Replan trigger evaluation failed");
    expect(result.warnings[0]).toContain("Failed to write trigger file");

    // Verify stage-result was still written
    const stageResultPath = path.join(
      tempDir,
      "docs/business-os/startup-baselines",
      business,
      "runs",
      runId,
      "stages/S10/stage-result.json"
    );
    expect(fs.existsSync(stageResultPath)).toBe(true);
  });

  test("TC-08: MCP preflight advisories are recorded when enabled", async () => {
    const runId = "2026-02-13-001";
    const business = "HEAD";

    const mockSnapshot = createMockSnapshot(runId, business, "S3/cvr", "moderate");
    mockGenerateDiagnosisSnapshot.mockReturnValue(mockSnapshot);
    mockAppendBottleneckHistory.mockReturnValue({ appended: true });
    mockCheckConstraintPersistence.mockReturnValue({ persistent: false, constraint_key: null });
    mockCheckAndTriggerReplan.mockReturnValue(null);

    mockRunMcpPreflight.mockReturnValue({
      ok: true,
      profile: "ci",
      errors: [],
      warnings: [
        {
          code: "MCP_PREFLIGHT_ARTIFACTS_MISSING",
          message: "No startup-loop artifacts found for freshness evaluation.",
        },
      ],
      checks: [
        {
          id: "registration",
          status: "pass",
          message: "ok",
        },
      ],
    });

    createStageResultDir(business, runId);

    const result = await runDiagnosisPipeline(runId, business, {
      baseDir: tempDir,
      mcpPreflight: {
        enabled: true,
        profile: "ci",
      },
    });

    expect(mockRunMcpPreflight).toHaveBeenCalledWith(
      {
        profile: "ci",
        repoRoot: tempDir,
      },
      process.env,
    );
    expect(result.warnings.some((warning) => warning.includes("MCP preflight reported advisory warnings"))).toBe(
      true,
    );
  });
});
