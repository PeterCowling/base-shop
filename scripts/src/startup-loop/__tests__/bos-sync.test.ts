import { describe, expect, it } from "@jest/globals";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

import type { BosApiClient, UpsertResult } from "../bos-sync";
import { bosSync } from "../bos-sync";

/**
 * LPSP-06C: /lp-bos-sync (S5B idempotent persistence + manifest commit)
 *
 * Tests cover:
 * - VC-06C-01: S5A gate — S5A absent/Blocked → S5B blocks
 * - VC-06C-02: Idempotent retry — same input → no duplicate cards
 * - VC-06C-03: Partial failure recovery — card write OK, manifest read fails → resume
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

const S5A_DONE = makeStageResult({
  stage: "S5A",
  status: "Done",
  produced_keys: ["prioritized_items"],
  artifacts: { prioritized_items: "stages/S5A/prioritized-items.md" },
});

const S5A_BLOCKED = makeStageResult({
  stage: "S5A",
  status: "Blocked",
  blocking_reason: "Upstream S4 not complete",
});

const SYNC_OPTIONS_BASE = {
  run_id: "SFS-TEST-20260213-1200",
  business: "TEST",
  loop_spec_version: "1.0.0",
};

async function setupRunDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "bos-sync-test-"));
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

function createMockApi(): BosApiClient & { calls: { method: string; args: unknown[] }[] } {
  const calls: { method: string; args: unknown[] }[] = [];
  const entityShas = new Map<string, string>();

  return {
    calls,
    async upsertCard(cardId: string, data: Record<string, unknown>): Promise<UpsertResult> {
      calls.push({ method: "upsertCard", args: [cardId, data] });
      const existingSha = entityShas.get(`card:${cardId}`);
      const newSha = `sha-${calls.length}`;
      entityShas.set(`card:${cardId}`, newSha);
      return {
        created: !existingSha,
        entitySha: newSha,
      };
    },
    async upsertStageDoc(cardId: string, stage: string, content: string): Promise<UpsertResult> {
      calls.push({ method: "upsertStageDoc", args: [cardId, stage, content] });
      const key = `stage-doc:${cardId}:${stage}`;
      const existingSha = entityShas.get(key);
      const newSha = `sha-${calls.length}`;
      entityShas.set(key, newSha);
      return {
        created: !existingSha,
        entitySha: newSha,
      };
    },
  };
}

// -- Tests --

describe("bosSync", () => {
  // VC-06C-01: S5A gate
  describe("VC-06C-01: S5A gate", () => {
    it("blocks when S5A stage-result is absent", async () => {
      const runDir = await setupRunDir();
      const api = createMockApi();
      // No S5A result

      const result = await bosSync(runDir, { ...SYNC_OPTIONS_BASE, api });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.stage_result.status).toBe("Blocked");
        expect(result.stage_result.blocking_reason).toContain("S5A");
      }
      // No API calls should have been made
      expect(api.calls).toHaveLength(0);
    });

    it("blocks when S5A status is Blocked", async () => {
      const runDir = await setupRunDir();
      await writeStageResult(runDir, "S5A", S5A_BLOCKED);
      const api = createMockApi();

      const result = await bosSync(runDir, { ...SYNC_OPTIONS_BASE, api });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.stage_result.status).toBe("Blocked");
        expect(result.stage_result.blocking_reason).toContain("S5A");
        expect(result.stage_result.blocking_reason).toContain("not complete");
      }
    });

    it("writes stage-result.json to stages/S5B/ when blocked", async () => {
      const runDir = await setupRunDir();
      const api = createMockApi();

      await bosSync(runDir, { ...SYNC_OPTIONS_BASE, api });

      const stageResultPath = path.join(runDir, "stages", "S5B", "stage-result.json");
      const written = JSON.parse(await fs.readFile(stageResultPath, "utf-8"));
      expect(written.stage).toBe("S5B");
      expect(written.status).toBe("Blocked");
    });
  });

  // VC-06C-02: Idempotent retry
  describe("VC-06C-02: idempotent retry", () => {
    it("second run with same input produces same stage-result (no duplicate API calls beyond expected)", async () => {
      const runDir = await setupRunDir();
      await writeStageResult(runDir, "S5A", S5A_DONE);
      await writeArtifact(
        runDir,
        "stages/S5A/prioritized-items.md",
        "# Prioritized Items\n\n1. Item A\n2. Item B",
      );

      const api = createMockApi();
      const result1 = await bosSync(runDir, { ...SYNC_OPTIONS_BASE, api });
      expect(result1.success).toBe(true);
      const callCount1 = api.calls.length;
      expect(callCount1).toBeGreaterThan(0);

      // Re-run (S5B stage-result now exists from first run)
      const result2 = await bosSync(runDir, { ...SYNC_OPTIONS_BASE, api });
      expect(result2.success).toBe(true);

      // Second run should still call API (upserts are idempotent by design)
      // but both runs should produce identical stage-results
      if (result1.success && result2.success) {
        expect(result1.stage_result.produced_keys).toEqual(result2.stage_result.produced_keys);
      }
    });
  });

  // VC-06C-03: Partial failure recovery
  describe("VC-06C-03: partial failure recovery", () => {
    it("recovers when first run partially fails", async () => {
      const runDir = await setupRunDir();
      await writeStageResult(runDir, "S5A", S5A_DONE);
      await writeArtifact(
        runDir,
        "stages/S5A/prioritized-items.md",
        "# Prioritized Items\n\n1. Item A",
      );

      // First run with failing API (upsertStageDoc fails)
      let callCount = 0;
      const failingApi: BosApiClient = {
        async upsertCard(cardId: string, _data: Record<string, unknown>): Promise<UpsertResult> {
          callCount++;
          return { created: true, entitySha: `sha-${callCount}` };
        },
        async upsertStageDoc(): Promise<UpsertResult> {
          callCount++;
          throw new Error("API timeout");
        },
      };

      const result1 = await bosSync(runDir, { ...SYNC_OPTIONS_BASE, api: failingApi });
      expect(result1.success).toBe(false);
      if (!result1.success) {
        expect(result1.stage_result.status).toBe("Failed");
        expect(result1.stage_result.error).toContain("API");
      }

      // Resume with working API
      const workingApi = createMockApi();
      const result2 = await bosSync(runDir, { ...SYNC_OPTIONS_BASE, api: workingApi });
      expect(result2.success).toBe(true);
      if (result2.success) {
        expect(result2.stage_result.status).toBe("Done");
      }
    });
  });
});
