/**
 * Shared signal event test fixtures.
 *
 * Factory functions produce objects matching the SelectionEvent and
 * RefinementEvent interfaces from `utils/signal-events.ts`. Mirrors
 * the inline `makeSelection` / `makeRefinement` helpers used in
 * `signal-events-validation.test.ts` and `draft-ranker-calibrate.test.ts`,
 * but exported for reuse across test files.
 */

import type {
  RefinementEvent,
  RewriteReason,
  SelectionEvent,
} from "../../../utils/signal-events.js";

// ---------------------------------------------------------------------------
// SelectionEvent factory
// ---------------------------------------------------------------------------

/**
 * Build a valid SelectionEvent with sensible defaults.
 * All fields can be overridden via the `overrides` parameter.
 */
export function makeSelectionEvent(
  overrides: Partial<SelectionEvent> = {},
): SelectionEvent {
  return {
    event: "selection",
    draft_id: "d-001",
    ts: "2026-02-20T10:00:00Z",
    template_subject: "Check-in Info",
    template_category: "check-in",
    selection: "template-a",
    scenario_category: "check-in",
    scenario_category_raw: "Check-In",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// RefinementEvent factory
// ---------------------------------------------------------------------------

/**
 * Build a valid RefinementEvent with sensible defaults.
 * All fields can be overridden via the `overrides` parameter.
 */
export function makeRefinementEvent(
  overrides: Partial<RefinementEvent> = {},
): RefinementEvent {
  return {
    event: "refinement",
    draft_id: "d-001",
    ts: "2026-02-20T10:01:00Z",
    rewrite_reason: "light-edit" as RewriteReason,
    refinement_applied: true,
    refinement_source: "operator",
    edit_distance_pct: 0.15,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Convenience: paired selection + refinement for a single draft
// ---------------------------------------------------------------------------

/**
 * Build a matched selection/refinement pair sharing the same draft_id.
 * Useful for tests that need joined events.
 */
export function makeSignalEventPair(overrides: {
  draft_id?: string;
  ts?: string;
  scenario_category?: string;
  template_subject?: string | null;
  rewrite_reason?: RewriteReason;
} = {}): { selection: SelectionEvent; refinement: RefinementEvent } {
  const draftId = overrides.draft_id ?? "d-001";
  const ts = overrides.ts ?? "2026-02-20T10:00:00Z";

  return {
    selection: makeSelectionEvent({
      draft_id: draftId,
      ts,
      scenario_category: overrides.scenario_category ?? "check-in",
      scenario_category_raw: overrides.scenario_category ?? "check-in",
      template_subject: overrides.template_subject ?? "Check-in Info",
      template_category: overrides.scenario_category ?? "check-in",
    }),
    refinement: makeRefinementEvent({
      draft_id: draftId,
      ts,
      rewrite_reason: overrides.rewrite_reason ?? "light-edit",
      refinement_applied: (overrides.rewrite_reason ?? "light-edit") !== "none",
    }),
  };
}
