import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import {
  getWeeklyGrowthMetrics,
  type GrowthPeriod,
} from "../growth-metrics-adapter";

/**
 * Growth metrics adapter tests
 *
 * Tests cover:
 * - TC-01: Happy path — valid S3 forecast + S10 readout with all actuals
 * - TC-02: Missing S3 stage-result — s3_forecast source is null; S10 actuals still produce metrics
 * - TC-03: Sparse S10 actuals — only traffic + orders; derived CVR computed; missing_metrics populated
 */

describe("getWeeklyGrowthMetrics", () => {
  let tempDir: string;
  let runDir: string;

  const TEST_RUN_ID = "SFS-TEST-20260213-1200";
  const TEST_BUSINESS = "TEST";

  const TEST_PERIOD: GrowthPeriod = {
    period_id: "2026-W07",
    start_date: "2026-02-09",
    end_date: "2026-02-15",
    forecast_id: "SFS-TEST-20260213-1200",
  };

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "growth-metrics-test-"));
    runDir = path.join(
      tempDir,
      "docs/business-os/startup-baselines",
      TEST_BUSINESS,
      "runs",
      TEST_RUN_ID,
    );
    fs.mkdirSync(runDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // TC-01: Happy path — all actuals present; metric computation and derivation verified
  describe("TC-01: happy path", () => {
    it("produces complete WeeklyGrowthMetrics from valid S3 + S10 artifacts", () => {
      // Write S3 stage-result → forecast pointer
      const s3Dir = path.join(runDir, "stages/S3");
      fs.mkdirSync(s3Dir, { recursive: true });
      fs.writeFileSync(
        path.join(runDir, "stage-result-S3.json"),
        JSON.stringify({
          stage: "S3",
          status: "completed",
          artifacts: { forecast: "stages/S3/forecast.json" },
        }),
      );
      fs.writeFileSync(
        path.join(s3Dir, "forecast.json"),
        JSON.stringify({ targets: { traffic: 10000, cvr: 0.05, aov: 150, cac: 50 } }),
      );

      // Write S10 stage-result → readout pointer
      const s10Dir = path.join(runDir, "stages/S10");
      fs.mkdirSync(s10Dir, { recursive: true });
      fs.writeFileSync(
        path.join(runDir, "stage-result-S10.json"),
        JSON.stringify({
          stage: "S10",
          status: "completed",
          artifacts: { readout: "stages/S10/readout.json" },
        }),
      );
      fs.writeFileSync(
        path.join(s10Dir, "readout.json"),
        JSON.stringify({
          actuals: {
            traffic: 8500,
            orders: 213,
            cvr: 0.025,
            cac: 45,
            aov: 145,
            revenue: 30885,
          },
          targets: { orders: 500, revenue: 75000 },
        }),
      );

      fs.writeFileSync(path.join(runDir, "events.jsonl"), "");

      const result = getWeeklyGrowthMetrics(
        TEST_RUN_ID,
        TEST_BUSINESS,
        TEST_PERIOD,
        { baseDir: tempDir },
      );

      expect(result.run_id).toBe(TEST_RUN_ID);
      expect(result.business).toBe(TEST_BUSINESS);

      // Activation metrics
      expect(result.metrics.activation.sessions_count).toBe(8500);
      expect(result.metrics.activation.orders_count).toBe(213);
      // cvr = 0.025 → 0.025 * 10000 = 250 bps
      expect(result.metrics.activation.sitewide_cvr_bps).toBe(250);

      // Revenue metrics
      // revenue = 30885 euros → 3_088_500 cents
      expect(result.metrics.revenue.gross_revenue_eur_cents).toBe(3088500);
      expect(result.metrics.revenue.orders_count).toBe(213);
      // aov = 145 euros → 14_500 cents
      expect(result.metrics.revenue.aov_eur_cents).toBe(14500);

      // Acquisition metrics (new_customers derived from orders since new_customers absent)
      expect(result.metrics.acquisition.new_customers_count).toBe(213);
      // cac = 45 euros → 4_500 cents
      expect(result.metrics.acquisition.blended_cac_eur_cents).toBe(4500);
      // spend derived from cac * new_customers: 45 * 213 = 9585 euros → 958_500 cents
      expect(result.metrics.acquisition.spend_eur_cents).toBe(958500);

      // Sources
      expect(result.sources.s3_forecast).toContain("stages/S3/forecast.json");
      expect(result.sources.s10_readout).toContain("stages/S10/readout.json");
      expect(result.sources.events).toBe("events.jsonl");

      // No missing metrics for core fields that were provided
      expect(result.data_quality.missing_metrics).not.toContain("activation.sessions_count");
      expect(result.data_quality.missing_metrics).not.toContain("activation.orders_count");
      expect(result.data_quality.missing_metrics).not.toContain("activation.sitewide_cvr_bps");
      expect(result.data_quality.missing_metrics).not.toContain("revenue.gross_revenue_eur_cents");
      expect(result.data_quality.missing_metrics).not.toContain("revenue.aov_eur_cents");
    });
  });

  // TC-02: Missing S3 stage-result — s3_forecast source null; S10 actuals still produce metrics
  describe("TC-02: missing S3", () => {
    it("handles missing S3 stage-result — s3_forecast null, S10 metrics still computed", () => {
      // NO S3 stage-result written

      // Write S10 stage-result → readout
      const s10Dir = path.join(runDir, "stages/S10");
      fs.mkdirSync(s10Dir, { recursive: true });
      fs.writeFileSync(
        path.join(runDir, "stage-result-S10.json"),
        JSON.stringify({
          stage: "S10",
          status: "completed",
          artifacts: { readout: "stages/S10/readout.json" },
        }),
      );
      fs.writeFileSync(
        path.join(s10Dir, "readout.json"),
        JSON.stringify({
          actuals: {
            traffic: 8500,
            orders: 213,
            cvr: 0.025,
            aov: 145,
            revenue: 30885,
          },
        }),
      );

      fs.writeFileSync(path.join(runDir, "events.jsonl"), "");

      const result = getWeeklyGrowthMetrics(
        TEST_RUN_ID,
        TEST_BUSINESS,
        TEST_PERIOD,
        { baseDir: tempDir },
      );

      // S3 source is null
      expect(result.sources.s3_forecast).toBeNull();

      // S10 actuals still populate core metrics
      expect(result.metrics.activation.sessions_count).toBe(8500);
      expect(result.metrics.activation.orders_count).toBe(213);
      expect(result.metrics.activation.sitewide_cvr_bps).toBe(250);
      expect(result.metrics.revenue.gross_revenue_eur_cents).toBe(3088500);
      expect(result.metrics.revenue.aov_eur_cents).toBe(14500);

      // S10 source still present
      expect(result.sources.s10_readout).toContain("stages/S10/readout.json");

      // Assumptions note about no targets
      expect(result.data_quality.assumptions).toEqual(
        expect.arrayContaining([
          expect.stringContaining("No S3/S10 targets found"),
        ]),
      );
    });
  });

  // TC-03: Sparse S10 actuals — only traffic + orders; derived CVR; many missing metrics
  describe("TC-03: sparse S10 actuals", () => {
    it("derives sitewide_cvr_bps from sessions/orders when cvr absent; populates missing_metrics for non-derivable fields", () => {
      // Write S10 with only traffic and orders
      const s10Dir = path.join(runDir, "stages/S10");
      fs.mkdirSync(s10Dir, { recursive: true });
      fs.writeFileSync(
        path.join(runDir, "stage-result-S10.json"),
        JSON.stringify({
          stage: "S10",
          status: "completed",
          artifacts: { readout: "stages/S10/readout.json" },
        }),
      );
      fs.writeFileSync(
        path.join(s10Dir, "readout.json"),
        JSON.stringify({
          actuals: {
            traffic: 8500,
            orders: 213,
            // cvr, cac, aov, revenue all absent
          },
        }),
      );

      fs.writeFileSync(path.join(runDir, "events.jsonl"), "");

      const result = getWeeklyGrowthMetrics(
        TEST_RUN_ID,
        TEST_BUSINESS,
        TEST_PERIOD,
        { baseDir: tempDir },
      );

      // Sessions and orders present
      expect(result.metrics.activation.sessions_count).toBe(8500);
      expect(result.metrics.activation.orders_count).toBe(213);

      // CVR derived: round(213 * 10000 / 8500) = round(250.588) = 251
      expect(result.metrics.activation.sitewide_cvr_bps).toBe(251);

      // Non-derivable metrics are null
      expect(result.metrics.acquisition.blended_cac_eur_cents).toBeNull();
      expect(result.metrics.acquisition.spend_eur_cents).toBeNull();
      expect(result.metrics.revenue.gross_revenue_eur_cents).toBeNull();
      expect(result.metrics.revenue.aov_eur_cents).toBeNull();

      // missing_metrics is non-empty and sorted
      const missing = result.data_quality.missing_metrics;
      expect(missing.length).toBeGreaterThan(0);
      expect([...missing]).toEqual([...missing].sort());

      // Key non-derivable fields appear in missing list
      expect(missing).toContain("acquisition.blended_cac_eur_cents");
      expect(missing).toContain("acquisition.spend_eur_cents");
      expect(missing).toContain("revenue.gross_revenue_eur_cents");
      expect(missing).toContain("revenue.aov_eur_cents");

      // Present/derived fields do NOT appear in missing list
      expect(missing).not.toContain("activation.sessions_count");
      expect(missing).not.toContain("activation.orders_count");
      expect(missing).not.toContain("activation.sitewide_cvr_bps");
    });
  });
});
