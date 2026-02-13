import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { afterEach,beforeEach, describe, expect, it } from "@jest/globals";

import { extractFunnelMetrics, type FunnelMetricsInput } from "../funnel-metrics-extractor";

/**
 * BL-02: Funnel metrics extraction into canonical diagnosis input shape
 *
 * Tests cover:
 * - TC-01: Happy path — valid S3 + S10 + events produce complete FunnelMetricsInput
 * - TC-02: Missing S10 — targets present, actuals/miss null for unavailable metrics
 * - TC-03: Malformed S3 JSON — warning logged, S3-dependent fields null
 * - TC-04: Event parsing — stage_blocked events normalize to reason_code values
 * - TC-05: Directionality — CAC above target yields positive miss; CVR below target yields positive miss
 * - TC-06: Pointer-based reads — manifest/stage-result pointers are used
 */

describe("extractFunnelMetrics", () => {
  let tempDir: string;
  let businessDir: string;
  let runDir: string;

  beforeEach(() => {
    // Create temporary directory structure for fixtures
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "funnel-metrics-test-"));
    businessDir = path.join(tempDir, "docs/business-os/startup-baselines/TEST");
    runDir = path.join(businessDir, "runs/SFS-TEST-20260213-1200");
    fs.mkdirSync(runDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // TC-01: Happy path — valid S3 + S10 + events produce complete FunnelMetricsInput
  describe("TC-01: happy path", () => {
    it("produces complete FunnelMetricsInput from valid S3, S10, and events", () => {
      // Write manifest with artifact pointers
      const manifest = {
        schema_version: 1,
        run_id: "SFS-TEST-20260213-1200",
        business: "TEST",
        created_at: "2026-02-13T12:00:00Z",
        loop_spec_version: "1.0.0",
        stages: {},
      };
      fs.writeFileSync(
        path.join(runDir, "baseline.manifest.json"),
        JSON.stringify(manifest, null, 2)
      );

      // Write S3 stage-result with forecast targets
      const s3StageResult = {
        stage: "S3",
        status: "completed",
        artifacts: {
          forecast: "stages/S3/forecast.json",
        },
      };
      const s3Dir = path.join(runDir, "stages/S3");
      fs.mkdirSync(s3Dir, { recursive: true });
      fs.writeFileSync(
        path.join(runDir, "stage-result-S3.json"),
        JSON.stringify(s3StageResult, null, 2)
      );

      // Write S3 forecast artifact with targets
      const s3Forecast = {
        targets: {
          traffic: 10000,
          cvr: 0.05,
          aov: 150,
          cac: 50,
        },
      };
      fs.writeFileSync(
        path.join(s3Dir, "forecast.json"),
        JSON.stringify(s3Forecast, null, 2)
      );

      // Write S10 stage-result with readout actuals
      const s10StageResult = {
        stage: "S10",
        status: "completed",
        artifacts: {
          readout: "stages/S10/readout.json",
        },
      };
      const s10Dir = path.join(runDir, "stages/S10");
      fs.mkdirSync(s10Dir, { recursive: true });
      fs.writeFileSync(
        path.join(runDir, "stage-result-S10.json"),
        JSON.stringify(s10StageResult, null, 2)
      );

      // Write S10 readout artifact with actuals and derived targets
      const s10Readout = {
        actuals: {
          traffic: 8500,
          cvr: 0.025,
          aov: 145,
          cac: 45,
          orders: 213,
          revenue: 30885,
        },
        targets: {
          orders: 500,
          revenue: 75000,
        },
      };
      fs.writeFileSync(
        path.join(s10Dir, "readout.json"),
        JSON.stringify(s10Readout, null, 2)
      );

      // Write events.jsonl (no blocked stages in happy path)
      fs.writeFileSync(path.join(runDir, "events.jsonl"), "");

      // Extract metrics
      const result = extractFunnelMetrics("SFS-TEST-20260213-1200", "TEST", tempDir);

      // Assertions
      expect(result.diagnosis_schema_version).toBe("v1");
      expect(result.constraint_key_version).toBe("v1");
      expect(result.metric_catalog_version).toBe("v1");

      // Check all six metrics are present
      expect(result.funnel_metrics.traffic).toBeDefined();
      expect(result.funnel_metrics.cvr).toBeDefined();
      expect(result.funnel_metrics.aov).toBeDefined();
      expect(result.funnel_metrics.cac).toBeDefined();
      expect(result.funnel_metrics.orders).toBeDefined();
      expect(result.funnel_metrics.revenue).toBeDefined();

      // Verify traffic (higher-is-better)
      expect(result.funnel_metrics.traffic.target).toBe(10000);
      expect(result.funnel_metrics.traffic.actual).toBe(8500);
      expect(result.funnel_metrics.traffic.delta_pct).toBeCloseTo(-15.0, 1);
      expect(result.funnel_metrics.traffic.miss).toBeCloseTo(0.15, 2);
      expect(result.funnel_metrics.traffic.stage).toBe("S6B");
      expect(result.funnel_metrics.traffic.direction).toBe("higher_is_better");
      expect(result.funnel_metrics.traffic.metric_class).toBe("primitive");

      // Verify CAC (lower-is-better, below target = good)
      expect(result.funnel_metrics.cac.target).toBe(50);
      expect(result.funnel_metrics.cac.actual).toBe(45);
      expect(result.funnel_metrics.cac.delta_pct).toBeCloseTo(-10.0, 1);
      expect(result.funnel_metrics.cac.miss).toBe(0.0);
      expect(result.funnel_metrics.cac.direction).toBe("lower_is_better");

      // Verify orders (derived)
      expect(result.funnel_metrics.orders.actual).toBe(213);
      expect(result.funnel_metrics.orders.metric_class).toBe("derived");

      // No blocked stages
      expect(result.blocked_stages).toEqual([]);

      // Data quality
      expect(result.data_quality.missing_targets).toEqual([]);
      expect(result.data_quality.missing_actuals).toEqual([]);
      expect(result.data_quality.excluded_metrics).toEqual([]);

      // Sources
      expect(result.sources.s3_forecast).toContain("stages/S3/forecast.json");
      expect(result.sources.s10_readout).toContain("stages/S10/readout.json");
      expect(result.sources.events).toContain("events.jsonl");
    });
  });

  // TC-02: Missing S10 — targets present, actuals/miss null for unavailable metrics
  describe("TC-02: missing S10", () => {
    it("handles missing S10 readout gracefully", () => {
      // Write manifest
      const manifest = {
        schema_version: 1,
        run_id: "SFS-TEST-20260213-1200",
        business: "TEST",
        created_at: "2026-02-13T12:00:00Z",
        loop_spec_version: "1.0.0",
        stages: {},
      };
      fs.writeFileSync(
        path.join(runDir, "baseline.manifest.json"),
        JSON.stringify(manifest, null, 2)
      );

      // Write S3 stage-result with forecast
      const s3StageResult = {
        stage: "S3",
        status: "completed",
        artifacts: { forecast: "stages/S3/forecast.json" },
      };
      const s3Dir = path.join(runDir, "stages/S3");
      fs.mkdirSync(s3Dir, { recursive: true });
      fs.writeFileSync(
        path.join(runDir, "stage-result-S3.json"),
        JSON.stringify(s3StageResult, null, 2)
      );

      const s3Forecast = {
        targets: { traffic: 10000, cvr: 0.05, aov: 150, cac: 50 },
      };
      fs.writeFileSync(
        path.join(s3Dir, "forecast.json"),
        JSON.stringify(s3Forecast, null, 2)
      );

      // No S10 stage-result
      fs.writeFileSync(path.join(runDir, "events.jsonl"), "");

      const result = extractFunnelMetrics("SFS-TEST-20260213-1200", "TEST", tempDir);

      // Targets are present
      expect(result.funnel_metrics.traffic.target).toBe(10000);
      expect(result.funnel_metrics.cvr.target).toBe(0.05);

      // Actuals are null for all metrics
      expect(result.funnel_metrics.traffic.actual).toBeNull();
      expect(result.funnel_metrics.cvr.actual).toBeNull();
      expect(result.funnel_metrics.aov.actual).toBeNull();
      expect(result.funnel_metrics.cac.actual).toBeNull();
      expect(result.funnel_metrics.orders.actual).toBeNull();
      expect(result.funnel_metrics.revenue.actual).toBeNull();

      // Miss is null when actuals are missing
      expect(result.funnel_metrics.traffic.miss).toBeNull();
      expect(result.funnel_metrics.cvr.miss).toBeNull();

      // Data quality reflects missing actuals
      expect(result.data_quality.missing_actuals).toEqual([
        "traffic",
        "cvr",
        "aov",
        "cac",
        "orders",
        "revenue",
      ]);

      // S10 source is null
      expect(result.sources.s10_readout).toBeNull();
    });
  });

  // TC-03: Malformed S3 JSON — warning logged, S3-dependent fields null
  describe("TC-03: malformed S3 JSON", () => {
    it("handles malformed S3 forecast gracefully", () => {
      // Write manifest
      const manifest = {
        schema_version: 1,
        run_id: "SFS-TEST-20260213-1200",
        business: "TEST",
        created_at: "2026-02-13T12:00:00Z",
        loop_spec_version: "1.0.0",
        stages: {},
      };
      fs.writeFileSync(
        path.join(runDir, "baseline.manifest.json"),
        JSON.stringify(manifest, null, 2)
      );

      // Write S3 stage-result
      const s3StageResult = {
        stage: "S3",
        status: "completed",
        artifacts: { forecast: "stages/S3/forecast.json" },
      };
      const s3Dir = path.join(runDir, "stages/S3");
      fs.mkdirSync(s3Dir, { recursive: true });
      fs.writeFileSync(
        path.join(runDir, "stage-result-S3.json"),
        JSON.stringify(s3StageResult, null, 2)
      );

      // Write malformed JSON
      fs.writeFileSync(path.join(s3Dir, "forecast.json"), "{ invalid json }");

      fs.writeFileSync(path.join(runDir, "events.jsonl"), "");

      const result = extractFunnelMetrics("SFS-TEST-20260213-1200", "TEST", tempDir);

      // Targets are null
      expect(result.funnel_metrics.traffic.target).toBeNull();
      expect(result.funnel_metrics.cvr.target).toBeNull();

      // Data quality reflects missing targets (all of them since S3 is malformed and S10 is missing)
      expect(result.data_quality.missing_targets).toEqual([
        "traffic",
        "cvr",
        "aov",
        "cac",
        "orders",
        "revenue",
      ]);

      // S3 source is null (malformed)
      expect(result.sources.s3_forecast).toBeNull();
    });
  });

  // TC-04: Event parsing — stage_blocked events normalize to reason_code values
  describe("TC-04: event parsing", () => {
    it("normalizes stage_blocked events to reason codes", () => {
      // Write minimal manifest
      const manifest = {
        schema_version: 1,
        run_id: "SFS-TEST-20260213-1200",
        business: "TEST",
        created_at: "2026-02-13T12:00:00Z",
        loop_spec_version: "1.0.0",
        stages: {},
      };
      fs.writeFileSync(
        path.join(runDir, "baseline.manifest.json"),
        JSON.stringify(manifest, null, 2)
      );

      // Write events with two stage_blocked entries
      const events = [
        {
          schema_version: 1,
          event: "stage_blocked",
          run_id: "SFS-TEST-20260213-1200",
          stage: "S4",
          timestamp: "2026-02-13T12:05:00Z",
          loop_spec_version: "1.0.0",
          artifacts: null,
          blocking_reason: "S3 stage-result.json not found (upstream dependencies)",
        },
        {
          schema_version: 1,
          event: "stage_blocked",
          run_id: "SFS-TEST-20260213-1200",
          stage: "S7",
          timestamp: "2026-02-13T12:10:00Z",
          loop_spec_version: "1.0.0",
          artifacts: null,
          blocking_reason: "Missing customer interview data",
        },
      ];
      fs.writeFileSync(
        path.join(runDir, "events.jsonl"),
        events.map((e) => JSON.stringify(e)).join("\n") + "\n"
      );

      const result = extractFunnelMetrics("SFS-TEST-20260213-1200", "TEST", tempDir);

      // Two blocked stages
      expect(result.blocked_stages).toHaveLength(2);

      // First blocked stage
      expect(result.blocked_stages[0].stage).toBe("S4");
      expect(result.blocked_stages[0].reason_code).toBe("deps_blocked");
      expect(result.blocked_stages[0].blocking_reason).toContain("upstream dependencies");
      expect(result.blocked_stages[0].timestamp).toBe("2026-02-13T12:05:00Z");

      // Second blocked stage
      expect(result.blocked_stages[1].stage).toBe("S7");
      expect(result.blocked_stages[1].reason_code).toBe("data_missing");
      expect(result.blocked_stages[1].blocking_reason).toContain("Missing customer interview");
      expect(result.blocked_stages[1].timestamp).toBe("2026-02-13T12:10:00Z");
    });
  });

  // TC-05: Directionality — CAC above target yields positive miss; CVR below target yields positive miss
  describe("TC-05: directionality correctness", () => {
    it("computes miss correctly for higher-is-better and lower-is-better metrics", () => {
      // Write manifest
      const manifest = {
        schema_version: 1,
        run_id: "SFS-TEST-20260213-1200",
        business: "TEST",
        created_at: "2026-02-13T12:00:00Z",
        loop_spec_version: "1.0.0",
        stages: {},
      };
      fs.writeFileSync(
        path.join(runDir, "baseline.manifest.json"),
        JSON.stringify(manifest, null, 2)
      );

      // Write S3 forecast
      const s3StageResult = {
        stage: "S3",
        status: "completed",
        artifacts: { forecast: "stages/S3/forecast.json" },
      };
      const s3Dir = path.join(runDir, "stages/S3");
      fs.mkdirSync(s3Dir, { recursive: true });
      fs.writeFileSync(
        path.join(runDir, "stage-result-S3.json"),
        JSON.stringify(s3StageResult, null, 2)
      );

      const s3Forecast = {
        targets: {
          cvr: 0.05,
          cac: 50,
        },
      };
      fs.writeFileSync(
        path.join(s3Dir, "forecast.json"),
        JSON.stringify(s3Forecast, null, 2)
      );

      // Write S10 readout with CVR below target and CAC above target
      const s10StageResult = {
        stage: "S10",
        status: "completed",
        artifacts: { readout: "stages/S10/readout.json" },
      };
      const s10Dir = path.join(runDir, "stages/S10");
      fs.mkdirSync(s10Dir, { recursive: true });
      fs.writeFileSync(
        path.join(runDir, "stage-result-S10.json"),
        JSON.stringify(s10StageResult, null, 2)
      );

      const s10Readout = {
        actuals: {
          cvr: 0.025, // 50% below target
          cac: 90, // 80% above target
        },
      };
      fs.writeFileSync(
        path.join(s10Dir, "readout.json"),
        JSON.stringify(s10Readout, null, 2)
      );

      fs.writeFileSync(path.join(runDir, "events.jsonl"), "");

      const result = extractFunnelMetrics("SFS-TEST-20260213-1200", "TEST", tempDir);

      // CVR (higher-is-better): below target yields positive miss
      expect(result.funnel_metrics.cvr.target).toBe(0.05);
      expect(result.funnel_metrics.cvr.actual).toBe(0.025);
      expect(result.funnel_metrics.cvr.miss).toBeCloseTo(0.50, 2); // (0.05 - 0.025) / 0.05

      // CAC (lower-is-better): above target yields positive miss
      expect(result.funnel_metrics.cac.target).toBe(50);
      expect(result.funnel_metrics.cac.actual).toBe(90);
      expect(result.funnel_metrics.cac.miss).toBeCloseTo(0.80, 2); // (90 - 50) / 50
    });
  });

  // TC-06: Pointer-based reads — manifest/stage-result pointers are used
  describe("TC-06: pointer-based reads", () => {
    it("uses stage-result artifact pointers even when extra files exist", () => {
      // Write manifest
      const manifest = {
        schema_version: 1,
        run_id: "SFS-TEST-20260213-1200",
        business: "TEST",
        created_at: "2026-02-13T12:00:00Z",
        loop_spec_version: "1.0.0",
        stages: {},
      };
      fs.writeFileSync(
        path.join(runDir, "baseline.manifest.json"),
        JSON.stringify(manifest, null, 2)
      );

      // Write S3 stage-result pointing to a specific forecast file
      const s3StageResult = {
        stage: "S3",
        status: "completed",
        artifacts: { forecast: "stages/S3/forecast-final.json" },
      };
      const s3Dir = path.join(runDir, "stages/S3");
      fs.mkdirSync(s3Dir, { recursive: true });
      fs.writeFileSync(
        path.join(runDir, "stage-result-S3.json"),
        JSON.stringify(s3StageResult, null, 2)
      );

      // Write the correct forecast file
      const s3Forecast = {
        targets: { traffic: 10000 },
      };
      fs.writeFileSync(
        path.join(s3Dir, "forecast-final.json"),
        JSON.stringify(s3Forecast, null, 2)
      );

      // Write a decoy file with different data
      const decoyForecast = {
        targets: { traffic: 99999 },
      };
      fs.writeFileSync(
        path.join(s3Dir, "forecast.json"),
        JSON.stringify(decoyForecast, null, 2)
      );

      fs.writeFileSync(path.join(runDir, "events.jsonl"), "");

      const result = extractFunnelMetrics("SFS-TEST-20260213-1200", "TEST", tempDir);

      // Should use the pointer-specified file (10000), not the decoy (99999)
      expect(result.funnel_metrics.traffic.target).toBe(10000);
    });
  });
});
