---
Type: Plan
Status: Active
Domain: BOS
Workstream: Engineering
Created: 2026-03-04
Last-reviewed: 2026-03-04
Last-updated: 2026-03-04
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: repo-maturity-strictness-hardening
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas
Overall-confidence: 86%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Repo Maturity Strictness Hardening Plan

## Summary
The current deterministic repository maturity scanner over-indexes on tool/config presence and can return Level-5 even when major engineering weaknesses are present. This plan hardens the scoring model with strictness-aware dimensions directly tied to operator priorities: frontier math adoption, OSS acceleration posture, security depth, CI velocity hygiene, folder/file structure hygiene, and indexing quality. The first build cycle implements strictness caps and transparent cap reasons in the snapshot output.

## Active tasks
- [x] TASK-01: Implement strictness-aware maturity scoring and score caps
- [x] TASK-02: Add focused tests + bridge assertions for strictness behavior
- [x] TASK-03: Track strictness regressions in bridge state + trigger logic
- [x] TASK-04: Add dimension-level strictness unit coverage and cap-threshold tests
- [x] TASK-05: Add isolated detector tests for OSS/security/CI/structure-indexing dimension scoring
- [x] TASK-06: Expand maturity scan skip exclusions and expose strictness improvement deltas

## Goals
- Prevent false Level-5 classifications when critical engineering dimensions are weak.
- Keep scoring deterministic, static-repo-only, and machine-extractable.
- Emit explicit cap reasons so downstream systems can explain score outcomes.

## Non-goals
- Refactoring CI workflows in this cycle.
- Implementing all detected security remediations in this cycle.

## Constraints & Assumptions
- Constraints:
  - No runtime telemetry dependencies.
  - Keep scanner fast enough for bridge invocation cadence.
- Assumptions:
  - Latest intake dispatch `IDEA-DISPATCH-20260304101633-0661` is the active anchor for this cycle.

## Inherited Outcome Contract
- **Why:** The current maturity score is too permissive and hides important operational risk.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Replace shallow maturity scoring with strictness-aware deterministic scoring so Level-5 requires demonstrably strong security, CI speed hygiene, structural/indexing quality, and frontier capability adoption.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/repo-maturity-strictness-hardening/fact-find.md`
- Key findings used:
  - Current score returns 98/100 despite known high-priority gaps.
  - Current scoring model is mostly boolean/presence based.

## Proposed Approach
- Option A: Increase weights only in existing six categories.
- Option B: Add strictness dimensions and hard score caps derived from measurable gaps.
- Chosen approach: **Option B**, because weighting alone still allows false high scores when baseline presence checks pass.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add strictness dimensions + cap logic in repo maturity scanner | 86% | M | Complete (2026-03-04) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Add tests and bridge-level assertions for strictness outputs | 84% | M | Complete (2026-03-04) | TASK-01 | - |
| TASK-03 | IMPLEMENT | Persist strictness scores/cap reasons in bridge state and emit on strictness regressions | 87% | M | Complete (2026-03-04) | TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Expand unit tests to dimension-level thresholds, partial caps, and metrics assertions | 86% | M | Complete (2026-03-04) | TASK-03 | - |
| TASK-05 | IMPLEMENT | Add isolated detector scoring tests for OSS/security/CI/structure-indexing paths | 88% | M | Complete (2026-03-04) | TASK-04 | TASK-06 |
| TASK-06 | IMPLEMENT | Broaden non-impacting path skip list and add strictness improvement regression output | 86% | S | Complete (2026-03-04) | TASK-05 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Core scoring and output contract change |
| 2 | TASK-02 | TASK-01 | Validate behavior and bridge compatibility |
| 3 | TASK-03 | TASK-02 | Bridge contract/state hardening + scan short-circuit |
| 4 | TASK-04 | TASK-03 | Dimension-level deterministic test coverage |
| 5 | TASK-05 | TASK-04 | Isolated detector formula verification |
| 6 | TASK-06 | TASK-05 | Skip-path widening + improvement visibility |

## Tasks

### TASK-01: Implement strictness-aware maturity scoring and score caps
- **Type:** IMPLEMENT
- **Deliverable:** Updated deterministic scanner with strictness dimensions and score-cap enforcement in `repo-maturity-signals.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-04)
- **Affects:** `scripts/src/startup-loop/ideas/repo-maturity-signals.ts`, `[readonly] scripts/src/startup-loop/ideas/lp-do-ideas-codebase-signals-bridge.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 86%
  - Implementation: 88% - Existing scanner already centralizes detection and scoring; strictness layer can be added without architecture change.
  - Approach: 86% - Deterministic score-capping with explicit reasons directly addresses false-high-score failure mode.
  - Impact: 90% - Prevents misleading Level-5 output and improves downstream prioritization quality.
- **Acceptance:**
  - Snapshot includes explicit strictness dimension signals and cap reasons.
  - Final score is bounded by strictness caps when priority gaps are detected.
  - Level mapping uses capped score.
  - Existing fields (`category_scores`, `signals`, regression compatibility) remain intact.
- **Validation contract (TC-XX):**
  - TC-01: Repo with broad tool presence but weak strictness dimensions cannot reach Level-5.
  - TC-02: Cap reasons are emitted deterministically for each triggered cap.
  - TC-03: Existing bridge consumption remains compatible (additive output only).
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: static evidence audit completed in fact-find.
  - Validation artifacts: fact-find + current scanner output snapshot.
  - Unexpected findings: none.
- **Scouts:** None: objective and entrypoint are unambiguous.
- **Edge Cases & Hardening:** Ensure caps are deterministic and do not require runtime state.
- **What would make this >=90%:**
  - Test suite coverage for strictness dimensions and cap edge cases across synthetic repos.
- **Rollout / rollback:**
  - Rollout: deploy scanner update via normal scripts package flow.
  - Rollback: revert scanner file and restore prior score behavior.
- **Documentation impact:** Notes emitted in snapshot output.
- **Notes / references:**
  - Dispatch anchors: `IDEA-DISPATCH-20260304092559-0065`, `IDEA-DISPATCH-20260304101633-0661`
- **Build-Evidence (2026-03-04):**
  - Implemented strictness-aware dimensions and deterministic score-capping in `scripts/src/startup-loop/ideas/repo-maturity-signals.ts`.
  - Added additive snapshot fields: `raw_overall_score` and `strictness_assessment` (scores, cap, reasons, metrics).
  - Verified scorer output on repository root: `raw=98`, `capped=72`, `level=Level-3-Reliable`, with explicit cap reasons including security/CI/structure/indexing/root-noise dimensions.
  - Validation: scoped checks passed (`pnpm --filter scripts exec tsc -p tsconfig.json --noEmit` and `pnpm --filter scripts exec eslint src/startup-loop/ideas/repo-maturity-signals.ts`).
  - Full `scripts/validate-changes.sh` run was blocked by unrelated pre-existing lint errors in `@apps/brikette` files outside this task scope.

### TASK-02: Add focused tests + bridge assertions for strictness behavior
- **Type:** IMPLEMENT
- **Deliverable:** New tests covering strictness caps and additive snapshot compatibility
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-04)
- **Affects:** `scripts/src/startup-loop/__tests__/repo-maturity-signals.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-codebase-signals-bridge.test.ts`, `[readonly] scripts/src/startup-loop/ideas/repo-maturity-signals.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 84%
  - Implementation: 85% - Existing test harness patterns already in place.
  - Approach: 84% - Synthetic repo fixtures can validate cap triggers deterministically.
  - Impact: 84% - Prevents regressions back to permissive scoring.
- **Acceptance:**
  - Tests assert strictness caps and emitted cap reason keys.
  - Bridge test coverage confirms additive compatibility and dispatch behavior continuity.
- **Validation contract (TC-XX):**
  - TC-01: strictness cap prevents Level-5 on weak dimensions.
  - TC-02: cap reason key set is stable for deterministic fixtures.
  - TC-03: bridge test still emits repo maturity dispatch when required.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: Added deterministic fixture tests for strictness scoring and bridge outputs.
  - Validation artifacts: `repo-maturity-signals.test.ts`, updated `lp-do-ideas-codebase-signals-bridge.test.ts`.
  - Unexpected findings: none.
- **Scouts:** None: follows existing startup-loop test patterns.
- **Edge Cases & Hardening:** include first-run bootstrap and non-bootstrap regression scenarios.
- **What would make this >=90%:** CI green on changed tests with no flaky behavior.
- **Rollout / rollback:** rollback by removing new tests if needed.
- **Documentation impact:** None.
- **Notes / references:** None.
- **Build-Evidence (2026-03-04):**
  - Added `scripts/src/startup-loop/__tests__/repo-maturity-signals.test.ts` with strictness-cap, truncation-rescan, and regression-delta assertions.
  - Extended `scripts/src/startup-loop/__tests__/lp-do-ideas-codebase-signals-bridge.test.ts` to assert additive maturity fields (`raw_overall_score`, `strictness_assessment`) and capped-score dispatch behavior.
  - Scoped validation passed: `pnpm --filter scripts exec tsc -p tsconfig.json --noEmit` and `pnpm --filter scripts exec eslint src/startup-loop/__tests__/repo-maturity-signals.test.ts src/startup-loop/__tests__/lp-do-ideas-codebase-signals-bridge.test.ts`.

### TASK-03: Track strictness regressions in bridge state + trigger logic
- **Type:** IMPLEMENT
- **Deliverable:** Bridge state v3 with strictness scores/cap reasons/input fingerprint tracking, strictness-aware event emission, and maturity-scan short-circuit when no impacting files changed
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-04)
- **Affects:** `scripts/src/startup-loop/ideas/lp-do-ideas-codebase-signals-bridge.ts`, `scripts/src/startup-loop/ideas/repo-maturity-signals.ts`
- **Depends on:** TASK-02
- **Blocks:** TASK-04
- **Confidence:** 87%
  - Implementation: 88% - Existing bridge already persists state and can absorb additive v3 fields.
  - Approach: 86% - Emitting on new cap reasons and strictness drops closes a real blind spot in current regression detection.
  - Impact: 88% - Makes strictness degradation visible to dispatch pipeline and reduces unnecessary scan cost.
- **Acceptance:**
  - Bridge state persists strictness scores and cap reasons.
  - Repo maturity dispatch can trigger on new cap reasons and strictness-dimension regressions, not only score drops.
  - No-impacting-change bridge runs can skip full repo maturity scan using deterministic input fingerprinting.
- **Validation contract (TC-XX):**
  - TC-01: New cap reason can emit dispatch even when score-drop threshold is effectively disabled.
  - TC-02: Bridge state records strictness scores/cap reasons/fingerprint under schema v3.
  - TC-03: Non-impacting changed files short-circuit maturity scan and preserve artifact timestamp.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: bridge + scanner code lint/typecheck.
  - Validation artifacts: updated bridge tests and state snapshot output.
  - Unexpected findings: none.
- **Scouts:** None.
- **Edge Cases & Hardening:** state migration from v1/v2 to v3 handled with additive defaults.
- **Rollout / rollback:** rollback by reverting bridge state schema and strictness regression conditions.
- **Documentation impact:** Plan/build evidence only.
- **Build-Evidence (2026-03-04):**
  - Added bridge state fields: `repo_maturity_strictness_scores`, `repo_maturity_cap_reasons`, `repo_maturity_inputs_fingerprint`; schema advanced to `codebase-signal-bridge.v3`.
  - Added strictness-aware trigger conditions (new cap reasons / worsening strictness dimensions).
  - Added deterministic skip path for repo maturity scan on non-impacting changed files.
  - Executed `lp-do-ideas` bridge run after changes; result enqueued dispatch `IDEA-DISPATCH-20260304103801-0095`.

### TASK-04: Add dimension-level strictness unit coverage and cap-threshold tests
- **Type:** IMPLEMENT
- **Deliverable:** Expanded deterministic unit coverage for strictness dimension scoring, partial/stacked caps, strictness metrics assertions, and truncation guard behavior
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-04)
- **Affects:** `scripts/src/startup-loop/__tests__/repo-maturity-signals.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-codebase-signals-bridge.test.ts`, `scripts/src/startup-loop/ideas/repo-maturity-signals.ts`
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 86%
  - Implementation: 86% - Deterministic synthetic repo fixtures provide direct control over scoring thresholds.
  - Approach: 86% - Covers both detector thresholds and cap-policy behavior (individual + stacked).
  - Impact: 86% - Prevents silent regressions in strictness logic and closes identified test blind spots.
- **Acceptance:**
  - Tests validate dimension-level threshold behavior (math and OSS included).
  - Tests validate single-cap, double-cap, and no-cap scenarios.
  - Tests assert strictness metrics fields are populated and stable for deterministic fixtures.
  - Tests cover persistent-truncation cap behavior.
- **Validation contract (TC-XX):**
  - TC-01: 2 advanced-math roots yields frontier score 3 with matching metrics.
  - TC-02: External dependency threshold progression (149 -> 150 -> 400) maps to expected OSS scores.
  - TC-03: Cap policy tests validate 72/74/76/78/84/88 thresholds and stacked minimum behavior.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: scoped typecheck + eslint for scanner/bridge/tests.
  - Validation artifacts: expanded repo-maturity + bridge test suites.
  - Unexpected findings: none.
- **Scouts:** None.
- **Edge Cases & Hardening:** truncation-after-rescan cap and notes are explicitly asserted.
- **Rollout / rollback:** rollback by reverting expanded tests if required.
- **Documentation impact:** Plan/build evidence only.
- **Build-Evidence (2026-03-04):**
  - Rewrote `repo-maturity-signals.test.ts` with dimension-specific detector tests, strictness metric assertions, cap policy tests, and partial-cap scenarios.
  - Extended bridge tests with strictness-regression/state assertions and non-impacting-change scan skip assertions.
  - Scoped validation passed:
    - `pnpm --filter scripts exec tsc -p tsconfig.json --noEmit`
    - `pnpm --filter scripts exec eslint src/startup-loop/ideas/repo-maturity-signals.ts src/startup-loop/ideas/lp-do-ideas-codebase-signals-bridge.ts src/startup-loop/__tests__/repo-maturity-signals.test.ts src/startup-loop/__tests__/lp-do-ideas-codebase-signals-bridge.test.ts`

### TASK-05: Add isolated detector tests for OSS/security/CI/structure-indexing dimension scoring
- **Type:** IMPLEMENT
- **Deliverable:** Isolated deterministic tests for per-dimension detector formulas (not only cap mapping)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-04)
- **Affects:** `scripts/src/startup-loop/__tests__/repo-maturity-signals.test.ts`
- **Depends on:** TASK-04
- **Blocks:** TASK-06
- **Confidence:** 88%
  - Implementation: 88% - Existing synthetic fixture framework already supports controlled signal toggles.
  - Approach: 88% - Formula-level assertions directly validate detector output mapping from files to scores.
  - Impact: 88% - Closes remaining coverage gaps where cap logic was tested but detector logic was not.
- **Acceptance:**
  - OSS acceleration tests cover dependency thresholds and dependabot/renovate/scouting increments.
  - Security depth tests cover incremental scoring (audit, secret scan, tools, rate-limit call sites).
  - CI velocity tests map concrete workflow characteristics to expected score values.
  - Structure/indexing hygiene tests assert detected score outputs from deterministic repository layouts.
- **Validation contract (TC-XX):**
  - TC-01: OSS score path includes bot/scouting contributions independently of dependency count.
  - TC-02: Security score increments are verified stepwise from 0 to capped maximum.
  - TC-03: CI/structure/indexing score formulas are asserted from fixture-derived repository state.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: scoped typecheck + eslint on `scripts` package.
  - Validation artifacts: updated `repo-maturity-signals.test.ts`.
  - Unexpected findings: none.
- **Scouts:** None.
- **Edge Cases & Hardening:** keeps tests static-repo-only and deterministic (no runtime telemetry).
- **Rollout / rollback:** rollback by reverting added tests.
- **Documentation impact:** Plan/build evidence only.
- **Build-Evidence (2026-03-04):**
  - Added isolated detector tests:
    - OSS bot/scouting contribution coverage.
    - Security depth incremental formula coverage.
    - CI velocity formula mapping coverage.
    - Structure/indexing hygiene detection coverage.
  - Added strictness metric assertions for `rate_limit_call_sites` and related counters.

### TASK-06: Expand maturity scan skip exclusions and expose strictness improvement deltas
- **Type:** IMPLEMENT
- **Deliverable:** Wider non-impacting path exclusions for scan short-circuit and additive strictness improvement outputs in regression
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-04)
- **Affects:** `scripts/src/startup-loop/ideas/lp-do-ideas-codebase-signals-bridge.ts`, `scripts/src/startup-loop/ideas/repo-maturity-signals.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-codebase-signals-bridge.test.ts`, `scripts/src/startup-loop/__tests__/repo-maturity-signals.test.ts`
- **Depends on:** TASK-05
- **Blocks:** -
- **Confidence:** 86%
  - Implementation: 86% - Additive schema/logic changes preserve backward compatibility.
  - Approach: 86% - Extending skip exclusions and reporting improvements addresses remaining operator visibility and efficiency gaps.
  - Impact: 86% - Reduces unnecessary full scans and surfaces positive strictness movement deterministically.
- **Acceptance:**
  - Non-impacting operational/docs paths can short-circuit maturity rescans.
  - Regression output includes strictness improvements as first-class signals.
  - Bridge skip-path tests validate warning + unchanged artifact timestamp behavior.
- **Validation contract (TC-XX):**
  - TC-01: `data/email-audit-log.jsonl` and `docs/business-os/strategy/*` changes are treated as non-impacting for maturity scans.
  - TC-02: `computeRepoMaturityRegression()` returns `improving_strictness_dimensions` when prior strictness scores are lower.
  - TC-03: Bridge run reports scan skip warning when only non-impacting paths changed.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: scoped typecheck + eslint + bridge invocation.
  - Validation artifacts: updated bridge tests and bridge run output.
  - Unexpected findings: none.
- **Scouts:** None.
- **Edge Cases & Hardening:** improvements tracking is additive and does not alter existing worsening-trigger logic.
- **Rollout / rollback:** rollback by reverting path exclusion additions and regression-output extension.
- **Documentation impact:** Plan/build evidence only.
- **Build-Evidence (2026-03-04):**
  - Expanded non-impacting path exclusions in `isRepoMaturityImpactingPath()`.
  - Added `improving_strictness_dimensions` to regression output.
  - Bridge test updated to assert skip behavior for non-impacting docs/operations path changes.

## Risks & Mitigations
- Risk: Overly aggressive caps reduce usefulness.
  - Mitigation: Emit per-cap reasons and keep thresholds explicit/tunable in code.
- Risk: Scanner runtime grows too much.
  - Mitigation: Derive metrics from existing file list where possible and keep bounded reads.

## Acceptance Criteria (overall)
- [x] Strictness layer implemented and score caps enforced in deterministic scanner.
- [x] Snapshot output explains cap reasons.
- [x] Bridge compatibility preserved.
- [x] Typecheck and lint pass for `scripts` package.
- [x] Strictness behavior is protected by dedicated tests in `scripts/src/startup-loop/__tests__/`.
- [x] Bridge state tracks strictness scores/cap reasons and emits on strictness regressions.
- [x] Repo maturity scan is short-circuited for non-impacting changed-file sets.
- [x] Detector formulas are covered independently of cap mapping (OSS, security, CI velocity, structure/indexing).
- [x] Strictness regressions include both worsening and improving dimensions.

## Decision Log
- 2026-03-04: Use strictness caps (not weight-only tuning) to eliminate false-high maturity levels.

## Overall-confidence Calculation
- TASK-01: 86% × M(2) = 172
- TASK-02: 84% × M(2) = 168
- TASK-03: 87% × M(2) = 174
- TASK-04: 86% × M(2) = 172
- TASK-05: 88% × M(2) = 176
- TASK-06: 86% × S(1) = 86
- Overall: (172 + 168 + 174 + 172 + 176 + 86) / 11 = **86.18%**
