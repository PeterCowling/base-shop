/** @jest-environment node */

import { promises as fs } from "fs";
import os from "os";
import path from "path";

import { handleLoopTool } from "../tools/loop";

async function writeFile(filePath: string, content: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");
}

describe("loop tools", () => {
  const originalRoot = process.env.STARTUP_LOOP_ARTIFACT_ROOT;
  const originalStaleThreshold = process.env.STARTUP_LOOP_STALE_THRESHOLD_SECONDS;

  let tempRoot = "";

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-loop-tools-"));
    process.env.STARTUP_LOOP_ARTIFACT_ROOT = tempRoot;
    delete process.env.STARTUP_LOOP_STALE_THRESHOLD_SECONDS;
  });

  afterEach(async () => {
    process.env.STARTUP_LOOP_ARTIFACT_ROOT = originalRoot;
    process.env.STARTUP_LOOP_STALE_THRESHOLD_SECONDS = originalStaleThreshold;
    await fs.rm(tempRoot, { recursive: true, force: true });
    jest.resetAllMocks();
  });

  it("TC-01: loop_manifest_status returns stage coverage and freshness", async () => {
    const manifestPath = path.join(
      tempRoot,
      "docs/business-os/startup-baselines/BRIK/runs/run-001/baseline.manifest.json"
    );

    await writeFile(
      manifestPath,
      JSON.stringify(
        {
          run_id: "run-001",
          status: "candidate",
          updated_at: new Date().toISOString(),
          stage_completions: {
            S2B: { status: "Done", produced_keys: ["offer"], timestamp: "2026-02-13T00:00:00Z" },
            S3: { status: "Done", produced_keys: ["forecast"], timestamp: "2026-02-13T00:00:00Z" },
          },
        },
        null,
        2
      )
    );

    const result = await handleLoopTool("loop_manifest_status", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "S7",
    });

    const payload = JSON.parse(result.content[0].text);
    expect(payload.stageCompletionCount).toBe(2);
    expect(payload.doneStageCount).toBe(2);
    expect(payload.freshness).toEqual(
      expect.objectContaining({
        status: expect.any(String),
        ageSeconds: expect.any(Number),
        thresholdSeconds: expect.any(Number),
        sourceTimestamp: expect.any(String),
      })
    );
  });

  it("TC-02: loop_manifest_status returns MISSING_ARTIFACT when manifest is absent", async () => {
    const result = await handleLoopTool("loop_manifest_status", {
      business: "BRIK",
      runId: "run-404",
      current_stage: "S7",
    });

    const payload = JSON.parse(result.content[0].text);
    expect(result.isError).toBe(true);
    expect(payload.error.code).toBe("MISSING_ARTIFACT");
  });

  it("TC-03: loop_learning_ledger_status reports entry count and latest timestamp", async () => {
    const ledgerPath = path.join(
      tempRoot,
      "docs/business-os/startup-baselines/BRIK/learning-ledger.jsonl"
    );

    await writeFile(
      ledgerPath,
      [
        JSON.stringify({ entry_id: "entry-1", created_at: "2026-02-10T10:00:00Z", verdict: "PASS" }),
        JSON.stringify({ entry_id: "entry-2", created_at: "2026-02-12T10:00:00Z", verdict: "FAIL" }),
      ].join("\n") + "\n"
    );

    const result = await handleLoopTool("loop_learning_ledger_status", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "S7",
    });

    const payload = JSON.parse(result.content[0].text);
    expect(payload.entryCount).toBe(2);
    expect(payload.latestEntryAt).toBe("2026-02-12T10:00:00Z");
    expect(payload.freshness).toHaveProperty("status");
  });

  it("TC-04: loop_metrics_summary returns aggregated metrics and freshness", async () => {
    const metricsPath = path.join(
      tempRoot,
      "docs/business-os/startup-baselines/BRIK/runs/run-001/metrics.jsonl"
    );

    await writeFile(
      metricsPath,
      [
        JSON.stringify({ timestamp: "2026-02-12T10:00:00Z", metric_name: "manual_interventions", value: 1 }),
        JSON.stringify({ timestamp: "2026-02-12T11:00:00Z", metric_name: "manual_interventions", value: 2 }),
        JSON.stringify({ timestamp: "2026-02-12T11:30:00Z", metric_name: "replan_count", value: 1 }),
      ].join("\n") + "\n"
    );

    const result = await handleLoopTool("loop_metrics_summary", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "S7",
    });

    const payload = JSON.parse(result.content[0].text);
    expect(payload.metricCount).toBe(2);
    expect(payload.metrics.manual_interventions).toBe(3);
    expect(payload.metrics.replan_count).toBe(1);
    expect(payload.freshness).toHaveProperty("sourceTimestamp", "2026-02-12T11:30:00Z");
  });

  it("TC-05: loop tools mark stale freshness when over threshold", async () => {
    process.env.STARTUP_LOOP_STALE_THRESHOLD_SECONDS = "60";

    const manifestPath = path.join(
      tempRoot,
      "docs/business-os/startup-baselines/BRIK/runs/run-001/baseline.manifest.json"
    );

    await writeFile(
      manifestPath,
      JSON.stringify(
        {
          run_id: "run-001",
          status: "candidate",
          updated_at: "2020-01-01T00:00:00Z",
          stage_completions: {
            S2B: { status: "Done", produced_keys: ["offer"], timestamp: "2020-01-01T00:00:00Z" },
          },
        },
        null,
        2
      )
    );

    const result = await handleLoopTool("loop_manifest_status", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "S7",
    });

    const payload = JSON.parse(result.content[0].text);
    expect(payload.freshness.status).toBe("stale");
  });

  it("TC-06: all loop tools expose consistent freshness field names", async () => {
    const manifestPath = path.join(
      tempRoot,
      "docs/business-os/startup-baselines/BRIK/runs/run-001/baseline.manifest.json"
    );
    const ledgerPath = path.join(
      tempRoot,
      "docs/business-os/startup-baselines/BRIK/learning-ledger.jsonl"
    );
    const metricsPath = path.join(
      tempRoot,
      "docs/business-os/startup-baselines/BRIK/runs/run-001/metrics.jsonl"
    );

    await writeFile(
      manifestPath,
      JSON.stringify(
        {
          run_id: "run-001",
          status: "candidate",
          updated_at: new Date().toISOString(),
          stage_completions: {},
        },
        null,
        2
      )
    );
    await writeFile(
      ledgerPath,
      JSON.stringify({ entry_id: "entry-1", created_at: new Date().toISOString(), verdict: "PASS" }) +
        "\n"
    );
    await writeFile(
      metricsPath,
      JSON.stringify({ timestamp: new Date().toISOString(), metric_name: "manual_interventions", value: 1 }) +
        "\n"
    );

    const commonArgs = {
      business: "BRIK",
      runId: "run-001",
      current_stage: "S7",
    };

    const manifestResult = JSON.parse((await handleLoopTool("loop_manifest_status", commonArgs)).content[0].text);
    const ledgerResult = JSON.parse((await handleLoopTool("loop_learning_ledger_status", commonArgs)).content[0].text);
    const metricsResult = JSON.parse((await handleLoopTool("loop_metrics_summary", commonArgs)).content[0].text);

    for (const result of [manifestResult, ledgerResult, metricsResult]) {
      expect(result.freshness).toHaveProperty("status");
      expect(result.freshness).toHaveProperty("ageSeconds");
      expect(result.freshness).toHaveProperty("thresholdSeconds");
      expect(result.freshness).toHaveProperty("sourceTimestamp");
    }
  });
});
