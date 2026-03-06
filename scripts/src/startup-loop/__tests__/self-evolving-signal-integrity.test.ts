import { describe, expect, it } from "@jest/globals";

import type { TrialDispatchPacket } from "../ideas/lp-do-ideas-trial.js";
import type { StartupState } from "../self-evolving/self-evolving-contracts.js";
import {
  extractBulletCandidates,
  extractPatternReflectionSeeds,
} from "../self-evolving/self-evolving-from-build-output.js";
import { dispatchToMetaObservation } from "../self-evolving/self-evolving-from-ideas.js";
import {
  deriveBoundarySignalSnapshotFromStartupState,
  isNonePlaceholderSignal,
} from "../self-evolving/self-evolving-signal-helpers.js";

function buildStartupState(): StartupState {
  return {
    schema_version: "startup-state.v1",
    startup_state_id: "state-brik-1",
    business_id: "BRIK",
    stage: "traction",
    current_website_generation: 3,
    offer: { headline: "Rapid launch storefront" },
    icp: { segment: "small ecommerce operators" },
    positioning: { angle: "launch in days" },
    brand: {
      voice_tone: "clear",
      do_rules: ["Keep legal copy plain-English."],
      dont_rules: ["No unverified guarantees."],
    },
    stack: {
      website_platform: "next",
      repo_ref: "base-shop",
      deploy_target: "staging",
    },
    analytics_stack: {
      provider: "ga4",
      workspace_id: "ws-brik",
      event_schema_ref: "schema-brik-v1",
    },
    channels_enabled: [{ channel: "seo", automation_allowed: true }],
    credential_refs: ["cred-brik-gh"],
    kpi_definitions: [
      {
        name: "activation_rate",
        unit: "ratio",
        aggregation_method: "rate",
        kind: "primary",
      },
      {
        name: "error_rate",
        unit: "ratio",
        aggregation_method: "rate",
        kind: "guardrail",
      },
    ],
    asset_refs: ["docs/business-os/legal/terms.md"],
    constraints: ["Claims policy applies"],
    updated_at: "2026-03-02T16:00:00.000Z",
    updated_by: "operator",
  };
}

function buildDispatchPacket(
  id: string,
  overrides: Partial<TrialDispatchPacket> = {},
): TrialDispatchPacket {
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
    ...overrides,
  };
}

describe("self-evolving signal integrity", () => {
  it("suppresses placeholder none signals", () => {
    expect(isNonePlaceholderSignal("None")).toBe(true);
    expect(isNonePlaceholderSignal("New skill - None.")).toBe(true);
    expect(isNonePlaceholderSignal("New open-source package: None identified.")).toBe(true);
    expect(isNonePlaceholderSignal("New skill - Build a guardrail checker")).toBe(false);
  });

  it("extracts only real build-output idea bullets", () => {
    const markdown = `
## New Idea Candidates
- New standing data source - None.
- New open-source package: None identified.
- New skill - Build a guardrail checker
- New loop process - Tighten queue completion write-back
`;

    expect(extractBulletCandidates(markdown)).toEqual([
      "New skill - Build a guardrail checker",
      "New loop process - Tighten queue completion write-back",
    ]);
  });

  it("extracts structured pattern-reflection entries individually", () => {
    const markdown = `---
schema_version: pattern-reflection.v1
feature_slug: startup-loop-self-improvement-workflow-closure
generated_at: 2026-03-05T12:00:00.000Z
entries:
  - pattern_summary: Repeated build-time queue persistence drift
    routing_target: loop_update
    occurrence_count: 3
    evidence_refs:
      - docs/plans/example/results-review.user.md
  - pattern_summary: Missing workflow follow-up dispatch emission
    routing_target: skill_proposal
    occurrence_count: 2
---

# Pattern Reflection

## Patterns

None identified.
`;

    const seeds = extractPatternReflectionSeeds(markdown);
    expect(seeds).toHaveLength(2);
    expect(seeds[0]?.candidateTypeHint).toBe("skill_refactor");
    expect(seeds[1]?.candidateTypeHint).toBe("new_skill");
  });

  it("stabilizes repeat identity across semantically equivalent dispatches", () => {
    const first = dispatchToMetaObservation(buildDispatchPacket("d-1"), {
      business: "BRIK",
      run_id: "run-1",
      session_id: "session-1",
      index: 0,
      now: new Date("2026-03-02T00:00:00.000Z"),
    });
    const second = dispatchToMetaObservation(
      buildDispatchPacket("d-2", {
        artifact_id: "docs.legal.v2",
        after_sha: "fff7777",
        location_anchors: ["docs/business-os/legal/terms-v2.md"],
      }),
      {
        business: "BRIK",
        run_id: "run-1",
        session_id: "session-1",
        index: 1,
        now: new Date("2026-03-02T00:00:00.000Z"),
      },
    );

    expect(first.hard_signature).toBe(second.hard_signature);
    expect(first.signal_hints?.recurrence_key).toBe(second.signal_hints?.recurrence_key);
  });

  it("derives mature-boundary inputs with explicit provenance", () => {
    const snapshot = deriveBoundarySignalSnapshotFromStartupState(buildStartupState());

    expect(snapshot.signals.monthly_revenue).toBe(0);
    expect(snapshot.sources.monthly_revenue).toBe("unknown");
    expect(snapshot.signals.headcount).toBe(1);
    expect(snapshot.sources.headcount).toBe("unknown");
    expect(snapshot.sources.operational_complexity_score).toBe("inferred");
    expect(snapshot.signals.operational_complexity_score).toBeGreaterThanOrEqual(5);
  });
});
