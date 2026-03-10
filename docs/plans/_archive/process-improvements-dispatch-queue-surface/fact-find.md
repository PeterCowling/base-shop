---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: BOS
Workstream: Engineering
Created: 2026-03-04
Last-updated: 2026-03-04
Feature-Slug: process-improvements-dispatch-queue-surface
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/process-improvements-dispatch-queue-surface/plan.md
Trigger-Why: The self-improving loop produces ideas via three signal bridges (codebase signals, agent session, operator) into queue-state.json, but none of these reach the process-improvements dashboard. The operator has no visibility into loop-generated ideas without reading raw JSON.
Trigger-Intended-Outcome: "type: operational | statement: All enqueued dispatch ideas from the self-improving loop appear on process-improvements.user.html alongside existing results-review and bug-scan ideas, with automatic regeneration when items are added or removed | source: operator"
---

# Process Improvements Dispatch Queue Surface — Fact-Find Brief

## Scope

### Summary

The process-improvements dashboard (`docs/business-os/process-improvements.user.html`) aggregates ideas from results-review files and bug-scan findings but ignores all dispatch queue items from the self-improving loop. The generator (`scripts/src/startup-loop/build/generate-process-improvements.ts`) writes dispatches *into* `queue-state.json` via signal bridges but never reads them back as displayable items. This means repo maturity findings, codebase structural signals, agent session findings, and operator-submitted ideas sitting in the queue are invisible on the dashboard.

### Goals

- Surface all enqueued dispatch queue items on the process-improvements dashboard as idea candidates.
- Auto-regenerate the HTML when queue-state.json changes (via git hook).
- Use the existing priority classification from dispatch packets (P0-P5) for consistent sorting.
- Completed/processed dispatches should not appear.

### Non-goals

- Changing the dispatch queue schema or lifecycle.
- Adding a new HTML section/tab for dispatches — they should merge into the existing Ideas section.
- Modifying the 30-second meta-refresh behavior (already works).

### Constraints & Assumptions

- Constraints:
  - Must preserve the existing `replaceArrayAssignment` injection pattern for `IDEA_ITEMS`.
  - Must not break `runCheck()` drift detection.
  - Must remain deterministic (no network calls, no runtime dependencies).
- Assumptions:
  - Dispatch items exit the dashboard via `queue_state` lifecycle transitions (enqueued → processed/completed), not via the completed-ideas registry. The `idea_key` is derived via `deriveIdeaKey(queueStatePath, area_anchor)` for cross-source dedup compatibility.
  - Only `queue_state === "enqueued"` items should appear (other lifecycle states are already actioned).

## Outcome Contract

- **Why:** The self-improving loop produces ideas via signal bridges into queue-state.json, but the operator dashboard ignores them entirely — loop-generated improvement signals are invisible without reading raw JSON.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All enqueued dispatch ideas from the self-improving loop appear on process-improvements.user.html alongside existing results-review and bug-scan ideas, with automatic regeneration when items are added or removed.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `scripts/src/startup-loop/build/generate-process-improvements.ts` — generator entry point (line 917: `runCli()`)
- `docs/business-os/process-improvements.user.html` — HTML dashboard template
- `scripts/git-hooks/generate-process-improvements.sh` — auto-regeneration trigger
- `docs/business-os/startup-loop/ideas/trial/queue-state.json` — dispatch queue (55 enqueued items)

### Key Modules / Files

- `generate-process-improvements.ts:434-438` — `ProcessImprovementsData` interface (3 arrays: ideaItems, riskItems, pendingReviewItems)
- `generate-process-improvements.ts:536-624` — idea collection from results-review (extracts from "New Idea Candidates" sections)
- `generate-process-improvements.ts:627-681` — idea collection from bug-scan findings
- `generate-process-improvements.ts:410-432` — `classifyIdeaItem()` runs the priority classifier on each idea
- `generate-process-improvements.ts:394-407` — `sortIdeaItems()` sorts by priority rank, action urgency, date
- `generate-process-improvements.ts:754-771` — `replaceArrayAssignment()` injects arrays into HTML
- `generate-process-improvements.ts:795-810` — `updateProcessImprovementsHtml()` orchestrates all replacements
- `generate-process-improvements.ts:850-908` — `runCheck()` drift detection
- `process-improvements.user.html:6` — `<meta http-equiv="refresh" content="30">` auto-reloads every 30 seconds
- `process-improvements.user.html:3486` — `allItems()` concatenates all three arrays for rendering

### Patterns & Conventions Observed

- All idea items share one type: `ProcessImprovementItem` with `type: "idea"` — evidence: line 23, 536, 666
- Ideas from different sources are distinguished by `source` field ("results-review.user.md", "bug-scan-findings.user.json") — evidence: lines 616, 673
- `idea_key` is SHA1(`sourcePath::title`) for results-review/bug-scan items — evidence: line 446
- Completed idea keys are filtered via `completedKeys.has(ideaKey)` — evidence: lines 601-603, 662-664
- The classifier enriches items with priority_tier, urgency, effort, proximity, reason_code — evidence: lines 410-432

### Data & Contracts

- Types/schemas/events:
  - `ProcessImprovementItem` (line 25-47): flat object with type, business, title, body, source, date, path, idea_key, classifier fields
  - `ProcessImprovementsData` (line 434-438): `{ ideaItems, riskItems, pendingReviewItems }`
  - Dispatch packet (queue-state.json): `dispatch_id`, `business`, `area_anchor`, `why`, `intended_outcome`, `priority`, `queue_state`, `created_at`, `evidence_refs`, `trigger`
- Persistence:
  - HTML: `docs/business-os/process-improvements.user.html` (inline `var IDEA_ITEMS = [...]`)
  - JSON: `docs/business-os/_data/process-improvements.json` (companion data file)
  - Queue: `docs/business-os/startup-loop/ideas/trial/queue-state.json`

### Dependency & Impact Map

- Upstream dependencies:
  - `queue-state.json` (written by codebase signals bridge, agent session bridge, operator ideas)
  - `completed-ideas.json` (deduplication registry)
- Downstream dependents:
  - `runCheck()` drift detection — must include dispatch items in expected output
  - Git hook — must trigger on queue-state.json changes
  - HTML rendering JS — no changes needed (items merge into existing IDEA_ITEMS array)
- Likely blast radius:
  - `generate-process-improvements.ts` — add one collection loop (~30 lines)
  - `generate-process-improvements.sh` — add queue-state.json to trigger pattern
  - No HTML template changes needed (dispatch items become regular idea items)

### Test Landscape

#### Existing Test Coverage

Existing unit tests in `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts`. Check mode (`--check`) serves as drift detection integration test.

#### Recommended Test Approach

- Verify dispatch items appear in `collectProcessImprovements()` output when queue-state.json has enqueued items.
- Verify completed/processed dispatches are excluded.
- Verify `runCheck()` passes after regeneration.

## Questions

### Resolved

- Q: Should dispatch items get their own HTML section or merge into Ideas?
  - A: Merge into Ideas. The existing rendering groups ideas by priority tier (P0-P5). Dispatch items already have priority fields, so they slot in naturally.
  - Evidence: HTML rendering at line 3546-3585 groups all IDEA_ITEMS by tier — no source-based grouping exists.

- Q: How should dispatch item priority be classified?
  - A: Use the dispatch packet's own `priority` field (already P0-P5 from the ideas classifier). Run `classifyIdeaItem()` as fallback only when priority is missing.
  - Evidence: Dispatch packets have `priority` field populated by `lp-do-ideas-classifier.ts` during orchestration.

- Q: How should dispatch items be deduplicated and removed when completed?
  - A: Dispatch items have a **dual exclusion** mechanism that is different from results-review items:
    1. **Primary exclusion (queue_state filter):** The collection loop only includes items where `queue_state === "enqueued"`. When a dispatch transitions to "processed" or "completed", it vanishes from the dashboard automatically on next regeneration. This is the natural lifecycle — no completed-ideas registry interaction needed.
    2. **Secondary exclusion (completed-ideas registry):** For cross-source deduplication (e.g., an idea appears in both a results-review file and as a dispatch), use `deriveIdeaKey(QUEUE_STATE_PATH, dispatch.area_anchor)` as the `idea_key`. This is compatible with `completedKeys.has()` for filtering. Note: `area_anchor` can repeat across dispatches (e.g., 18 instances of "bos-agent-session-findings"), but these represent distinct events at different dates — the dedup key collision is acceptable here because `queue_state` is the primary filter, not `idea_key`.
    3. **`appendCompletedIdea()` is not needed** for dispatch items — they exit the dashboard via queue_state transitions, not via the completed-ideas registry.
  - Evidence: `appendCompletedIdea()` at line 477-506 derives key from `source_path + title` (SHA1). Dispatch items don't need this path because their lifecycle is managed by queue_state transitions in queue-state.json.

- Q: What happens when a dispatch moves from "enqueued" to "processed"?
  - A: It disappears from the dashboard on next regeneration since the collection loop only includes `queue_state === "enqueued"` items. The pi-transitions system (localStorage-based) will show it in the "recently removed" ghost section for 6 seconds.
  - Evidence: HTML lines 3687-3704 track idea_keys in localStorage and detect removals.

- Q: Does the auto-refresh already work?
  - A: Yes. `<meta http-equiv="refresh" content="30">` reloads the page every 30 seconds. When the generator updates the HTML file, the next reload picks up new data. The pi-transitions system detects new/removed items via localStorage comparison.
  - Evidence: HTML line 6.

### Open (Operator Input Required)

None.

## Confidence Inputs

- Implementation: 92% — straightforward extension of existing collection pattern; no new abstractions needed.
- Approach: 90% — merging dispatch items as regular ideas is the simplest path; alternatives (new section, separate array) add complexity for no operator benefit.
- Impact: 88% — operator gains visibility into 55+ enqueued loop ideas currently invisible on the dashboard.
- Testability: 86% — existing unit tests at `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts`; validation also via `--check` drift detection mode.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Large number of dispatch items (55+) clutters the dashboard | Medium | Low | Items sort by priority tier; low-priority items collapse to backlog section. Operator can filter by tier. |
| Dispatch titles (area_anchor) are verbose compared to results-review ideas | Low | Low | area_anchor is already concise by convention; body field carries detail. |

## Suggested Task Seeds (Non-binding)

- TASK-01: Add dispatch queue collection to `collectProcessImprovements()` — read queue-state.json, filter for enqueued, map to ProcessImprovementItem, classify, merge into ideaItems.
- TASK-02: Update git hook trigger pattern to include `queue-state.json`.
- TASK-03: Verify end-to-end with `--check` mode and manual HTML inspection.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: `runCheck()` passes, dispatch items visible on dashboard, git hook triggers on queue-state changes
- Post-delivery measurement plan: Count of dispatch items visible on dashboard matches `queue_state === "enqueued"` count in queue-state.json

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Generator collection loop | Yes | None | No |
| Dispatch → ProcessImprovementItem mapping | Yes | None | No |
| Priority classifier integration | Yes | None | No |
| Deduplication against completed-ideas | Yes | None | No |
| HTML rendering compatibility | Yes | None | No |
| Git hook trigger expansion | Yes | None | No |
| runCheck() drift detection | Yes | None | No |
| Auto-refresh behavior | Yes | None | No |

## Scope Signal

- Signal: right-sized
- Rationale: The change is a single collection loop addition (~30 lines) plus a git hook pattern update. All integration points are well-understood. No new types, no HTML changes, no schema changes.

## Evidence Gap Review

### Gaps Addressed

- Verified dispatch packet schema and field availability for mapping.
- Confirmed HTML rendering handles items generically by type/priority.
- Confirmed auto-refresh already works via meta-refresh.
- Verified git hook pattern is the only trigger mechanism.

### Confidence Adjustments

None — all initial assumptions confirmed.

### Remaining Assumptions

- Dispatch `area_anchor` is suitable as an idea title (max ~100 chars). Verified by inspection of 3+ queue items.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan`
