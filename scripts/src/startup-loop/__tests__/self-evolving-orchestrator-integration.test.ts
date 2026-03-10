import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "@jest/globals";

import type { TrialDispatchPacket } from "../ideas/lp-do-ideas-trial.js";
import { consumeBackboneQueueToIdeasWorkflow } from "../self-evolving/self-evolving-backbone-consume.js";
import {
  type ImprovementCandidate,
  type MetaObservation,
  type StartupState,
  validateMetaObservation,
} from "../self-evolving/self-evolving-contracts.js";
import {
  dispatchToMetaObservation,
  runSelfEvolvingFromIdeas,
} from "../self-evolving/self-evolving-from-ideas.js";
import { runSelfEvolvingOrchestrator } from "../self-evolving/self-evolving-orchestrator.js";
import { createDefaultPolicyState } from "../self-evolving/self-evolving-scoring.js";
import {
  createStartupStateStore,
  readPolicyDecisionJournal,
  readPolicyState,
  writePolicyState,
} from "../self-evolving/self-evolving-startup-state.js";

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
      {
        name: "regressions_detected",
        unit: "count",
        aggregation_method: "sum",
        kind: "guardrail",
      },
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

function buildRouteObservation(input: {
  id: string;
  timestamp: string;
  hardSignature: string;
  evidenceGrade: "exploratory" | "measured";
}): MetaObservation {
  const measured = input.evidenceGrade === "measured";
  return {
    schema_version: "meta-observation.v2",
    observation_id: input.id,
    observation_type: "execution_event",
    timestamp: input.timestamp,
    business: "BRIK",
    actor_type: "automation",
    run_id: "run-1",
    session_id: "session-1",
    skill_id: "lp-do-build",
    container_id: null,
    artifact_refs: ["docs/source.md"],
    context_path: "lp-do-build/test",
    hard_signature: input.hardSignature,
    soft_cluster_id: null,
    fingerprint_version: "1",
    repeat_count_window: 2,
    operator_minutes_estimate: 10,
    quality_impact_estimate: 0.5,
    detector_confidence: 0.8,
    severity: 0.4,
    inputs_hash: "inputs",
    outputs_hash: "outputs",
    toolchain_version: "test",
    model_version: null,
    kpi_name: measured ? "activation_rate" : null,
    kpi_value: measured ? 0.42 : null,
    kpi_unit: measured ? "ratio" : null,
    aggregation_method: measured ? "rate" : null,
    sample_size: measured ? 120 : null,
    data_quality_status: measured ? "ok" : null,
    data_quality_reason_code: null,
    baseline_ref: measured ? "activation_rate:baseline" : null,
    measurement_window: measured ? "7d" : null,
    traffic_segment: measured ? "all" : null,
    evidence_refs: ["docs/evidence.md"],
    evidence_grade: input.evidenceGrade,
    measurement_contract_status: measured ? "verified" : "none",
    signal_hints: {
      recurrence_key: "repeat-website-fix",
      problem_statement: "Reduce recurring website fix work.",
      candidate_type_hint: "container_update",
      executor_domain_hint: "website",
      executor_path_hint: "lp-do-build:container:website-v3",
    },
  };
}

function readTrialQueueState(tempRoot: string): { dispatches: TrialDispatchPacket[] } {
  return JSON.parse(
    readFileSync(
      path.join(
        tempRoot,
        "docs",
        "business-os",
        "startup-loop",
        "ideas",
        "trial",
        "queue-state.json",
      ),
      "utf-8",
    ),
  ) as { dispatches: TrialDispatchPacket[] };
}

function extractSelfEvolvingDispatches(
  tempRoot: string,
): TrialDispatchPacket[] {
  return readTrialQueueState(tempRoot).dispatches.filter((dispatch) =>
    dispatch.evidence_refs.some((ref) => ref.startsWith("self-evolving-candidate:")),
  );
}

function rewriteBackboneEntriesAsPending(
  backboneQueuePath: string,
  queuedAt: string,
): string[] {
  return rewriteBackboneEntries(backboneQueuePath, queuedAt);
}

function rewriteBackboneEntries(
  backboneQueuePath: string,
  queuedAt: string,
  mutate?: (entry: Record<string, unknown>) => Record<string, unknown>,
): string[] {
  const entries = readFileSync(backboneQueuePath, "utf-8")
    .trim()
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
  const candidateIds = entries.map((entry) => String(entry.candidate_id));
  const rewritten = entries.map((entry) => ({
    ...entry,
    queued_at: queuedAt,
    consumed_at: null,
    consumed_by: null,
    followup_dispatch_id: null,
    followup_queue_state: null,
    followup_route: null,
    ...(mutate ? mutate(entry) : {}),
  }));
  writeFileSync(
    backboneQueuePath,
    `${rewritten.map((entry) => JSON.stringify(entry)).join("\n")}\n`,
    "utf-8",
  );
  return candidateIds;
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
    expect(observation.schema_version).toBe("meta-observation.v2");
    expect(observation.evidence_grade).toBe("structural");
    expect(observation.measurement_contract_status).toBe("declared");
    expect(validateMetaObservation(observation)).toEqual([]);
  });

  it("accepts legacy queue packets with string intended outcomes and sparse optional text", () => {
    const legacyPacket = {
      ...buildDispatchPacket("d-legacy"),
      current_truth: "",
      next_scope_now: "",
      why: undefined,
      intended_outcome: "Use lp-do-build to automate terms-and-conditions generation.",
    } as unknown as TrialDispatchPacket;

    const observation = dispatchToMetaObservation(legacyPacket, {
      business: "BRIK",
      run_id: "run-legacy",
      session_id: "session-legacy",
      index: 0,
      now: new Date("2026-03-02T00:00:00.000Z"),
    });

    expect(observation.context_path).toBe("lp-do-ideas/website-legal-terms");
    expect(observation.signal_hints.problem_statement).toContain("website-legal-terms");
    expect(validateMetaObservation(observation)).toEqual([]);
  });

  it("preserves canonical build-origin recurrence identity on queue-backed observations", () => {
    const packet = {
      ...buildDispatchPacket("d-build-origin"),
      trigger: "operator_idea",
      artifact_id: null,
      area_anchor: "Queue-backed build-origin idea",
      current_truth: "Queue-backed build-origin idea",
      build_origin: {
        schema_version: "dispatch-build-origin.v1",
        build_signal_id: "signal-queue-123",
        recurrence_key: "queue-backed-build-origin-recurrence",
        review_cycle_key: "queue-unification-task",
        plan_slug: "queue-unification-task",
        canonical_title: "Queue-backed build-origin idea",
        primary_source: "pattern-reflection.entries.json",
        merge_state: "merged_cross_sidecar",
        source_presence: {
          results_review_signal: true,
          pattern_reflection_entry: true,
        },
        results_review_path: "docs/plans/queue-unification-task/results-review.user.md",
        results_review_sidecar_path:
          "docs/plans/queue-unification-task/results-review.signals.json",
        pattern_reflection_path:
          "docs/plans/queue-unification-task/pattern-reflection.user.md",
        pattern_reflection_sidecar_path:
          "docs/plans/queue-unification-task/pattern-reflection.entries.json",
      },
    } as TrialDispatchPacket;

    const observation = dispatchToMetaObservation(packet, {
      business: "BRIK",
      run_id: "run-build-origin",
      session_id: "session-build-origin",
      index: 0,
      now: new Date("2026-03-10T00:00:00.000Z"),
    });

    expect(observation.signal_hints.recurrence_key).toBe("queue-backed-build-origin-recurrence");
    expect(observation.context_path).toBe(
      "lp-do-ideas/build-origin/queue-unification-task/signal-queue-123",
    );
    expect(observation.evidence_refs).toEqual(
      expect.arrayContaining([
        "build-origin-signal:signal-queue-123",
        "docs/plans/queue-unification-task/results-review.user.md",
      ]),
    );
    expect(validateMetaObservation(observation)).toEqual([]);
  });

  it("routes weak-evidence candidates back into fact-find instead of direct build", () => {
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
    expect(result.followup_closure_state).toBe("closed");
    expect(result.followup_dispatches_emitted).toBeGreaterThan(0);
    expect(result.followup_pending_entries).toBeGreaterThan(0);
    expect(result.followup_consumed_entries).toBe(result.followup_dispatches_emitted);
    expect(result.followup_closed_candidate_ids.length).toBeGreaterThan(0);
    expect(result.followup_stale_repairable_candidate_ids).toEqual([]);
    expect(result.followup_hard_failed_candidate_ids).toEqual([]);
    expect(result.followup_unresolved_candidate_ids).toEqual([]);
    expect(result.orchestrator.ranked_candidates[0]?.score.evidence.classification).toBe(
      "structural_only",
    );
    expect(result.orchestrator.ranked_candidates[0]?.route.route).toBe("lp-do-fact-find");
    expect(result.orchestrator.ranked_candidates[0]?.route.reason).toBe(
      "evidence_posture_structural_fact_find_only",
    );
    expect(result.orchestrator.ranked_candidates[0]?.policy_context?.policy_version).toBe(
      "self-evolving-policy.v1",
    );
    expect(result.orchestrator.policy_state_path).toContain("policy-state.json");
    expect(result.orchestrator.policy_decision_path).toContain("policy-decisions.jsonl");
    expect(result.orchestrator.ranked_candidates[0]?.candidate.executor_path).toBe(
      "lp-do-build:container:website-v3",
    );

    const queueRaw = readFileSync(result.backbone_queue_path, "utf-8").trim();
    expect(queueRaw.length).toBeGreaterThan(0);
    const ideasQueuePath = path.join(
      tempRoot,
      "docs",
      "business-os",
      "startup-loop",
      "ideas",
      "trial",
      "queue-state.json",
    );
    const ideasQueueRaw = readFileSync(ideasQueuePath, "utf-8");
    expect(ideasQueueRaw).toContain("self-evolving-candidate:");
    expect(ideasQueueRaw).toContain("\"self_evolving\"");
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("replays stale backbone entries into the legacy trial queue without duplicating on repeat drains", () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "self-evolving-stale-replay-"));
    const initial = runSelfEvolvingFromIdeas({
      rootDir: tempRoot,
      business: "BRIK",
      run_id: "run-1",
      session_id: "session-1",
      startup_state: buildStartupState(),
      dispatches: [buildDispatchPacket("d-1"), buildDispatchPacket("d-2")],
      now: new Date("2026-03-02T00:00:00.000Z"),
    });

    const queueStatePath = path.join(
      tempRoot,
      "docs",
      "business-os",
      "startup-loop",
      "ideas",
      "trial",
      "queue-state.json",
    );
    writeFileSync(
      queueStatePath,
      `${JSON.stringify({ last_updated: "2026-03-03T00:00:00.000Z", dispatches: [] }, null, 2)}\n`,
      "utf-8",
    );
    const staleCandidateIds = rewriteBackboneEntriesAsPending(
      initial.backbone_queue_path,
      "2026-03-01T00:00:00.000Z",
    );

    const repaired = consumeBackboneQueueToIdeasWorkflow({
      rootDir: tempRoot,
      business: "BRIK",
      queueStatePath,
      telemetryPath: path.join(
        tempRoot,
        "docs",
        "business-os",
        "startup-loop",
        "ideas",
        "trial",
        "telemetry.jsonl",
      ),
    });

    expect(repaired.ok).toBe(true);
    expect(repaired.closure_state).toBe("stale-repairable");
    expect(repaired.stale_repairable_candidate_ids.sort()).toEqual(staleCandidateIds.sort());
    expect(repaired.closed_candidate_ids).toEqual([]);
    expect(repaired.hard_failed_candidate_ids).toEqual([]);
    expect(repaired.queue_entries_written).toBe(staleCandidateIds.length);
    expect(extractSelfEvolvingDispatches(tempRoot)).toHaveLength(staleCandidateIds.length);

    const repeated = consumeBackboneQueueToIdeasWorkflow({
      rootDir: tempRoot,
      business: "BRIK",
      queueStatePath,
      telemetryPath: path.join(
        tempRoot,
        "docs",
        "business-os",
        "startup-loop",
        "ideas",
        "trial",
        "telemetry.jsonl",
      ),
    });

    expect(repeated.ok).toBe(true);
    expect(repeated.closure_state).toBe("closed");
    expect(repeated.pending_entries).toBe(0);
    expect(repeated.emitted_dispatches).toBe(0);
    expect(extractSelfEvolvingDispatches(tempRoot)).toHaveLength(staleCandidateIds.length);
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("TASK-17 TC-01 and TC-03 only honor portfolio suppression once guarded trial authority is active", () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "self-evolving-authority-consume-"));
    const initial = runSelfEvolvingFromIdeas({
      rootDir: tempRoot,
      business: "BRIK",
      run_id: "run-1",
      session_id: "session-1",
      startup_state: buildStartupState(),
      dispatches: [buildDispatchPacket("d-1"), buildDispatchPacket("d-2")],
      now: new Date("2026-03-02T00:00:00.000Z"),
    });

    const queueStatePath = path.join(
      tempRoot,
      "docs",
      "business-os",
      "startup-loop",
      "ideas",
      "trial",
      "queue-state.json",
    );
    const telemetryPath = path.join(
      tempRoot,
      "docs",
      "business-os",
      "startup-loop",
      "ideas",
      "trial",
      "telemetry.jsonl",
    );
    const store = createStartupStateStore(tempRoot);
    const policyState = readPolicyState(store, "BRIK");
    expect(policyState?.authority_level).toBe("shadow");

    const deferredCandidateIds = rewriteBackboneEntries(
      initial.backbone_queue_path,
      "2026-03-01T00:00:00.000Z",
      () => ({ portfolio_selected: false }),
    );
    writeFileSync(
      queueStatePath,
      `${JSON.stringify({ last_updated: "2026-03-03T00:00:00.000Z", dispatches: [] }, null, 2)}\n`,
      "utf-8",
    );

    const shadowResult = consumeBackboneQueueToIdeasWorkflow({
      rootDir: tempRoot,
      business: "BRIK",
      queueStatePath,
      telemetryPath,
    });

    expect(shadowResult.ok).toBe(true);
    expect(shadowResult.closure_state).toBe("stale-repairable");
    expect(shadowResult.emitted_dispatches).toBe(deferredCandidateIds.length);

    const advisoryState = readPolicyState(store, "BRIK");
    expect(advisoryState).not.toBeNull();
    writePolicyState(store, {
      ...(advisoryState ?? createDefaultPolicyState("BRIK", "2026-03-03T00:00:00.000Z")),
      authority_level: "advisory",
      updated_at: "2026-03-03T00:00:00.000Z",
    });
    rewriteBackboneEntries(
      initial.backbone_queue_path,
      "2026-03-01T00:00:00.000Z",
      () => ({ portfolio_selected: false }),
    );
    writeFileSync(
      queueStatePath,
      `${JSON.stringify({ last_updated: "2026-03-03T01:00:00.000Z", dispatches: [] }, null, 2)}\n`,
      "utf-8",
    );

    const advisoryResult = consumeBackboneQueueToIdeasWorkflow({
      rootDir: tempRoot,
      business: "BRIK",
      queueStatePath,
      telemetryPath,
    });

    expect(advisoryResult.ok).toBe(true);
    expect(advisoryResult.closure_state).toBe("stale-repairable");
    expect(advisoryResult.emitted_dispatches).toBe(deferredCandidateIds.length);

    const guardedTrialState = readPolicyState(store, "BRIK");
    expect(guardedTrialState).not.toBeNull();
    writePolicyState(store, {
      ...(guardedTrialState ?? createDefaultPolicyState("BRIK", "2026-03-03T02:00:00.000Z")),
      authority_level: "guarded_trial",
      updated_at: "2026-03-03T02:00:00.000Z",
    });
    rewriteBackboneEntries(
      initial.backbone_queue_path,
      "2026-03-01T00:00:00.000Z",
      () => ({ portfolio_selected: false }),
    );
    writeFileSync(
      queueStatePath,
      `${JSON.stringify({ last_updated: "2026-03-03T02:00:00.000Z", dispatches: [] }, null, 2)}\n`,
      "utf-8",
    );

    const guardedTrialResult = consumeBackboneQueueToIdeasWorkflow({
      rootDir: tempRoot,
      business: "BRIK",
      queueStatePath,
      telemetryPath,
    });

    expect(guardedTrialResult.ok).toBe(true);
    expect(guardedTrialResult.closure_state).toBe("closed");
    expect(guardedTrialResult.pending_entries).toBe(0);
    expect(guardedTrialResult.emitted_dispatches).toBe(0);
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("TASK-18 writes shadow policy artifacts without mutating the follow-up queue and reruns stably", () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "self-evolving-shadow-evidence-"));
    const runnerInput = {
      rootDir: tempRoot,
      business: "BRIK" as const,
      run_id: "shadow-run-1",
      session_id: "shadow-session-1",
      startup_state: buildStartupState(),
      dispatches: [buildDispatchPacket("d-1"), buildDispatchPacket("d-2"), buildDispatchPacket("d-3")],
      followupConsumeMode: "skip" as const,
      now: new Date("2026-03-02T00:00:00.000Z"),
    };

    const firstResult = runSelfEvolvingFromIdeas(runnerInput);
    expect(firstResult.followup_consume_mode).toBe("skip");
    expect(firstResult.followup_closure_state).toBe("closed");
    expect(firstResult.followup_dispatches_emitted).toBe(0);
    expect(firstResult.followup_pending_entries).toBe(0);
    expect(firstResult.followup_consumed_entries).toBe(0);
    expect(firstResult.followup_queue_entries_written).toBe(0);
    expect(firstResult.shadow_handoffs_written).toBeGreaterThan(0);
    expect(firstResult.shadow_handoff_path).toContain("shadow-handoffs.jsonl");

    const store = createStartupStateStore(tempRoot);
    const policyState = readPolicyState(store, "BRIK");
    const policyDecisions = readPolicyDecisionJournal(store, "BRIK");
    expect(policyState).not.toBeNull();
    expect(policyState?.authority_level).toBe("shadow");
    expect(policyDecisions.length).toBeGreaterThan(0);

    const policyStatePath = path.join(
      tempRoot,
      "docs",
      "business-os",
      "startup-loop",
      "self-evolving",
      "BRIK",
      "policy-state.json",
    );
    const policyDecisionPath = path.join(
      tempRoot,
      "docs",
      "business-os",
      "startup-loop",
      "self-evolving",
      "BRIK",
      "policy-decisions.jsonl",
    );
    const followupQueuePath = path.join(
      tempRoot,
      "docs",
      "business-os",
      "startup-loop",
      "ideas",
      "trial",
      "queue-state.json",
    );
    const shadowHandoffPath = path.join(
      tempRoot,
      "docs",
      "business-os",
      "startup-loop",
      "self-evolving",
      "BRIK",
      "shadow-handoffs.jsonl",
    );
    const firstPolicyStateBody = readFileSync(policyStatePath, "utf-8");
    const firstPolicyDecisionBody = readFileSync(policyDecisionPath, "utf-8");
    const firstShadowHandoffBody = readFileSync(shadowHandoffPath, "utf-8");

    expect(existsSync(followupQueuePath)).toBe(false);
    expect(firstShadowHandoffBody).toContain("\"schema_version\":\"shadow-handoff.v1\"");

    const secondResult = runSelfEvolvingFromIdeas(runnerInput);
    expect(secondResult.followup_consume_mode).toBe("skip");
    expect(secondResult.followup_dispatches_emitted).toBe(0);
    expect(secondResult.followup_queue_entries_written).toBe(0);
    expect(secondResult.shadow_handoffs_written).toBe(0);
    expect(readFileSync(policyStatePath, "utf-8")).toBe(firstPolicyStateBody);
    expect(readFileSync(policyDecisionPath, "utf-8")).toBe(firstPolicyDecisionBody);
    expect(readFileSync(shadowHandoffPath, "utf-8")).toBe(firstShadowHandoffBody);
    expect(existsSync(followupQueuePath)).toBe(false);

    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("TASK-17 promotion recommendations only surface on ranked candidates once guarded trial authority is active", () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "self-evolving-authority-promotion-"));
    const shadowResult = runSelfEvolvingOrchestrator({
      rootDir: tempRoot,
      business: "BRIK",
      run_id: "run-1",
      session_id: "session-1",
      startup_state: buildStartupState(),
      observations: [
        buildRouteObservation({
          id: "obs-1",
          timestamp: "2026-03-02T00:00:00.000Z",
          hardSignature: "sig-guarded",
          evidenceGrade: "measured",
        }),
        buildRouteObservation({
          id: "obs-2",
          timestamp: "2026-03-02T01:00:00.000Z",
          hardSignature: "sig-guarded",
          evidenceGrade: "measured",
        }),
      ],
      now: new Date("2026-03-02T02:00:00.000Z"),
    });

    expect(shadowResult.ranked_candidates[0]?.policy_context?.promotion_gate_action).toBeNull();
    expect(shadowResult.ranked_candidates[0]?.policy_context?.promotion_gate_reason).toBeNull();

    const store = createStartupStateStore(tempRoot);
    const policyState = readPolicyState(store, "BRIK");
    expect(policyState).not.toBeNull();
    writePolicyState(store, {
      ...(policyState ?? createDefaultPolicyState("BRIK", "2026-03-02T03:00:00.000Z")),
      authority_level: "guarded_trial",
      updated_at: "2026-03-02T03:00:00.000Z",
    });

    const guardedTrialResult = runSelfEvolvingOrchestrator({
      rootDir: tempRoot,
      business: "BRIK",
      run_id: "run-2",
      session_id: "session-2",
      startup_state: buildStartupState(),
      observations: [
        buildRouteObservation({
          id: "obs-3",
          timestamp: "2026-03-02T03:00:00.000Z",
          hardSignature: "sig-guarded",
          evidenceGrade: "measured",
        }),
        buildRouteObservation({
          id: "obs-4",
          timestamp: "2026-03-02T04:00:00.000Z",
          hardSignature: "sig-guarded",
          evidenceGrade: "measured",
        }),
      ],
      now: new Date("2026-03-02T05:00:00.000Z"),
    });

    expect(guardedTrialResult.ranked_candidates[0]?.policy_context?.promotion_gate_decision_id).toBeTruthy();
    expect(guardedTrialResult.ranked_candidates[0]?.policy_context?.promotion_gate_action).toBe("hold");
    expect(guardedTrialResult.ranked_candidates[0]?.policy_context?.promotion_gate_reason).toBeTruthy();
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("repairs stale backbone entries from an existing legacy follow-up dispatch without appending duplicates", () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "self-evolving-stale-existing-"));
    const initial = runSelfEvolvingFromIdeas({
      rootDir: tempRoot,
      business: "BRIK",
      run_id: "run-1",
      session_id: "session-1",
      startup_state: buildStartupState(),
      dispatches: [buildDispatchPacket("d-1"), buildDispatchPacket("d-2")],
      now: new Date("2026-03-02T00:00:00.000Z"),
    });
    const existingDispatches = extractSelfEvolvingDispatches(tempRoot);
    const staleCandidateIds = rewriteBackboneEntriesAsPending(
      initial.backbone_queue_path,
      "2026-03-01T00:00:00.000Z",
    );

    const repaired = consumeBackboneQueueToIdeasWorkflow({
      rootDir: tempRoot,
      business: "BRIK",
      queueStatePath: path.join(
        tempRoot,
        "docs",
        "business-os",
        "startup-loop",
        "ideas",
        "trial",
        "queue-state.json",
      ),
      telemetryPath: path.join(
        tempRoot,
        "docs",
        "business-os",
        "startup-loop",
        "ideas",
        "trial",
        "telemetry.jsonl",
      ),
    });

    expect(repaired.ok).toBe(true);
    expect(repaired.closure_state).toBe("stale-repairable");
    expect(repaired.emitted_dispatches).toBe(0);
    expect(repaired.queue_entries_written).toBe(0);
    expect(repaired.stale_repairable_candidate_ids.sort()).toEqual(staleCandidateIds.sort());
    expect(extractSelfEvolvingDispatches(tempRoot)).toHaveLength(existingDispatches.length);
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("surfaces unresolved pending backbone entries when candidate ledger data is missing", () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "self-evolving-consume-failure-"));
    const queuePath = path.join(
      tempRoot,
      "docs",
      "business-os",
      "startup-loop",
      "self-evolving",
      "BRIK",
      "backbone-queue.jsonl",
    );
    mkdirSync(path.dirname(queuePath), { recursive: true });
    writeFileSync(
      queuePath,
      `${JSON.stringify({
        queued_at: "2026-03-02T00:00:00.000Z",
        business: "BRIK",
        candidate_id: "missing-candidate",
        route: "lp-do-fact-find",
        reason: "evidence_structural_only_requires_fact_find",
        executor_path: "lp-do-build:container:website-v3",
        autonomy_cap: 2,
        priority: 3.5,
        consumed_at: null,
        consumed_by: null,
        followup_dispatch_id: null,
        followup_queue_state: null,
        followup_route: null,
      })}\n`,
      "utf-8",
    );

    const result = consumeBackboneQueueToIdeasWorkflow({
      rootDir: tempRoot,
      business: "BRIK",
      queueStatePath: path.join(
        tempRoot,
        "docs",
        "business-os",
        "startup-loop",
        "ideas",
        "trial",
        "queue-state.json",
      ),
      telemetryPath: path.join(
        tempRoot,
        "docs",
        "business-os",
        "startup-loop",
        "ideas",
        "trial",
        "telemetry.jsonl",
      ),
    });

    expect(result.ok).toBe(false);
    expect(result.closure_state).toBe("hard-failed");
    expect(result.pending_entries).toBe(1);
    expect(result.hard_failed_candidate_ids).toEqual(["missing-candidate"]);
    expect(result.stale_repairable_candidate_ids).toEqual([]);
    expect(result.unresolved_candidate_ids).toEqual(["missing-candidate"]);
    expect(result.error).toBe("unresolved_pending_backbone_entries");
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("keeps exploratory posture candidates fact-find only even when the candidate shape maps to build", () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "self-evolving-exploratory-route-"));
    const result = runSelfEvolvingOrchestrator({
      rootDir: tempRoot,
      business: "BRIK",
      run_id: "run-1",
      session_id: "session-1",
      startup_state: buildStartupState(),
      observations: [
        buildRouteObservation({
          id: "obs-1",
          timestamp: "2026-03-02T00:00:00.000Z",
          hardSignature: "sig-exploratory",
          evidenceGrade: "exploratory",
        }),
        buildRouteObservation({
          id: "obs-2",
          timestamp: "2026-03-02T01:00:00.000Z",
          hardSignature: "sig-exploratory",
          evidenceGrade: "exploratory",
        }),
      ],
      now: new Date("2026-03-02T02:00:00.000Z"),
    });

    expect(result.ranked_candidates).toHaveLength(1);
    expect(result.ranked_candidates[0]?.route).toEqual({
      route: "lp-do-fact-find",
      reason: "evidence_posture_exploratory_fact_find_only",
    });
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("preserves stronger routes for declared measured posture with measurement-ready fields", () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "self-evolving-measured-route-"));
    const result = runSelfEvolvingOrchestrator({
      rootDir: tempRoot,
      business: "BRIK",
      run_id: "run-1",
      session_id: "session-1",
      startup_state: buildStartupState(),
      observations: [
        buildRouteObservation({
          id: "obs-1",
          timestamp: "2026-03-02T00:00:00.000Z",
          hardSignature: "sig-measured",
          evidenceGrade: "measured",
        }),
        buildRouteObservation({
          id: "obs-2",
          timestamp: "2026-03-02T01:00:00.000Z",
          hardSignature: "sig-measured",
          evidenceGrade: "measured",
        }),
      ],
      now: new Date("2026-03-02T02:00:00.000Z"),
    });

    expect(result.ranked_candidates).toHaveLength(1);
    expect(result.ranked_candidates[0]?.score.evidence.classification).toBe("measured");
    expect(result.ranked_candidates[0]?.route).toEqual({
      route: "lp-do-build",
      reason: "container_update_ready_for_build",
    });
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("forces measured but unknown prescriptions back into fact-find", () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "self-evolving-unknown-prescription-"));
    const result = runSelfEvolvingOrchestrator({
      rootDir: tempRoot,
      business: "BRIK",
      run_id: "run-1",
      session_id: "session-1",
      startup_state: buildStartupState(),
      observations: [
        {
          ...buildRouteObservation({
            id: "obs-1",
            timestamp: "2026-03-02T00:00:00.000Z",
            hardSignature: "sig-unknown-prescription",
            evidenceGrade: "measured",
          }),
          signal_hints: {
            recurrence_key: "repeat-new-skill",
            problem_statement: "New recurring remediation needs discovery.",
            candidate_type_hint: "new_skill",
            executor_domain_hint: "website",
            executor_path_hint: "lp-do-build:container:website-v3",
          },
        },
        {
          ...buildRouteObservation({
            id: "obs-2",
            timestamp: "2026-03-02T01:00:00.000Z",
            hardSignature: "sig-unknown-prescription",
            evidenceGrade: "measured",
          }),
          signal_hints: {
            recurrence_key: "repeat-new-skill",
            problem_statement: "New recurring remediation needs discovery.",
            candidate_type_hint: "new_skill",
            executor_domain_hint: "website",
            executor_path_hint: "lp-do-build:container:website-v3",
          },
        },
      ],
      now: new Date("2026-03-02T02:00:00.000Z"),
    });

    expect(result.ranked_candidates).toHaveLength(1);
    expect(result.ranked_candidates[0]?.route).toEqual({
      route: "lp-do-fact-find",
      reason: "prescription_unknown_requires_fact_find",
    });
    expect(result.ranked_candidates[0]?.candidate.prescription_maturity).toBe("unknown");
    expect(result.ranked_candidates[0]?.candidate.requirement_posture).toBe("relative_required");
    expect(result.policy_decisions[0]?.requirement_posture).toBe("relative_required");
    expect(result.policy_decisions[0]?.prescription_maturity).toBe("unknown");
    expect(result.policy_decisions[0]?.prescription_choice).toEqual(
      expect.objectContaining({
        prescription_family: "self_evolving_new_skill",
        required_route: "lp-do-fact-find",
        maturity_at_choice: "unknown",
      }),
    );
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("promotes to a stronger route when the current evidence tranche ends in measured observations", () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "self-evolving-current-tranche-"));
    const result = runSelfEvolvingOrchestrator({
      rootDir: tempRoot,
      business: "BRIK",
      run_id: "run-1",
      session_id: "session-1",
      startup_state: buildStartupState(),
      observations: [
        buildRouteObservation({
          id: "obs-1",
          timestamp: "2026-03-02T00:00:00.000Z",
          hardSignature: "sig-current-tranche",
          evidenceGrade: "exploratory",
        }),
        buildRouteObservation({
          id: "obs-2",
          timestamp: "2026-03-02T01:00:00.000Z",
          hardSignature: "sig-current-tranche",
          evidenceGrade: "measured",
        }),
        buildRouteObservation({
          id: "obs-3",
          timestamp: "2026-03-02T02:00:00.000Z",
          hardSignature: "sig-current-tranche",
          evidenceGrade: "measured",
        }),
      ],
      now: new Date("2026-03-02T03:00:00.000Z"),
    });

    expect(result.ranked_candidates[0]?.route.route).toBe("lp-do-build");
    expect(
      result.dashboard.posture.current_qualified_tranche.measured_suffix_observations,
    ).toBe(2);
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("demotes stronger-route eligibility when the latest observation regresses below measured posture", () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "self-evolving-regression-tranche-"));
    const result = runSelfEvolvingOrchestrator({
      rootDir: tempRoot,
      business: "BRIK",
      run_id: "run-1",
      session_id: "session-1",
      startup_state: buildStartupState(),
      observations: [
        buildRouteObservation({
          id: "obs-1",
          timestamp: "2026-03-02T00:00:00.000Z",
          hardSignature: "sig-regression-tranche",
          evidenceGrade: "measured",
        }),
        buildRouteObservation({
          id: "obs-2",
          timestamp: "2026-03-02T01:00:00.000Z",
          hardSignature: "sig-regression-tranche",
          evidenceGrade: "measured",
        }),
        buildRouteObservation({
          id: "obs-3",
          timestamp: "2026-03-02T02:00:00.000Z",
          hardSignature: "sig-regression-tranche",
          evidenceGrade: "exploratory",
        }),
      ],
      now: new Date("2026-03-02T03:00:00.000Z"),
    });

    expect(result.ranked_candidates[0]?.route.route).toBe("lp-do-fact-find");
    expect(
      result.dashboard.posture.current_qualified_tranche.measured_suffix_observations,
    ).toBe(0);
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it("preserves non-draft lifecycle state across repeated detections instead of resetting to validated", () => {
    const tempRoot = mkdtempSync(path.join(os.tmpdir(), "self-evolving-merge-state-"));
    const first = runSelfEvolvingOrchestrator({
      rootDir: tempRoot,
      business: "BRIK",
      run_id: "run-1",
      session_id: "session-1",
      startup_state: buildStartupState(),
      observations: [
        buildRouteObservation({
          id: "obs-1",
          timestamp: "2026-03-02T00:00:00.000Z",
          hardSignature: "sig-preserve-state",
          evidenceGrade: "measured",
        }),
        buildRouteObservation({
          id: "obs-2",
          timestamp: "2026-03-02T01:00:00.000Z",
          hardSignature: "sig-preserve-state",
          evidenceGrade: "measured",
        }),
      ],
      now: new Date("2026-03-02T02:00:00.000Z"),
    });

    const existingCandidate = first.ranked_candidates[0];
    expect(existingCandidate).toBeDefined();

    const mutatedLedgerCandidate: ImprovementCandidate = {
      ...existingCandidate!.candidate,
      candidate_state: "blocked",
      blocked_reason_code: "manual_review_required",
      blocked_since: "2026-03-02T03:00:00.000Z",
      unblock_requirements: ["review recurrence evidence"],
    };
    const mutatedLedger = {
      ...first.ranked_candidates[0]!,
      candidate: mutatedLedgerCandidate,
    };
    const candidatePath = path.join(
      tempRoot,
      "docs",
      "business-os",
      "startup-loop",
      "self-evolving",
      "BRIK",
      "candidates.json",
    );
    writeFileSync(
      candidatePath,
      `${JSON.stringify(
        {
          schema_version: "candidate-ledger.v1",
          business: "BRIK",
          updated_at: "2026-03-02T03:00:00.000Z",
          candidates: [mutatedLedger],
        },
        null,
        2,
      )}\n`,
      "utf-8",
    );

    const second = runSelfEvolvingOrchestrator({
      rootDir: tempRoot,
      business: "BRIK",
      run_id: "run-2",
      session_id: "session-2",
      startup_state: buildStartupState(),
      observations: [
        buildRouteObservation({
          id: "obs-3",
          timestamp: "2026-03-02T04:00:00.000Z",
          hardSignature: "sig-preserve-state",
          evidenceGrade: "measured",
        }),
      ],
      now: new Date("2026-03-02T05:00:00.000Z"),
    });

    expect(second.ranked_candidates[0]?.candidate.candidate_state).toBe("blocked");
    expect(second.ranked_candidates[0]?.candidate.blocked_reason_code).toBe(
      "manual_review_required",
    );
    expect(second.ranked_candidates[0]?.candidate.trigger_observations.length).toBeGreaterThan(2);
    rmSync(tempRoot, { recursive: true, force: true });
  });
});
