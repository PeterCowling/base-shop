import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "@jest/globals";

import { computeClusterFingerprint } from "../ideas/lp-do-ideas-fingerprint.js";
import {
  runHistoricalCarryoverBridge,
} from "../ideas/lp-do-ideas-historical-carryover-bridge.js";
import { parseQueueState } from "../ideas/lp-do-ideas-queue-state-file.js";

function makeTmpDir(): string {
  const dir = path.join(
    tmpdir(),
    `historical-carryover-bridge-${randomBytes(4).toString("hex")}`,
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeJson(filePath: string, value: unknown): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function readQueue(queueStatePath: string) {
  const parsed = parseQueueState(readFileSync(queueStatePath, "utf8"));
  if ("error" in parsed) {
    throw new Error(parsed.error);
  }
  return parsed;
}

describe("lp-do-ideas-historical-carryover-bridge", () => {
  it("TC-01: enqueues eligible carry-forward items and writes admission results back to the manifest", () => {
    const rootDir = makeTmpDir();
    const manifestPath = path.join(
      rootDir,
      "docs",
      "plans",
      "startup-loop-results-review-historical-carryover",
      "artifacts",
      "historical-carryover-manifest.json",
    );
    const queueStatePath = path.join(
      rootDir,
      "docs",
      "business-os",
      "startup-loop",
      "ideas",
      "trial",
      "queue-state.json",
    );
    const telemetryPath = path.join(
      rootDir,
      "docs",
      "business-os",
      "startup-loop",
      "ideas",
      "trial",
      "telemetry.jsonl",
    );

    writeJson(manifestPath, {
      schema_version: "historical-carryover-manifest.v1",
      generated_at: "2026-03-10T14:15:00.000Z",
      source_audit_path:
        "docs/plans/_archive/startup-loop-results-review-queue-unification/artifacts/historical-carryover-audit.md",
      items: [
        {
          historical_candidate_id: "hc_1",
          title: "Carry me forward",
          category: "new_loop_process",
          source_plan_slugs: ["example-plan"],
          source_paths: ["docs/plans/_archive/example-plan/results-review.signals.json"],
          source_titles: ["Carry me forward"],
          current_state: "worthwhile_unresolved",
          carry_forward_decision: "carry_forward",
          decision_reason: "Still unresolved.",
          manual_judgment_notes: "Fresh fact-find required.",
          queue_mapping: {
            business: "BRIK",
            route: "lp-do-fact-find",
            status: "fact_find_ready",
            target_slug: "carry-me-forward",
            target_path: "docs/plans/carry-me-forward/fact-find.md",
            provenance: {
              schema_version: "dispatch-historical-carryover.v1",
              historical_candidate_id: "hc_1",
              source_audit_path:
                "docs/plans/_archive/startup-loop-results-review-queue-unification/artifacts/historical-carryover-audit.md",
              source_plan_slugs: ["example-plan"],
              source_paths: ["docs/plans/_archive/example-plan/results-review.signals.json"],
              backfilled_at: null,
            },
          },
          admission_result: null,
        },
        {
          historical_candidate_id: "hc_2",
          title: "Do not carry me",
          category: "ai_to_mechanistic",
          source_plan_slugs: ["example-plan"],
          source_paths: ["docs/plans/_archive/example-plan/results-review.signals.json"],
          source_titles: ["Do not carry me"],
          current_state: "resolved",
          carry_forward_decision: "do_not_carry",
          decision_reason: "Already resolved.",
          manual_judgment_notes: "Deterministic do-not-carry.",
          queue_mapping: null,
          admission_result: null,
        },
      ],
    });

    const result = runHistoricalCarryoverBridge({
      rootDir,
      manifestPath,
      queueStatePath,
      telemetryPath,
      clock: () => new Date("2026-03-10T15:00:00.000Z"),
    });

    expect(result.ok).toBe(true);
    expect(result.eligible_items).toBe(1);
    expect(result.dispatches_enqueued).toBe(1);
    expect(result.suppressed).toBe(0);

    const queue = readQueue(queueStatePath);
    expect(queue.dispatches).toHaveLength(1);
    const dispatch = queue.dispatches[0] as { historical_carryover?: { historical_candidate_id?: string } };
    expect(dispatch.historical_carryover?.historical_candidate_id).toBe("hc_1");

    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      items: Array<{
        historical_candidate_id: string;
        admission_result: { queue_state: string; dispatch_id: string | null } | null;
        queue_mapping: { provenance: { backfilled_at: string | null } } | null;
      }>;
    };
    const carried = manifest.items.find((item) => item.historical_candidate_id === "hc_1");
    expect(carried?.admission_result?.queue_state).toBe("enqueued");
    expect(carried?.admission_result?.dispatch_id).toMatch(/^IDEA-DISPATCH-/);
    expect(carried?.queue_mapping?.provenance.backfilled_at).toBe("2026-03-10T15:00:00.000Z");
  });

  it("TC-02: suppresses duplicate historical carry-over packets and records the suppression in the manifest", () => {
    const rootDir = makeTmpDir();
    const manifestPath = path.join(
      rootDir,
      "docs",
      "plans",
      "startup-loop-results-review-historical-carryover",
      "artifacts",
      "historical-carryover-manifest.json",
    );
    const queueStatePath = path.join(
      rootDir,
      "docs",
      "business-os",
      "startup-loop",
      "ideas",
      "trial",
      "queue-state.json",
    );
    const telemetryPath = path.join(
      rootDir,
      "docs",
      "business-os",
      "startup-loop",
      "ideas",
      "trial",
      "telemetry.jsonl",
    );
    const normalizedSemanticDiffHash = createHash("sha1")
      .update("hc_dup::duplicate-item")
      .digest("hex");
    const clusterFingerprint = computeClusterFingerprint({
      root_event_id: "historical-carryover:brik:hc_dup",
      anchor_key: "duplicate-item",
      evidence_ref_ids: [
        "hc_dup",
        "docs/plans/_archive/startup-loop-results-review-queue-unification/artifacts/historical-carryover-audit.md",
        "docs/plans/_archive/example-plan/results-review.signals.json",
      ],
      normalized_semantic_diff_hash: normalizedSemanticDiffHash,
    });

    writeJson(queueStatePath, {
      dispatches: [
        {
          dispatch_id: "IDEA-DISPATCH-20260310150000-0001",
          cluster_key: "BRIK:historical-carryover:hc_dup:duplicate-item",
          cluster_fingerprint: clusterFingerprint,
          queue_state: "enqueued",
        },
      ],
    });

    writeJson(manifestPath, {
      schema_version: "historical-carryover-manifest.v1",
      generated_at: "2026-03-10T14:15:00.000Z",
      source_audit_path:
        "docs/plans/_archive/startup-loop-results-review-queue-unification/artifacts/historical-carryover-audit.md",
      items: [
        {
          historical_candidate_id: "hc_dup",
          title: "Duplicate item",
          category: "ai_to_mechanistic",
          source_plan_slugs: ["example-plan"],
          source_paths: ["docs/plans/_archive/example-plan/results-review.signals.json"],
          source_titles: ["Duplicate item"],
          current_state: "worthwhile_unresolved",
          carry_forward_decision: "carry_forward",
          decision_reason: "Still unresolved.",
          manual_judgment_notes: "Fresh fact-find required.",
          queue_mapping: {
            business: "BRIK",
            route: "lp-do-fact-find",
            status: "fact_find_ready",
            target_slug: "duplicate-item",
            target_path: "docs/plans/duplicate-item/fact-find.md",
            provenance: {
              schema_version: "dispatch-historical-carryover.v1",
              historical_candidate_id: "hc_dup",
              source_audit_path:
                "docs/plans/_archive/startup-loop-results-review-queue-unification/artifacts/historical-carryover-audit.md",
              source_plan_slugs: ["example-plan"],
              source_paths: ["docs/plans/_archive/example-plan/results-review.signals.json"],
              backfilled_at: null,
            },
          },
          admission_result: null,
        },
      ],
    });

    const result = runHistoricalCarryoverBridge({
      rootDir,
      manifestPath,
      queueStatePath,
      telemetryPath,
      clock: () => new Date("2026-03-10T15:00:00.000Z"),
    });

    expect(result.ok).toBe(true);
    expect(result.dispatches_enqueued).toBe(0);
    expect(result.suppressed).toBe(1);

    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      items: Array<{
        historical_candidate_id: string;
        admission_result: { queue_state: string; suppression_reason: string | null } | null;
      }>;
    };
    expect(manifest.items[0]?.admission_result?.queue_state).toBe("suppressed");
    expect(manifest.items[0]?.admission_result?.suppression_reason).toContain(
      "cluster already present",
    );
  });
});
