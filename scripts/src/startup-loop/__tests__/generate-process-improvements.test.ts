import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  appendCompletedIdea,
  collectProcessImprovements,
  deriveIdeaKey,
  loadCompletedIdeasRegistry,
  QUEUE_STATE_RELATIVE_PATH,
  runBuildOriginBridgeForProcessImprovements,
  runCheck,
  updateProcessImprovementsArtifacts,
  updateProcessImprovementsHtml,
} from "../build/generate-process-improvements";
import type { DispatchBuildOriginProvenance } from "../ideas/lp-do-ideas-trial";

async function writeFile(root: string, relativePath: string, content: string): Promise<void> {
  const absPath = path.join(root, relativePath);
  await fs.mkdir(path.dirname(absPath), { recursive: true });
  await fs.writeFile(absPath, content, "utf8");
}

async function readCanonicalProcessImprovementsHtml(): Promise<string> {
  const candidates = [
    path.resolve(process.cwd(), "docs/business-os/process-improvements.user.html"),
    path.resolve(process.cwd(), "../docs/business-os/process-improvements.user.html"),
  ];

  for (const candidate of candidates) {
    try {
      return await fs.readFile(candidate, "utf8");
    } catch {
      continue;
    }
  }

  throw new Error("Unable to locate docs/business-os/process-improvements.user.html");
}

async function writeQueueState(
  root: string,
  dispatches: Record<string, unknown>[],
): Promise<void> {
  await writeFile(root, QUEUE_STATE_RELATIVE_PATH, `${JSON.stringify({ dispatches }, null, 2)}\n`);
}

function makeQueueDispatch(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    dispatch_id: "DISPATCH-QUEUE-001",
    business: "BRIK",
    area_anchor: "Queue-backed build idea",
    current_truth: "Queue-backed build idea",
    why: "Route this queued idea through the canonical backlog.",
    queue_state: "enqueued",
    created_at: "2026-03-06T09:00:00.000Z",
    ...overrides,
  };
}

function makeBuildOriginProvenance(
  overrides: Partial<DispatchBuildOriginProvenance> = {},
): DispatchBuildOriginProvenance {
  return {
    schema_version: "dispatch-build-origin.v1",
    build_signal_id: "build-signal-123",
    recurrence_key: "recurrence-123",
    review_cycle_key: "queue-unification-task",
    plan_slug: "queue-unification-task",
    canonical_title: "Queue-backed build idea",
    primary_source: "pattern-reflection.entries.json",
    merge_state: "merged_cross_sidecar",
    source_presence: {
      results_review_signal: true,
      pattern_reflection_entry: true,
    },
    results_review_path: "docs/plans/queue-unification-task/results-review.user.md",
    results_review_sidecar_path: "docs/plans/queue-unification-task/results-review.signals.json",
    pattern_reflection_path: "docs/plans/queue-unification-task/pattern-reflection.user.md",
    pattern_reflection_sidecar_path:
      "docs/plans/queue-unification-task/pattern-reflection.entries.json",
    reflection_fields: {
      category: "workflow",
      routing_target: "loop_update",
      occurrence_count: 3,
    },
    ...overrides,
  };
}

async function writeBuildOriginSidecars(
  root: string,
  planDirRelative: string,
  overrides: {
    planSlug?: string;
    reviewCycleKey?: string;
    title?: string;
    buildSignalId?: string;
    recurrenceKey?: string;
  } = {},
): Promise<void> {
  const planSlug = overrides.planSlug ?? path.basename(planDirRelative);
  const reviewCycleKey = overrides.reviewCycleKey ?? planSlug;
  const title = overrides.title ?? "Queue-backed build-origin idea";
  const buildSignalId = overrides.buildSignalId ?? "build-signal-123";
  const recurrenceKey = overrides.recurrenceKey ?? "recurrence-123";

  await writeFile(
    root,
    `${planDirRelative}/results-review.signals.json`,
    `${JSON.stringify(
      {
        schema_version: "results-review.signals.v1",
        generated_at: "2026-03-10T09:00:00.000Z",
        plan_slug: planSlug,
        review_cycle_key: reviewCycleKey,
        source_path: `${planDirRelative}/results-review.user.md`,
        build_origin_status: "ready",
        failures: [],
        items: [
          {
            type: "idea",
            business: "BRIK",
            title,
            body: "This came up again during build review.",
            source: "results-review.user.md",
            date: "2026-03-10T09:00:00.000Z",
            path: `${planDirRelative}/results-review.user.md`,
            idea_key: `legacy-${buildSignalId}`,
            review_cycle_key: reviewCycleKey,
            canonical_title: title,
            build_signal_id: buildSignalId,
            recurrence_key: recurrenceKey,
            build_origin_status: "ready",
          },
        ],
      },
      null,
      2,
    )}\n`,
  );

  await writeFile(
    root,
    `${planDirRelative}/pattern-reflection.entries.json`,
    `${JSON.stringify(
      {
        schema_version: "pattern-reflection.entries.v1",
        generated_at: "2026-03-10T09:05:00.000Z",
        plan_slug: planSlug,
        review_cycle_key: reviewCycleKey,
        source_path: `${planDirRelative}/pattern-reflection.user.md`,
        build_origin_status: "ready",
        failures: [],
        entries: [
          {
            review_cycle_key: reviewCycleKey,
            canonical_title: title,
            pattern_summary: title,
            category: "new-loop-process",
            routing_target: "loop_update",
            occurrence_count: 3,
            evidence_refs: [`${planDirRelative}/results-review.user.md`],
            build_signal_id: buildSignalId,
            recurrence_key: recurrenceKey,
            build_origin_status: "ready",
          },
        ],
      },
      null,
      2,
    )}\n`,
  );
}

describe("generate-process-improvements", () => {
  it("collects idea candidates, reflection risks, and pending reviews from plan artifacts", async () => {
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "process-improvements-"));

    await writeQueueState(repoRoot, [
      makeQueueDispatch({
        dispatch_id: "DISPATCH-QUEUE-IDEA-001",
        current_truth: "Add ranking layer",
        area_anchor: "Add ranking layer",
        why: "1 seed rejected in pilot; route through the canonical ideas queue.",
      }),
    ]);

    await writeFile(
      repoRoot,
      "docs/plans/feature-b/build-record.user.md",
      `---
Business-Unit: HBAG
Feature-Slug: feature-b
---
# Build Record`,
    );

    await writeFile(
      repoRoot,
      "docs/plans/feature-b/reflection-debt.user.md",
      `# Reflection Debt
<!-- REFLECTION_DEBT_LEDGER_START -->
\`\`\`json
{
  "schema_version": "reflection-debt.v1",
  "feature_slug": "feature-b",
  "generated_at": "2026-02-25T12:00:00.000Z",
  "items": [
    {
      "status": "open",
      "feature_slug": "feature-b",
      "business_scope": "HBAG",
      "due_at": "2026-03-01T00:00:00.000Z",
      "updated_at": "2026-02-25T12:00:00.000Z",
      "minimum_reflection": {
        "missing_sections": ["Observed Outcomes", "Standing Updates"]
      },
      "source_paths": {
        "results_review_path": "/tmp/feature-b/results-review.user.md"
      }
    }
  ]
}
\`\`\`
<!-- REFLECTION_DEBT_LEDGER_END -->
`,
    );

    const data = collectProcessImprovements(repoRoot);

    expect(data.ideaItems).toHaveLength(1);
    expect(data.ideaItems[0]?.business).toBe("BRIK");
    expect(data.ideaItems[0]?.title).toBe("Add ranking layer");
    expect(data.ideaItems[0]?.source).toBe("queue-state.json");
    expect(data.ideaItems[0]?.body).toContain("canonical ideas queue");

    expect(data.riskItems).toHaveLength(1);
    expect(data.riskItems[0]?.business).toBe("HBAG");
    expect(data.riskItems[0]?.title).toContain("feature-b");

    expect(data.pendingReviewItems).toHaveLength(1);
    expect(data.pendingReviewItems[0]?.business).toBe("HBAG");
    expect(data.pendingReviewItems[0]?.title).toContain("feature-b");

    await fs.rm(repoRoot, { recursive: true, force: true });
  });

  it("dedupes repeated Signal Review review-required sidecars onto one pending-review surface item", async () => {
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "process-improvements-signal-review-"));

    await writeFile(
      repoRoot,
      "docs/business-os/strategy/BRIK/marketing/signal-review-20260218-1238-W08.review-required.json",
      `${JSON.stringify(
        {
          schema_version: "signal-review.review-required.v1",
          generated_at: "2026-02-18T12:38:00.000Z",
          business: "BRIK",
          source_path: "docs/business-os/strategy/BRIK/marketing/signal-review-20260218-1238-W08.md",
          items: [
            {
              fingerprint: "P08-S10-no-second-weekly-readout",
              business: "BRIK",
              title: "Feedback Loop Closure — no second weekly readout",
              body: "Week-two readout is still absent.",
              owner: "Pete",
              workflow_status: "open",
              due_date: "2026-02-25",
              escalation_state: "repeat-open",
              recurrence_count: 2,
              first_seen_run_date: "2026-02-13",
              latest_seen_run_date: "2026-02-18",
              source_signal_review_path:
                "docs/business-os/strategy/BRIK/marketing/signal-review-20260218-1238-W08.md",
              suggested_action: "Produce the week-two KPCS now.",
            },
          ],
        },
        null,
        2,
      )}\n`,
    );

    await writeFile(
      repoRoot,
      "docs/business-os/strategy/BRIK/marketing/signal-review-20260226-1641-W09.review-required.json",
      `${JSON.stringify(
        {
          schema_version: "signal-review.review-required.v1",
          generated_at: "2026-02-26T16:41:00.000Z",
          business: "BRIK",
          source_path: "docs/business-os/strategy/BRIK/marketing/signal-review-20260226-1641-W09.md",
          items: [
            {
              fingerprint: "P08-S10-no-second-weekly-readout",
              business: "BRIK",
              title: "Feedback Loop Closure — no second weekly readout",
              body: "Day-14 gate review is now due tomorrow.",
              owner: "Pete",
              workflow_status: "open",
              due_date: "2026-02-29",
              escalation_state: "escalated",
              recurrence_count: 3,
              first_seen_run_date: "2026-02-13",
              latest_seen_run_date: "2026-02-26",
              source_signal_review_path:
                "docs/business-os/strategy/BRIK/marketing/signal-review-20260226-1641-W09.md",
              suggested_action: "Produce the week-two KPCS now.",
            },
          ],
        },
        null,
        2,
      )}\n`,
    );

    const data = collectProcessImprovements(repoRoot);

    expect(data.pendingReviewItems).toHaveLength(1);
    expect(data.pendingReviewItems[0]?.title).toContain("Review required");
    expect(data.pendingReviewItems[0]?.fingerprint).toBe("P08-S10-no-second-weekly-readout");
    expect(data.pendingReviewItems[0]?.escalation_state).toBe("escalated");
    expect(data.pendingReviewItems[0]?.recurrence_count).toBe(3);
    expect(data.pendingReviewItems[0]?.latest_seen_date).toBe("2026-02-26");

    await fs.rm(repoRoot, { recursive: true, force: true });
  });

  it("replaces array assignments and footer date in process improvements HTML", async () => {
    const html = `
<div>Last cleared: 2026-01-01 — test</div>
<script>
var IDEA_ITEMS = [];
var RISK_ITEMS = [];
var PENDING_REVIEW_ITEMS = [];
</script>
`;

    const updated = updateProcessImprovementsHtml(
      html,
      {
        ideaItems: [
          {
            type: "idea",
            business: "BRIK",
            title: "Idea",
            body: "Body",
            source: "results-review.user.md",
            date: "2026-02-25",
            path: "docs/plans/x/results-review.user.md",
          },
        ],
        riskItems: [],
        pendingReviewItems: [],
      },
      "2026-02-25",
    );

    expect(updated).toContain('"title": "Idea"');
    expect(updated).toContain("Last cleared: 2026-02-25");
    expect(updated).toContain("var IDEA_ITEMS = [");
    expect(updated).toContain("var RISK_ITEMS = [");
    expect(updated).toContain("var PENDING_REVIEW_ITEMS = [");
  });
});

const HTML_TEMPLATE = `<div>Last cleared: 2026-01-01 — test</div>
<script>
var IDEA_ITEMS = [];
var RISK_ITEMS = [];
var PENDING_REVIEW_ITEMS = [];
</script>
`;

describe("runCheck", () => {
  let tmpDir: string;
  let exitSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "run-check-"));
    exitSpy = jest.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit called with ${String(code)}`);
    });
  });

  afterEach(async () => {
    exitSpy.mockRestore();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("TC-13: completes without error when committed output files are up-to-date", async () => {
    await writeQueueState(tmpDir, [makeQueueDispatch()]);

    const data = collectProcessImprovements(tmpDir);
    const expectedDataJson = `${JSON.stringify(data, null, 2)}\n`;
    const expectedHtml = updateProcessImprovementsHtml(HTML_TEMPLATE, data, "2026-02-25");

    await writeFile(tmpDir, "docs/business-os/process-improvements.user.html", expectedHtml);
    await writeFile(tmpDir, "docs/business-os/_data/process-improvements.json", expectedDataJson);

    expect(() => runCheck(tmpDir)).not.toThrow();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("TC-14: calls process.exit(1) when committed HTML has stale array assignments", async () => {
    await writeQueueState(tmpDir, [makeQueueDispatch()]);

    const data = collectProcessImprovements(tmpDir);
    const expectedDataJson = `${JSON.stringify(data, null, 2)}\n`;

    // Stale HTML — empty arrays, does not reflect the actual queue-backed idea item
    await writeFile(tmpDir, "docs/business-os/process-improvements.user.html", HTML_TEMPLATE);
    await writeFile(tmpDir, "docs/business-os/_data/process-improvements.json", expectedDataJson);

    expect(() => runCheck(tmpDir)).toThrow("process.exit called with 1");
  });

  it("TC-15: calls process.exit(1) when the committed HTML file does not exist", async () => {
    await writeQueueState(tmpDir, [makeQueueDispatch()]);

    const data = collectProcessImprovements(tmpDir);
    const expectedDataJson = `${JSON.stringify(data, null, 2)}\n`;
    await writeFile(tmpDir, "docs/business-os/_data/process-improvements.json", expectedDataJson);
    // No HTML file written — drift should be detected

    expect(() => runCheck(tmpDir)).toThrow("process.exit called with 1");
  });
});

describe("completion lifecycle", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "completion-lifecycle-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("deriveIdeaKey is stable and input-sensitive", () => {
    const key1 = deriveIdeaKey("path/to/file.md", "Title");
    const key2 = deriveIdeaKey("path/to/file.md", "Title");
    expect(key1).toBe(key2);

    const keyDifferentTitle = deriveIdeaKey("path/to/file.md", "Different Title");
    expect(key1).not.toBe(keyDifferentTitle);

    const keyDifferentPath = deriveIdeaKey("path/to/other.md", "Title");
    expect(key1).not.toBe(keyDifferentPath);
  });

  it("collectProcessImprovements does not let completed-ideas registry hide active queue items", async () => {
    const dispatchId = "DISPATCH-COMPLETE-001";
    const ideaKey = deriveIdeaKey(QUEUE_STATE_RELATIVE_PATH, dispatchId);
    await writeQueueState(
      tmpDir,
      [makeQueueDispatch({ dispatch_id: dispatchId, area_anchor: "Add ranking layer" })],
    );

    const registry = {
      schema_version: "completed-ideas.v1",
      entries: [
        {
          idea_key: ideaKey,
          title: "Add ranking layer",
          source_path: QUEUE_STATE_RELATIVE_PATH,
          plan_slug: "some-plan",
          completed_at: "2026-02-26",
        },
      ],
    };
    await writeFile(
      tmpDir,
      "docs/business-os/_data/completed-ideas.json",
      `${JSON.stringify(registry, null, 2)}\n`,
    );

    const data = collectProcessImprovements(tmpDir);
    expect(data.ideaItems).toHaveLength(1);
    expect(data.ideaItems[0]?.title).toBe("Queue-backed build idea");
  });

  it("collectProcessImprovements no longer ingests markdown New Idea Candidates directly", async () => {
    await writeFile(
      tmpDir,
      "docs/plans/feature-a/results-review.user.md",
      `---
Business-Unit: BRIK
Review-date: 2026-02-25
---
# Results Review

## New Idea Candidates
- Normal idea to keep
- ~~Some completed idea~~
`,
    );

    const data = collectProcessImprovements(tmpDir);
    expect(data.ideaItems).toHaveLength(0);
  });

  it("collectProcessImprovements no longer ingests results-review sidecars directly", async () => {
    await writeFile(
      tmpDir,
      "docs/plans/feature-a/results-review.user.md",
      `---
Business-Unit: BRIK
Review-date: 2026-02-25
---
# Results Review

## New Idea Candidates
- Real idea to keep
`,
    );
    await writeFile(
      tmpDir,
      "docs/plans/feature-a/results-review.signals.json",
      `${JSON.stringify(
        {
          schema_version: "results-review.signals.v1",
          generated_at: "2026-03-06T11:00:00.000Z",
          plan_slug: "feature-a",
          source_path: "docs/plans/feature-a/results-review.user.md",
          items: [
            {
              type: "idea",
              business: "BRIK",
              title: "Sidecar-only idea",
              body: "This should not appear until admitted into queue.",
              source: "results-review.user.md",
              date: "2026-03-06",
              path: "docs/plans/feature-a/results-review.user.md",
              idea_key: "sidecar-only-idea-key",
            },
          ],
        },
        null,
        2,
      )}\n`,
    );

    const data = collectProcessImprovements(tmpDir);
    expect(data.ideaItems).toHaveLength(0);
  });

  it("idea items produced by collectProcessImprovements carry classifier output fields", async () => {
    const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "process-improvements-clf-"));
    await writeQueueState(
      tmpRoot,
      [
        makeQueueDispatch({
          dispatch_id: "DISPATCH-CLF-QUEUE-001",
          current_truth: "Add classifier output fields",
          area_anchor: "Add classifier output fields",
          why: "classification fields missing on surfaced queue items",
        }),
      ],
    );

    const data = collectProcessImprovements(tmpRoot);
    expect(data.ideaItems).toHaveLength(1);
    const item = data.ideaItems[0]!;

    // Classification fields must be present (values are classifier-determined but type is string)
    expect(typeof item.urgency).toBe("string");
    expect(typeof item.effort).toBe("string");
    // reason_code must be a non-empty string
    expect(typeof item.reason_code).toBe("string");
    expect((item.reason_code ?? "").length).toBeGreaterThan(0);
    // priority_tier must be a recognized tier code
    expect(["P0", "P0R", "P1", "P1M", "P2", "P3", "P4", "P5"]).toContain(item.priority_tier);
    // own_priority_rank must be a positive integer
    expect(typeof item.own_priority_rank).toBe("number");
    expect(item.own_priority_rank!).toBeGreaterThan(0);
    // proximity is null or string (null for non-P1 tiers)
    expect(item.proximity === null || typeof item.proximity === "string").toBe(true);

    await fs.rm(tmpRoot, { recursive: true, force: true });
  });

  it("collectProcessImprovements ignores raw bug-scan artifacts without queue admission", async () => {
    await writeFile(
      tmpDir,
      "docs/plans/bug-scan-flow/bug-scan-findings.user.json",
      `${JSON.stringify(
        {
          schema_version: "bug-scan-findings.v1",
          generated_at: "2026-03-02T10:00:00.000Z",
          business_scope: "BRIK",
          finding_count: 1,
          critical_count: 1,
          warning_count: 0,
          findings: [
            {
              ruleId: "no-eval-call",
              severity: "critical",
              message: "`eval()` execution is unsafe and hard to audit.",
              suggestion: "Replace with explicit parsing/dispatch logic.",
              file: "apps/brikette/src/lib/risky.ts",
              line: 14,
              column: 7,
            },
          ],
        },
        null,
        2,
      )}\n`,
    );

    const data = collectProcessImprovements(tmpDir);
    expect(data.ideaItems).toHaveLength(0);
  });

  it("collectProcessImprovements surfaces queue-backed bug-scan ideas instead of raw bug-scan artifacts", async () => {
    await writeFile(
      tmpDir,
      "docs/plans/bug-scan-flow/bug-scan-findings.user.json",
      `${JSON.stringify(
        {
          schema_version: "bug-scan-findings.v1",
          generated_at: "2026-03-02T10:00:00.000Z",
          business_scope: "BRIK",
          findings: [
            {
              ruleId: "no-eval-call",
              severity: "critical",
              message: "`eval()` execution is unsafe and hard to audit.",
              suggestion: "Replace with explicit parsing/dispatch logic.",
              file: "apps/brikette/src/lib/risky.ts",
              line: 14,
              column: 7,
            },
          ],
        },
        null,
        2,
      )}\n`,
    );

    await writeQueueState(tmpDir, [
      makeQueueDispatch({
        dispatch_id: "DISPATCH-BUG-SCAN-001",
        artifact_id: "BOS-BOS-BUG_SCAN_FINDINGS",
        business: "BRIK",
        area_anchor: "Bug scan no-eval-call at apps/brikette/src/lib/risky.ts:14:7",
        current_truth: "Bug scan no-eval-call at apps/brikette/src/lib/risky.ts:14:7",
        why: "Replace with explicit parsing/dispatch logic.",
        created_at: "2026-03-02T10:00:00.000Z",
      }),
    ]);

    const data = collectProcessImprovements(tmpDir);

    expect(data.ideaItems).toHaveLength(1);
    expect(data.ideaItems[0]?.source).toBe("queue-state.json");
    expect(data.ideaItems[0]?.title).toContain("no-eval-call");
    expect(data.ideaItems[0]?.path).toBe(QUEUE_STATE_RELATIVE_PATH);
  });

  // ---------------------------------------------------------------------------
  // TASK-04: queue-only backlog TCs
  // ---------------------------------------------------------------------------

  it("TC-04-01: markdown-only results-review ideas do not appear without queue admission", async () => {
    await writeFile(
      tmpDir,
      "docs/plans/sidecar-test/results-review.user.md",
      `---
Business-Unit: BRIK
Review-date: 2026-03-06
---
## New Idea Candidates
- Markdown only idea
`,
    );

    const data = collectProcessImprovements(tmpDir);
    expect(data.ideaItems).toHaveLength(0);
  });

  it("TC-04-02: valid results-review sidecars do not appear without queue admission", async () => {
    await writeFile(
      tmpDir,
      "docs/plans/sidecar-test/results-review.user.md",
      `---
Business-Unit: BRIK
Review-date: 2026-03-06
---
## New Idea Candidates
- Markdown idea (should be bypassed)
`,
    );

    const sidecar = {
      schema_version: "results-review.signals.v1",
      generated_at: new Date().toISOString(),
      plan_slug: "sidecar-test",
      source_path: "docs/plans/sidecar-test/results-review.user.md",
      items: [
        {
          type: "idea",
          business: "BRIK",
          title: "Sidecar idea (should win)",
          body: "",
          source: "results-review.user.md",
          date: "2026-03-06",
          path: "docs/plans/sidecar-test/results-review.user.md",
          idea_key: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          priority_tier: "P3",
          own_priority_rank: 7,
          urgency: "U2",
          effort: "M",
          proximity: null,
          reason_code: "test_idea",
        },
      ],
    };
    await writeFile(
      tmpDir,
      "docs/plans/sidecar-test/results-review.signals.json",
      `${JSON.stringify(sidecar, null, 2)}\n`,
    );

    const data = collectProcessImprovements(tmpDir);
    expect(data.ideaItems).toHaveLength(0);
  });

  it("TC-04-03: queue-backed build-origin ideas expose provenance in process-improvements data", async () => {
    await writeQueueState(
      tmpDir,
      [
        makeQueueDispatch({
          dispatch_id: "DISPATCH-BUILD-ORIGIN-001",
          current_truth: "Queue-backed build-origin idea",
          area_anchor: "Queue-backed build-origin idea",
          build_origin: makeBuildOriginProvenance(),
        }),
      ],
    );

    const data = collectProcessImprovements(tmpDir);
    expect(data.ideaItems).toHaveLength(1);
    expect(data.ideaItems[0]?.source).toBe("queue-state.json");
    expect(data.ideaItems[0]?.build_origin?.build_signal_id).toBe("build-signal-123");
    expect(data.ideaItems[0]?.build_origin?.results_review_path).toBe(
      "docs/plans/queue-unification-task/results-review.user.md",
    );
  });

  it("TC-04-03A: historical carry-over queue items use the area anchor as backlog title", async () => {
    await writeQueueState(
      tmpDir,
      [
        makeQueueDispatch({
          dispatch_id: "DISPATCH-HISTORICAL-001",
          area_anchor: "Build artifact caching for staging",
          current_truth:
            "The archived observation is still specific, no later queue-backed follow-up exists, and the repo does not show a staging-specific caching follow-on that closes the idea.",
          why: "Backfilled from the historical carry-over audit.",
          historical_carryover: {
            schema_version: "dispatch-historical-carryover.v1",
            manifest_path:
              "docs/plans/startup-loop-results-review-historical-carryover/artifacts/historical-carryover-manifest.json",
            historical_candidate_id: "hc_96cb17616884",
            source_audit_path:
              "docs/plans/_archive/startup-loop-results-review-queue-unification/artifacts/historical-carryover-audit.md",
            source_plan_slugs: ["brikette-staging-upload-speed"],
            source_paths: [
              "docs/plans/_archive/brikette-staging-upload-speed/results-review.signals.json",
              "docs/plans/_archive/brikette-staging-upload-speed/pattern-reflection.entries.json",
            ],
            backfilled_at: "2026-03-10T12:25:35.035Z",
          },
        }),
      ],
    );

    const data = collectProcessImprovements(tmpDir);
    expect(data.ideaItems).toHaveLength(1);
    expect(data.ideaItems[0]?.source).toBe("queue-state.json");
    expect(data.ideaItems[0]?.title).toBe("Build artifact caching for staging");
    expect(data.ideaItems[0]?.historical_carryover?.historical_candidate_id).toBe(
      "hc_96cb17616884",
    );
  });

  it("TC-04-04: updated HTML embeds build-origin provenance for queue-backed ideas", () => {
    const updated = updateProcessImprovementsHtml(
      HTML_TEMPLATE,
      {
        ideaItems: [
          {
            type: "idea",
            business: "BRIK",
            title: "Queue-backed build-origin idea",
            body: "Visible only through queue-backed admission.",
            source: "queue-state.json",
            date: "2026-03-06",
            path: QUEUE_STATE_RELATIVE_PATH,
            build_origin: makeBuildOriginProvenance(),
          },
        ],
        riskItems: [],
        pendingReviewItems: [],
      },
      "2026-03-06",
    );

    expect(updated).toContain('"build_origin"');
    expect(updated).toContain('"build_signal_id": "build-signal-123"');
    expect(updated).toContain('"results_review_path": "docs/plans/queue-unification-task/results-review.user.md"');
  });

  it("TC-04-05: canonical report labels distinguish the P4/P5 group from the P5 tier", async () => {
    const html = await readCanonicalProcessImprovementsHtml();

    expect(html).toContain("Low/Backlog (P4/P5)");
    expect(html).toContain("'P4':  'Low priority'");
    expect(html).toContain("'P5':  'Backlog'");
    expect(html).not.toContain("</span> Backlog</button>");
  });

  it("TC-14-01: build-origin bridge auto-admits active plan sidecars into the trial queue", async () => {
    await writeBuildOriginSidecars(tmpDir, "docs/plans/queue-unification-task");

    const bridgeResult = runBuildOriginBridgeForProcessImprovements(tmpDir);

    expect(bridgeResult.ok).toBe(true);
    expect(bridgeResult.plans_considered).toBe(1);
    expect(bridgeResult.dispatches_enqueued).toBe(1);

    const data = collectProcessImprovements(tmpDir);
    expect(data.ideaItems).toHaveLength(1);
    expect(data.ideaItems[0]?.title).toBe("Queue-backed build-origin idea");
    expect(data.ideaItems[0]?.build_origin?.build_signal_id).toBe("build-signal-123");
  });

  it("TC-14-02: build-origin bridge ignores archived plan sidecars during automatic admission", async () => {
    await writeBuildOriginSidecars(tmpDir, "docs/plans/_archive/old-feature", {
      planSlug: "old-feature",
      reviewCycleKey: "old-feature",
      title: "Archived build-origin idea",
      buildSignalId: "archived-signal-123",
      recurrenceKey: "archived-recurrence-123",
    });

    const bridgeResult = runBuildOriginBridgeForProcessImprovements(tmpDir);

    expect(bridgeResult.ok).toBe(true);
    expect(bridgeResult.plans_considered).toBe(0);
    expect(bridgeResult.dispatches_enqueued).toBe(0);

    const data = collectProcessImprovements(tmpDir);
    expect(data.ideaItems).toHaveLength(0);
  });

  it("TC-14-03: render-only artifact updates do not auto-admit build-origin sidecars", async () => {
    await writeBuildOriginSidecars(tmpDir, "docs/plans/queue-unification-task");
    await writeFile(tmpDir, "docs/business-os/process-improvements.user.html", HTML_TEMPLATE);

    const result = updateProcessImprovementsArtifacts(tmpDir, {
      sync_build_origin_bridge: false,
      sync_codebase_signals_bridge: false,
      sync_agent_session_signals_bridge: false,
      now: new Date("2026-03-10T12:00:00.000Z"),
    });

    expect(result.data.ideaItems).toHaveLength(0);

    const queueStatePath = path.join(tmpDir, QUEUE_STATE_RELATIVE_PATH);
    await expect(fs.stat(queueStatePath)).rejects.toThrow();
  });

  it("keeps the static report in read-only signpost mode for operator actions", async () => {
    const html = await readCanonicalProcessImprovementsHtml();

    expect(html).toContain("Operator Actions Live In The App");
    expect(html).toContain("http://127.0.0.1:3020/process-improvements");
    expect(html).toContain("pnpm --filter @apps/business-os dev");
  });

  it("TC-14-04: build-origin sync can still be run explicitly before artifact updates", async () => {
    await writeBuildOriginSidecars(tmpDir, "docs/plans/queue-unification-task");
    await writeFile(tmpDir, "docs/business-os/process-improvements.user.html", HTML_TEMPLATE);

    const result = updateProcessImprovementsArtifacts(tmpDir, {
      sync_build_origin_bridge: true,
      sync_codebase_signals_bridge: false,
      sync_agent_session_signals_bridge: false,
      now: new Date("2026-03-10T12:00:00.000Z"),
    });

    expect(result.build_origin_bridge?.dispatches_enqueued).toBe(1);
    expect(result.data.ideaItems).toHaveLength(1);
    expect(result.data.ideaItems[0]?.title).toBe("Queue-backed build-origin idea");
  });

  it("appendCompletedIdea is idempotent — calling twice yields one entry", async () => {
    const entry = {
      title: "My idea",
      source_path: "docs/plans/test/results-review.user.md",
      plan_slug: "test-plan",
      completed_at: "2026-02-26",
    };

    appendCompletedIdea(tmpDir, entry);
    appendCompletedIdea(tmpDir, entry);

    const registryPath = path.join(tmpDir, "docs/business-os/_data/completed-ideas.json");
    const raw = await fs.readFile(registryPath, "utf8");
    const registry = JSON.parse(raw) as { entries: unknown[] };
    expect(registry.entries).toHaveLength(1);
  });
});

describe("dispatch queue collection", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "dispatch-queue-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("TC-01: collects only enqueued dispatches, excludes completed", async () => {
    const queueState = {
      dispatches: [
        {
          dispatch_id: "DISPATCH-001",
          business: "BOS",
          area_anchor: "Enqueued idea one",
          why: "Reason one",
          queue_state: "enqueued",
          created_at: "2026-03-04T10:00:00.000Z",
        },
        {
          dispatch_id: "DISPATCH-002",
          business: "BOS",
          area_anchor: "Enqueued idea two",
          why: "Reason two",
          queue_state: "enqueued",
          created_at: "2026-03-04T11:00:00.000Z",
        },
        {
          dispatch_id: "DISPATCH-003",
          business: "BRIK",
          area_anchor: "Enqueued idea three",
          why: "Reason three",
          queue_state: "enqueued",
          created_at: "2026-03-04T12:00:00.000Z",
        },
        {
          dispatch_id: "DISPATCH-004",
          business: "BOS",
          area_anchor: "Completed idea",
          why: "Already done",
          queue_state: "completed",
          created_at: "2026-03-03T10:00:00.000Z",
        },
        {
          dispatch_id: "DISPATCH-005",
          business: "BOS",
          area_anchor: "Processed idea",
          why: "Already processed",
          queue_state: "processed",
          created_at: "2026-03-03T11:00:00.000Z",
        },
      ],
    };
    await writeFile(tmpDir, QUEUE_STATE_RELATIVE_PATH, JSON.stringify(queueState, null, 2));

    const data = collectProcessImprovements(tmpDir);
    const dispatchItems = data.ideaItems.filter((item) => item.source === "queue-state.json");
    expect(dispatchItems).toHaveLength(3);
    expect(dispatchItems.map((i) => i.title)).toEqual(
      expect.arrayContaining(["Enqueued idea one", "Enqueued idea two", "Enqueued idea three"]),
    );
  });

  it("TC-02: missing queue-state.json produces zero dispatch items with no error", async () => {
    // No queue-state.json written — should still work
    const data = collectProcessImprovements(tmpDir);
    const dispatchItems = data.ideaItems.filter((item) => item.source === "queue-state.json");
    expect(dispatchItems).toHaveLength(0);
  });

  it("TC-03: dispatch items carry classifier fields when classifier succeeds (fail-open)", async () => {
    const queueState = {
      dispatches: [
        {
          dispatch_id: "DISPATCH-CLF-001",
          business: "BOS",
          area_anchor: "Add caching layer to API responses",
          why: "API response times are slow for repeated queries",
          queue_state: "enqueued",
          created_at: "2026-03-04T10:00:00.000Z",
        },
      ],
    };
    await writeFile(tmpDir, QUEUE_STATE_RELATIVE_PATH, JSON.stringify(queueState, null, 2));

    const data = collectProcessImprovements(tmpDir);
    const dispatchItems = data.ideaItems.filter((item) => item.source === "queue-state.json");
    expect(dispatchItems).toHaveLength(1);
    const item = dispatchItems[0]!;

    // Classifier fields should be present (fail-open: if classifier errors, fields are unset)
    expect(typeof item.priority_tier).toBe("string");
    expect(typeof item.own_priority_rank).toBe("number");
    expect(typeof item.urgency).toBe("string");
    expect(typeof item.effort).toBe("string");
    expect(typeof item.reason_code).toBe("string");
  });

  it("TC-03B: synthetic dispatch items prefer enriched current_truth as the surfaced title", async () => {
    const queueState = {
      dispatches: [
        {
          dispatch_id: "DISPATCH-SYN-001",
          artifact_id: "BOS-BOS-AGENT_SESSION_FINDINGS",
          business: "BOS",
          area_anchor: "bos-agent-session-findings",
          current_truth: "Recent agent-session review surfaced: Upload button fails silently when the API times out.",
          why: "Recent walkthrough/testing activity surfaced a concrete issue that should retain its original session context in downstream idea intake.",
          queue_state: "enqueued",
          created_at: "2026-03-04T10:00:00.000Z",
        },
      ],
    };
    await writeFile(tmpDir, QUEUE_STATE_RELATIVE_PATH, JSON.stringify(queueState, null, 2));

    const data = collectProcessImprovements(tmpDir);
    const dispatchItems = data.ideaItems.filter((item) => item.source === "queue-state.json");
    expect(dispatchItems).toHaveLength(1);
    expect(dispatchItems[0]?.title).toBe(
      "Recent agent-session review surfaced: Upload button fails silently when the API times out.",
    );
  });

  it("TC-03C: generic synthetic dispatch items are projected into well-formed surfaced ideas", async () => {
    const queueState = {
      dispatches: [
        {
          dispatch_id: "DISPATCH-SYN-002",
          artifact_id: "BOS-BOS-REPO_MATURITY_SIGNALS",
          business: "BOS",
          area_anchor: "bos-repo-maturity-signals",
          current_truth: "BOS-BOS-REPO_MATURITY_SIGNALS changed (bootstr → b2e8a4f)",
          next_scope_now: "Investigate implications of bos-repo-maturity-signals delta for BOS",
          why: "Assess bos-repo-maturity-signals implications from BOS-BOS-REPO_MATURITY_SIGNALS delta for BOS.",
          intended_outcome: {
            type: "operational",
            statement: "Produce a validated routing outcome and scoped next action for bos-repo-maturity-signals.",
            source: "auto",
          },
          evidence_refs: [
            "repo-maturity-score:65",
            "repo-maturity-level:Level-3-Reliable",
            "repo-maturity-critical-control:no_ci_pipeline",
            "repo-maturity-critical-control:no_codeowners",
          ],
          queue_state: "enqueued",
          created_at: "2026-03-04T10:00:00.000Z",
        },
      ],
    };
    await writeFile(tmpDir, QUEUE_STATE_RELATIVE_PATH, JSON.stringify(queueState, null, 2));

    const data = collectProcessImprovements(tmpDir);
    const dispatchItems = data.ideaItems.filter((item) => item.source === "queue-state.json");
    expect(dispatchItems).toHaveLength(1);
    expect(dispatchItems[0]?.title).toContain("Repo maturity is 65");
    expect(dispatchItems[0]?.body).toContain("Repo maturity monitoring is only useful");
  });

  it("TC-04: dispatches with identical area_anchor but different dispatch_id get distinct idea_keys", async () => {
    const queueState = {
      dispatches: [
        {
          dispatch_id: "DISPATCH-DUP-001",
          business: "BOS",
          area_anchor: "bos-agent-session-findings",
          why: "First finding",
          queue_state: "enqueued",
          created_at: "2026-03-04T10:00:00.000Z",
        },
        {
          dispatch_id: "DISPATCH-DUP-002",
          business: "BOS",
          area_anchor: "bos-agent-session-findings",
          why: "Second finding",
          queue_state: "enqueued",
          created_at: "2026-03-04T11:00:00.000Z",
        },
      ],
    };
    await writeFile(tmpDir, QUEUE_STATE_RELATIVE_PATH, JSON.stringify(queueState, null, 2));

    const data = collectProcessImprovements(tmpDir);
    const dispatchItems = data.ideaItems.filter((item) => item.source === "queue-state.json");
    expect(dispatchItems).toHaveLength(2);
    const keys = dispatchItems.map((i) => i.idea_key);
    expect(keys[0]).not.toBe(keys[1]);
  });

  it("TC-05: queue-backed idea items sort correctly after bug-scan cutover", async () => {
    await writeQueueState(
      tmpDir,
      [
        makeQueueDispatch({
          dispatch_id: "DISPATCH-SORT-001",
          business: "BOS",
          area_anchor: "Dispatch queue idea",
          current_truth: "Dispatch queue idea",
          why: "Testing sort order",
          created_at: "2026-03-04T10:00:00.000Z",
        }),
        makeQueueDispatch({
          dispatch_id: "DISPATCH-SORT-002",
          artifact_id: "BOS-BOS-BUG_SCAN_FINDINGS",
          business: "BRIK",
          area_anchor: "Bug scan no-debug-logging at apps/brikette/src/lib/debug.ts:9:2",
          current_truth: "Bug scan no-debug-logging at apps/brikette/src/lib/debug.ts:9:2",
          why: "Remove the debug logging from the production path.",
          created_at: "2026-03-04T09:00:00.000Z",
        }),
      ],
    );

    const data = collectProcessImprovements(tmpDir);
    // Queue-backed sources should be the only actionable idea items after cutover.
    const sources = new Set(data.ideaItems.map((i) => i.source));
    expect(sources.has("queue-state.json")).toBe(true);
    expect(sources.has("bug-scan-findings.user.json")).toBe(false);
    // All items should be sorted (own_priority_rank ascending)
    for (let i = 1; i < data.ideaItems.length; i++) {
      const prevRank = data.ideaItems[i - 1]!.own_priority_rank ?? 999;
      const currRank = data.ideaItems[i]!.own_priority_rank ?? 999;
      expect(prevRank).toBeLessThanOrEqual(currRank);
    }
  });

  it("TC-06: malformed queue-state.json (missing dispatches array) returns empty", async () => {
    await writeFile(tmpDir, QUEUE_STATE_RELATIVE_PATH, '{"counts": {}}');

    const data = collectProcessImprovements(tmpDir);
    const dispatchItems = data.ideaItems.filter((item) => item.source === "queue-state.json");
    expect(dispatchItems).toHaveLength(0);
  });

  it("TC-07: dispatch with empty area_anchor is skipped", async () => {
    const queueState = {
      dispatches: [
        {
          dispatch_id: "DISPATCH-EMPTY-001",
          business: "BOS",
          area_anchor: "",
          why: "No title",
          queue_state: "enqueued",
          created_at: "2026-03-04T10:00:00.000Z",
        },
        {
          dispatch_id: "DISPATCH-GOOD-001",
          business: "BOS",
          area_anchor: "Valid idea",
          why: "Has a title",
          queue_state: "enqueued",
          created_at: "2026-03-04T11:00:00.000Z",
        },
      ],
    };
    await writeFile(tmpDir, QUEUE_STATE_RELATIVE_PATH, JSON.stringify(queueState, null, 2));

    const data = collectProcessImprovements(tmpDir);
    const dispatchItems = data.ideaItems.filter((item) => item.source === "queue-state.json");
    expect(dispatchItems).toHaveLength(1);
    expect(dispatchItems[0]?.title).toBe("Valid idea");
  });
});
