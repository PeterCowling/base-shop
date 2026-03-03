import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { runCodebaseSignalsBridge } from "../ideas/lp-do-ideas-codebase-signals-bridge.js";

async function writeJson(root: string, relativePath: string, value: unknown): Promise<void> {
  const absolute = path.join(root, relativePath);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

describe("lp-do-ideas codebase signals bridge", () => {
  let repoRoot: string;

  beforeEach(async () => {
    repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ideas-codebase-signals-"));

    await writeJson(
      repoRoot,
      "docs/business-os/startup-loop/ideas/standing-registry.json",
      {
        registry_version: "registry.v2",
        trigger_threshold: "T1-conservative",
        t1_semantic_sections: ["critical finding", "code quality", "api endpoint", "route change"],
        unknown_artifact_policy: "fail_closed_never_trigger",
        artifacts: [
          {
            artifact_id: "BOS-BOS-BUG_SCAN_FINDINGS",
            path: "docs/plans/_latest/bug-scan-findings.user.json",
            domain: "BOS",
            business: "BOS",
            artifact_class: "source_process",
            trigger_policy: "eligible",
            propagation_mode: "source_mechanical_auto",
            depends_on: [],
            produces: [],
            active: true,
          },
          {
            artifact_id: "BOS-BOS-CODEBASE_STRUCTURAL_SIGNALS",
            path: "docs/business-os/startup-loop/ideas/trial/codebase-signals.latest.json",
            domain: "BOS",
            business: "BOS",
            artifact_class: "source_process",
            trigger_policy: "eligible",
            propagation_mode: "source_mechanical_auto",
            depends_on: [],
            produces: [],
            active: true,
          },
        ],
      },
    );

    await writeJson(
      repoRoot,
      "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      {
        queue_version: "queue.v1",
        dispatches: [],
        counts: {},
        last_updated: "2026-01-01T00:00:00.000Z",
      },
    );

    await writeJson(
      repoRoot,
      "docs/plans/sample/bug-scan-findings.user.json",
      {
        schema_version: "bug-scan-findings.v1",
        generated_at: "2026-03-03T23:55:00.000Z",
        findings: [
          {
            ruleId: "no-eval-call",
            severity: "critical",
            message: "eval is unsafe",
            file: "apps/brikette/src/lib/risky.ts",
            line: 7,
          },
        ],
      },
    );
  });

  afterEach(async () => {
    await fs.rm(repoRoot, { recursive: true, force: true });
  });

  it("emits and enqueues dispatches from bug-scan and structural code signals", async () => {
    const result = runCodebaseSignalsBridge({
      rootDir: repoRoot,
      business: "BOS",
      registryPath: "docs/business-os/startup-loop/ideas/standing-registry.json",
      queueStatePath: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      telemetryPath: "docs/business-os/startup-loop/ideas/trial/telemetry.jsonl",
      statePath: "docs/business-os/startup-loop/ideas/trial/codebase-signal-bridge-state.json",
      bugScanArtifactPath: "docs/plans/sample/bug-scan-findings.user.json",
      fromRef: "HEAD~1",
      toRef: "HEAD",
      bugSeverityThreshold: "critical",
      changedFilesOverride: [
        { status: "A", file: "apps/reception/src/app/api/users/route.ts" },
        { status: "M", file: "apps/reception/package.json" },
      ],
    });

    expect(result.ok).toBe(true);
    expect(result.events_considered).toBeGreaterThan(0);
    expect(result.events_admitted).toBeGreaterThan(0);
    expect(result.dispatches_enqueued).toBeGreaterThan(0);

    const queueStateRaw = await fs.readFile(
      path.join(repoRoot, "docs/business-os/startup-loop/ideas/trial/queue-state.json"),
      "utf8",
    );
    const queueState = JSON.parse(queueStateRaw) as { dispatches: Array<{ artifact_id: string }> };
    expect(queueState.dispatches.length).toBeGreaterThan(0);
    const artifactIds = new Set(queueState.dispatches.map((dispatch) => dispatch.artifact_id));
    expect(artifactIds.has("BOS-BOS-BUG_SCAN_FINDINGS")).toBe(true);
    expect(artifactIds.has("BOS-BOS-CODEBASE_STRUCTURAL_SIGNALS")).toBe(true);
  });

  it("suppresses repeat emissions when hashes have not changed", () => {
    const first = runCodebaseSignalsBridge({
      rootDir: repoRoot,
      business: "BOS",
      registryPath: "docs/business-os/startup-loop/ideas/standing-registry.json",
      queueStatePath: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      telemetryPath: "docs/business-os/startup-loop/ideas/trial/telemetry.jsonl",
      statePath: "docs/business-os/startup-loop/ideas/trial/codebase-signal-bridge-state.json",
      bugScanArtifactPath: "docs/plans/sample/bug-scan-findings.user.json",
      fromRef: "HEAD~1",
      toRef: "HEAD",
      bugSeverityThreshold: "critical",
      changedFilesOverride: [{ status: "M", file: "apps/reception/src/app/api/users/route.ts" }],
    });
    expect(first.ok).toBe(true);
    expect(first.dispatches_enqueued).toBeGreaterThan(0);

    const second = runCodebaseSignalsBridge({
      rootDir: repoRoot,
      business: "BOS",
      registryPath: "docs/business-os/startup-loop/ideas/standing-registry.json",
      queueStatePath: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      telemetryPath: "docs/business-os/startup-loop/ideas/trial/telemetry.jsonl",
      statePath: "docs/business-os/startup-loop/ideas/trial/codebase-signal-bridge-state.json",
      bugScanArtifactPath: "docs/plans/sample/bug-scan-findings.user.json",
      fromRef: "HEAD~1",
      toRef: "HEAD",
      bugSeverityThreshold: "critical",
      changedFilesOverride: [{ status: "M", file: "apps/reception/src/app/api/users/route.ts" }],
    });
    expect(second.ok).toBe(true);
    expect(second.dispatches_enqueued).toBe(0);
  });
});
