---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: BOS
Workstream: Engineering
Created: 2026-03-04
Last-updated: 2026-03-04
Feature-Slug: ideas-keyword-calibration-feedback-loop
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/ideas-keyword-calibration-feedback-loop/plan.md
Dispatch-ID: IDEA-DISPATCH-20260304103029-0001
Trigger-Why:
Trigger-Intended-Outcome:
---

# Ideas Keyword Calibration Feedback Loop Fact-Find Brief

## Scope

### Summary

The T1 semantic keyword list (`T1_SEMANTIC_KEYWORDS`, 38 terms) in `lp-do-ideas-trial.ts` is a static array that drives the primary routing decision for artifact-delta dispatches: keyword match routes to `fact_find_ready`, no match routes to `briefing_ready`. There is no feedback mechanism from dispatch outcomes (confirmed, skipped, completed) back to keyword effectiveness. When new business domains are added, the keyword list doesn't grow automatically.

A periodic calibration process is needed that analyzes which dispatches were confirmed vs skipped by the operator, adjusts keyword weights accordingly, and writes updated priors to a configuration file consumed by the routing logic.

### Goals

- Build a deterministic calibration script that reads dispatch outcomes from `queue-state.json` and computes keyword effectiveness priors
- Apply computed priors to the routing decision in `lp-do-ideas-trial.ts` so that keyword weights evolve with operator feedback
- Follow the proven calibration pattern from `draft_ranker_calibrate` (minimum data gate, atomic writes, graceful degradation)

### Non-goals

- Replacing the keyword list entirely with ML/embedding-based classification
- Changing the `operator_idea` routing path (which uses agent judgment, not keywords)
- Auto-adding new keywords (calibration adjusts weights of existing keywords + surfaces candidates for manual addition)

### Constraints & Assumptions

- Constraints:
  - Must be deterministic (no LLM calls in the calibration script)
  - Must be fail-open: missing priors file = current behavior unchanged
  - Must not break existing routing for in-flight dispatches
  - Queue-state.json is 500KB+ — calibration must handle large files efficiently
- Assumptions:
  - 109 dispatches with terminal outcomes (108 completed + 1 skipped) provide sufficient positive-signal volume. Extreme class imbalance (only 1 skipped) limits negative-signal correction power — calibration V1 will primarily reinforce effective keywords and demote unused ones, not learn from explicit rejections
  - The `completed` vs `skipped` dispatch outcome is a reliable proxy for routing correctness
  - The `processed_by.route` field records the process mode (`dispatch-routed`, `direct-inject`), not an explicit routing correction. Calibration signal comes from lifecycle outcome (completed = positive, skipped = negative), not from route field values.

## Outcome Contract

- **Why:** Source-trigger classification uses a static keyword list (T1_SEMANTIC_KEYWORDS, 38 terms) that doesn't grow when new business domains are added. Confirmed vs skipped dispatch outcomes in queue-state are not fed back to adjust keyword weights, so routing accuracy degrades over time.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Produce a deterministic calibration script that analyzes confirmed vs skipped dispatches in queue-state.json and adjusts T1 semantic keyword weights accordingly, creating a feedback loop from dispatch outcomes to routing accuracy.
- **Source:** operator

## Access Declarations

None — all data sources are repo-internal (TypeScript source files, JSON queue-state, test files).

## Evidence Audit (Current State)

### Entry Points

- `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts:27-68` — `T1_SEMANTIC_KEYWORDS` definition (38 keywords in 3 categories: GTM/positioning, assessment-container, codebase/quality)
- `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts:603-608` — `matchesT1()` function (binary substring containment, case-insensitive)
- `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts:929-933` — routing decision point (keyword match → `fact_find_ready` at 0.75 confidence; no match → `briefing_ready` at 0.5)

### Key Modules / Files

1. `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts` — T1 keyword list, `matchesT1()`, routing decision, confidence assignment. **The file that needs to consume calibration priors.**
2. `scripts/src/startup-loop/ideas/lp-do-ideas-routing-adapter.ts` — Routes dispatches by `status` field. Does NOT use `confidence` for routing decisions. Validates `status` ↔ `recommended_route` consistency.
3. `scripts/src/startup-loop/ideas/lp-do-ideas-trial-queue.ts` — Queue lifecycle management. Has `QueueEntry` type with `queue_state`, `classification`, `state_reason`. Telemetry JSONL append.
4. `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts` — `markDispatchesCompleted()` records `completed_by` with outcome text.
5. `docs/business-os/startup-loop/ideas/trial/queue-state.json` — Live dispatch queue (202 entries, 108 completed, 17 processed, 51 enqueued).
6. `packages/mcp-server/src/tools/draft-ranker-calibrate.ts` — **Reference pattern**: signal event pairing, delta mapping, mean aggregation + ±30 clamp, minimum 20-event gate, atomic write.
7. `packages/mcp-server/src/utils/signal-events.ts` — Signal event I/O, archival, timestamp windowing. Reference for event stream patterns.
8. `scripts/src/startup-loop/__tests__/lp-do-ideas-trial.test.ts:119-141` — Existing keyword tests (membership checks, negative match, case-insensitive routing integration tests).

### Patterns & Conventions Observed

- **Calibration loop pattern** (from draft-ranker): Input events → join by ID → map reason to delta → group by (category, key) → mean + clamp → atomic write to priors JSON. Evidence: `packages/mcp-server/src/tools/draft-ranker-calibrate.ts`
- **Minimum data gate**: `MIN_EVENTS_GATE = 20` — refuse to write priors with insufficient signal. Evidence: `packages/mcp-server/src/tools/draft-ranker-calibrate.ts:44`
- **Graceful degradation**: Missing priors file → `null` → ranking continues with base scores. Evidence: `packages/mcp-server/src/utils/template-ranker.ts:376-391`
- **Hard-rule protection**: Certain categories skip calibration entirely (regulatory/contractual). Evidence: `PROTECTED_CATEGORIES` in draft-ranker-calibrate.ts
- **Advisory/fail-open integration**: Startup-loop bridge scripts use `{ ok: false }` return when preconditions missing, never block callers. Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-from-build-failure.ts`

### Data & Contracts

- Types/schemas:
  - `T1_SEMANTIC_KEYWORDS: readonly string[]` — current type (no weight dimension)
  - `QueueEntry` interface in `lp-do-ideas-trial-queue.ts` — `queue_state`, `lane`, `classification`, `packet`
  - `TrialDispatchPacketV2` — `status`, `recommended_route`, `confidence`, `area_anchor`, `evidence_refs`
  - Dispatch schema: `docs/business-os/startup-loop/ideas/schemas/lp-do-ideas-dispatch.v2.schema.json`
- Persistence:
  - Queue state: `docs/business-os/startup-loop/ideas/trial/queue-state.json` (hand-authored format with `dispatches[]` array)
  - Telemetry: `docs/business-os/startup-loop/ideas/trial/telemetry.jsonl` (append-only)
  - **New priors file needed**: e.g. `docs/business-os/startup-loop/ideas/trial/keyword-calibration-priors.json`
- API/contracts:
  - `matchesT1(changedSections: string[]): boolean` — current binary return; needs to become weighted
  - `routeDispatch(packet): RouteResult` and `routeDispatchV2(packet): RouteResult` — reads `status` not `confidence`

### Dependency & Impact Map

- Upstream dependencies:
  - `queue-state.json` dispatch entries with `completed_by` / `processed_by` fields (outcome signal)
  - `T1_SEMANTIC_KEYWORDS` array (keywords to calibrate)
  - Dispatch `area_anchor` and `evidence_refs` fields (for keyword extraction from dispatches)
- Downstream dependents:
  - `matchesT1()` — must consume priors to produce weighted scores instead of binary match
  - Dispatch confidence field (currently hardcoded 0.75/0.5) — should reflect calibrated weight
  - Routing decision (lines 929-933) — may need threshold-based decision instead of boolean
- Likely blast radius:
  - `lp-do-ideas-trial.ts` — keyword matching and routing logic (primary change)
  - `lp-do-ideas-trial.test.ts` — existing keyword tests need updating for weighted behavior
  - New script file + new test file for the calibration process
  - New priors JSON file (gittracked, deterministic)

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (via governed runner)
- Commands: CI-only per `docs/testing-policy.md` — push and use `gh run watch` to monitor
- CI integration: `.github/workflows/test.yml` — scripts package tests run via governed runner; other test paths (Cypress, app-level Jest) run separately

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| T1 keywords membership | Unit | `lp-do-ideas-trial.test.ts:119-141` | 4 membership checks, 1 negative match |
| T1 routing integration | Unit | `lp-do-ideas-trial.test.ts:206-565` | TC-01 (T1 match → fact_find_ready), TC-04 (no match → briefing_ready), case-insensitive |
| Queue lifecycle | Unit | `lp-do-ideas-trial-queue` tests | State transitions, dedup, telemetry |
| Routing adapter | Unit | `lp-do-ideas-routing-adapter` tests | Status→route mapping, validation |
| Draft ranker calibration | Unit | `draft-ranker-calibrate.test.ts` | Min gate, delta computation, clamping, reordering |

#### Coverage Gaps

- No tests for keyword weight/scoring (doesn't exist yet)
- No tests for calibration feedback from dispatch outcomes
- No tests for priors file loading/fallback in the ideas pipeline

#### Testability Assessment

- Easy to test:
  - Delta computation from dispatch outcomes (pure function)
  - Priors file read/write (filesystem mocking via tmpdir, same as self-evolving tests)
  - Weighted `matchesT1()` with various priors configurations
- Hard to test:
  - Real dispatch outcome quality (requires retrospective analysis of 108 completed dispatches)
- Test seams needed:
  - Priors file path injectable (for test isolation)
  - Clock injectable for calibrated_at timestamps

#### Recommended Test Approach

- Unit tests for: calibration delta computation, mean + clamp aggregation, minimum data gate, priors file I/O, weighted keyword scoring
- Integration tests for: end-to-end calibration from queue-state → priors → routing change
- Contract tests for: priors JSON schema validation

### Recent Git History (Targeted)

- `lp-do-ideas-trial.ts` — `self-evolving-from-build-failure` added to `SELF_TRIGGER_PROCESSES` (recent commit `13a8f30f39`). Keywords unchanged for multiple weeks.
- `queue-state.json` — actively mutated by dispatches; most recent update `2026-03-04T10:30:29.000Z`

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The deliverable is a single calibration script + a priors consumption change in `matchesT1()`. The reference pattern (`draft_ranker_calibrate`) is well-documented with transferable architecture. 109 dispatches with terminal outcomes provide sufficient calibration signal. No external dependencies. The scope matches a standard S-to-M effort code task.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| T1 keyword list and matchesT1() | Yes | None | No |
| Routing decision point (lines 929-933) | Yes | None | No |
| Queue-state dispatch outcome data | Yes | None | No |
| Draft ranker calibration reference pattern | Yes | None | No |
| Routing adapter (confidence consumption) | Yes | [Moderate]: Routing adapter ignores `confidence` field — weighted scoring only affects dispatch confidence metadata, not routing status | No |
| Priors file I/O and graceful degradation | Yes | None | No |
| Test landscape for keyword matching | Yes | None | No |

## Questions

### Resolved

- Q: Should calibration change the routing status (fact_find_ready/briefing_ready) or only the confidence score?
  - A: Change both. Calibration should adjust keyword weights so that `matchesT1()` returns a numeric score. When the score crosses a configurable threshold (e.g., 0.6), status becomes `fact_find_ready`; below threshold, `briefing_ready`. This makes routing accuracy improve over time. The routing adapter reads `status` not `confidence`, so the status assignment must change — confidence alone is metadata.
  - Evidence: `lp-do-ideas-routing-adapter.ts` lines 303-378 — routes by `status`, ignores `confidence`

- Q: What calibration signal is available — just completed/skipped, or richer outcome data?
  - A: Two reliable signal types: (1) `queue_state` lifecycle (completed vs skipped vs error) — the primary signal, (2) `completed_by.outcome` (free-text, useful for post-hoc analysis but too unstructured for deterministic calibration). The `processed_by.route` field records process mode (`dispatch-routed`, `direct-inject`, `auto-executed`), not an explicit routing correction, so it cannot distinguish whether the recommended route was correct. For V1, use lifecycle state as primary signal: completed = positive, skipped = negative.
  - Evidence: queue-state.json header shows 108 completed, 1 skipped — 109 terminal-state dispatches available

- Q: Should there be protected keywords that never get calibrated (like prepayment/cancellation in draft ranker)?
  - A: Not initially. Unlike email templates where regulatory categories must never be deprioritized, all idea routing keywords serve advisory purposes. No keyword drives a compliance-critical path. Add protection later if a keyword category is identified as safety-critical.
  - Evidence: All 38 keywords are GTM, assessment, or code-quality signals — none are regulatory

- Q: How should new keyword candidates be surfaced?
  - A: The calibration script should log keywords that appear frequently in completed dispatch `area_anchor` / `evidence_refs` but don't match any existing T1 keyword. These become "candidate additions" in the calibration output — surfaced for operator review, not auto-added. This is a secondary output, not a blocker for V1.

### Open (Operator Input Required)

None — all design decisions are resolvable from available evidence and the reference pattern.

## Confidence Inputs

- Implementation: 85% — clear reference pattern (draft_ranker_calibrate), well-typed codebase, all source files identified. Raises to >=90: verify that weighted `matchesT1()` doesn't break any downstream consumer.
- Approach: 90% — the calibration loop pattern is proven in the email pipeline and transfers directly. The main design question (binary→weighted matching) has a clean solution path.
- Impact: 75% — routing accuracy improvement depends on quality of dispatch outcome signal. 108 completed dispatches may show imbalanced keyword coverage. Raises to >=80: run a dry-run calibration against historical data to verify delta distribution.
- Delivery-Readiness: 85% — all dependencies identified, test seams clear, no external services needed. Raises to >=90: confirm the priors file path convention with the broader ideas pipeline.
- Testability: 90% — pure functions, filesystem I/O via tmpdir isolation, clear expected outputs. The draft-ranker test suite provides a complete test pattern template.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Insufficient outcome signal from 108 completed dispatches (sparse keyword coverage) | Medium | Medium | Minimum data gate (20+ events per keyword group); keywords below gate keep base score |
| Calibration oscillation — keyword weights flip-flop between runs | Low | Medium | Mean aggregation + ±30 clamp dampens oscillation. Idempotency: priors file includes `calibrated_at` and `dispatch_ids_included` hash — re-running against unchanged queue-state produces identical output (no dedup needed beyond snapshot identity) |
| Breaking existing routing for enqueued dispatches | Low | High | Fail-open: missing priors = current behavior. Priors only read at dispatch creation time, not retroactively applied |
| Class imbalance (108 completed vs 1 skipped) limits negative-signal calibration | High | Medium | V1 uses absence-of-completion as secondary negative signal: keywords that appear in area_anchor of enqueued-but-not-completed dispatches get neutral/negative delta. Explicit skip signal will strengthen as queue matures |
| Queue-state.json format divergence causes parse errors | Low | Low | Use the existing format reader (dispatches[] array) consistent with how the viewer and completion hook already parse it |

## Planning Constraints & Notes

- Must-follow patterns:
  - Follow `draft_ranker_calibrate` architecture: min gate → delta computation → mean + clamp → atomic write
  - Place new script in `scripts/src/startup-loop/ideas/` alongside existing ideas pipeline files
  - Register in `scripts/package.json` as `startup-loop:ideas-keyword-calibrate`
  - Register in `SELF_TRIGGER_PROCESSES` for anti-loop defense
- Rollout/rollback expectations:
  - Rollback: delete priors file → instant revert to current static keyword behavior
  - Rollout: run calibration script manually first (dry-run), review deltas, then enable priors consumption
- Observability expectations:
  - Calibration output should log: keywords calibrated, delta per keyword, keywords below minimum gate, candidate new keywords
  - Priors file should include `calibrated_at` timestamp and `event_count` for audit trail

## Suggested Task Seeds (Non-binding)

1. **IMPLEMENT: Calibration script** — Read queue-state.json dispatches, compute keyword effectiveness deltas from completed/skipped outcomes, write `keyword-calibration-priors.json` with min gate + atomic write
2. **IMPLEMENT: Weighted matchesT1()** — Convert `matchesT1()` from binary boolean to numeric score using priors; adjust routing decision to use threshold
3. **IMPLEMENT: Tests** — Unit tests for calibration computation, priors I/O, weighted matching, minimum gate, end-to-end routing change

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - Calibration script produces valid priors JSON from test fixtures
  - Weighted `matchesT1()` returns scores that change routing status based on priors
  - All existing keyword routing tests updated and passing
  - New calibration tests passing
  - Anti-loop registration present
- Post-delivery measurement plan:
  - Run calibration against live queue-state.json and verify delta distribution
  - Track routing accuracy before/after over subsequent dispatch cycles

## Evidence Gap Review

### Gaps Addressed

- Identified all keyword consumers (matchesT1, routing decision, confidence assignment)
- Confirmed routing adapter does NOT use confidence — status change is required for calibration to affect routing
- Verified reference calibration pattern (draft_ranker_calibrate) is directly transferable
- Confirmed sufficient historical dispatch data (109 terminal-state: 108 completed + 1 skipped) for initial calibration
- Identified priors file placement convention aligned with existing ideas pipeline data paths

### Confidence Adjustments

- Impact reduced from 80→75% due to uncertainty about keyword coverage distribution across 109 terminal dispatches (some keywords may have zero completed dispatches, making calibration impossible for those)
- Testability remains at 90% — pure functions with clear reference test patterns

### Remaining Assumptions

- Dispatch `completed` status is a reliable positive signal for routing correctness (assumption: if a dispatch was completed, its routing was at least not harmful)
- The 38 existing keywords have sufficient coverage across the 109 terminal-state dispatches to compute meaningful deltas for most keywords

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan ideas-keyword-calibration-feedback-loop --auto`
