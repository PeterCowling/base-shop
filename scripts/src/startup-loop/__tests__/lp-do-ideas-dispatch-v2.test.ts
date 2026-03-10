/**
 * dispatch.v2 schema validation tests.
 *
 * TC-01-A: Valid v2 packet with operator-authored `why` + measurable `intended_outcome` passes
 * TC-01-B: v2 packet missing `why` fails schema validation with actionable error
 * TC-01-C: v2 packet with `intended_outcome.type: "operational"` and non-empty statement passes
 * TC-01-D: v2 packet with `intended_outcome.source: "auto"` passes schema (flagged in quality metrics, not schema)
 * TC-01-E: `artifact_delta` dispatch with auto-populated values carries `source: "auto"` — schema permits
 *
 * Plan: docs/plans/startup-loop-why-intended-outcome-automation/plan.md (TASK-01)
 */

import { describe, expect, it } from "@jest/globals";

import {
  type IntendedOutcomeV2,
  type TrialDispatchPacketV2,
  validateDispatchV2,
} from "../ideas/lp-do-ideas-trial.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FIXED_DATE = new Date("2026-02-25T10:00:00.000Z");

/** Builds a minimal valid dispatch.v2 packet with operator-authored outcome. */
function makeV2Packet(
  overrides: Partial<TrialDispatchPacketV2> = {},
): TrialDispatchPacketV2 {
  return {
    schema_version: "dispatch.v2",
    dispatch_id: "IDEA-DISPATCH-20260225100000-0001",
    mode: "trial",
    business: "HBAG",
    trigger: "artifact_delta",
    artifact_id: "HBAG-SELL-PACK",
    before_sha: "abc1234",
    after_sha: "def5678",
    root_event_id: "HBAG-SELL-PACK:def5678",
    anchor_key: "channel-strategy",
    cluster_key: "hbag:sell:channel-strategy:HBAG-SELL-PACK:def5678",
    cluster_fingerprint: "deadbeef",
    lineage_depth: 0,
    area_anchor: "channel-strategy",
    location_anchors: ["docs/business-os/strategy/HBAG/sell-pack.user.md"],
    provisional_deliverable_family: "business-artifact",
    current_truth: "HBAG-SELL-PACK changed (abc1234 → def5678)",
    next_scope_now: "Investigate channel-strategy delta for HBAG",
    adjacent_later: [],
    recommended_route: "lp-do-fact-find",
    status: "fact_find_ready",
    priority: "P2",
    confidence: 0.75,
    evidence_refs: ["docs/business-os/strategy/HBAG/sell-pack.user.md"],
    created_at: FIXED_DATE.toISOString(),
    queue_state: "enqueued",
    why: "Channel mix shifted toward DTC — we need to validate whether new sell-pack guidance improves hostel channel ROI",
    intended_outcome: {
      type: "measurable",
      statement: "≥10% improvement in DTC booking conversion within 30 days of rollout",
      source: "operator",
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// TC-01-A: Valid v2 packet with operator-authored `why` + measurable `intended_outcome` passes
// ---------------------------------------------------------------------------

describe("TC-01-A: Valid v2 packet — operator-authored why + measurable outcome", () => {
  it("passes schema validation for a complete v2 packet", () => {
    const packet = makeV2Packet();
    const result = validateDispatchV2(packet);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("schema_version is 'dispatch.v2'", () => {
    const packet = makeV2Packet();
    expect(packet.schema_version).toBe("dispatch.v2");
  });

  it("why is a non-empty operator-authored string", () => {
    const packet = makeV2Packet();
    expect(typeof packet.why).toBe("string");
    expect(packet.why.trim().length).toBeGreaterThan(0);
  });

  it("intended_outcome.source is 'operator' for operator-authored content", () => {
    const packet = makeV2Packet();
    expect(packet.intended_outcome.source).toBe("operator");
  });
});

// ---------------------------------------------------------------------------
// TC-01-B: v2 packet missing `why` fails schema validation
// ---------------------------------------------------------------------------

describe("TC-01-B: v2 packet missing `why` — schema validation fails", () => {
  it("rejects v2 packet with missing why field", () => {
    const packet = makeV2Packet({
      why: undefined as unknown as string,
    });
    const result = validateDispatchV2(packet);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.toLowerCase().includes("why"))).toBe(true);
  });

  it("rejects v2 packet with empty why string", () => {
    const packet = makeV2Packet({ why: "" });
    const result = validateDispatchV2(packet);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes("why"))).toBe(true);
  });

  it("rejects v2 packet with whitespace-only why string", () => {
    const packet = makeV2Packet({ why: "   " });
    const result = validateDispatchV2(packet);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes("why"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TC-01-C: v2 packet with intended_outcome.type "operational" + non-empty statement passes
// ---------------------------------------------------------------------------

describe("TC-01-C: operational intended_outcome — no KPI required", () => {
  it("passes when type is 'operational' with non-empty statement", () => {
    const packet = makeV2Packet({
      intended_outcome: {
        type: "operational",
        statement: "Establish repeatable channel-scoring process for hostel partnerships",
        source: "operator",
      },
    });
    const result = validateDispatchV2(packet);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects operational outcome with empty statement", () => {
    const packet = makeV2Packet({
      intended_outcome: {
        type: "operational",
        statement: "",
        source: "operator",
      },
    });
    const result = validateDispatchV2(packet);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes("statement"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TC-01-D: v2 packet with intended_outcome.source "auto" — schema permits
// ---------------------------------------------------------------------------

describe("TC-01-D: source='auto' — schema permits, excluded from quality metrics", () => {
  it("passes schema validation when source is 'auto'", () => {
    const packet = makeV2Packet({
      intended_outcome: {
        type: "measurable",
        statement: "Investigate implications of channel-strategy delta",
        source: "auto",
      },
    });
    const result = validateDispatchV2(packet);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("schema result includes quality_warning when source is 'auto'", () => {
    const packet = makeV2Packet({
      intended_outcome: {
        type: "measurable",
        statement: "Auto-generated placeholder statement",
        source: "auto",
      },
    });
    const result = validateDispatchV2(packet);

    expect(result.valid).toBe(true);
    expect(result.quality_warnings).toBeDefined();
    expect(result.quality_warnings!.some((w) => w.toLowerCase().includes("auto"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TC-01-E: artifact_delta dispatch with auto-populated values — source: "auto"
// ---------------------------------------------------------------------------

describe("TC-01-E: artifact_delta dispatch auto-populated values carry source: 'auto'", () => {
  it("auto-generated why + source=auto passes schema", () => {
    const packet = makeV2Packet({
      trigger: "artifact_delta",
      why: "HBAG-SELL-PACK changed (abc1234 → def5678)",
      intended_outcome: {
        type: "operational",
        statement: "Investigate implications of channel-strategy delta for HBAG",
        source: "auto",
      },
    });
    const result = validateDispatchV2(packet);

    expect(result.valid).toBe(true);
  });

  it("operator_idea packets may carry artifact_id=null and build_origin provenance", () => {
    const packet = makeV2Packet({
      trigger: "operator_idea",
      artifact_id: null,
      build_origin: {
        schema_version: "dispatch-build-origin.v1",
        build_signal_id: "signal-123",
        recurrence_key: "recur-123",
        review_cycle_key: "test-feature",
        plan_slug: "test-feature",
        canonical_title: "Queue-backed build origin bridge",
        primary_source: "results-review.signals.json",
        merge_state: "single_source",
        source_presence: {
          results_review_signal: true,
          pattern_reflection_entry: false,
        },
        results_review_path: "docs/plans/test-feature/results-review.user.md",
        results_review_sidecar_path: "docs/plans/test-feature/results-review.signals.json",
        pattern_reflection_path: null,
        pattern_reflection_sidecar_path: null,
        gap_case: {
          schema_version: "gap-case.v1",
          gap_case_id: "gap-123",
          source_kind: "build_origin",
          business_id: "HBAG",
          stage_id: null,
          capability_id: null,
          gap_type: "build_origin_review_signal",
          reason_code: "build_origin_signal",
          severity: 0.7,
          evidence_refs: ["docs/plans/test-feature/results-review.user.md"],
          recurrence_key: "recur-123",
          structural_context: {
            plan_slug: "test-feature",
          },
          runtime_binding: {
            binding_mode: "compiled_to_candidate",
            candidate_id: "cand-123",
          },
        },
        prescription: {
          schema_version: "prescription.v1",
          prescription_id: "rx-123",
          prescription_family: "build_origin_fact_find_candidate",
          source: "build_origin",
          gap_types_supported: ["build_origin_review_signal"],
          required_route: "lp-do-fact-find",
          required_inputs: ["docs/plans/test-feature/results-review.signals.json"],
          expected_artifacts: ["fact-find.md"],
          expected_signal_change: "Address the build-origin signal through the canonical queue path.",
          risk_class: "low",
        },
      },
    });
    const result = validateDispatchV2(packet);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("operator_idea packets may carry historical_carryover provenance", () => {
    const packet = makeV2Packet({
      trigger: "operator_idea",
      artifact_id: null,
      historical_carryover: {
        schema_version: "dispatch-historical-carryover.v1",
        manifest_path:
          "docs/plans/startup-loop-results-review-historical-carryover/artifacts/historical-carryover-manifest.json",
        historical_candidate_id: "hc_1234",
        source_audit_path:
          "docs/plans/_archive/startup-loop-results-review-queue-unification/artifacts/historical-carryover-audit.md",
        source_plan_slugs: ["reception-component-token-compliance"],
        source_paths: [
          "docs/plans/_archive/reception-component-token-compliance/results-review.signals.json",
        ],
        backfilled_at: "2026-03-10T15:00:00.000Z",
      },
    });
    const result = validateDispatchV2(packet);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("self_evolving links may carry canonical gap-case and prescription references", () => {
    const packet = makeV2Packet({
      trigger: "operator_idea",
      artifact_id: null,
      self_evolving: {
        candidate_id: "cand-1",
        decision_id: "decision-1",
        requirement_posture: "relative_required",
        blocking_scope: "degrades_quality",
        prescription_maturity: "structured",
        gap_case: {
          gap_case_id: "gap-1",
          candidate_id: "cand-1",
          binding_mode: "compiled_to_candidate",
        },
        prescription: {
          prescription_id: "prescription-1",
          prescription_family: "build-origin-bridge-fact-find",
          required_route: "lp-do-fact-find",
        },
        policy_version: "self-evolving-policy.v1",
        recommended_route_origin: "lp-do-plan",
        executor_path: "lp-do-build:container:website-v3",
        handoff_emitted_at: FIXED_DATE.toISOString(),
      },
    });
    const result = validateDispatchV2(packet);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects invalid learned-prescription posture fields on self_evolving links", () => {
    const packet = makeV2Packet({
      trigger: "operator_idea",
      artifact_id: null,
      self_evolving: {
        candidate_id: "cand-1",
        decision_id: "decision-1",
        requirement_posture: "someday" as never,
        blocking_scope: "degrades_quality",
        prescription_maturity: "structured",
        policy_version: "self-evolving-policy.v1",
        recommended_route_origin: "lp-do-plan",
        executor_path: "lp-do-build:container:website-v3",
        handoff_emitted_at: FIXED_DATE.toISOString(),
      },
    });
    const result = validateDispatchV2(packet);

    expect(result.valid).toBe(false);
    expect(
      result.errors.some((error) => error.includes("self_evolving.requirement_posture")),
    ).toBe(true);
  });

  it("accepts unknown-maturity self_evolving links when a discovery contract is present", () => {
    const packet = makeV2Packet({
      trigger: "operator_idea",
      artifact_id: null,
      self_evolving: {
        candidate_id: "cand-1",
        decision_id: "decision-1",
        requirement_posture: "relative_required",
        blocking_scope: "degrades_quality",
        prescription_maturity: "unknown",
        gap_case: {
          gap_case_id: "gap-1",
          candidate_id: "cand-1",
          binding_mode: "compiled_to_candidate",
        },
        prescription: {
          prescription_id: "prescription-1",
          prescription_family: "build-origin-bridge-fact-find",
          required_route: "lp-do-fact-find",
        },
        discovery_contract: {
          schema_version: "unknown-prescription-discovery.v1",
          gap_case_id: "gap-1",
          discovery_reason: "prescription_unknown",
          prescription_candidates: [
            {
              prescription_id: "prescription-1",
              prescription_family: "build-origin-bridge-fact-find",
              required_route: "lp-do-fact-find",
              required_inputs: ["results-review.signals.json"],
              expected_artifacts: ["fact-find.md"],
              expected_signals: [
                "Gap becomes structured enough for canonical queue admission.",
              ],
            },
          ],
          recommended_first_prescription_id: "prescription-1",
          required_inputs: ["results-review.signals.json"],
          expected_artifacts: ["fact-find.md"],
          expected_signals: [
            "Gap becomes structured enough for canonical queue admission.",
          ],
        },
        policy_version: "self-evolving-policy.v1",
        recommended_route_origin: "lp-do-fact-find",
        executor_path: "lp-do-build:container:website-v3",
        handoff_emitted_at: FIXED_DATE.toISOString(),
      },
    });
    const result = validateDispatchV2(packet);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects unknown-maturity self_evolving links without a discovery contract", () => {
    const packet = makeV2Packet({
      trigger: "operator_idea",
      artifact_id: null,
      self_evolving: {
        candidate_id: "cand-1",
        decision_id: "decision-1",
        prescription_maturity: "unknown",
        policy_version: "self-evolving-policy.v1",
        recommended_route_origin: "lp-do-fact-find",
        executor_path: "lp-do-build:container:website-v3",
        handoff_emitted_at: FIXED_DATE.toISOString(),
      },
    });
    const result = validateDispatchV2(packet);

    expect(result.valid).toBe(false);
    expect(
      result.errors.some((error) => error.includes("self_evolving.discovery_contract is required")),
    ).toBe(true);
  });

  it("rejects discovery contracts whose recommended prescription drifts from self_evolving.prescription", () => {
    const packet = makeV2Packet({
      trigger: "operator_idea",
      artifact_id: null,
      self_evolving: {
        candidate_id: "cand-1",
        decision_id: "decision-1",
        prescription_maturity: "hypothesized",
        gap_case: {
          gap_case_id: "gap-1",
          candidate_id: "cand-1",
          binding_mode: "compiled_to_candidate",
        },
        prescription: {
          prescription_id: "prescription-1",
          prescription_family: "build-origin-bridge-fact-find",
          required_route: "lp-do-fact-find",
        },
        discovery_contract: {
          schema_version: "unknown-prescription-discovery.v1",
          gap_case_id: "gap-1",
          discovery_reason: "prescription_hypothesized",
          prescription_candidates: [
            {
              prescription_id: "prescription-other",
              prescription_family: "build-origin-bridge-fact-find",
              required_route: "lp-do-fact-find",
              required_inputs: ["results-review.signals.json"],
              expected_artifacts: ["fact-find.md"],
              expected_signals: [
                "Gap becomes structured enough for canonical queue admission.",
              ],
            },
          ],
          recommended_first_prescription_id: "prescription-other",
          required_inputs: ["results-review.signals.json"],
          expected_artifacts: ["fact-find.md"],
          expected_signals: [
            "Gap becomes structured enough for canonical queue admission.",
          ],
        },
        policy_version: "self-evolving-policy.v1",
        recommended_route_origin: "lp-do-fact-find",
        executor_path: "lp-do-build:container:website-v3",
        handoff_emitted_at: FIXED_DATE.toISOString(),
      },
    });
    const result = validateDispatchV2(packet);

    expect(result.valid).toBe(false);
    expect(
      result.errors.some((error) =>
        error.includes(
          "self_evolving.discovery_contract.recommended_first_prescription_id must match self_evolving.prescription.prescription_id",
        ),
      ),
    ).toBe(true);
  });

  it("rejects self_evolving gap-case references that drift from candidate identity", () => {
    const packet = makeV2Packet({
      trigger: "operator_idea",
      artifact_id: null,
      self_evolving: {
        candidate_id: "cand-1",
        decision_id: "decision-1",
        gap_case: {
          gap_case_id: "gap-1",
          candidate_id: "cand-other",
          binding_mode: "compiled_to_candidate",
        },
        policy_version: "self-evolving-policy.v1",
        recommended_route_origin: "lp-do-plan",
        executor_path: "lp-do-build:container:website-v3",
        handoff_emitted_at: FIXED_DATE.toISOString(),
      },
    });
    const result = validateDispatchV2(packet);

    expect(result.valid).toBe(false);
    expect(
      result.errors.some((error) =>
        error.includes("self_evolving.gap_case.candidate_id must match self_evolving.candidate_id"),
      ),
    ).toBe(true);
  });

  it("auto-generated values produce quality_warnings about auto source", () => {
    const packet = makeV2Packet({
      trigger: "artifact_delta",
      why: "artifact changed automatically",
      intended_outcome: {
        type: "operational",
        statement: "auto investigation",
        source: "auto",
      },
    });
    const result = validateDispatchV2(packet);

    expect(result.valid).toBe(true);
    expect(result.quality_warnings).toBeDefined();
    expect(result.quality_warnings!.length).toBeGreaterThan(0);
  });

  it("accepts milestone_event packets with canonical milestone provenance", () => {
    const packet = makeV2Packet({
      trigger: "milestone_event",
      artifact_id: null,
      milestone_origin: {
        schema_version: "dispatch-milestone.v1",
        milestone_event_id: "milestone-1",
        root_id: "transaction_data_available",
        producer_kind: "metric",
        source_ref: "data/shops/BRIK/growth-ledger.json",
        observed_at: FIXED_DATE.toISOString(),
        bundle_key: "gtm4-lifecycle-readiness",
        bundle_title: "Assess lifecycle automation readiness from first transaction data",
        bundle_size: 1,
        bundle_index: 0,
        gap_case: {
          schema_version: "gap-case.v1",
          gap_case_id: "gap-1",
          source_kind: "milestone",
          business_id: "HBAG",
          stage_id: "S10",
          capability_id: null,
          gap_type: "milestone_transaction_data_available_gtm4_lifecycle_readiness",
          reason_code: "transaction_data_available",
          severity: 0.7,
          evidence_refs: ["data/shops/BRIK/growth-ledger.json"],
          recurrence_key: "transaction_data_available:gtm4-lifecycle-readiness",
          requirement_posture: "relative_required",
          blocking_scope: "degrades_quality",
          structural_context: {
            milestone_root_id: "transaction_data_available",
          },
          runtime_binding: {
            binding_mode: "compiled_to_candidate",
            candidate_id: "cand-1",
          },
        },
        prescription: {
          schema_version: "prescription.v1",
          prescription_id: "rx-1",
          prescription_family: "milestone_transaction_data_available_gtm4_lifecycle_readiness",
          source: "milestone_bundle",
          gap_types_supported: [
            "milestone_transaction_data_available_gtm4_lifecycle_readiness",
          ],
          required_route: "lp-do-fact-find",
          required_inputs: ["data/shops/BRIK/growth-ledger.json"],
          expected_artifacts: ["fact-find.md"],
          expected_signal_change:
            "Lifecycle automation readiness is grounded in real transaction data instead of assumptions.",
          risk_class: "low",
          maturity: "structured",
        },
      },
    });
    const result = validateDispatchV2(packet);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects milestone_event packets without milestone provenance", () => {
    const packet = makeV2Packet({
      trigger: "milestone_event",
      artifact_id: null,
    });
    const result = validateDispatchV2(packet);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes("milestone_origin is required"))).toBe(
      true,
    );
  });
});

// ---------------------------------------------------------------------------
// Additional: schema_version must be dispatch.v2 (not v1)
// ---------------------------------------------------------------------------

describe("schema_version enforcement", () => {
  it("rejects a packet with schema_version 'dispatch.v1' as a v2 packet", () => {
    const packet = makeV2Packet({
      schema_version: "dispatch.v1" as "dispatch.v2",
    });
    const result = validateDispatchV2(packet);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("dispatch.v2"))).toBe(true);
  });

  it("rejects missing intended_outcome", () => {
    const packet = makeV2Packet({
      intended_outcome: undefined as unknown as IntendedOutcomeV2,
    });
    const result = validateDispatchV2(packet);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes("intended_outcome"))).toBe(true);
  });
});
