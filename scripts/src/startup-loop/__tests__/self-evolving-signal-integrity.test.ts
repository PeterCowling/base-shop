import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import type { PatternReflectionSidecar } from "../build/lp-do-build-pattern-reflection-extract";
import { extractPatternReflectionSignals } from "../build/lp-do-build-pattern-reflection-extract";
import type { ResultsReviewSidecar } from "../build/lp-do-build-results-review-extract";
import { extractResultsReviewSignals } from "../build/lp-do-build-results-review-extract";
import type { TrialDispatchPacket } from "../ideas/lp-do-ideas-trial.js";
import {
  type StartupState,
  validateMetaObservation,
} from "../self-evolving/self-evolving-contracts.js";
import {
  extractBulletCandidates,
  extractPatternReflectionSeeds,
  runSelfEvolvingFromBuildOutput,
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

  it("emits the same build_signal_id for duplicate results-review and pattern-reflection findings", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "build-origin-identity-"));
    try {
      fs.writeFileSync(
        path.join(tmpDir, "results-review.user.md"),
        [
          "---",
          "Business-Unit: BOS",
          "---",
          "",
          "## New Idea Candidates",
          "- New loop process — Post-authoring sidecar extraction as a reusable loop process",
          "",
        ].join("\n"),
        "utf8",
      );

      fs.writeFileSync(
        path.join(tmpDir, "pattern-reflection.user.md"),
        [
          "---",
          "entries:",
          "  - canonical_title: Post-authoring sidecar extraction as a reusable loop process",
          "    pattern_summary: Post-authoring sidecar extraction as a reusable loop process",
          "    category: new-loop-process",
          "    routing_target: loop_update",
          "    occurrence_count: 1",
          "    evidence_refs: []",
          "---",
          "",
          "## Patterns",
          "See YAML frontmatter.",
        ].join("\n"),
        "utf8",
      );

      await extractResultsReviewSignals(tmpDir, { repoRoot: tmpDir });
      await extractPatternReflectionSignals(tmpDir, { repoRoot: tmpDir });

      const reviewSidecar = JSON.parse(
        fs.readFileSync(path.join(tmpDir, "results-review.signals.json"), "utf8"),
      ) as ResultsReviewSidecar;
      const reflectionSidecar = JSON.parse(
        fs.readFileSync(path.join(tmpDir, "pattern-reflection.entries.json"), "utf8"),
      ) as PatternReflectionSidecar;

      expect(reviewSidecar.build_origin_status).toBe("ready");
      expect(reflectionSidecar.build_origin_status).toBe("ready");
      expect(reviewSidecar.items).toHaveLength(1);
      expect(reflectionSidecar.entries).toHaveLength(1);
      expect(reviewSidecar.items[0]?.canonical_title).toBe(
        "Post-authoring sidecar extraction as a reusable loop process",
      );
      expect(reflectionSidecar.entries[0]?.canonical_title).toBe(
        "Post-authoring sidecar extraction as a reusable loop process",
      );
      expect(reviewSidecar.items[0]?.build_signal_id).toBe(
        reflectionSidecar.entries[0]?.build_signal_id,
      );
      expect(reviewSidecar.items[0]?.recurrence_key).toBe(
        reflectionSidecar.entries[0]?.recurrence_key,
      );
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
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
    expect(validateMetaObservation(first)).toEqual([]);
    expect(validateMetaObservation(second)).toEqual([]);
  });

  it("routes milestone_event dispatches into milestone-scoped observations", () => {
    const observation = dispatchToMetaObservation(
      buildDispatchPacket("d-milestone", {
        trigger: "milestone_event",
        artifact_id: null,
        area_anchor: "lifecycle-automation",
        current_truth: "Transaction data is now available with 3 recorded orders.",
        next_scope_now:
          "Run lp-do-fact-find to assess lifecycle automation readiness from first transaction data.",
        milestone_origin: {
          schema_version: "dispatch-milestone.v1",
          milestone_event_id: "milestone-1",
          root_id: "transaction_data_available",
          producer_kind: "metric",
          source_ref: "data/shops/BRIK/growth-ledger.json",
          observed_at: "2026-03-10T08:00:00.000Z",
          bundle_key: "gtm4-lifecycle-readiness",
          bundle_title: "Assess lifecycle automation readiness from first transaction data",
          bundle_size: 1,
          bundle_index: 0,
        },
      }),
      {
        business: "BRIK",
        run_id: "run-1",
        session_id: "session-1",
        index: 0,
        now: new Date("2026-03-10T10:00:00.000Z"),
      },
    );

    expect(observation.context_path).toBe(
      "lp-do-ideas/milestone/transaction_data_available/milestone-1",
    );
    expect(observation.signal_hints?.recurrence_key).toContain("transaction_data_available");
    expect(observation.evidence_refs).toContain("milestone-event:milestone-1");
    expect(observation.evidence_refs).toContain("data/shops/BRIK/growth-ledger.json");
    expect(validateMetaObservation(observation)).toEqual([]);
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

// ---------------------------------------------------------------------------
// TASK-05: sidecar-prefer branch TCs for runSelfEvolvingFromBuildOutput
// ---------------------------------------------------------------------------

describe("self-evolving sidecar-prefer branches", () => {
  let tmpDir: string;

  function writeTmpFile(relPath: string, content: string): void {
    const abs = path.join(tmpDir, relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, "utf-8");
  }

  function writeStartupState(): void {
    const state: StartupState = buildStartupState();
    writeTmpFile(
      "docs/business-os/startup-loop/self-evolving/BRIK/startup-state.json",
      JSON.stringify(state, null, 2),
    );
  }

  function baseBridgeOptions(overrides: Partial<{
    resultsReviewPath: string;
    patternReflectionPath: string;
    buildRecordPath: string;
  }> = {}) {
    const planSlug = "test-sidecar-plan";
    return {
      rootDir: tmpDir,
      business: "BRIK",
      planSlug,
      buildRecordPath:
        overrides.buildRecordPath ??
        path.join("docs", "plans", planSlug, "build-record.user.md"),
      resultsReviewPath:
        overrides.resultsReviewPath ??
        path.join("docs", "plans", planSlug, "results-review.user.md"),
      patternReflectionPath:
        overrides.patternReflectionPath ??
        path.join("docs", "plans", planSlug, "pattern-reflection.user.md"),
      followupQueueStatePath: path.join(
        "docs",
        "business-os",
        "startup-loop",
        "ideas",
        "trial",
        "queue-state.json",
      ),
      followupTelemetryPath: path.join(
        "docs",
        "business-os",
        "startup-loop",
        "ideas",
        "trial",
        "telemetry.jsonl",
      ),
      runId: "run-test-01",
      sessionId: "session-test-01",
    };
  }

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "self-evolving-sidecar-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("TC-05-01: empty richer review artifacts degrade explicitly without changing build-record-only output", () => {
    writeStartupState();

    const planSlug = "test-sidecar-plan";
    // Write results-review.user.md with no ideas (proves sidecar was used instead)
    writeTmpFile(
      `docs/plans/${planSlug}/results-review.user.md`,
      `---\nBusiness-Unit: BRIK\n---\n## New Idea Candidates\n- None\n`,
    );
    // Write sidecar with one real idea
    const sidecar = {
      schema_version: "results-review.signals.v1",
      generated_at: new Date().toISOString(),
      plan_slug: planSlug,
      source_path: `docs/plans/${planSlug}/results-review.user.md`,
      items: [
        {
          type: "idea",
          business: "BRIK",
          title: "Sidecar-sourced idea",
          body: "",
          source: "results-review.user.md",
          date: "2026-03-06",
          path: `docs/plans/${planSlug}/results-review.user.md`,
          idea_key: "cccccccccccccccccccccccccccccccccccccccc",
        },
      ],
    };
    writeTmpFile(
      `docs/plans/${planSlug}/results-review.signals.json`,
      JSON.stringify(sidecar, null, 2),
    );
    // Empty pattern reflection
    writeTmpFile(
      `docs/plans/${planSlug}/pattern-reflection.user.md`,
      "## Patterns\nNone identified.\n",
    );
    writeTmpFile(`docs/plans/${planSlug}/build-record.user.md`, "# Build Record\n");

    const result = runSelfEvolvingFromBuildOutput(baseBridgeOptions());
    expect(result.ok).toBe(true);
    expect(result.observations_generated).toBe(1);
    expect(result.source_artifacts).toEqual(
      expect.arrayContaining([
        `docs/plans/${planSlug}/build-record.user.md`,
        `docs/plans/${planSlug}/results-review.user.md`,
        `docs/plans/${planSlug}/pattern-reflection.user.md`,
      ]),
    );
    expect(
      result.warnings.some((warning) =>
        warning.includes(`No results-review idea seeds extracted: docs/plans/${planSlug}/results-review.user.md`),
      ),
    ).toBe(true);
    expect(
      result.warnings.some((warning) =>
        warning.includes(`No pattern-reflection seeds extracted: docs/plans/${planSlug}/pattern-reflection.user.md`),
      ),
    ).toBe(true);
    const observationsPath = path.join(
      tmpDir,
      "docs",
      "business-os",
      "startup-loop",
      "self-evolving",
      "BRIK",
      "observations.jsonl",
    );
    const observations = fs
      .readFileSync(observationsPath, "utf-8")
      .trim()
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as { schema_version?: string; evidence_grade?: string; measurement_contract_status?: string });
    expect(observations.length).toBeGreaterThan(0);
    expect(observations.every((observation) => observation.schema_version === "meta-observation.v2")).toBe(true);
    expect(observations.every((observation) => observation.evidence_grade === "structural")).toBe(
      true,
    );
    expect(
      observations.every(
        (observation) => observation.measurement_contract_status === "declared",
      ),
    ).toBe(true);
  });

  it("TC-05-01b: results-review sidecar content does not change build-output observation count", () => {
    writeStartupState();

    const planSlug = "test-sidecar-plan";
    writeTmpFile(
      `docs/plans/${planSlug}/results-review.user.md`,
      `---\nBusiness-Unit: BRIK\n---\n## New Idea Candidates\n- None\n`,
    );
    const sidecar = {
      schema_version: "results-review.signals.v1",
      generated_at: new Date().toISOString(),
      plan_slug: planSlug,
      source_path: `docs/plans/${planSlug}/results-review.user.md`,
      items: [
        {
          type: "idea",
          business: "BRIK",
          title: "New open-source package — None.",
          body: "None.",
          source: "results-review.user.md",
          date: "2026-03-06",
          path: `docs/plans/${planSlug}/results-review.user.md`,
          idea_key: "placeholder-idea-1",
        },
        {
          type: "idea",
          business: "BRIK",
          title: "New loop process — add a hygiene pass",
          body: "Follow runtime cleanup with deterministic report verification.",
          source: "results-review.user.md",
          date: "2026-03-06",
          path: `docs/plans/${planSlug}/results-review.user.md`,
          idea_key: "real-idea-1",
        },
      ],
    };
    writeTmpFile(
      `docs/plans/${planSlug}/results-review.signals.json`,
      JSON.stringify(sidecar, null, 2),
    );
    writeTmpFile(
      `docs/plans/${planSlug}/pattern-reflection.user.md`,
      "## Patterns\nNone identified.\n",
    );
    writeTmpFile(`docs/plans/${planSlug}/build-record.user.md`, "# Build Record\n");

    const result = runSelfEvolvingFromBuildOutput(baseBridgeOptions());
    expect(result.ok).toBe(true);
    expect(result.observations_generated).toBe(1);
  });

  it("TC-05-02: results-review markdown now contributes richer observation seeds", () => {
    writeStartupState();

    const planSlug = "test-sidecar-plan";
    writeTmpFile(
      `docs/plans/${planSlug}/results-review.user.md`,
      `---\nBusiness-Unit: BRIK\n---\n## New Idea Candidates\n- Markdown idea\n`,
    );
    writeTmpFile(
      `docs/plans/${planSlug}/pattern-reflection.user.md`,
      "## Patterns\nNone identified.\n",
    );
    writeTmpFile(`docs/plans/${planSlug}/build-record.user.md`, "# Build Record\n");

    const result = runSelfEvolvingFromBuildOutput(baseBridgeOptions());
    expect(result.ok).toBe(true);
    expect(result.observations_generated).toBe(2);
    expect(result.warnings.some((w) => w.includes("sidecar parse failed"))).toBe(false);
  });

  it("TC-05-03: malformed results-review sidecar does not block markdown-derived richer sensing", () => {
    writeStartupState();

    const planSlug = "test-sidecar-plan";
    writeTmpFile(
      `docs/plans/${planSlug}/results-review.user.md`,
      `---\nBusiness-Unit: BRIK\n---\n## New Idea Candidates\n- Fallback idea\n`,
    );
    writeTmpFile(
      `docs/plans/${planSlug}/results-review.signals.json`,
      "not valid json {{{",
    );
    writeTmpFile(
      `docs/plans/${planSlug}/pattern-reflection.user.md`,
      "## Patterns\nNone identified.\n",
    );
    writeTmpFile(`docs/plans/${planSlug}/build-record.user.md`, "# Build Record\n");

    const result = runSelfEvolvingFromBuildOutput(baseBridgeOptions());
    expect(result.ok).toBe(true);
    expect(result.observations_generated).toBe(2);
    expect(result.warnings.some((w) => w.includes("sidecar parse failed"))).toBe(false);
  });

  it("TC-05-04: pattern-reflection sidecar no longer generates duplicate self-evolving idea observations", () => {
    writeStartupState();

    const planSlug = "test-sidecar-plan";
    writeTmpFile(
      `docs/plans/${planSlug}/results-review.user.md`,
      `---\nBusiness-Unit: BRIK\n---\n## New Idea Candidates\n- None\n`,
    );
    writeTmpFile(
      `docs/plans/${planSlug}/pattern-reflection.user.md`,
      "## Patterns\nNone identified.\n",
    );
    const patternSidecar = {
      schema_version: "pattern-reflection.entries.v1",
      generated_at: new Date().toISOString(),
      plan_slug: planSlug,
      source_path: `docs/plans/${planSlug}/pattern-reflection.user.md`,
      entries: [
        {
          pattern_summary: "Post-authoring extraction pattern",
          category: "ai-to-mechanistic",
          routing_target: "loop_update",
          occurrence_count: 2,
          evidence_refs: [],
        },
        {
          pattern_summary: "Shared parse module reuse",
          category: "new-loop-process",
          routing_target: "skill_proposal",
          occurrence_count: 1,
          evidence_refs: [],
        },
      ],
    };
    writeTmpFile(
      `docs/plans/${planSlug}/pattern-reflection.entries.json`,
      JSON.stringify(patternSidecar, null, 2),
    );
    writeTmpFile(`docs/plans/${planSlug}/build-record.user.md`, "# Build Record\n");

    const result = runSelfEvolvingFromBuildOutput(baseBridgeOptions());
    expect(result.ok).toBe(true);
    expect(result.observations_generated).toBe(1);
  });

  it("TC-05-05: pattern-reflection markdown now contributes richer observation seeds", () => {
    writeStartupState();

    const planSlug = "test-sidecar-plan";
    writeTmpFile(
      `docs/plans/${planSlug}/results-review.user.md`,
      `---\nBusiness-Unit: BRIK\n---\n## New Idea Candidates\n- None\n`,
    );
    // Pattern reflection with one YAML entry (no sidecar)
    writeTmpFile(
      `docs/plans/${planSlug}/pattern-reflection.user.md`,
      [
        "---",
        "entries:",
        "  - pattern_summary: Markdown-only pattern",
        "    category: unclassified",
        "    routing_target: defer",
        "    occurrence_count: 1",
        "    evidence_refs: []",
        "---",
        "",
        "## Patterns",
        "See frontmatter.",
      ].join("\n"),
    );
    writeTmpFile(`docs/plans/${planSlug}/build-record.user.md`, "# Build Record\n");

    const result = runSelfEvolvingFromBuildOutput(baseBridgeOptions());
    expect(result.ok).toBe(true);
    expect(result.observations_generated).toBe(2);
    expect(result.warnings.some((w) => w.includes("sidecar parse failed"))).toBe(false);
  });

  it("TC-05-06: richer review seeds merge by normalized recurrence key instead of double-counting", () => {
    writeStartupState();

    const planSlug = "test-sidecar-plan";
    writeTmpFile(
      `docs/plans/${planSlug}/results-review.user.md`,
      [
        "---",
        "Business-Unit: BRIK",
        "---",
        "",
        "## New Idea Candidates",
        "- Tighten queue completion write-back",
      ].join("\n"),
    );
    writeTmpFile(
      `docs/plans/${planSlug}/pattern-reflection.user.md`,
      [
        "---",
        "entries:",
        "  - pattern_summary: Tighten queue completion write-back",
        "    category: new-loop-process",
        "    routing_target: loop_update",
        "    occurrence_count: 2",
        "    evidence_refs: []",
        "---",
        "",
        "## Patterns",
        "See frontmatter.",
      ].join("\n"),
    );
    writeTmpFile(`docs/plans/${planSlug}/build-record.user.md`, "# Build Record\n");

    const result = runSelfEvolvingFromBuildOutput(baseBridgeOptions());
    expect(result.ok).toBe(true);
    expect(result.observations_generated).toBe(2);
  });
});
