---
Type: Plan
Status: Archived
Domain: BOS
Workstream: Engineering
Created: 2026-03-04
Last-reviewed: 2026-03-04
Last-updated: 2026-03-04T11:07
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: ideas-keyword-calibration-feedback-loop
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Ideas Keyword Calibration Feedback Loop Plan

## Summary

The T1 semantic keyword system in `lp-do-ideas-trial.ts` routes artifact-delta dispatches using a static 38-keyword list with binary matching: match → `fact_find_ready`, no match → `briefing_ready`. This plan adds a calibration feedback loop: a deterministic script reads dispatch outcomes from `queue-state.json`, computes per-keyword effectiveness deltas (following the proven `draft_ranker_calibrate` pattern), and writes priors to a JSON file. The routing logic then consumes these priors to produce weighted scores instead of binary boolean results, making routing accuracy improve over time with operator feedback.

## Active tasks

- [x] TASK-01: Calibration script — compute keyword priors from dispatch outcomes
- [x] TASK-02: Weighted keyword matching — convert matchesT1() to scored routing
- [x] TASK-03: Tests and registration — unit tests, anti-loop, package.json

## Goals

- Deterministic calibration script that produces keyword effectiveness priors from dispatch outcomes
- Weighted `matchesT1()` that consumes priors to improve routing accuracy over time
- Follow draft_ranker_calibrate reference pattern (min gate, atomic write, graceful degradation)

## Non-goals

- ML/embedding-based keyword classification
- Changing operator_idea routing (agent judgment, not keywords)
- Auto-adding new keywords (candidates surfaced for operator review only)

## Constraints & Assumptions

- Constraints:
  - Deterministic — no LLM calls in calibration script
  - Fail-open — missing priors file = current binary behavior unchanged
  - Must not break in-flight dispatch routing
- Assumptions:
  - Calibration measures keyword effectiveness (do keywords that match lead to completed work?), not routing boundary correctness (was fact-find vs briefing the right choice?). This is valid because all 108 completed dispatches went through fact-find — there is no completed briefing cohort to compare against.
  - Only `trigger: "artifact_delta"` dispatches are calibrated (keyword routing is used for artifact deltas only; operator_idea routing uses agent judgment)
  - Class imbalance (108:1 completed:skipped) limits negative-signal correction — V1 primarily reinforces keywords with observed matches; keywords below MIN_KEYWORDS_GATE (no or few matches) retain base score unchanged (not demoted)

## Inherited Outcome Contract

- **Why:** Source-trigger classification uses a static keyword list (T1_SEMANTIC_KEYWORDS, 38 terms) that doesn't grow when new business domains are added. Confirmed vs skipped dispatch outcomes in queue-state are not fed back to adjust keyword weights, so routing accuracy degrades over time.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Produce a deterministic calibration script that analyzes confirmed vs skipped dispatches in queue-state.json and adjusts T1 semantic keyword weights accordingly, creating a feedback loop from dispatch outcomes to routing accuracy.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/ideas-keyword-calibration-feedback-loop/fact-find.md`
- Key findings used:
  - `matchesT1()` is binary boolean (lines 603-608); routing decision at lines 929-933; confidence hardcoded 0.75/0.5 at line 962
  - Routing adapter reads `status` not `confidence` — so weighted scoring must change the status assignment, not just confidence
  - `draft_ranker_calibrate` pattern is directly transferable: min gate → delta → mean + clamp → atomic write
  - 109 terminal dispatches available; class imbalance acknowledged with mitigation strategy

## Proposed Approach

- Option A: Full weighted scoring — convert keyword list to Map<keyword, weight>, compute aggregate match score, use threshold for routing status
- Option B: Simple boost/demote — keep binary matching but add a second pass that flips status for keywords with strong calibration signal
- Chosen approach: **Option A** — full weighted scoring. It matches the draft_ranker_calibrate pattern more closely, provides a numeric confidence value, and creates a clean extensibility surface for future keyword additions. The added complexity (score computation vs boolean flip) is minimal and justified by better downstream signal.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Calibration script — compute keyword priors from dispatch outcomes | 85% | M | Complete (2026-03-04) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Weighted keyword matching — convert matchesT1() to scored routing | 85% | S | Complete (2026-03-04) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Tests and registration — unit tests, anti-loop, package.json | 85% | M | Complete (2026-03-04) | TASK-01, TASK-02 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Produces priors file format + calibration logic |
| 2 | TASK-02 | TASK-01 | Consumes priors file in matchesT1() |
| 3 | TASK-03 | TASK-01, TASK-02 | Tests both, plus registration |

## Tasks

### TASK-01: Calibration script — compute keyword priors from dispatch outcomes

- **Type:** IMPLEMENT
- **Deliverable:** New file `scripts/src/startup-loop/ideas/lp-do-ideas-keyword-calibrate.ts` + priors output file `docs/business-os/startup-loop/ideas/trial/keyword-calibration-priors.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-04)
- **Affects:** `scripts/src/startup-loop/ideas/lp-do-ideas-keyword-calibrate.ts` (new), `docs/business-os/startup-loop/ideas/trial/keyword-calibration-priors.json` (new), `[readonly] docs/business-os/startup-loop/ideas/trial/queue-state.json`, `[readonly] scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
- **Build evidence:** Codex offload (exit 0), typecheck clean, lint clean, Mode 2 data simulation passed (TC-01 through TC-07 verified). Commit: f8b3be4830
  - Implementation: 85% — clear reference pattern (`draft_ranker_calibrate`), well-defined input/output. All source files identified. Held-back test: no single unknown would drop below 80 because the calibration algorithm is a direct port of the proven draft-ranker pattern with simpler signal structure (lifecycle state vs paired events).
  - Approach: 90% — algorithm design resolved: read `artifact_delta` dispatches only → match dispatch `area_anchor` text against T1 keywords (same substring containment as runtime `matchesT1` uses on `changed_sections`) → map lifecycle outcome to delta → group by keyword → mean + clamp ±30 → atomic write
  - Impact: 85% — produces the priors file that TASK-02 consumes; no other consumers yet. Dead-end risk mitigated by TASK-02 being a direct dependent.
- **Acceptance:**
  - [ ] Script reads `queue-state.json` and filters to `trigger: "artifact_delta"` dispatches only (operator_idea dispatches excluded — keyword routing doesn't apply to them)
  - [ ] Extracts keyword signals by matching dispatch `area_anchor` text against T1 keywords using same substring containment as runtime `matchesT1` uses on `changed_sections`
  - [ ] Computes per-keyword delta using lifecycle outcome mapping: completed → +4, skipped → -8
  - [ ] Applies minimum data gate (MIN_KEYWORDS_GATE = 5 dispatches per keyword group)
  - [ ] Groups by keyword, computes mean, clamps to ±30
  - [ ] Writes `keyword-calibration-priors.json` atomically (tmp → rename)
  - [ ] Priors file includes `calibrated_at`, `event_count`, `keywords_calibrated`, `keywords_below_gate`
  - [ ] Surfaces candidate new keywords (frequent area_anchor terms not in T1 list)
  - [ ] Dry-run mode (`--dry-run`) outputs deltas without writing priors file
  - [ ] CLI entrypoint with `--queue-state-path` and `--priors-path` args
- **Validation contract (TC-XX):**
  - TC-01: 10 completed dispatches matching keyword "pricing" → delta for "pricing" = +4, included in priors
  - TC-02: 2 dispatches matching "pricing" (below MIN_KEYWORDS_GATE=5) → "pricing" excluded from priors, listed in `keywords_below_gate`
  - TC-03: 5 completed + 3 skipped matching "icp" → mean delta = (5×4 + 3×(-8))/8 = -0.5 → rounded to 0
  - TC-04: Empty queue-state → returns `{ ok: false, reason: "no_terminal_dispatches" }`
  - TC-05: Dry-run mode → returns priors object but does not write file
  - TC-06: Priors file written atomically — tmp file created, then renamed
  - TC-07: Candidate keywords surfaced — area_anchor terms appearing in ≥3 completed dispatches but not in T1 list
- **Execution plan:** Red → Green → Refactor
  - Red: Write test fixtures with known dispatch outcomes; verify calibration produces expected deltas
  - Green: Implement `calibrateKeywords()` reading queue-state, extracting keyword signals, computing deltas
  - Refactor: Extract types, add JSDoc, ensure clean module boundary
- **Planning validation (required for M/L):**
  - Checks run: Read `draft_ranker_calibrate.ts` for transferable pattern; verified queue-state dispatch structure includes `area_anchor`, `evidence_refs`, `status`, `queue_state`
  - Validation artifacts: queue-state.json header (109 terminal dispatches), draft-ranker-calibrate.ts (reference implementation)
  - Unexpected findings: `processed_by.route` field records process mode not routing correction — calibration uses lifecycle state only
  - Feature proxy validation: Runtime `matchesT1()` matches keywords against `changed_sections` (ephemeral, not stored in queue-state). Calibration matches against `area_anchor` (stored). Both contain the same semantic domain terms (e.g., "ICP", "pricing", "brand identity") because `area_anchor` is derived from the same change context. This proxy is adequate for keyword-level effectiveness measurement — individual section-level precision is not required for aggregate calibration priors.
- **Consumer tracing:**
  - New: `KeywordCalibrationPriors` type — consumed by TASK-02 (`loadKeywordPriors()`)
  - New: `keyword-calibration-priors.json` file — consumed by TASK-02 (`loadKeywordPriors()`)
  - New: `calibrateKeywords()` function — consumed by CLI entrypoint in same file
  - Consumer `matchesT1()` in TASK-02 is unchanged by this task — it reads priors via a new loader in TASK-02
- **Scouts:** None: reference pattern well-established; signal structure verified in fact-find
- **Edge Cases & Hardening:**
  - Queue-state with only `operator_idea` dispatches (no `artifact_delta`) → returns `{ ok: true, keywords_calibrated: 0 }` (no artifact_delta dispatches to calibrate)
  - Keywords with zero dispatch matches → excluded from priors (below MIN_KEYWORDS_GATE), retain base score
  - Malformed queue-state JSON → fail gracefully with `{ ok: false, reason: "parse_error" }`
- **What would make this >=90%:**
  - Run dry-run calibration against live queue-state to verify delta distribution before writing priors
- **Rollout / rollback:**
  - Rollout: Run `--dry-run` first to verify deltas, then run without flag to write priors
  - Rollback: Delete `keyword-calibration-priors.json` → instant revert to binary matching
- **Documentation impact:**
  - Add `startup-loop:ideas-keyword-calibrate` to `scripts/package.json` (TASK-03)
- **Notes / references:**
  - Reference: `packages/mcp-server/src/tools/draft-ranker-calibrate.ts`
  - Delta mapping: completed → +4, skipped → -8 (mirrors draft-ranker none/wrong-template; stale-enqueued excluded to avoid conflating queue throughput with routing quality)

### TASK-02: Weighted keyword matching — convert matchesT1() to scored routing

- **Type:** IMPLEMENT
- **Deliverable:** Modified `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts` — weighted `scoreT1Match()` replacing binary `matchesT1()`, priors-aware routing
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-04)
- **Affects:** `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`, `[readonly] docs/business-os/startup-loop/ideas/trial/keyword-calibration-priors.json`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 85% — clear modification scope (3 code points: matchesT1 function, routing decision, confidence assignment). Held-back test: no single unknown would drop below 80 because the function signature change is internal (no external callers beyond tests, which are updated in TASK-03).
  - Approach: 90% — weighted scoring with configurable threshold is a well-known pattern; the draft-ranker applies priors multiplicatively, we apply additively (simpler)
  - Impact: 85% — changes routing behavior for artifact-delta dispatches. Fail-open: missing priors = current behavior preserved.
- **Build evidence:** Inline execution, typecheck clean, lint clean, Mode 2 data simulation passed (TC-01 through TC-06 all verified). Commit: 39d5925997
- **Acceptance:**
  - [ ] `matchesT1()` replaced with `scoreT1Match(changedSections: string[]): number` — returns numeric 0-1 score
  - [ ] Score computation: base score (substring match = 0.75, no match = 0.0) + calibration delta from priors (delta/100 additive, clamped to 0.0-1.0). Base 0.75 (not 1.0) ensures negative priors can actually flip routing: e.g., delta -30 → 0.75 - 0.3 = 0.45 → below threshold → `briefing_ready`
  - [ ] `loadKeywordPriors()` reads priors JSON with graceful fallback (missing file → null → base scores)
  - [ ] Routing threshold: `T1_ROUTING_THRESHOLD = 0.6` — score >= threshold → `fact_find_ready`, below → `briefing_ready`
  - [ ] Dispatch confidence field set to computed score (replaces hardcoded 0.75/0.5)
  - [ ] Priors cache with invalidation (module-level, same pattern as draft-ranker)
- **Validation contract (TC-XX):**
  - TC-01: No priors file → `scoreT1Match(["ICP Definition"])` returns 0.75 (base match, no adjustment) → `fact_find_ready`
  - TC-02: No priors file → `scoreT1Match(["Historical Data"])` returns 0.0 (no match) → `briefing_ready`
  - TC-03: Priors with "pricing" delta +20 → `scoreT1Match(["Pricing Strategy"])` returns 0.95 (0.75 + 0.2) → `fact_find_ready`
  - TC-04: Priors with "pricing" delta -30 → `scoreT1Match(["Pricing Strategy"])` returns 0.45 (0.75 - 0.3) → `briefing_ready` (below 0.6 threshold — routing actually changes)
  - TC-05: Priors with keyword delta -100 (extreme) → clamped to 0.0 → `briefing_ready`
  - TC-06: Multiple keyword matches → highest-scoring keyword determines result
- **Execution plan:** Red → Green → Refactor
  - Red: Existing tests will break when `matchesT1` is renamed/refactored (expected — TASK-03 fixes)
  - Green: Implement `scoreT1Match()`, `loadKeywordPriors()`, threshold-based routing
  - Refactor: Clean up hardcoded 0.75/0.5 confidence values
- **Planning validation (required for M/L):** None: S-effort task
- **Consumer tracing:**
  - Modified: `matchesT1(changedSections: string[]): boolean` → `scoreT1Match(changedSections: string[]): number` — consumers:
    - Routing decision at line 929-933 (same task updates — threshold comparison replaces boolean)
    - Confidence assignment at line 962 (same task updates — uses computed score)
    - Tests in `lp-do-ideas-trial.test.ts` (TASK-03 updates)
  - New: `loadKeywordPriors(): KeywordCalibrationPriors | null` — consumed by `scoreT1Match()` only
  - New: `T1_ROUTING_THRESHOLD = 0.6` constant — consumed by routing decision only
  - Consumer `T1_SEMANTIC_KEYWORDS` export is unchanged — still used by `lp-do-ideas-trial.ts` (matchesT1/scoreT1Match) and its test file (`lp-do-ideas-trial.test.ts`)
- **Scouts:** None: modification scope is small and well-bounded
- **Edge Cases & Hardening:**
  - Priors file corrupt/invalid JSON → `loadKeywordPriors()` returns null → base scores used
  - Priors contain keywords not in T1 list → ignored (only T1 keywords are scored)
  - Score exactly at threshold (0.6) → routes to `fact_find_ready` (>= comparison, consistent with current inclusive behavior)
- **What would make this >=90%:**
  - Verify all callers of `matchesT1` in test files and production code are accounted for
- **Rollout / rollback:**
  - Rollout: Automatic — when priors file exists, scoring is weighted; when absent, falls back to binary
  - Rollback: Delete priors file → binary behavior restored instantly
- **Documentation impact:** None: internal function, not user-facing
- **Notes / references:**
  - Current code: `lp-do-ideas-trial.ts:603-608` (matchesT1), `929-933` (routing), `962` (confidence)

### TASK-03: Tests and registration — unit tests, anti-loop, package.json

- **Type:** IMPLEMENT
- **Deliverable:** New test file `scripts/src/startup-loop/__tests__/lp-do-ideas-keyword-calibrate.test.ts`, updated `scripts/package.json`, updated `lp-do-ideas-trial.ts` (SELF_TRIGGER_PROCESSES)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-04)
- **Affects:** `scripts/src/startup-loop/__tests__/lp-do-ideas-keyword-calibrate.test.ts` (new), `scripts/src/startup-loop/__tests__/lp-do-ideas-trial.test.ts`, `scripts/package.json`, `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 85%
- **Build evidence:** Inline execution, typecheck clean, lint clean, SELF_TRIGGER_PROCESSES updated, package.json script added, 15 test cases covering all TC contracts. Commit: be008f7a37
  - Implementation: 85% — test patterns well-established from draft-ranker and self-evolving tests. Held-back test: no single unknown would drop below 80 because test seams (tmpdir isolation, injectable paths) are defined by TASK-01.
  - Approach: 90% — follows existing test patterns (tmpdir fixtures, jest describe blocks, TC contract mapping)
  - Impact: 85% — validates correctness of TASK-01 and TASK-02; catches regressions
- **Acceptance:**
  - [ ] New test file covers all TASK-01 TC contracts (TC-01 through TC-07)
  - [ ] Existing `lp-do-ideas-trial.test.ts` keyword tests updated for `scoreT1Match()` return type (number vs boolean)
  - [ ] TASK-02 TC contracts (TC-01 through TC-06) covered in existing or new test file
  - [ ] `"ideas-keyword-calibrate"` added to `SELF_TRIGGER_PROCESSES` set
  - [ ] `"startup-loop:ideas-keyword-calibrate"` added to `scripts/package.json` scripts
  - [ ] All tests pass in CI
- **Validation contract (TC-XX):**
  - TC-01: TASK-01 TC-01 through TC-07 all have corresponding test cases
  - TC-02: TASK-02 TC-01 through TC-06 all have corresponding test cases
  - TC-03: `SELF_TRIGGER_PROCESSES` contains `"ideas-keyword-calibrate"`
  - TC-04: `scripts/package.json` contains `"startup-loop:ideas-keyword-calibrate"` script entry
  - TC-05: Existing keyword membership tests (`T1_SEMANTIC_KEYWORDS.toContain(...)`) still pass unchanged
- **Execution plan:** Red → Green → Refactor
  - Red: Write test cases matching TC contracts; they will fail until implementations from TASK-01/02 are available
  - Green: Verify all tests pass against implemented code
  - Refactor: Organize tests into logical describe blocks
- **Planning validation (required for M/L):**
  - Checks run: Verified test file patterns in `self-evolving-from-build-failure.test.ts` (tmpdir isolation), `lp-do-ideas-trial.test.ts` (keyword tests at lines 119-141)
  - Validation artifacts: existing test patterns confirmed
  - Unexpected findings: None
- **Scouts:** None: test patterns well-established
- **Edge Cases & Hardening:** None: test code, not production code
- **What would make this >=90%:**
  - Run tests against live queue-state fixture (sanitized) to verify real-world delta computation
- **Rollout / rollback:**
  - Rollout: Tests added in CI pipeline automatically
  - Rollback: N/A — tests only
- **Documentation impact:** None
- **Notes / references:**
  - Test pattern reference: `scripts/src/startup-loop/__tests__/self-evolving-from-build-failure.test.ts`
  - Existing keyword tests: `scripts/src/startup-loop/__tests__/lp-do-ideas-trial.test.ts:119-141`

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Class imbalance (108 completed vs 1 skipped) limits negative-signal correction | High | Medium | V1 measures keyword effectiveness (does keyword match → completed work?) not routing boundary correctness; explicit skip signal strengthens as queue matures |
| All completed dispatches went through fact-find — no briefing cohort for boundary calibration | High | Low | By design: V1 calibrates keyword effectiveness, not fact-find vs briefing boundary; future V2 can add boundary calibration when briefing completions exist |
| Keyword coverage sparse — some keywords have zero dispatch matches | Medium | Low | MIN_KEYWORDS_GATE (5) excludes under-sampled keywords; they keep base score |
| matchesT1 rename breaks downstream consumers | Low | Medium | Consumer tracing complete: only tests + routing decision (both updated in-plan); T1_SEMANTIC_KEYWORDS export unchanged |
| Priors file corruption on write | Low | High | Atomic write (tmp → rename); graceful degradation on read (corrupt → null → base scores) |

## Observability

- Logging: Calibration script outputs keyword delta summary, keywords below gate, candidate new keywords
- Metrics: Priors file contains `calibrated_at`, `event_count`, `keywords_calibrated`, `keywords_below_gate` for audit
- Alerts/Dashboards: None: advisory/fail-open system; operator reviews priors manually

## Acceptance Criteria (overall)

- [ ] Calibration script produces valid priors JSON from queue-state dispatch outcomes
- [ ] Weighted `scoreT1Match()` returns numeric scores that change routing status based on priors
- [ ] Missing priors file → identical behavior to current binary matching (fail-open)
- [ ] All existing keyword routing tests updated and passing
- [ ] New calibration tests passing with TC contract coverage
- [ ] Anti-loop registration in SELF_TRIGGER_PROCESSES
- [ ] Package.json script entry for `startup-loop:ideas-keyword-calibrate`

## Decision Log

- 2026-03-04: Chose Option A (full weighted scoring) over Option B (boost/demote). Justification: better matches draft-ranker reference pattern, provides continuous confidence signal, cleaner extensibility for future keyword additions.
- 2026-03-04: Decided against protected keywords (no regulatory categories in idea routing). Can be added later if needed.
- 2026-03-04: Primary calibration signal is lifecycle state (completed/skipped), not processed_by.route (which records process mode, not routing correction).
- 2026-03-04: Calibration scope narrowed to `artifact_delta` dispatches only — operator_idea dispatches use agent judgment, not keyword matching. Prevents signal contamination.
- 2026-03-04: Removed stale-enqueued as negative signal — queue backlog reflects throughput constraints, not routing quality. Only terminal states (completed/skipped) are calibration inputs.
- 2026-03-04: Calibration measures keyword effectiveness (keyword presence → completed work), not fact-find vs briefing boundary correctness (no completed briefing cohort exists yet).

## Overall-confidence Calculation

- TASK-01: 85% × M(2) = 170
- TASK-02: 85% × S(1) = 85
- TASK-03: 85% × M(2) = 170
- Overall = (170 + 85 + 170) / (2 + 1 + 2) = 425 / 5 = 85%

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Calibration script | Yes | None — queue-state.json readable, T1_SEMANTIC_KEYWORDS importable, no external dependencies | No |
| TASK-02: Weighted matchesT1() | Yes | None — TASK-01 defines priors file format; matchesT1() at known location; routing decision at known lines | No |
| TASK-03: Tests and registration | Yes | None — TASK-01 and TASK-02 provide implementations to test; SELF_TRIGGER_PROCESSES set at known line; package.json at known path | No |
