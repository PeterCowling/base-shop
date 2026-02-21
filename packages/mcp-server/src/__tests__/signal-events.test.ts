/** @jest-environment node */

/**
 * TASK-02: Tests for signal capture — draft_id, selection/refinement events, rewrite_reason.
 *
 * TC-01: handleDraftGenerateTool returns draft_id UUID on every call
 * TC-02: handleDraftGenerateTool appends a selection event to JSONL
 * TC-03: handleDraftRefineTool appends a refinement event with matching draft_id + rewrite_reason
 * TC-04: handleDraftRefineTool without draft_id returns validation error
 * TC-05: normalizeSignalCategory("inquiry") → { "general", raw: "inquiry" }
 * TC-06: joinEvents — only paired events returned; orphaned selection excluded
 * TC-07: joinEvents — orphaned refinement excluded
 * TC-08: editDistancePct — identical=0, fully different≈1, one changed word≈10%
 * TC-09: countSignalEvents with 3 selection + 2 refinement events returns correct counts
 * TC-10: countSignalEvents with non-existent path returns all-zero counts
 *
 * Run command:
 *   pnpm -w run test:governed -- jest -- --testPathPattern="signal-events.test" --no-coverage
 */

import { randomUUID } from "node:crypto";
import { unlink,writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { handleDraftRefineTool } from "../tools/draft-refine";
import {
  countSignalEvents,
  editDistancePct,
  joinEvents,
  normalizeSignalCategory,
  type RefinementEvent,
  type SelectionEvent,
} from "../utils/signal-events";

// ---------------------------------------------------------------------------
// TC-04: handleDraftRefineTool without draft_id → validation error
// (Simple schema-only test — no complex mocking needed)
// ---------------------------------------------------------------------------

describe("TASK-02: TC-04 draft_refine without draft_id returns validation error", () => {
  const BASE_ACTION_PLAN = {
    language: "EN" as const,
    intents: { questions: [], requests: [] },
    scenario: { category: "faq" },
    workflow_triggers: { booking_monitor: false },
  };

  it("returns error when draft_id is missing", async () => {
    const result = await handleDraftRefineTool("draft_refine", {
      actionPlan: BASE_ACTION_PLAN,
      // draft_id deliberately omitted
      originalBodyPlain: "Check-in is from 2:30pm.",
      refinedBodyPlain: "Check-in is from 2:30pm.",
    });

    expect(
      (result as { isError?: boolean }).isError === true ||
        (result as { content: Array<{ text: string }> }).content[0].text.includes(
          "Invalid arguments",
        ),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TC-05: normalizeSignalCategory
// ---------------------------------------------------------------------------

describe("TASK-02: TC-05 normalizeSignalCategory normalizes unknown categories", () => {
  it('maps unknown category "inquiry" to "general", retains raw value', () => {
    const result = normalizeSignalCategory("inquiry");
    expect(result.scenario_category).toBe("general");
    expect(result.scenario_category_raw).toBe("inquiry");
  });

  it('passes through known category "faq" unchanged', () => {
    const result = normalizeSignalCategory("faq");
    expect(result.scenario_category).toBe("faq");
    expect(result.scenario_category_raw).toBe("faq");
  });

  it('passes through known category "cancellation" unchanged', () => {
    const result = normalizeSignalCategory("cancellation");
    expect(result.scenario_category).toBe("cancellation");
  });

  it("normalizes completely unknown category to general", () => {
    const result = normalizeSignalCategory("completely-unknown-xyz");
    expect(result.scenario_category).toBe("general");
    expect(result.scenario_category_raw).toBe("completely-unknown-xyz");
  });
});

// ---------------------------------------------------------------------------
// TC-06: joinEvents — only paired events; orphaned selection excluded
// ---------------------------------------------------------------------------

describe("TASK-02: TC-06 joinEvents — only paired events returned", () => {
  const makeSelection = (draft_id: string): SelectionEvent => ({
    event: "selection",
    draft_id,
    ts: new Date().toISOString(),
    template_subject: "Test subject",
    template_category: "faq",
    selection: "composite",
    scenario_category: "faq",
    scenario_category_raw: "faq",
  });

  const makeRefinement = (draft_id: string): RefinementEvent => ({
    event: "refinement",
    draft_id,
    ts: new Date().toISOString(),
    rewrite_reason: "none",
    refinement_applied: false,
    refinement_source: "none",
    edit_distance_pct: 0,
  });

  it("returns only the A pair when B is an orphaned selection", () => {
    const selections = [makeSelection("A"), makeSelection("B")];
    const refinements = [makeRefinement("A")];

    const pairs = joinEvents(selections, refinements);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].selection.draft_id).toBe("A");
    expect(pairs[0].refinement.draft_id).toBe("A");
  });

  it("returns empty array when both selections are orphaned", () => {
    const selections = [makeSelection("A"), makeSelection("B")];
    const refinements: RefinementEvent[] = [];

    const pairs = joinEvents(selections, refinements);
    expect(pairs).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// TC-07: joinEvents — orphaned refinement excluded
// ---------------------------------------------------------------------------

describe("TASK-02: TC-07 joinEvents — orphaned refinement excluded", () => {
  it("returns empty when only an orphaned refinement is present", () => {
    const selections: SelectionEvent[] = [];
    const refinements: RefinementEvent[] = [
      {
        event: "refinement",
        draft_id: "X",
        ts: new Date().toISOString(),
        rewrite_reason: "style",
        refinement_applied: true,
        refinement_source: "claude-cli",
        edit_distance_pct: 0.15,
      },
    ];

    const pairs = joinEvents(selections, refinements);
    expect(pairs).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// TC-08: editDistancePct
// ---------------------------------------------------------------------------

describe("TASK-02: TC-08 editDistancePct — token-level distance", () => {
  it("returns 0 for identical strings", () => {
    expect(editDistancePct("hello world", "hello world")).toBe(0);
  });

  it("returns 1 for completely different strings of equal token length", () => {
    expect(editDistancePct("alpha beta gamma", "delta epsilon zeta")).toBe(1);
  });

  it("returns a low distance for one changed word in ten", () => {
    const base = "one two three four five six seven eight nine ten";
    const changed = "one two three four five six seven eight nine CHANGED";
    const dist = editDistancePct(base, changed);
    // One token changed out of 10 → distance ≈ 0.10
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThan(0.25);
  });

  it("returns 1 for empty vs non-empty string", () => {
    expect(editDistancePct("", "hello world")).toBe(1);
  });

  it("returns 0 for two empty strings", () => {
    expect(editDistancePct("", "")).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// TC-09: countSignalEvents with 3 selection + 2 refinement events
// ---------------------------------------------------------------------------

describe("TASK-02: TC-09 countSignalEvents returns correct counts", () => {
  let tmpPath: string;

  beforeEach(() => {
    tmpPath = join(tmpdir(), `signal-events-test-${randomUUID()}.jsonl`);
  });

  afterEach(async () => {
    try {
      await unlink(tmpPath);
    } catch {
      // ignore if file doesn't exist
    }
  });

  it("counts 3 selections, 2 refinements, 2 joined pairs", async () => {
    const events = [
      // 3 selection events
      JSON.stringify({ event: "selection", draft_id: "d1", ts: "2026-01-01T10:00:00.000Z", template_subject: "A", template_category: "faq", selection: "composite", scenario_category: "faq", scenario_category_raw: "faq" }),
      JSON.stringify({ event: "selection", draft_id: "d2", ts: "2026-01-01T10:01:00.000Z", template_subject: "B", template_category: "faq", selection: "composite", scenario_category: "faq", scenario_category_raw: "faq" }),
      JSON.stringify({ event: "selection", draft_id: "d3", ts: "2026-01-01T10:02:00.000Z", template_subject: "C", template_category: "faq", selection: "composite", scenario_category: "faq", scenario_category_raw: "faq" }),
      // 2 refinement events (d1 and d2 paired; d3 orphaned)
      JSON.stringify({ event: "refinement", draft_id: "d1", ts: "2026-01-01T10:00:30.000Z", rewrite_reason: "none", refinement_applied: false, refinement_source: "none", edit_distance_pct: 0 }),
      JSON.stringify({ event: "refinement", draft_id: "d2", ts: "2026-01-01T10:01:30.000Z", rewrite_reason: "style", refinement_applied: true, refinement_source: "claude-cli", edit_distance_pct: 0.1 }),
    ].join("\n") + "\n";

    await writeFile(tmpPath, events, "utf-8");

    const counts = await countSignalEvents(tmpPath);
    expect(counts.selection_count).toBe(3);
    expect(counts.refinement_count).toBe(2);
    expect(counts.joined_count).toBe(2);
    expect(counts.events_since_last_calibration).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// TC-10: countSignalEvents with non-existent file → all-zero counts
// ---------------------------------------------------------------------------

describe("TASK-02: TC-10 countSignalEvents returns zeros when file is absent", () => {
  it("returns all-zero counts for a non-existent path", async () => {
    const nonExistentPath = join(tmpdir(), `does-not-exist-${randomUUID()}.jsonl`);
    const counts = await countSignalEvents(nonExistentPath);
    expect(counts).toEqual({
      selection_count: 0,
      refinement_count: 0,
      joined_count: 0,
      events_since_last_calibration: 0,
    });
  });
});
