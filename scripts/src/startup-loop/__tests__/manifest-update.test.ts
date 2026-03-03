import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

import { updateManifest } from "../manifest-update";
import { FORECAST_STAGE_ID } from "../stage-id-compat";

/**
 * LPSP-03B: Single-writer manifest update mechanism
 *
 * Tests cover:
 * - VC-03B-01: Parallel completion (forecast + SELL-01 both Done → manifest updated)
 * - VC-03B-02: Upstream failure (SELL-01 Failed → manifest rejected)
 * - VC-03B-03: Idempotent re-derivation (same inputs → same manifest)
 */

// -- Fixture helpers --

function makeStageResult(overrides: Record<string, unknown> = {}) {
  return {
    schema_version: 1,
    run_id: "SFS-TEST-20260213-1200",
    loop_spec_version: "1.0.0",
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
  timestamp: "2026-02-13T12:02:00Z",
  produced_keys: ["offer"],
  artifacts: { offer: "stages/MARKET-06/offer.md" },
});

const S3_DONE = makeStageResult({
  stage: FORECAST_STAGE_ID,
  status: "Done",
  timestamp: "2026-02-13T12:04:00Z",
  produced_keys: ["forecast"],
  artifacts: { forecast: `stages/${FORECAST_STAGE_ID}/forecast.md` },
});

const S6B_DONE = makeStageResult({
  stage: "SELL-01",
  status: "Done",
  timestamp: "2026-02-13T12:05:00Z",
  produced_keys: ["channels", "seo", "outreach"],
  artifacts: {
    channels: "stages/SELL-01/channels.md",
    seo: "stages/SELL-01/seo.md",
    outreach: "stages/SELL-01/outreach.md",
  },
});

const S6B_FAILED = makeStageResult({
  stage: "SELL-01",
  status: "Failed",
  timestamp: "2026-02-13T12:05:00Z",
  error: "lp-channels failed: missing market intelligence input",
});

const S3_BLOCKED = makeStageResult({
  stage: FORECAST_STAGE_ID,
  status: "Blocked",
  timestamp: "2026-02-13T12:04:00Z",
  blocking_reason: "Required input missing: MARKET-06 offer artifact",
});

// -- Test setup --

let runDir: string;

async function writeStageResult(stage: string, data: Record<string, unknown>) {
  const stageDir = path.join(runDir, "stages", stage);
  await fs.mkdir(stageDir, { recursive: true });
  await fs.writeFile(
    path.join(stageDir, "stage-result.json"),
    JSON.stringify(data, null, 2),
  );
}

beforeEach(async () => {
  runDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "manifest-update-test-"),
  );
  await fs.mkdir(path.join(runDir, "stages"), { recursive: true });
});

afterEach(async () => {
  await fs.rm(runDir, { recursive: true, force: true });
});

describe("updateManifest", () => {
  // VC-03B-01: Simulated parallel completion — write forecast and SELL-01 stage results
  // concurrently → S4 merge consumes both deterministically and manifest artifact
  // pointers are correct.
  describe("VC-03B-01: parallel completion", () => {
    it("creates manifest when all required stages are Done", async () => {
      await writeStageResult("MARKET-06", S2B_DONE);
      await writeStageResult(FORECAST_STAGE_ID, S3_DONE);
      await writeStageResult("SELL-01", S6B_DONE);

      const result = await updateManifest(runDir, {
        run_id: "SFS-TEST-20260213-1200",
        business: "TEST",
        loop_spec_version: "1.0.0",
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      // Manifest was written
      const manifestPath = path.join(runDir, "baseline.manifest.json");
      const raw = await fs.readFile(manifestPath, "utf-8");
      const manifest = JSON.parse(raw);

      expect(manifest.schema_version).toBe(1);
      expect(manifest.run_id).toBe("SFS-TEST-20260213-1200");
      expect(manifest.business).toBe("TEST");
      expect(manifest.status).toBe("current");

      // All artifact pointers collected
      expect(manifest.artifacts).toEqual({
        "MARKET-06/offer": "stages/MARKET-06/offer.md",
        [`${FORECAST_STAGE_ID}/forecast`]: `stages/${FORECAST_STAGE_ID}/forecast.md`,
        "SELL-01/channels": "stages/SELL-01/channels.md",
        "SELL-01/outreach": "stages/SELL-01/outreach.md",
        "SELL-01/seo": "stages/SELL-01/seo.md",
      });

      // Stage completions recorded
      expect(manifest.stage_completions["MARKET-06"].status).toBe("Done");
      expect(manifest.stage_completions[FORECAST_STAGE_ID].status).toBe("Done");
      expect(manifest.stage_completions["SELL-01"].status).toBe("Done");
    });
  });

  // VC-03B-02: Simulated upstream failure — forecast completes, SELL-01 fails → manifest
  // update blocked with explicit reason referencing SELL-01 failure.
  describe("VC-03B-02: upstream failure rejection", () => {
    it("rejects when a required stage has Failed", async () => {
      await writeStageResult("MARKET-06", S2B_DONE);
      await writeStageResult(FORECAST_STAGE_ID, S3_DONE);
      await writeStageResult("SELL-01", S6B_FAILED);

      const result = await updateManifest(runDir, {
        run_id: "SFS-TEST-20260213-1200",
        business: "TEST",
        loop_spec_version: "1.0.0",
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.failed_stages).toContain("SELL-01");
      expect(result.reason).toMatch(/SELL-01/);
    });

    it("rejects when a required stage is Blocked", async () => {
      await writeStageResult("MARKET-06", S2B_DONE);
      await writeStageResult(FORECAST_STAGE_ID, S3_BLOCKED);
      await writeStageResult("SELL-01", S6B_DONE);

      const result = await updateManifest(runDir, {
        run_id: "SFS-TEST-20260213-1200",
        business: "TEST",
        loop_spec_version: "1.0.0",
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.blocked_stages).toContain(FORECAST_STAGE_ID);
    });

    it("rejects when a required stage result is missing", async () => {
      await writeStageResult("MARKET-06", S2B_DONE);
      await writeStageResult(FORECAST_STAGE_ID, S3_DONE);
      // SELL-01 missing entirely

      const result = await updateManifest(runDir, {
        run_id: "SFS-TEST-20260213-1200",
        business: "TEST",
        loop_spec_version: "1.0.0",
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.missing_stages).toContain("SELL-01");
    });

    it("rejects when a stage result is malformed", async () => {
      await writeStageResult("MARKET-06", S2B_DONE);
      await writeStageResult(FORECAST_STAGE_ID, S3_DONE);

      // Write malformed JSON
      const s6bDir = path.join(runDir, "stages", "SELL-01");
      await fs.mkdir(s6bDir, { recursive: true });
      await fs.writeFile(
        path.join(s6bDir, "stage-result.json"),
        "{ invalid json",
      );

      const result = await updateManifest(runDir, {
        run_id: "SFS-TEST-20260213-1200",
        business: "TEST",
        loop_spec_version: "1.0.0",
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.malformed_stages).toContain("SELL-01");
    });

    it("does not write manifest file when rejected", async () => {
      await writeStageResult("MARKET-06", S2B_DONE);
      await writeStageResult(FORECAST_STAGE_ID, S3_DONE);
      await writeStageResult("SELL-01", S6B_FAILED);

      await updateManifest(runDir, {
        run_id: "SFS-TEST-20260213-1200",
        business: "TEST",
        loop_spec_version: "1.0.0",
      });

      const manifestPath = path.join(runDir, "baseline.manifest.json");
      await expect(fs.access(manifestPath)).rejects.toThrow();
    });
  });

  // VC-03B-03: Idempotent re-derivation — given identical valid stage results,
  // re-running manifest update produces byte-identical manifest pointers.
  describe("VC-03B-03: idempotent re-derivation", () => {
    it("produces identical manifests on repeated invocation", async () => {
      await writeStageResult("MARKET-06", S2B_DONE);
      await writeStageResult(FORECAST_STAGE_ID, S3_DONE);
      await writeStageResult("SELL-01", S6B_DONE);

      const opts = {
        run_id: "SFS-TEST-20260213-1200",
        business: "TEST",
        loop_spec_version: "1.0.0",
      };

      // First invocation
      const result1 = await updateManifest(runDir, opts);
      expect(result1.success).toBe(true);
      const manifestPath = path.join(runDir, "baseline.manifest.json");
      const raw1 = await fs.readFile(manifestPath, "utf-8");
      const manifest1 = JSON.parse(raw1);

      // Second invocation (re-run)
      const result2 = await updateManifest(runDir, opts);
      expect(result2.success).toBe(true);
      const raw2 = await fs.readFile(manifestPath, "utf-8");
      const manifest2 = JSON.parse(raw2);

      // Content-identical (compare everything except updated_at)
      const { updated_at: _u1, ...content1 } = manifest1;
      const { updated_at: _u2, ...content2 } = manifest2;
      expect(content1).toEqual(content2);
    });

    it("sorts artifact keys alphabetically for deterministic output", async () => {
      await writeStageResult("MARKET-06", S2B_DONE);
      await writeStageResult(FORECAST_STAGE_ID, S3_DONE);
      await writeStageResult("SELL-01", S6B_DONE);

      await updateManifest(runDir, {
        run_id: "SFS-TEST-20260213-1200",
        business: "TEST",
        loop_spec_version: "1.0.0",
      });

      const manifestPath = path.join(runDir, "baseline.manifest.json");
      const raw = await fs.readFile(manifestPath, "utf-8");
      const manifest = JSON.parse(raw);

      const artifactKeys = Object.keys(manifest.artifacts);
      const sorted = [...artifactKeys].sort();
      expect(artifactKeys).toEqual(sorted);

      const stageKeys = Object.keys(manifest.stage_completions);
      const sortedStages = [...stageKeys].sort();
      expect(stageKeys).toEqual(sortedStages);
    });
  });
});
