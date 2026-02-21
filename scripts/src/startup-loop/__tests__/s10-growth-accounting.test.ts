import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { describe, expect, it } from "@jest/globals";

import type { RunEvent } from "../derive-state";
import { validateEventStream } from "../event-validation";
import { runDiagnosisPipeline } from "../s10-diagnosis-integration";
import { runS10GrowthAccounting } from "../s10-growth-accounting";

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

function seedRunArtifacts(baseDir: string, business: string, runId: string): void {
  const runDir = path.join(
    baseDir,
    "docs/business-os/startup-baselines",
    business,
    "runs",
    runId,
  );

  writeJson(path.join(runDir, "stage-result-S3.json"), {
    stage: "S3",
    status: "completed",
    artifacts: { forecast: "stages/S3/forecast.json" },
  });

  writeJson(path.join(runDir, "stages/S3/forecast.json"), {
    targets: {
      traffic: 10000,
      cvr: 0.05,
      aov: 150,
      cac: 50,
      orders: 500,
      revenue: 75000,
    },
  });

  writeJson(path.join(runDir, "stage-result-S10.json"), {
    stage: "S10",
    status: "completed",
    artifacts: { readout: "stages/S10/readout.json" },
  });

  writeJson(path.join(runDir, "stages/S10/readout.json"), {
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
  });

  fs.writeFileSync(path.join(runDir, "events.jsonl"), "", "utf8");
}

describe("S10 growth accounting integration", () => {
  it("TC-01: writes growth ledger and exposes stage summary + replay payload", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "s10-growth-accounting-test-"));
    const business = "HEAD";
    const runId = "SFS-HEAD-20260213-1200";
    seedRunArtifacts(tempDir, business, runId);

    const result = await runS10GrowthAccounting(runId, business, {
      baseDir: tempDir,
      period: {
        period_id: "2026-W07",
        start_date: "2026-02-09",
        end_date: "2026-02-15",
        forecast_id: "HEAD-FC-2026Q1",
      },
      timestamp: "2026-02-13T12:00:00.000Z",
    });

    expect(result.changed).toBe(true);
    expect(result.ledger.ledger_revision).toBe(1);
    expect(fs.existsSync(result.ledgerPath)).toBe(true);
    expect(result.stageSummary.overall_status).toBe("red");
    expect(result.stageSummary.stage_statuses.acquisition).toBe("red");
    expect(result.stageSummary.stage_statuses.retention).toBe("not_tracked");
    expect(result.eventPayload.growth_accounting.input.metrics.activation.sitewide_cvr_bps).toBe(250);
    expect(result.eventPayload.growth_accounting.threshold_set.threshold_set_id).toMatch(
      /^gts_[a-f0-9]{12}$/,
    );

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("TC-02: rerun with identical inputs is deterministic and does not bump revision", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "s10-growth-accounting-test-"));
    const business = "HEAD";
    const runId = "SFS-HEAD-20260213-1200";
    seedRunArtifacts(tempDir, business, runId);

    const options = {
      baseDir: tempDir,
      period: {
        period_id: "2026-W07",
        start_date: "2026-02-09",
        end_date: "2026-02-15",
        forecast_id: "HEAD-FC-2026Q1",
      },
      timestamp: "2026-02-13T12:00:00.000Z",
    } as const;

    const first = await runS10GrowthAccounting(runId, business, options);
    const second = await runS10GrowthAccounting(runId, business, options);

    expect(first.changed).toBe(true);
    expect(second.changed).toBe(false);
    expect(first.ledger.ledger_revision).toBe(1);
    expect(second.ledger.ledger_revision).toBe(1);
    expect(second.stageSummary).toEqual(first.stageSummary);

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("TC-03: diagnosis pipeline writes growth fields to S10 stage-result and event payload validates", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "s10-growth-accounting-test-"));
    const business = "HEAD";
    const runId = "SFS-HEAD-20260213-1200";
    seedRunArtifacts(tempDir, business, runId);

    const result = await runDiagnosisPipeline(runId, business, {
      baseDir: tempDir,
      growthAccounting: {
        enabled: true,
        period: {
          period_id: "2026-W07",
          start_date: "2026-02-09",
          end_date: "2026-02-15",
          forecast_id: "HEAD-FC-2026Q1",
        },
        timestamp: "2026-02-13T12:00:00.000Z",
      },
    });

    expect(result.growthAccounting).not.toBeNull();
    expect(result.growthEventPayload).not.toBeNull();
    expect(result.growthAccounting?.stageSummary.overall_status).toBe("red");

    const stageResultPath = path.join(
      tempDir,
      "docs/business-os/startup-baselines",
      business,
      "runs",
      runId,
      "stages/S10/stage-result.json",
    );
    const stageResult = JSON.parse(fs.readFileSync(stageResultPath, "utf8"));

    expect(stageResult.artifacts.bottleneck_diagnosis).toBe("bottleneck-diagnosis.json");
    expect(stageResult.artifacts.growth_ledger).toContain("growth-ledger.json");
    expect(stageResult.growth_accounting.overall_status).toBe("red");

    const validation = validateEventStream([
      result.growthEventPayload as unknown as RunEvent,
    ]);
    expect(validation.valid).toBe(true);

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
