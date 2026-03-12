---
Type: Build-Record
Status: Complete
Domain: BOS
Last-reviewed: 2026-03-12
Feature-Slug: ideas-queue-quality-gates
Execution-Track: code
Completed-date: 2026-03-12
artifact: build-record
Build-Event-Ref: docs/plans/ideas-queue-quality-gates/build-event.json
---

# Build Record: Ideas Queue Quality Gates

## Outcome Contract

- **Why:** Right now, nothing checks whether an idea entering the backlog is real or just internal processing noise. Over half the entries have missing categories, and about 80 are duplicated fragments of the AI talking to itself. The operator cannot trust the backlog for decision-making. Adding automatic quality checks and cleaning up the existing data would make the ideas list reliable for prioritising what to work on next.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Deterministic admission guards prevent noise entering the queue, existing queue data is cleaned and domain-classified, and a fresh pattern analysis on clean data is produced.
- **Source:** operator

## What Was Built

**Admission guards (TASK-01):** A pure `validateDispatchContent()` function added to `lp-do-ideas-queue-admission.ts` with 4 deterministic guard rules: forbidden-pattern detection (9 regex patterns matching agent reasoning, table rows, markdown headings, truncated text), minimum word count (5+ for artifact_delta trigger), area_anchor exact-match dedup against existing queue entries, and domain canonical check against the 8-value ArtifactDomain enum. The function is integrated into `enqueueQueueDispatches()` protecting all 4 bridge callers. Rejections fold into the existing `suppressed` count and emit `validation_rejected` telemetry.

**Direct-writer alignment (TASK-02):** The two queue writers that bypass `enqueueQueueDispatches()` — `lp-do-ideas-historical-carryover-bridge.ts` and `self-evolving-backbone-consume.ts` — now call `validateDispatchContent()` before each `queue.dispatches.push()`. All 6 queue ingress paths are now protected.

**Queue data cleanup (TASK-03):** A cleanup script (`lp-do-ideas-queue-cleanup.ts`) fixed 10 non-canonical domain values (BUILD→PRODUCTS, Platform→BOS), classified 291 missing domains using business + area_anchor heuristics, and flagged 181 noise entries with `noise_flagged: true`. No enqueued noise was removed (all noise was already in completed/processed state).

**Pattern analysis (TASK-04):** Analysis of 373 clean dispatches found 96% are manual operator submissions vs 4% auto-detected — only BOS has any standing-artifact-driven detection. Identified 7 thematic clusters and recommended 10 standing artifacts across 3 priority tiers. Priority 1 artifacts (email pipeline health, storefront health, catalog quality, booking funnel health) would auto-detect ~32% of queue volume.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=lp-do-ideas-queue-admission` | Pass | 20 tests: 14 unit + 6 integration |
| `scripts/validate-engineering-coverage.sh docs/plans/ideas-queue-quality-gates/plan.md` | Pass | valid: true, no errors or warnings |

## Workflow Telemetry Summary

None: workflow telemetry not recorded for this build session.

## Validation Evidence

### TASK-01
- TC-01: "Based on the analysis of..." → rejected (forbidden_pattern) ✓
- TC-02: "Fix bug" (2 words, artifact_delta) → rejected (min_word_count) ✓
- TC-03: Duplicate area_anchor → rejected (area_anchor_duplicate) ✓
- TC-04: domain "BUILD" → rejected (domain_non_canonical) ✓
- TC-05: domain "MARKET" → accepted ✓
- TC-06: No domain field → accepted ✓
- TC-07: Valid area_anchor + ≥5 words + unique + valid domain → accepted ✓
- TC-08: operator_idea + 3-word anchor → accepted (min word count exemption) ✓

### TASK-02
- TC-01: Eligible carry-forward with valid content → enqueued ✓
- TC-02: Duplicate carry-forward → suppressed by inline dedup ✓
- TC-03: Carry-forward with forbidden pattern → rejected by content guard ✓

### TASK-03
- TC-01: Dry-run reports noise count, domain classification count, non-canonical fixes without writing ✓
- TC-02: Write mode → 0 missing domain, all remaining dispatches have valid domain ✓
- TC-03: Re-running guards on clean data → 0 noise caught ✓

### TASK-04
- TC-01: 0% noise rate on clean data ✓
- TC-02: All 373 clean dispatches have canonical domain values ✓
- TC-03: Top themes identified by domain across all 6 domains present ✓

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | N/A | No UI changes |
| UX / states | N/A | No user-facing states |
| Security / privacy | N/A | Internal queue validation |
| Logging / observability / audit | Required — PASS | `validation_rejected` telemetry with reason literals emitted for all guard rejections |
| Testing / validation | Required — PASS | 20 tests in `lp-do-ideas-queue-admission.test.ts`: 14 unit + 6 integration |
| Data / contracts | Required — PASS | `ContentGuardResult` type exported, `EnqueueQueueDispatchesOptions` TPacket constraint widened, queue-state.json format preserved with recalculated counts |
| Performance / reliability | Required — PASS | Pre-compiled regex patterns, Set-based area_anchor dedup |
| Rollout / rollback | N/A | Internal tooling, revert commit to rollback |

## Scope Deviations

- TASK-02: Historical-carryover bridge was NOT refactored to use `enqueueQueueDispatches()` — instead the guard function is called directly before each `queue.dispatches.push()`. This preserves per-item admission_result stamping and dry-run support. Lower coupling, same protection.
- TASK-03: Expected 160 noise removals but found 0 enqueued noise to remove — all noise was already completed/processed. 181 entries flagged with `noise_flagged: true` instead of removed. Clean outcome preserved downstream reporting integrity.
