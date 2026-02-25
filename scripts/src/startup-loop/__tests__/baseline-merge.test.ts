import { describe, expect, it } from "@jest/globals";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

import { baselineMerge } from "../baseline-merge";
import { FORECAST_STAGE_ID } from "../stage-id-compat";

/**
 * LPSP-06B: /lp-baseline-merge (S4 join barrier)
 *
 * Tests cover:
 * - VC-06B-01: Missing required input → S4 blocks
 * - VC-06B-02: Happy-path merge → snapshot + stage-result
 * - VC-06B-03: Deterministic composition
 */

// -- Fixture helpers --

interface StageResultFixture {
  schema_version: number;
  run_id: string;
  stage: string;
  loop_spec_version: string;
  status: "Done" | "Failed" | "Blocked";
  timestamp: string;
  produced_keys: string[];
  artifacts: Record<string, string>;
  error: string | null;
  blocking_reason: string | null;
}

function makeStageResult(overrides: Partial<StageResultFixture>): StageResultFixture {
  return {
    schema_version: 1,
    run_id: "SFS-TEST-20260213-1200",
    stage: "S0",
    loop_spec_version: "1.0.0",
    status: "Done",
    timestamp: "2026-02-13T12:00:00Z",
    produced_keys: [],
    artifacts: {},
    error: null,
    blocking_reason: null,
    ...overrides,
  };
}

const S2B_DONE = makeStageResult({
  stage: "MARKET-06",
  status: "Done",
  produced_keys: ["offer"],
  artifacts: { offer: "stages/MARKET-06/offer.md" },
});

const S3_DONE = makeStageResult({
  stage: FORECAST_STAGE_ID,
  status: "Done",
  produced_keys: ["forecast"],
  artifacts: { forecast: `stages/${FORECAST_STAGE_ID}/forecast.md` },
});

const S6B_DONE = makeStageResult({
  stage: "SELL-01",
  status: "Done",
  produced_keys: ["channels"],
  artifacts: { channels: "stages/SELL-01/channels.md" },
});

const S6B_DONE_WITH_OPTIONAL = makeStageResult({
  stage: "SELL-01",
  status: "Done",
  produced_keys: ["channels", "seo", "outreach"],
  artifacts: {
    channels: "stages/SELL-01/channels.md",
    seo: "stages/SELL-01/seo.md",
    outreach: "stages/SELL-01/outreach.md",
  },
});

const PRODUCT_02_DONE = makeStageResult({
  stage: "PRODUCT-02",
  status: "Done",
  produced_keys: ["adjacent_product_research"],
  artifacts: {
    adjacent_product_research: "stages/PRODUCT-02/adjacent-product-research.md",
  },
});


const MERGE_OPTIONS = {
  run_id: "SFS-TEST-20260213-1200",
  business: "TEST",
  loop_spec_version: "1.0.0",
};

async function setupRunDir(): Promise<string> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "merge-test-"));
  return tmpDir;
}

async function writeStageResult(
  runDir: string,
  stage: string,
  result: StageResultFixture,
): Promise<void> {
  const stageDir = path.join(runDir, "stages", stage);
  await fs.mkdir(stageDir, { recursive: true });
  await fs.writeFile(
    path.join(stageDir, "stage-result.json"),
    JSON.stringify(result, null, 2),
  );
}

async function writeArtifact(
  runDir: string,
  relativePath: string,
  content: string,
): Promise<void> {
  const fullPath = path.join(runDir, relativePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content);
}

// -- Tests --

describe("baselineMerge", () => {
  // VC-06B-01: Missing required input → S4 blocks
  describe("VC-06B-01: missing required input", () => {
    it("blocks when S3 stage-result is absent", async () => {
      const runDir = await setupRunDir();
      await writeStageResult(runDir, "MARKET-06", S2B_DONE);
      await writeArtifact(runDir, "stages/MARKET-06/offer.md", "# Offer");
      await writeStageResult(runDir, "SELL-01", S6B_DONE);
      await writeArtifact(runDir, "stages/SELL-01/channels.md", "# Channels");
      // S3 is absent

      const result = await baselineMerge(runDir, MERGE_OPTIONS);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.stage_result.status).toBe("Blocked");
        expect(result.stage_result.blocking_reason).toContain(FORECAST_STAGE_ID);
        expect(result.stage_result.blocking_reason).toContain("forecast");
      }
    });

    it("blocks when MARKET-06 stage-result is absent", async () => {
      const runDir = await setupRunDir();
      await writeStageResult(runDir, FORECAST_STAGE_ID, S3_DONE);
      await writeArtifact(runDir, `stages/${FORECAST_STAGE_ID}/forecast.md`, "# Forecast");
      await writeStageResult(runDir, "SELL-01", S6B_DONE);
      await writeArtifact(runDir, "stages/SELL-01/channels.md", "# Channels");
      // MARKET-06 is absent

      const result = await baselineMerge(runDir, MERGE_OPTIONS);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.stage_result.status).toBe("Blocked");
        expect(result.stage_result.blocking_reason).toContain("MARKET-06");
      }
    });

    it("blocks when SELL-01 stage-result is absent", async () => {
      const runDir = await setupRunDir();
      await writeStageResult(runDir, "MARKET-06", S2B_DONE);
      await writeArtifact(runDir, "stages/MARKET-06/offer.md", "# Offer");
      await writeStageResult(runDir, FORECAST_STAGE_ID, S3_DONE);
      await writeArtifact(runDir, `stages/${FORECAST_STAGE_ID}/forecast.md`, "# Forecast");
      // SELL-01 is absent

      const result = await baselineMerge(runDir, MERGE_OPTIONS);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.stage_result.status).toBe("Blocked");
        expect(result.stage_result.blocking_reason).toContain("SELL-01");
      }
    });

    it("blocks when S3 status is Failed", async () => {
      const runDir = await setupRunDir();
      await writeStageResult(runDir, "MARKET-06", S2B_DONE);
      await writeArtifact(runDir, "stages/MARKET-06/offer.md", "# Offer");
      await writeStageResult(runDir, FORECAST_STAGE_ID, makeStageResult({
        stage: FORECAST_STAGE_ID,
        status: "Failed",
        error: "forecast computation error",
      }));
      await writeStageResult(runDir, "SELL-01", S6B_DONE);
      await writeArtifact(runDir, "stages/SELL-01/channels.md", "# Channels");

      const result = await baselineMerge(runDir, MERGE_OPTIONS);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.stage_result.status).toBe("Blocked");
        expect(result.stage_result.blocking_reason).toContain(FORECAST_STAGE_ID);
        expect(result.stage_result.blocking_reason).toContain("Failed");
      }
    });

    it("writes stage-result.json to stages/S4/ when blocked", async () => {
      const runDir = await setupRunDir();
      // No upstream results at all

      const result = await baselineMerge(runDir, MERGE_OPTIONS);

      expect(result.success).toBe(false);

      // Verify stage-result.json was written
      const stageResultPath = path.join(runDir, "stages", "S4", "stage-result.json");
      const written = JSON.parse(await fs.readFile(stageResultPath, "utf-8"));
      expect(written.stage).toBe("S4");
      expect(written.status).toBe("Blocked");
      expect(written.produced_keys).toEqual([]);
      expect(written.artifacts).toEqual({});
    });
  });

  // VC-06B-02: Happy-path merge
  describe("VC-06B-02: happy-path merge", () => {
    it("produces baseline.snapshot.md with all required inputs present", async () => {
      const runDir = await setupRunDir();
      await writeStageResult(runDir, "MARKET-06", S2B_DONE);
      await writeArtifact(runDir, "stages/MARKET-06/offer.md", "# Offer\nValue prop here.");
      await writeStageResult(runDir, FORECAST_STAGE_ID, S3_DONE);
      await writeArtifact(runDir, `stages/${FORECAST_STAGE_ID}/forecast.md`, "# Forecast\nP50 scenario.");
      await writeStageResult(runDir, "SELL-01", S6B_DONE);
      await writeArtifact(runDir, "stages/SELL-01/channels.md", "# Channels\nSEO + paid.");

      const result = await baselineMerge(runDir, MERGE_OPTIONS);

      expect(result.success).toBe(true);
      if (result.success) {
        // Verify snapshot was written
        const snapshotPath = path.join(runDir, "stages", "S4", "baseline.snapshot.md");
        const snapshot = await fs.readFile(snapshotPath, "utf-8");
        expect(snapshot).toContain("# Baseline Snapshot");
        expect(snapshot).toContain("# Offer\nValue prop here.");
        expect(snapshot).toContain("# Forecast\nP50 scenario.");
        expect(snapshot).toContain("# Channels\nSEO + paid.");
        expect(snapshot).toContain("Not produced in this run");

        // Verify stage-result
        expect(result.stage_result.status).toBe("Done");
        expect(result.stage_result.produced_keys).toEqual(["baseline_snapshot"]);
        expect(result.stage_result.artifacts).toEqual({
          baseline_snapshot: "stages/S4/baseline.snapshot.md",
        });
      }
    });

    it("includes optional artifacts when present", async () => {
      const runDir = await setupRunDir();
      await writeStageResult(runDir, "MARKET-06", S2B_DONE);
      await writeArtifact(runDir, "stages/MARKET-06/offer.md", "# Offer");
      await writeStageResult(runDir, FORECAST_STAGE_ID, S3_DONE);
      await writeArtifact(runDir, `stages/${FORECAST_STAGE_ID}/forecast.md`, "# Forecast");
      await writeStageResult(runDir, "SELL-01", S6B_DONE_WITH_OPTIONAL);
      await writeArtifact(runDir, "stages/SELL-01/channels.md", "# Channels");
      await writeArtifact(runDir, "stages/SELL-01/seo.md", "# SEO Strategy");
      await writeArtifact(runDir, "stages/SELL-01/outreach.md", "# Outreach Plan");

      const result = await baselineMerge(runDir, MERGE_OPTIONS);

      expect(result.success).toBe(true);
      if (result.success) {
        const snapshotPath = path.join(runDir, "stages", "S4", "baseline.snapshot.md");
        const snapshot = await fs.readFile(snapshotPath, "utf-8");
        expect(snapshot).toContain("# SEO Strategy");
        expect(snapshot).toContain("# Outreach Plan");
        expect(snapshot).toContain(
          "## 6. Adjacent Product Research (PRODUCT-02, optional)",
        );
        expect(snapshot).toContain("Not produced in this run");
      }
    });

    it("includes adjacent-product artifact from PRODUCT-02", async () => {
      const runDir = await setupRunDir();
      await writeStageResult(runDir, "MARKET-06", S2B_DONE);
      await writeArtifact(runDir, "stages/MARKET-06/offer.md", "# Offer");
      await writeStageResult(runDir, FORECAST_STAGE_ID, S3_DONE);
      await writeArtifact(runDir, `stages/${FORECAST_STAGE_ID}/forecast.md`, "# Forecast");
      await writeStageResult(runDir, "SELL-01", S6B_DONE);
      await writeArtifact(runDir, "stages/SELL-01/channels.md", "# Channels");
      await writeStageResult(runDir, "PRODUCT-02", PRODUCT_02_DONE);
      await writeArtifact(
        runDir,
        "stages/PRODUCT-02/adjacent-product-research.md",
        "# Adjacent Product Research",
      );

      const result = await baselineMerge(runDir, MERGE_OPTIONS);

      expect(result.success).toBe(true);
      if (result.success) {
        const snapshotPath = path.join(runDir, "stages", "S4", "baseline.snapshot.md");
        const snapshot = await fs.readFile(snapshotPath, "utf-8");
        expect(snapshot).toContain("# Adjacent Product Research");
      }
    });

  });

  // VC-06B-03: Deterministic composition
  describe("VC-06B-03: deterministic composition", () => {
    it("produces identical snapshot from identical inputs", async () => {
      async function runMerge(): Promise<string> {
        const runDir = await setupRunDir();
        await writeStageResult(runDir, "MARKET-06", S2B_DONE);
        await writeArtifact(runDir, "stages/MARKET-06/offer.md", "# Offer\nContent A.");
        await writeStageResult(runDir, FORECAST_STAGE_ID, S3_DONE);
        await writeArtifact(runDir, `stages/${FORECAST_STAGE_ID}/forecast.md`, "# Forecast\nContent B.");
        await writeStageResult(runDir, "SELL-01", S6B_DONE);
        await writeArtifact(runDir, "stages/SELL-01/channels.md", "# Channels\nContent C.");

        const result = await baselineMerge(runDir, MERGE_OPTIONS);
        if (!result.success) throw new Error("Expected success");

        const snapshotPath = path.join(runDir, "stages", "S4", "baseline.snapshot.md");
        return fs.readFile(snapshotPath, "utf-8");
      }

      const snapshot1 = await runMerge();
      const snapshot2 = await runMerge();
      expect(snapshot1).toBe(snapshot2);
    });

    it("sections appear in fixed priority order", async () => {
      const runDir = await setupRunDir();
      await writeStageResult(runDir, "MARKET-06", S2B_DONE);
      await writeArtifact(runDir, "stages/MARKET-06/offer.md", "# Offer");
      await writeStageResult(runDir, FORECAST_STAGE_ID, S3_DONE);
      await writeArtifact(runDir, `stages/${FORECAST_STAGE_ID}/forecast.md`, "# Forecast");
      await writeStageResult(runDir, "SELL-01", S6B_DONE_WITH_OPTIONAL);
      await writeArtifact(runDir, "stages/SELL-01/channels.md", "# Channels");
      await writeArtifact(runDir, "stages/SELL-01/seo.md", "# SEO");
      await writeArtifact(runDir, "stages/SELL-01/outreach.md", "# Outreach");

      const result = await baselineMerge(runDir, MERGE_OPTIONS);
      expect(result.success).toBe(true);

      const snapshotPath = path.join(runDir, "stages", "S4", "baseline.snapshot.md");
      const snapshot = await fs.readFile(snapshotPath, "utf-8");

      // Verify section order: Offer before Forecast before Channels before SEO before Outreach
      const offerIdx = snapshot.indexOf("## 1. Offer Design");
      const forecastIdx = snapshot.indexOf("## 2. Forecast");
      const channelsIdx = snapshot.indexOf("## 3. Channel Strategy");
      const seoIdx = snapshot.indexOf("## 4. SEO Strategy");
      const outreachIdx = snapshot.indexOf("## 5. Outreach Plan");

      expect(offerIdx).toBeLessThan(forecastIdx);
      expect(forecastIdx).toBeLessThan(channelsIdx);
      expect(channelsIdx).toBeLessThan(seoIdx);
      expect(seoIdx).toBeLessThan(outreachIdx);
    });
  });
});
