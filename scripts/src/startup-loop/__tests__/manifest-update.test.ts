import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

import { updateManifest } from "../manifest-update";

/**
 * LPSP-03B: Single-writer manifest update mechanism
 *
 * Tests cover:
 * - VC-03B-01: Parallel completion (S3 + S6B both Done → manifest updated)
 * - VC-03B-02: Upstream failure (S6B Failed → manifest rejected)
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
  stage: "S2B",
  status: "Done",
  timestamp: "2026-02-13T12:02:00Z",
  produced_keys: ["offer"],
  artifacts: { offer: "stages/S2B/offer.md" },
});

const S3_DONE = makeStageResult({
  stage: "S3",
  status: "Done",
  timestamp: "2026-02-13T12:04:00Z",
  produced_keys: ["forecast"],
  artifacts: { forecast: "stages/S3/forecast.md" },
});

const S6B_DONE = makeStageResult({
  stage: "S6B",
  status: "Done",
  timestamp: "2026-02-13T12:05:00Z",
  produced_keys: ["channels", "seo", "outreach"],
  artifacts: {
    channels: "stages/S6B/channels.md",
    seo: "stages/S6B/seo.md",
    outreach: "stages/S6B/outreach.md",
  },
});

const S6B_FAILED = makeStageResult({
  stage: "S6B",
  status: "Failed",
  timestamp: "2026-02-13T12:05:00Z",
  error: "lp-channels failed: missing market intelligence input",
});

const S3_BLOCKED = makeStageResult({
  stage: "S3",
  status: "Blocked",
  timestamp: "2026-02-13T12:04:00Z",
  blocking_reason: "Required input missing: S2B offer artifact",
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
  // VC-03B-01: Simulated parallel completion — write S3 and S6B stage results
  // concurrently → S4 merge consumes both deterministically and manifest artifact
  // pointers are correct.
  describe("VC-03B-01: parallel completion", () => {
    it("creates manifest when all required stages are Done", async () => {
      await writeStageResult("S2B", S2B_DONE);
      await writeStageResult("S3", S3_DONE);
      await writeStageResult("S6B", S6B_DONE);

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
      expect(manifest.status).toBe("candidate");

      // All artifact pointers collected
      expect(manifest.artifacts).toEqual({
        "S2B/offer": "stages/S2B/offer.md",
        "S3/forecast": "stages/S3/forecast.md",
        "S6B/channels": "stages/S6B/channels.md",
        "S6B/outreach": "stages/S6B/outreach.md",
        "S6B/seo": "stages/S6B/seo.md",
      });

      // Stage completions recorded
      expect(manifest.stage_completions.S2B.status).toBe("Done");
      expect(manifest.stage_completions.S3.status).toBe("Done");
      expect(manifest.stage_completions.S6B.status).toBe("Done");
    });
  });

  // VC-03B-02: Simulated upstream failure — S3 completes, S6B fails → manifest
  // update blocked with explicit reason referencing S6B failure.
  describe("VC-03B-02: upstream failure rejection", () => {
    it("rejects when a required stage has Failed", async () => {
      await writeStageResult("S2B", S2B_DONE);
      await writeStageResult("S3", S3_DONE);
      await writeStageResult("S6B", S6B_FAILED);

      const result = await updateManifest(runDir, {
        run_id: "SFS-TEST-20260213-1200",
        business: "TEST",
        loop_spec_version: "1.0.0",
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.failed_stages).toContain("S6B");
      expect(result.reason).toMatch(/S6B/);
    });

    it("rejects when a required stage is Blocked", async () => {
      await writeStageResult("S2B", S2B_DONE);
      await writeStageResult("S3", S3_BLOCKED);
      await writeStageResult("S6B", S6B_DONE);

      const result = await updateManifest(runDir, {
        run_id: "SFS-TEST-20260213-1200",
        business: "TEST",
        loop_spec_version: "1.0.0",
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.blocked_stages).toContain("S3");
    });

    it("rejects when a required stage result is missing", async () => {
      await writeStageResult("S2B", S2B_DONE);
      await writeStageResult("S3", S3_DONE);
      // S6B missing entirely

      const result = await updateManifest(runDir, {
        run_id: "SFS-TEST-20260213-1200",
        business: "TEST",
        loop_spec_version: "1.0.0",
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.missing_stages).toContain("S6B");
    });

    it("rejects when a stage result is malformed", async () => {
      await writeStageResult("S2B", S2B_DONE);
      await writeStageResult("S3", S3_DONE);

      // Write malformed JSON
      const s6bDir = path.join(runDir, "stages", "S6B");
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

      expect(result.malformed_stages).toContain("S6B");
    });

    it("does not write manifest file when rejected", async () => {
      await writeStageResult("S2B", S2B_DONE);
      await writeStageResult("S3", S3_DONE);
      await writeStageResult("S6B", S6B_FAILED);

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
      await writeStageResult("S2B", S2B_DONE);
      await writeStageResult("S3", S3_DONE);
      await writeStageResult("S6B", S6B_DONE);

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
      await writeStageResult("S2B", S2B_DONE);
      await writeStageResult("S3", S3_DONE);
      await writeStageResult("S6B", S6B_DONE);

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
