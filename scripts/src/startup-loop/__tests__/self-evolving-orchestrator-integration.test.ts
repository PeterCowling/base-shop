import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "@jest/globals";

import type { TrialDispatchPacket } from "../lp-do-ideas-trial.js";
import type { StartupState } from "../self-evolving-contracts.js";
import {
  dispatchToMetaObservation,
  runSelfEvolvingFromIdeas,
} from "../self-evolving-from-ideas.js";

function buildStartupState(): StartupState {
  return {
    schema_version: "startup-state.v1",
    startup_state_id: "state-1",
    business_id: "BRIK",
    stage: "traction",
    current_website_generation: 3,
    offer: { title: "Starter offer" },
    icp: { segment: "SMB" },
    positioning: { angle: "fast launch" },
    brand: {
      voice_tone: "clear",
      do_rules: ["Be specific."],
      dont_rules: ["Do not overclaim."],
    },
    stack: {
      website_platform: "next",
      repo_ref: "base-shop",
      deploy_target: "staging",
    },
    analytics_stack: {
      provider: "ga4",
      workspace_id: "w1",
      event_schema_ref: "schema-1",
    },
    channels_enabled: [{ channel: "seo", automation_allowed: true }],
    credential_refs: ["cred-1"],
    kpi_definitions: [
      { name: "activation_rate", unit: "ratio", aggregation_method: "rate", kind: "primary" },
    ],
    asset_refs: ["asset-1"],
    constraints: ["no medical claims"],
    updated_at: "2026-03-02T00:00:00.000Z",
    updated_by: "agent",
  };
}

function buildDispatchPacket(id: string): TrialDispatchPacket {
  return {
    schema_version: "dispatch.v2",
    dispatch_id: id,
    mode: "trial",
    business: "BRIK",
    trigger: "artifact_delta",
    artifact_id: "legal.terms-conditions",
    before_sha: "abc1234",
    after_sha: "def5678",
    root_event_id: `root-${id}`,
    anchor_key: "legal",
    cluster_key: "website",
    cluster_fingerprint: "cluster-1",
    lineage_depth: 0,
    area_anchor: "website-legal-terms",
    location_anchors: ["docs/business-os/legal/terms.md"],
    provisional_deliverable_family: "business-artifact",
    current_truth: "Terms exist but are manually rebuilt every cycle.",
    next_scope_now: "Route to build a repeatable terms generation path.",
    adjacent_later: [],
    recommended_route: "lp-do-fact-find",
    status: "fact_find_ready",
    priority: "P1",
    confidence: 0.92,
    evidence_refs: ["docs/business-os/legal/terms.md"],
    created_at: "2026-03-02T00:00:00.000Z",
    queue_state: "enqueued",
    why: "Repeated legal terms work was done manually in multiple loops.",
    intended_outcome: {
      type: "operational",
      statement: "Use lp-do-build to automate terms-and-conditions generation.",
      source: "operator",
    },
  };
}

describe("self-evolving orchestrator integration", () => {
  it("converts dispatch packets into valid meta observations", () => {
    const packet = buildDispatchPacket("d-1");
    const observation = dispatchToMetaObservation(packet, {
      business: "BRIK",
      run_id: "run-1",
      session_id: "session-1",
      index: 0,
      now: new Date("2026-03-02T00:00:00.000Z"),
    });
    expect(observation.business).toBe("BRIK");
    expect(observation.observation_type).toBe("execution_event");
    expect(observation.hard_signature.length).toBeGreaterThan(10);
    expect(observation.skill_id).toBe("lp-do-ideas");
  });

  it("generates ranked candidates and queues backbone actions for lp-do-build", () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "self-evolving-integration-"));
    const result = runSelfEvolvingFromIdeas({
      rootDir: tempRoot,
      business: "BRIK",
      run_id: "run-1",
      session_id: "session-1",
      startup_state: buildStartupState(),
      dispatches: [
        buildDispatchPacket("d-1"),
        buildDispatchPacket("d-2"),
        buildDispatchPacket("d-3"),
      ],
      now: new Date("2026-03-02T00:00:00.000Z"),
    });

    expect(result.observations_generated).toBe(3);
    expect(result.orchestrator.candidates_generated).toBeGreaterThan(0);
    expect(result.backbone_queued).toBeGreaterThan(0);
    expect(result.orchestrator.ranked_candidates[0]?.route.route).toBe("lp-do-build");
    expect(result.orchestrator.ranked_candidates[0]?.candidate.executor_path).toBe(
      "lp-do-build:container:website-v3",
    );

    const queueRaw = readFileSync(result.backbone_queue_path, "utf-8").trim();
    expect(queueRaw.length).toBeGreaterThan(0);
    rmSync(tempRoot, { recursive: true, force: true });
  });
});
