import { describe, expect, it } from "@jest/globals";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

import { checkRunConcurrency } from "../run-concurrency";

/**
 * LPSP-08: /lp-build (VC-08-03 concurrency gate)
 *
 * Tests cover:
 * - VC-08-03-01: No active runs → new run allowed
 * - VC-08-03-02: Active run exists for same business → new run blocked
 * - VC-08-03-03: Active run for different business → new run allowed
 * - VC-08-03-04: Completed run for same business → new run allowed
 */

// -- Fixture helpers --

interface DeriveStateFixture {
  schema_version: number;
  business: string;
  run_id: string;
  loop_spec_version: string;
  active_stage: string | null;
  stages: Record<string, { status: string }>;
}

function makeState(overrides: Partial<DeriveStateFixture>): DeriveStateFixture {
  return {
    schema_version: 1,
    business: "TEST",
    run_id: "SFS-TEST-20260213-1200",
    loop_spec_version: "1.0.0",
    active_stage: null,
    stages: {},
    ...overrides,
  };
}

async function setupRunsDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "concurrency-test-"));
}

async function writeRunState(
  runsDir: string,
  runId: string,
  state: DeriveStateFixture,
  status: "active" | "complete" | "blocked" = "active",
): Promise<void> {
  const runDir = path.join(runsDir, runId);
  await fs.mkdir(runDir, { recursive: true });
  await fs.writeFile(
    path.join(runDir, "state.json"),
    JSON.stringify({ ...state, run_status: status }, null, 2),
  );
}

// -- Tests --

describe("checkRunConcurrency", () => {
  // VC-08-03-01: No active runs → allowed
  it("allows new run when no runs exist", async () => {
    const runsDir = await setupRunsDir();

    const result = await checkRunConcurrency("TEST", runsDir);

    expect(result.allowed).toBe(true);
  });

  // VC-08-03-02: Active run for same business → blocked
  it("blocks new run when active run exists for same business", async () => {
    const runsDir = await setupRunsDir();
    await writeRunState(
      runsDir,
      "SFS-TEST-20260213-1200",
      makeState({ business: "TEST", active_stage: "S3" }),
      "active",
    );

    const result = await checkRunConcurrency("TEST", runsDir);

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("one active run per business");
    expect(result.activeRunId).toBe("SFS-TEST-20260213-1200");
  });

  // VC-08-03-03: Active run for different business → allowed
  it("allows new run when active run is for a different business", async () => {
    const runsDir = await setupRunsDir();
    await writeRunState(
      runsDir,
      "SFS-OTHER-20260213-1200",
      makeState({ business: "OTHER", active_stage: "S3" }),
      "active",
    );

    const result = await checkRunConcurrency("TEST", runsDir);

    expect(result.allowed).toBe(true);
  });

  // VC-08-03-04: Completed run for same business → allowed
  it("allows new run when prior run for same business is complete", async () => {
    const runsDir = await setupRunsDir();
    await writeRunState(
      runsDir,
      "SFS-TEST-20260213-1000",
      makeState({ business: "TEST", active_stage: null }),
      "complete",
    );

    const result = await checkRunConcurrency("TEST", runsDir);

    expect(result.allowed).toBe(true);
  });

  it("blocks when one of multiple runs is active for same business", async () => {
    const runsDir = await setupRunsDir();
    // Completed run
    await writeRunState(
      runsDir,
      "SFS-TEST-20260213-0800",
      makeState({ business: "TEST" }),
      "complete",
    );
    // Active run
    await writeRunState(
      runsDir,
      "SFS-TEST-20260213-1200",
      makeState({ business: "TEST", active_stage: "S4" }),
      "active",
    );

    const result = await checkRunConcurrency("TEST", runsDir);

    expect(result.allowed).toBe(false);
    expect(result.activeRunId).toBe("SFS-TEST-20260213-1200");
  });
});
