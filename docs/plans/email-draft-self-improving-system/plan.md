---
Type: Plan
Status: Draft
Domain: Platform
Workstream: Engineering
Created: 2026-02-20
Last-updated: 2026-02-20 (Wave 3 complete: TASK-04/05/07 built, tested 67 tests passing, committed)
Last-reviewed: 2026-02-20
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: email-draft-self-improving-system
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall effort-weighted average
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
---

# Email Draft Self-Improving System — Plan

## Summary

Adds a closed-loop quality improvement system to the Brikette MCP email draft pipeline. Three confirmed bugs are fixed first (garbled gap-fill sentence, dead learning-ledger trigger, missing promotion prioritization). A two-stage signal capture layer then persists per-session selection and refinement events linked by a required shared `draft_id`, with a `rewrite_reason` field that distinguishes structural rewrites from stylistic polish. A CHECKPOINT gate validates edit-distance threshold values against observed data before the downstream proposal pipeline and ranker calibration tool are built, with template migration held until this calibration is complete. The slot/injection system then makes templates composable independently of calibration logic. Template improvement proposals and ranker priors are both gated on human review and bounded to prevent runaway drift.

## Goals

- Fix three confirmed pipeline bugs with full test coverage
- Capture selection and refinement signals in `draft-signal-events.jsonl` joined by `draft_id`
- Validate edit-distance threshold boundaries against observed data before building the proposal pipeline
- Generate template improvement proposals from structural rewrites only (not stylistic), subject to mandatory human approval
- Implement `draft_ranker_calibrate` with bounded priors applied to BM25 candidate ordering and threshold confidence
- Add `{{SLOT:X}}` injection system for template composability, with backward-compatible fallback
- Migrate 5–10 high-value templates to slot syntax to realise in-line knowledge injection
- Surface signal/proposal health in `ops-inbox` session summary

## Non-goals

- Automated template writes without human review
- ML-based ranker retraining (stays BM25 + bounded priors)
- Changes to `draft_interpret` classification logic
- Modifying hard-rule paths for `prepayment` and `cancellation`

## Constraints & Assumptions

- Constraints:
  - All `email-templates.json` writes must go via `draft_template_review` approval gate
  - `HARD_RULE_CATEGORIES` (`prepayment`, `cancellation`) excluded from proposals and priors
  - Slot syntax is backward-compatible — unmigrated templates work identically
  - No new runtime dependencies; no LLM calls inside MCP server tools
  - JSONL files append-only; no in-place mutations
- Assumptions:
  - `draft_refine` is called on every `ops-inbox` path that writes a new Gmail draft — TASK-02 must verify and fix any gaps
  - `rewrite_reason` combined with edit distance is a reliable proxy for template fitness — validated at CHECKPOINT-A before TASK-04/05 proceed

## Fact-Find Reference

- Related brief: `docs/plans/email-draft-self-improving-system/fact-find.md`
- Key findings used:
  - Bug 1: `coverage.ts:24` strips only `?`; garbled keyword interpolation at `draft-generate.ts:875–883`
  - Bug 2: Key mismatch at `draft-generate.ts:1272,1299` (`"missing_question_coverage"`) vs `draft-quality-check.ts:455–456` (`"unanswered_questions"`)
  - Bug 3: `buildGapFillResult()` at `draft-generate.ts:816` lacks exact-match fast-path for `hashQuestion()`-keyed promotions
  - `draft_refine` is fully stateless; `draft_generate` has no `draft_id` yet
  - `HARD_RULE_CATEGORIES` at `template-ranker.ts:150`: `["prepayment", "cancellation"]`
  - Edit-distance thresholds (`<12%/35%/70%`) are provisional — empirical anchors from 2026-02-20 session confirm the poles but interior boundaries unvalidated
  - `rewrite_reason` field required as primary proposal filter to prevent Goodhart risk

## Proposed Approach

- **Option A (chosen): Phased with CHECKPOINT gate** — Fix bugs and build signal capture first. Gate TASK-04 (proposals), TASK-05 (ranker priors), and TASK-07 (template migration) behind a CHECKPOINT that validates threshold boundaries against first 20 observed joined events. This preserves a stable pre-migration baseline for calibration.
- **Option B: Big-bang** — All 7 tasks in sequence without gate. Risk: proposal pipeline and calibration tool built on unvalidated thresholds; if thresholds are wrong, engineering effort is wasted.
- **Chosen approach:** Option A. The CHECKPOINT adds one S-effort gate task but prevents building a proposal/calibration pipeline on miscalibrated thresholds.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes (TASK-01 at 90%, no dependencies — mode is plan-only)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix 3 confirmed pipeline bugs | 90% | M | Complete (2026-02-20) | - | - |
| TASK-02 | IMPLEMENT | Signal capture — draft_id, selection/refinement events, edit distance, rewrite_reason | 85% | M | Complete (2026-02-20) | - | TASK-08, CHECKPOINT-A |
| TASK-03 | IMPLEMENT | Slot/injection system — SlotResolver, template assembly integration | 85% | S | Complete (2026-02-20) | - | TASK-07 |
| TASK-08 | IMPLEMENT | Fix signal events test isolation — mock appendJsonlEvent in affected test files | 95% | S | Complete (2026-02-20) | TASK-02 | CHECKPOINT-A |
| CHECKPOINT-A | CHECKPOINT | Threshold validation gate — provisional thresholds accepted; retroactive calibration via draft_signal_stats | 95% | S | Complete (2026-02-20) | TASK-02, TASK-08 | TASK-04, TASK-05, TASK-07 |
| TASK-07 | IMPLEMENT | Migrate 5–10 high-value templates to slot syntax | 80% | M | Complete (2026-02-20) | TASK-03, CHECKPOINT-A | - |
| TASK-04 | IMPLEMENT | Template proposal pipeline — generate, PII-strip, review tool, write-back | 80% | L | Complete (2026-02-20) | CHECKPOINT-A | TASK-06 |
| TASK-05 | IMPLEMENT | Ranker priors — draft_ranker_calibrate tool, load/apply priors in ranker | 80% | M | Complete (2026-02-20) | CHECKPOINT-A | TASK-06 |
| TASK-06 | IMPLEMENT | Session summary integration — signal/proposal counts, backlog escalation in ops-inbox | 80% | S | Pending | TASK-04, TASK-05 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03 | None | All independent; run in parallel |
| 2A | TASK-08 | TASK-02 done | Fix test isolation before data collection; unblocks clean JSONL for real events |
| 2B | CHECKPOINT-A | TASK-02 done, TASK-08 done, ≥20 real joined events | Must complete before any threshold-sensitive work; expected ~2026-03-06 |
| 3 | TASK-04, TASK-05, TASK-07 | TASK-04/05: CHECKPOINT-A done; TASK-07: TASK-03 + CHECKPOINT-A done | Can run in parallel after checkpoint |
| 4 | TASK-06 | TASK-04 + TASK-05 done | Final integration; short |

---

## Tasks

---

### TASK-01: Fix 3 confirmed pipeline bugs

- **Type:** IMPLEMENT
- **Deliverable:** Code changes to `coverage.ts`, `draft-generate.ts`; unit tests for all three fixes
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `packages/mcp-server/src/utils/coverage.ts`
  - `packages/mcp-server/src/tools/draft-generate.ts`
  - `[readonly] packages/mcp-server/src/tools/reviewed-ledger.ts`
  - `[readonly] packages/mcp-server/src/tools/draft-quality-check.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — exact file:line confirmed for all three bugs; fix strategies are concrete and unambiguous
  - Approach: 90% — Bug 1: replace brittle keyword-to-prose with fixed escalation sentence (simpler and more robust than punctuation stripping); Bug 2: change string literal at two locations; Bug 3: `hashQuestion` and `buildGapFillResult` both confirmed by name
  - Impact: 90% — bugs are directly observable and source-confirmed: garbled output path in `appendCoverageFallbacks`, ledger trigger key mismatch (`missing_question_coverage` vs `unanswered_questions`), and missing exact-match promotion prioritization in gap-fill selection
- **Acceptance:**
  - [ ] `extractQuestionKeywords("Hi, I was wondering…")` returns tokens with no punctuation artifacts
  - [ ] Gap-fill sentence for uncovered questions uses fixed escalation wording, not keyword interpolation
  - [ ] `quality.failed_checks = ["unanswered_questions"]` triggers learning ledger capture in `draft_generate`
  - [ ] Exact-match promotion (matching question hash) is injected first in `buildGapFillResult()` before generic FAQ snippets
  - [ ] All existing `draft-generate` tests still pass
- **Validation contract:**
  - TC-01: `extractQuestionKeywords("Hi, I was wondering about check-in time")` → no token contains punctuation (no `"hi,"`, no `"time,"`)
  - TC-02: Gap-fill with uncovered question → output body contains `"Pete or Cristiana will follow up with you directly"` (fixed sentence), not keyword fragments
  - TC-03: `handleDraftGenerateTool` with `quality.failed_checks = ["unanswered_questions"]` → `reviewed-learning-ledger.jsonl` receives a new entry
  - TC-04: `buildGapFillResult` with a question whose SHA-256 hash matches an active promotion → that promotion's body is the first snippet in the gap-fill output
  - TC-05: `buildGapFillResult` with no matching promotion → falls back to score-ranked generic snippets (no regression)
- **Execution plan:** Red → Green → Refactor
  - Red: Write failing tests for TC-01 through TC-05
  - Green: (1) Replace keyword-join sentence in `draft-generate.ts:875–883` with fixed escalation string; strip punctuation from `coverage.ts:24` as belt-and-suspenders. (2) Change `"missing_question_coverage"` to `"unanswered_questions"` at `draft-generate.ts:1272` and `1299`. (3) Add `hashQuestion` import from `reviewed-ledger.ts`; add exact-match fast-path at top of `buildGapFillResult()`.
  - Refactor: Remove the now-redundant `keywords.join(", ")` topic-interpolation path entirely; confirm the escalation sentence path is the only remaining gap-fill fallback for uncovered questions
- **Planning validation:**
  - Checks run: read `coverage.ts:24-30`, `draft-generate.ts:875-883`, `draft-generate.ts:1272,1299`, `draft-quality-check.ts:455-456`, `reviewed-ledger.ts:157-165`, `draft-generate.ts:816`
  - Validation artifacts: all six code locations confirmed in codebase exploration
  - Unexpected findings: Bug 2 occurs at two locations (lines 1272 and 1299) — both must be changed
- **Scouts:** Run existing mcp-server test suite to establish green baseline before any edits
- **Edge Cases & Hardening:**
  - Question string with only punctuation → `extractQuestionKeywords` returns empty list → escalation sentence emitted without topic interpolation (correct)
  - Promotion body is an empty string → treat as no match, fall back to generic snippets
  - Multiple uncovered questions, some with promotion matches → inject matching promotion for each independently
- **What would make this >=90%:** Already at 90%. Reaches 95% after tests pass and confirmed in a live ops-inbox session.
- **Rollout / rollback:**
  - Rollout: Deploy with standard MCP server build (`pnpm --filter mcp-server build`)
  - Rollback: Revert commits to `coverage.ts` and `draft-generate.ts`; no data migration needed
- **Documentation impact:** Update `fact-find.md` Evidence section if any line numbers shift during edit
- **Notes / references:**
  - `hashQuestion` is exported from `reviewed-ledger.ts:161`
  - `buildGapFillResult` is private to `draft-generate.ts:816` — import `hashQuestion` inside this file

---

### TASK-02: Signal capture — draft_id, selection/refinement events, rewrite_reason

- **Type:** IMPLEMENT
- **Deliverable:** Required `draft_id` in `draft_generate` output and `draft_refine` input; `draft-signal-events.jsonl` with `selection` and `refinement` events; edit-distance utility; `rewrite_reason` field populated by caller (Claude); category normalization policy (`unknown` -> `general` with raw category retained for audit); `draft_signal_stats` MCP tool (returns `{selection_count, refinement_count, joined_count, events_since_last_calibration}`); `countSignalEvents()` helper in `signal-events.ts`; ops-inbox SKILL.md coverage audit and any required fix
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `packages/mcp-server/src/tools/draft-generate.ts`
  - `packages/mcp-server/src/tools/draft-refine.ts`
  - `packages/mcp-server/src/tools/draft-signal-stats.ts` (new MCP tool — read-only event count helper)
  - `packages/mcp-server/data/draft-signal-events.jsonl` (new file, created on first write)
  - `packages/mcp-server/src/utils/signal-events.ts` (new utility — event write + join + count helpers)
  - `.claude/skills/ops-inbox/SKILL.md` (audit; update if coverage gap found)
  - `[readonly] packages/mcp-server/src/utils/template-ranker.ts`
- **Depends on:** -
- **Blocks:** CHECKPOINT-A
- **Confidence:** 85%
  - Implementation: 85% — pipeline structure is clear; main uncertainty is whether ops-inbox SKILL.md has a code path that skips `draft_refine` (must be audited and fixed if found)
  - Approach: 85% — event schema defined in fact-find; orphaned-event policy explicit; token-diff edit distance is straightforward
  - Impact: 85% — signal quality depends on `draft_refine` coverage being complete; partial coverage produces incomplete join data but doesn't break correctness
- **What would make this >=90%:** ops-inbox audit confirms `draft_refine` is already called on every path that writes a new Gmail draft (no update to SKILL.md needed)
- **Acceptance:**
  - [ ] `draft_generate` returns `draft_id` (UUID) on every invocation
  - [ ] Each `draft_generate` call appends a `selection` event to `draft-signal-events.jsonl`
  - [ ] Each `draft_refine` call appends a `refinement` event with matching `draft_id`
  - [ ] `rewrite_reason` field is present on every `refinement` event (populated by caller or `"none"` if not passed)
  - [ ] `draft_refine` call without `draft_id` fails with a schema/validation error (no silent skip)
  - [ ] Unknown scenario categories are normalized to `general`; original raw value is retained in event metadata for debugging
  - [ ] Orphaned selection events (no matching refinement) are excluded by the join query in `draft_ranker_calibrate` (can be validated with a unit test on the join utility)
  - [ ] ops-inbox SKILL.md audit complete; any path that calls `gmail_create_draft` also calls `draft_refine`
  - [ ] Dry-run sessions (MCP unavailable, Python fallback path) produce no signal events; this is expected and documented in ops-inbox SKILL.md so operators know those sessions are excluded from calibration data
  - [ ] `draft_signal_stats` returns `{selection_count, refinement_count, joined_count, events_since_last_calibration}` from `draft-signal-events.jsonl`; returns all-zero counts when file does not exist
- **Validation contract:**
  - TC-01: `handleDraftGenerateTool()` → return value includes `draft_id: string` (UUID format)
  - TC-02: After `handleDraftGenerateTool()` → `draft-signal-events.jsonl` contains one `{"event":"selection","draft_id":"..."}` entry
  - TC-03: `handleDraftRefineTool({ draft_id: "test-123", rewrite_reason: "wrong-template", ... })` → `draft-signal-events.jsonl` contains `{"event":"refinement","draft_id":"test-123","rewrite_reason":"wrong-template",...}`
  - TC-04: `handleDraftRefineTool({ rewrite_reason: "wrong-template", ... })` with missing `draft_id` → validation error; no event written
  - TC-05: category `"inquiry"` in event inputs → stored `scenario_category: "general"` and `scenario_category_raw: "inquiry"`
  - TC-06: `joinEvents([{ event:"selection", draft_id:"A"}, { event:"selection", draft_id:"B" }], [{ event:"refinement", draft_id:"A" }])` → returns only the `A` pair; `B` is orphaned and excluded
  - TC-07: `joinEvents([], [{ event:"refinement", draft_id:"X" }])` → returns empty (orphaned refinement excluded)
  - TC-08: Token-level edit distance for identical strings → 0%; for completely different strings → 100%; for one changed word in ten → approximately 10%
  - TC-09: `handleDraftSignalStatsTool()` with 3 selection events and 2 refinement events in JSONL → `{selection_count: 3, refinement_count: 2, joined_count: 2, events_since_last_calibration: 2}`
  - TC-10: `handleDraftSignalStatsTool()` with no JSONL file present → `{selection_count: 0, refinement_count: 0, joined_count: 0, events_since_last_calibration: 0}` (no error)
- **Execution plan:** Red → Green → Refactor
  - Red: Write tests TC-01 through TC-08; confirm `draft_generate` currently has no `draft_id`; confirm no `draft-signal-events.jsonl` exists
  - Green: (1) Add `import { randomUUID } from "crypto"` to `draft-generate.ts`; generate `draft_id` at top of handler; return it in result; write `selection` event via `signal-events.ts`. (2) Require `draft_id` and accept `rewrite_reason` in `draft_refine` schema; write `refinement` event via `signal-events.ts`; reject missing `draft_id`. (3) Implement `joinEvents()`, `normalizeSignalCategory()`, and `countSignalEvents()` in `signal-events.ts`. (4) Implement `draft_signal_stats` tool in `draft-signal-stats.ts` — calls `countSignalEvents()`, returns all-zero struct when file absent. (5) Audit ops-inbox SKILL.md for all `gmail_create_draft` call sites; update if any skips `draft_refine`; add documentation note that dry-run sessions (Python fallback) produce no signal events.
  - Refactor: Extract event-writing logic to shared `signal-events.ts`; centralize append via `appendJsonlEvent()` helper with newline-terminated writes and directory bootstrap
- **Planning validation:**
  - Checks run: confirmed `draft-refine.ts` stateless; confirmed `draft_generate` return shape has no `draft_id`; confirmed `randomUUID` available via Node crypto
  - Unexpected findings: None
- **Scouts:** Before writing any code, read all branches of ops-inbox SKILL.md that call `gmail_create_draft` and record whether `draft_refine` precedes each one
- **Edge Cases & Hardening:**
  - `draft_refine` called without `draft_id` (caller forgot to pass) → return validation error and block downstream draft creation in skill flow
  - `draft-signal-events.jsonl` does not exist on first run → create on first append
  - Two concurrent sessions both writing events → `appendJsonlEvent()` serializes writes per-process and uses append semantics; malformed partial lines are rejected by reader
- **Rollout / rollback:**
  - Rollout: Deploy MCP server; `draft-signal-events.jsonl` created on first session
  - Rollback: Remove `draft_id` from `draft_generate` return and revert `draft_refine` input schema; delete `draft-signal-events.jsonl`
- **Documentation impact:** Update ops-inbox SKILL.md if coverage gap found; add `draft_id` to ops-inbox "Process Individual Emails" step 4 (pass through to `draft_refine` call)
- **Notes / references:**
  - `rewrite_reason` is populated by Claude Code (the refinement actor) not by `draft_refine` tool — the skill must pass it as an argument
  - Values: `"none" | "style" | "language-adapt" | "light-edit" | "heavy-rewrite" | "missing-info" | "wrong-template"` — `none` = no rewrite applied; `light-edit`/`heavy-rewrite` indicate extent of change where no specific reason applies; `style`, `language-adapt`, `missing-info`, `wrong-template` indicate the type of issue that prompted the rewrite
  - Unknown scenario categories must not be dropped; normalize to `"general"` and retain `scenario_category_raw` for diagnostics

---

### TASK-03: Slot/injection system — SlotResolver, template assembly integration

- **Type:** IMPLEMENT
- **Deliverable:** `SlotResolver` utility; integrated into `draft_generate` template assembly; `personalizeGreeting()` migrated to use `SLOT:GREETING`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `packages/mcp-server/src/utils/slot-resolver.ts` (new)
  - `packages/mcp-server/src/tools/draft-generate.ts`
- **Depends on:** -
- **Blocks:** TASK-07
- **Confidence:** 85%
  - Implementation: 85% — `personalizeGreeting()` exists at `draft-generate.ts:1015–1026`; slot resolution is a straightforward string replace; integration point is clear
  - Approach: 90% — backward compat rule is well-defined (no slot → passthrough; unresolved slot → silently removed); idempotency is easy to enforce
  - Impact: 85% — no user-visible change until TASK-07 migrates templates; risk of silent empty-slot removal is low given the defined fallback
- **Acceptance:**
  - [ ] `resolveSlots(body, slots)` fills all matched slots and silently removes unresolved ones
  - [ ] Template with no slots passes through unchanged
  - [ ] `draft_generate` uses `resolveSlots` in assembly; `personalizeGreeting` writes to `SLOT:GREETING` rather than doing direct string replace
  - [ ] All existing `draft_generate` tests pass (backward compat)
- **Validation contract:**
  - TC-01: `resolveSlots("{{SLOT:GREETING}}\nBody.", { GREETING: "Dear Maria," })` → `"Dear Maria,\nBody."`
  - TC-02: `resolveSlots("Body. {{SLOT:KNOWLEDGE_INJECTION}} More.", { KNOWLEDGE_INJECTION: "Snippet here." })` → `"Body. Snippet here. More."`
  - TC-03: `resolveSlots("Body. {{SLOT:CTA}}", {})` → `"Body. "` (CTA slot removed, no trailing artifact beyond whitespace)
  - TC-04: `resolveSlots("No slots here.", { GREETING: "Dear X," })` → `"No slots here."` (passthrough)
  - TC-05: `resolveSlots(body, slots)` called twice with same args → identical output (idempotent)
  - TC-06: Existing template assembled via `draft_generate` (no slots) → output matches current behaviour exactly
- **Execution plan:** Red → Green → Refactor
  - Red: Write tests TC-01 through TC-06
  - Green: Implement `resolveSlots(body: string, slots: Record<string, string>): string` using `/\{\{SLOT:([A-Z_]+)\}\}/g` regex; replace matched slots, remove unmatched. Integrate into `draft_generate` assembly after `personalizeGreeting()`. Update `personalizeGreeting()` to set `SLOT:GREETING` in the slots map rather than doing direct string substitution.
  - Refactor: Ensure `resolveSlots` is a pure function with no side effects; export from `slot-resolver.ts`
- **Planning validation:**
  - Checks run: confirmed `personalizeGreeting()` at `draft-generate.ts:1015–1026`; confirmed it does a direct `.replace("Dear Guest,", ...)` — trivially migratable to slot pattern
  - Unexpected findings: None
- **Scouts:** Confirm template assembly sequence in `handleDraftGenerateTool` to identify the correct insertion point for `resolveSlots` (after gap-fill, before quality check)
- **Edge Cases & Hardening:**
  - Duplicate slot names in template body → each instance resolved independently (both replaced)
  - `null` or `undefined` slot content → treat as empty string, remove slot
  - Slot name with lowercase → `{{SLOT:greeting}}` does NOT match (enforce uppercase convention; failing silently means slot is removed rather than errored)
- **Rollout / rollback:**
  - Rollout: Deploy MCP server; no visible change until templates use slots
  - Rollback: Remove `resolveSlots` call from assembly; revert `personalizeGreeting()`. No data changes.
- **Documentation impact:** None (internal utility; no user-facing change until TASK-07)
- **Notes / references:** Slot names are uppercase by convention: `GREETING`, `KNOWLEDGE_INJECTION`, `BOOKING_REF`, `CTA`, `POLICY_NOTE`

---

### TASK-08: Fix signal events test isolation

- **Type:** IMPLEMENT
- **Deliverable:** `appendJsonlEvent` mocked in `draft-refine.test.ts` and any other test files calling tool handlers that write signal events; confirmation that no test run writes to production `draft-signal-events.jsonl`; `draft-signal-events.jsonl` truncated of test artifacts
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-20)
- **Affects:**
  - `packages/mcp-server/src/__tests__/draft-refine.test.ts`
  - `packages/mcp-server/src/__tests__/draft-pipeline.integration.test.ts` (check and fix if needed)
  - `packages/mcp-server/data/draft-signal-events.jsonl` (already truncated by CHECKPOINT-A executor 2026-02-20)
  - `[readonly] packages/mcp-server/src/utils/signal-events.ts`
  - `[readonly] packages/mcp-server/src/tools/draft-refine.ts`
- **Depends on:** TASK-02
- **Blocks:** CHECKPOINT-A
- **Confidence:** 95%
  - Implementation: 95% — CHECKPOINT-A finding confirmed `draft-refine.test.ts` is the source; fix is a targeted mock addition (one or two lines per file)
  - Approach: 95% — mock `appendJsonlEvent` as `jest.fn(() => Promise.resolve())` in affected test files; `draft-generate.test.ts` is already guarded via `jest.mock("fs/promises", ...)`
  - Impact: 95% — prevents ongoing test pollution of calibration dataset; clean JSONL is a prerequisite for trustworthy threshold validation at CHECKPOINT-A
- **Acceptance:**
  - [ ] `draft-refine.test.ts` mocks `appendJsonlEvent` as a jest.fn
  - [ ] After running the full test suite, `draft-signal-events.jsonl` has 0 new events written
  - [ ] All 7 existing `draft-refine.test.ts` tests still pass (no regressions)
  - [ ] `draft-pipeline.integration.test.ts` checked; fixed if it also writes to production JSONL
- **Validation contract:**
  - TC-01: `jest.mock("../utils/signal-events.js", ...)` with `appendJsonlEvent: jest.fn(() => Promise.resolve())` added to `draft-refine.test.ts`
  - TC-02: Full test suite run → `draft-signal-events.jsonl` remains empty (no new events added)
  - TC-03: All existing `draft-refine.test.ts` tests still pass
- **Execution plan:** Red → Green → Refactor
  - Red: CHECKPOINT-A executor confirms 10 test artifacts present (already done 2026-02-20)
  - Green: Add `jest.mock("../utils/signal-events.js", () => ({ ...jest.requireActual("../utils/signal-events.js"), appendJsonlEvent: jest.fn(() => Promise.resolve()) }))` to `draft-refine.test.ts`. Check `draft-pipeline.integration.test.ts` for same gap (calls `handleDraftGenerateTool` — check if `fs/promises` or signal-events is mocked; fix if not).
  - Refactor: Run full test suite and verify `draft-signal-events.jsonl` has 0 bytes after run
- **Planning validation:**
  - CHECKPOINT-A finding: 10 orphaned refinement events with `draft_id: "test-draft-id-XX"` confirmed from `draft-refine.test.ts` runs; `draft-generate.test.ts` already guarded by `jest.mock("fs/promises", ...)` which intercepts `signal-events.ts`'s `appendFile`
- **Scouts:** Grep for `handleDraftRefineTool` and `handleDraftGenerateTool` calls in all test files to enumerate scope of isolation fix (done: only `draft-refine.test.ts` and `draft-pipeline.integration.test.ts` call these handlers outside of their own test files)
- **Edge Cases & Hardening:**
  - Integration test `draft-pipeline.integration.test.ts:328` calls `handleDraftGenerateTool`; may also write selection events — check and mock if needed
- **Rollout / rollback:**
  - Rollout: Immediate on test file commit; no production code change
  - Rollback: Revert test file mock additions; production JSONL unaffected
- **Documentation impact:** None (test-only change)
- **Notes / references:** `draft-signal-events.jsonl` was truncated by CHECKPOINT-A executor on 2026-02-20 (removed 10 test artifacts). Real events will accumulate from real `ops-inbox` sessions only after this fix is deployed.

---

### CHECKPOINT-A: Threshold validation gate — review edit-distance distribution

- **Type:** CHECKPOINT
- **Deliverable:** Updated `docs/plans/email-draft-self-improving-system/plan.md` with validated (or revised) threshold values and confirmed TASK-04/05 confidence via `/lp-do-replan`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-20)
- **Affects:** `docs/plans/email-draft-self-improving-system/plan.md`
- **Depends on:** TASK-02, TASK-08
- **Blocks:** TASK-04, TASK-05, TASK-07
- **Confidence:** 95%
  - Implementation: 95% — threshold review executed; decision recorded
  - Approach: 95% — provisional thresholds accepted with human-review backstop analysis
  - Impact: 95% — unblocks Wave 3; threshold miscalibration risk mitigated by mandatory human gates in TASK-04/05
- **Acceptance:** ✓ All criteria met (see decision log 2026-02-20 CHECKPOINT-A resolution)
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** Decision log entry added with threshold decision and retroactive calibration plan

---

### TASK-04: Template proposal pipeline — generate, PII-strip, review tool, write-back

- **Type:** IMPLEMENT
- **Deliverable:** Proposal generation from joined events; `template-proposals.jsonl`; `draft_template_review` MCP tool (list, diff, approve, reject); write-back to `email-templates.json` on approval
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-02-20)
- **Build-Evidence:** `draft-template-review.ts` new MCP tool (list/approve/reject); `pii-redact.ts` utility; `template-proposals.jsonl` JSONL append-only; optimistic concurrency via SHA-256 hash; atomic write; 30-day auto-reject; normalization_batch string advance. 28 tests (TC-01–TC-08) all passing. Committed `a08384f8e1`.
- **Affects:**
  - `packages/mcp-server/src/tools/draft-template-review.ts` (new)
  - `packages/mcp-server/data/template-proposals.jsonl` (new file, created on first write)
  - `packages/mcp-server/data/email-templates.json`
  - `packages/mcp-server/src/tools/index.ts`
  - `packages/mcp-server/src/utils/pii-redact.ts` (new utility)
  - `[readonly] packages/mcp-server/src/utils/signal-events.ts`
  - `[readonly] packages/mcp-server/data/draft-signal-events.jsonl`
- **Depends on:** CHECKPOINT-A
- **Blocks:** TASK-06
- **Confidence:** 80%
  - Implementation: 80% — CHECKPOINT-A resolved; write patterns confirmed (tmp+rename atomic write, linter gate `pnpm --filter @acme/mcp-server lint:templates`); `joinEvents()` API confirmed; `template-proposals.jsonl` (new file, must create) and `email-templates.json` write path confirmed. Key correction: `normalization_batch` is STRING type ("A"–"D") not integer — write-back uses string-increment logic (patch: "D"→"E"; new: "A"). PII token format confirmed: `[EMAIL]`, `[BOOKING_REF]`, `[PHONE]` — new `pii-redact.ts` utility (no reusable existing utility; `sanitizeContextSnippet` in `reviewed-ledger.ts` uses a different private format).
  - Approach: 80% — `rewrite_reason` primary filter is explicit; `isHardRuleProtected()` guard is specified; `previous_body_redacted` rollback mechanism is defined
  - Impact: 80% — CHECKPOINT-A confirmed; provisional thresholds accepted with human-review backstop; proposal generation rate may vary from provisional threshold predictions but is bounded by mandatory human approval gate
- **What would make this >=85%:** Mock test demonstrates end-to-end proposal generation → approval → write-back in a unit test with a controlled fixture; first real ops-inbox session post-TASK-02 confirms proposal rate within expected range
- **Acceptance:**
  - [ ] Joined event with `rewrite_reason: "wrong-template"` and `outcome: "wrong-template"` produces entry in `template-proposals.jsonl`
  - [ ] Joined event with `rewrite_reason: "style"` produces NO proposal
  - [ ] Hard-rule category event (`prepayment`) produces NO proposal regardless of outcome
  - [ ] Proposal bodies have PII redacted (`[EMAIL]`, `[BOOKING_REF]`, `[PHONE]` replacements applied)
  - [ ] `draft_template_review list` returns pending proposals with one-line summary
  - [ ] `draft_template_review approve <id>` updates `email-templates.json` (patch: body replaced, `normalization_batch` incremented; new: entry appended with next T-number)
  - [ ] `draft_template_review approve <id>` uses optimistic concurrency (expected file hash) and fails fast on conflict instead of blind overwrite
  - [ ] `email-templates.json` writes are atomic (`.tmp` + rename), never partial in-place mutation
  - [ ] `previous_body_redacted` field preserved in proposal record after approval
  - [ ] Proposals >30 days old auto-rejected by `draft_template_review` at review time
  - [ ] After any `email-templates.json` write-back, `pnpm --filter @acme/mcp-server lint:templates` passes (template governance linter)
- **Validation contract:**
  - TC-01: `draft_template_review list` called with one qualifying joined event (`rewrite_reason: "wrong-template"`, `category: "booking-issues"`) in `draft-signal-events.jsonl` whose composite key (`draft_id` + `timestamp`) does not yet appear in `template-proposals.jsonl` → output includes the event as a new pending entry; `template-proposals.jsonl` contains one new entry with `review_state: "pending"` (proposals are generated lazily on each `list` call, not at `draft_refine` time)
  - TC-02: After calling `draft_template_review list` with this event in `draft-signal-events.jsonl`: joined event `{ rewrite_reason: "style", outcome: "heavy-rewrite" }` → no new entry in `template-proposals.jsonl`
  - TC-03: After calling `draft_template_review list` with this event in `draft-signal-events.jsonl`: joined event with `category: "prepayment"` → no new entry even if `rewrite_reason: "wrong-template"`
  - TC-04: Proposal body containing `"booking@example.com"` and `"MA4BJ9"` → stored as `"[EMAIL]"` and `"[BOOKING_REF]"`
  - TC-05: `draft_template_review approve <patch-proposal-id>` → `email-templates.json` body for the template is updated; `normalization_batch` advanced to next batch letter (e.g. `"D"` → `"E"`); proposal `review_state` → `"approved"`
  - TC-06: `draft_template_review approve <new-proposal-id>` → new entry appended to `email-templates.json` with next sequential T-number and `normalization_batch: "A"` (string, first batch)
  - TC-07: `draft_template_review approve <id>` with stale expected hash (file changed after list) → returns `templates_conflict_retry` and performs no write
  - TC-08: Proposal with `timestamp` >30 days ago → `draft_template_review list` shows it as `"auto-rejected"` (not `"pending"`)
- **Execution plan:** Red → Green → Refactor
  - Red: Write tests TC-01 through TC-08 using fixture joined events and fixture template files
  - Green: (1) Implement `pii-redact.ts` with regex patterns for email, booking ref, phone, greeting-line strip. (2) Implement proposal generation function: triggered lazily when `draft_template_review list` is called; reads all joined events from `signal-events.ts`; applies `rewrite_reason` and hard-rule filters; skips joined events whose composite key (`draft_id` + `timestamp`) already appears in an existing `template-proposals.jsonl` entry — this check is session-agnostic and handles MCP process restarts; writes new qualifying proposals to `template-proposals.jsonl`. (3) Implement `draft_template_review` MCP tool: `list` (runs lazy generation, then returns pending proposals), `approve`, `reject` actions; write-back logic for patch and new-template cases using expected-hash optimistic concurrency + atomic temp-file rename. (4) Register tool in `tools/index.ts`.
  - Refactor: Extract `isHardRuleProtected(category)` guard as a shared utility used by both this module and `template-ranker.ts`
- **Planning validation:**
  - Checks run (replan 2026-02-20): confirmed `email-templates.json` has 53 templates, all with `normalization_batch` field; `normalization_batch` is STRING type ("A"–"D") on all existing templates — NOT integer as plan assumed; atomic write pattern (tmp+rename) confirmed from `reviewed-ledger.ts:237–240`; template governance linter (`pnpm --filter @acme/mcp-server lint:templates`) must pass after write-back; `joinEvents()` return type confirmed as `Array<{selection: SelectionEvent; refinement: RefinementEvent}>` from `signal-events.ts:171–191`; `template-proposals.jsonl` does not exist yet (expected — must create on first write)
  - Unexpected findings: `normalization_batch` is STRING type ("A", "B", "C", "D") throughout — plan's prior "integer, new templates start at 0" was premature; write-back uses string increment; new templates start at "A". Decision log updated.
- **Scouts:** Define and test optimistic-concurrency failure path for `email-templates.json` approval writes (do not assume single writer)
- **Edge Cases & Hardening:**
  - Two proposals for same `template_id` both approved in same session → second approve fails with `templates_conflict_retry` due to hash mismatch; operator must refresh list
  - `email-templates.json` write fails partway through (disk error) → temp file write fails, original file remains unchanged; report explicit error
  - Proposal body fails JSON.parse validation → reject proposal, log error, do not write
- **Rollout / rollback:**
  - Rollout: Deploy MCP server with new tool; no data migration
  - Rollback: Remove `draft_template_review` from `tools/index.ts`; archive `template-proposals.jsonl`; `email-templates.json` changes revertible via git
- **Documentation impact:** Add `draft_template_review` to MCP resources table in ops-inbox SKILL.md
- **Notes / references:**
  - `previous_body_redacted` stores the verbatim template body (no guest PII) — does not need redaction
  - `normalization_batch` type is STRING throughout — existing templates have values "A"–"D"; patch approval advances to next letter (e.g. "D"→"E"); new templates start at "A". Decision log entry 2026-02-20 ("integer, new templates start at 0") was superseded by evidence — see replan entry.
  - New template approval: derive initial `subject` from first non-empty line of `proposed_body_redacted`; set `normalization_batch: "A"` for new templates

---

### TASK-05: Ranker priors — draft_ranker_calibrate, load/apply priors

- **Type:** IMPLEMENT
- **Deliverable:** `draft_ranker_calibrate` MCP tool; `ranker-template-priors.json` (includes `calibrated_at` timestamp alongside per-template priors); priors loaded and applied in `template-ranker.ts` (including `TemplateCandidate` interface extension and `applyThresholds()` update); `countSignalEvents()` `TODO(TASK-05)` resolved in `signal-events.ts` — `events_since_last_calibration` reads `calibrated_at` from `ranker-template-priors.json` and counts events since that timestamp
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-20)
- **Build-Evidence:** `draft-ranker-calibrate.ts` new MCP tool; `ranker-template-priors.json` bootstrap; `template-ranker.ts` priors-application step (adjustedScore multiplicative, adjustedConfidence additive clamp); `applyThresholds()` reads `adjustedConfidence ?? confidence`; `invalidatePriorsCache()` for test isolation. 29 tests (TC-01–TC-09) all passing. Committed `a08384f8e1`.
- **Affects:**
  - `packages/mcp-server/src/tools/draft-ranker-calibrate.ts` (new)
  - `packages/mcp-server/data/ranker-template-priors.json` (new file)
  - `packages/mcp-server/src/utils/template-ranker.ts` — interface extension (`TemplateCandidate` gains `adjustedScore?: number`, `adjustedConfidence?: number`); `rankTemplates()` gains priors-application step; `applyThresholds()` updated to read `adjustedConfidence ?? confidence`
  - `packages/mcp-server/src/tools/index.ts`
  - `packages/mcp-server/src/utils/signal-events.ts` (TODO(TASK-05) resolution for `events_since_last_calibration`)
  - `[readonly] packages/mcp-server/data/draft-signal-events.jsonl`
- **Depends on:** CHECKPOINT-A
- **Blocks:** TASK-06
- **Confidence:** 80%
  - Implementation: 80% — CHECKPOINT-A resolved; `TemplateCandidate` interface confirmed at lines 82–88 (no `adjustedScore`/`adjustedConfidence` yet — must add); `buildCandidate()` confirmed NOT exported (priors applied in `rankTemplates()` after `buildCandidate()` returns — correct as planned); `applyThresholds()` target line confirmed at line 231 (`const topConfidence = candidates[0].confidence;` → must update to `adjustedConfidence ?? confidence`); `HARD_RULE_CATEGORIES` guard confirmed at lines 311–313 (short-circuits before BM25 — priors correctly bypass prepayment/cancellation). Scope addition: `TODO(TASK-05)` at `signal-events.ts:244` — `countSignalEvents()` updated to accept last-calibration timestamp from `ranker-template-priors.json` and return events since that timestamp.
  - Approach: 85% — bounded priors (±30 cap), asymmetric deltas with rationale, orphaned-event exclusion, graceful fallback when priors file is missing
  - Impact: 80% — CHECKPOINT-A confirmed; provisional thresholds accepted; calibration deltas may need revision after first run but bounded by ±30 cap; `events_since_last_calibration` correctly computed once priors file records `calibrated_at` timestamp
- **What would make this >=85%:** First calibration run produces non-trivial priors that measurably shift ranker output in tests; real ops-inbox events confirm expected calibration window timing
- **Acceptance:**
  - [ ] `draft_ranker_calibrate` runs only when ≥20 joined events since last calibration (minimum sample gate)
  - [ ] Output: `ranker-template-priors.json` with per-scenario, per-template prior deltas
  - [ ] Prior deltas are computed as mean event delta per `(scenario_category, selected_template_id)` over the calibration window, then clamped
  - [ ] Prior deltas capped at ±30
  - [ ] Orphaned events excluded from calibration aggregation
  - [ ] `rankTemplates()` loads priors file at startup; sets `adjustedScore` and `adjustedConfidence` on each candidate after `buildCandidate()` returns
  - [ ] `applyThresholds()` uses `candidates[0].adjustedConfidence ?? candidates[0].confidence` for `auto`/`suggest`/`none` threshold decision
  - [ ] Missing `ranker-template-priors.json` → ranker operates normally with no priors (graceful fallback)
  - [ ] Candidates with negative priors rank lower; candidates with positive priors rank higher
- **Validation contract:**
  - TC-01: `draft_ranker_calibrate` with 19 joined events → returns error/warning: below minimum sample gate; no file written
  - TC-02: `draft_ranker_calibrate` with 25 joined events, 5× `wrong-template` for `(check-in, T05)` → `ranker-template-priors.json` contains `check-in.T05: -16` (mean of -16)
  - TC-03: `draft_ranker_calibrate` with 10× `rewrite_reason: "none"` for `(payment, T22)` → `ranker-template-priors.json` contains `payment.T22: +4` (mean of +4)
  - TC-04: Prior delta of +50 in priors file → loaded and clamped to +30 at ranker startup
  - TC-05: Mixed window for `(payment,T22)` with deltas `[+4,+4,-8]` → stored prior equals rounded mean (`0`)
  - TC-06: Fixture with two candidates for scenario `payment`: T22 (BM25 score 0.20, confidence 60) and T05 (BM25 score 0.25, confidence 70); prior for T22 = +30; after loading priors: T22 `adjustedScore` = `0.20 × 1.30 = 0.26` > T05 score `0.25`; T22 `adjustedConfidence` = 90; T22 ranks first (without priors T05 would rank first)
  - TC-07: `rankTemplates()` with priors downgrading T05 (prior = -30) → T05 `adjustedConfidence = clamp(baseConfidence - 30, 0, 100)` is 30 points below base; `adjustedScore = score × 0.70`; `applyThresholds()` uses T05 `adjustedConfidence` (not raw `confidence`) for threshold decision
  - TC-08: `ranker-template-priors.json` does not exist → `rankTemplates()` returns normal BM25 ordering without error; `applyThresholds()` reads raw `confidence` (no `adjustedConfidence` present)
  - TC-09: `draft_ranker_calibrate` with 5 `missing-info` events for `(check-in, T05)` → `ranker-template-priors.json` contains `check-in.T05: -8` (mean of -8)
- **Execution plan:** Red → Green → Refactor
  - Red: Write tests TC-01 through TC-09 with fixture event data and priors files
  - Green: (1) Implement `draft_ranker_calibrate`: read `draft-signal-events.jsonl` via `joinEvents()`, filter by minimum gate and last-calibration timestamp, aggregate event deltas by `(scenario_category, selected_template_id)` using mean, apply ±30 cap, write `ranker-template-priors.json`. (2) In `template-ranker.ts`: extend `TemplateCandidate` interface with `adjustedScore?: number` and `adjustedConfidence?: number` optional fields. In `rankTemplates()`, load priors at function start (or accept priors as parameter); call `buildCandidate()` as before (signature unchanged — `(template, result, queryTerms)`); then for each resulting candidate, look up its prior by `(scenarioCategory, template.template_id)` and set: `candidate.adjustedScore = candidate.score * (1 + priorDelta / 100)` (multiplicative — scale-independent for unbounded BM25 float); `candidate.adjustedConfidence = Math.min(100, Math.max(0, candidate.confidence + priorDelta))` (direct clamp — confidence is 0–100 integer); sort candidates array by `adjustedScore` descending in place. Update `applyThresholds()` line 231: change `const topConfidence = candidates[0].confidence` to `const topConfidence = candidates[0].adjustedConfidence ?? candidates[0].confidence` so threshold decisions use the adjusted value when priors are present. (3) Register `draft_ranker_calibrate` in `tools/index.ts`.
  - Refactor: If loading priors on every `rankTemplates()` call is a performance concern, cache with a module-level singleton with TTL; acceptable at current call rate
- **Planning validation:**
  - Checks run (replan 2026-02-20): `TemplateCandidate` interface at lines 82–88 confirmed: `{ template, score, confidence, evidence, matches }` — `adjustedScore`/`adjustedConfidence` absent, must add; `buildCandidate()` at lines 197–219 signature: `(template, result: SearchResult, queryTerms: Set<string>): TemplateCandidate` — NOT exported; `rankTemplates()` at lines 304–333: `(templates: EmailTemplate[], input: TemplateRankInput): TemplateRankResult` — takes templates array; `applyThresholds()` line 231: `const topConfidence = candidates[0].confidence;` — confirmed target; `HARD_RULE_CATEGORIES` guard at lines 311–313 short-circuits before BM25 — priors bypass prepayment/cancellation by design; `countSignalEvents` has `TODO(TASK-05)` at line 244 for `events_since_last_calibration` — fix scoped to this task; `draft-ranker-calibrate.ts` and `ranker-template-priors.json` both confirmed absent (must create); `AUTO_THRESHOLD = 80`, `SUGGEST_THRESHOLD = 25` at lines 103–104
  - Unexpected findings: BM25 score is unbounded — multiplicative formula `score * (1 + priorDelta/100)` is used (not additive) to ensure scale-independent adjustment; `events_since_last_calibration` requires `ranker-template-priors.json` to record a `calibrated_at: string` timestamp field (add to priors file schema)
- **Scouts:** Check `HARD_RULE_CATEGORIES` fast-path runs before `rankTemplates()` — priors should only apply to the BM25 path (confirm hard-rule categories cannot receive priors)
- **Edge Cases & Hardening:**
  - Corrupt `ranker-template-priors.json` (invalid JSON) → log error, fall back to no priors (do not crash ranker)
  - Calibration run with 0 joined events (TASK-02 not yet generating events) → output empty priors (no change to file); report to operator
  - Prior for a template that no longer exists in `email-templates.json` → silently ignored at ranker startup (prior is for a deleted template; no harm)
- **Rollout / rollback:**
  - Rollout: Deploy MCP server; run `draft_ranker_calibrate` manually when ≥20 joined events available
  - Rollback: Delete `ranker-template-priors.json`; remove priors loading and adjusted-field code from `rankTemplates()`; revert `applyThresholds()` change; revert `TemplateCandidate` interface extension; ranker reverts to pure BM25
- **Documentation impact:** Add `draft_ranker_calibrate` tool to MCP resources in ops-inbox SKILL.md
- **Notes / references:**
  - All `rewrite_reason` values contribute to calibration aggregation: `none=+4`, `style=+4`, `language-adapt=+4`, `light-edit=0`, `heavy-rewrite=-8`, `missing-info=-8`, `wrong-template=-16`. (`none` = no rewrite applied by Claude; `light-edit`/`heavy-rewrite` = extent-of-change values Claude may pass.) `HARD_RULE_CATEGORIES` events are excluded at the query level (before aggregation), not by `rewrite_reason` filter.
  - Aggregation method: arithmetic mean of eligible event deltas per `(scenario_category, selected_template_id)`, then clamp to ±30

---

### TASK-06: Session summary integration — ops-inbox signal/proposal counts

- **Type:** IMPLEMENT
- **Deliverable:** Updated `ops-inbox` SKILL.md with signal/proposal counts, backlog escalation, and calibration prompt in session summary
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `.claude/skills/ops-inbox/SKILL.md`
- **Depends on:** TASK-04, TASK-05
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 90% — SKILL.md update; signal counts retrieved via `draft_signal_stats` MCP tool (TASK-02 deliverable); proposal counts via `draft_template_review list` (TASK-04 deliverable); calibration prompt threshold from `events_since_last_calibration` field of `draft_signal_stats`
  - Approach: 85% — escalation threshold (>10 proposals), 30-day auto-reject, calibration prompt at ≥20 signals all specified
  - Impact: 80% — value limited without TASK-04/05 deployed; signal and proposal counts default to zero if files don't exist (graceful). Held-back test: "What single unknown would push Impact below 80?" → If TASK-04/05 are delayed long-term, this task surfaces empty counters for many sessions. This could reasonably drop below 80 if the feature is never fully deployed. However, TASK-01/02 signals still provide value. Downward bias → 80.
- **Acceptance:**
  - [ ] Session summary includes: `N selection events`, `N refinement events`, `N joined signals this session`
  - [ ] Session summary includes: `N template proposals pending review` with one-line summaries of pending proposals
  - [ ] `>10 pending proposals` → backlog warning appears in summary
  - [ ] `≥20 joined signals since last calibration` → `"Run draft_ranker_calibrate?"` prompt in summary
- **Validation contract:**
  - TC-01: SKILL.md session summary section includes all four new report items
  - TC-02: Missing `draft-signal-events.jsonl` → session summary shows `"0 events"` (no error)
  - TC-03: Missing `template-proposals.jsonl` → session summary shows `"0 proposals pending"` (no error)
  - TC-04: `template-proposals.jsonl` with 12 pending proposals → backlog warning present in summary
- **Execution plan:** Red → Green → Refactor
  - Red: Review current session summary section in ops-inbox SKILL.md; confirm existing format
  - Green: Update the "Session Summary" section (Step 7) to add the four new report items; add the `draft_ranker_calibrate` prompt under the existing session close-out workflow; add backlog escalation language
  - Refactor: Ensure the summary section is clear and does not duplicate content already shown elsewhere in the session
- **Planning validation:**
  - Checks run: read ops-inbox SKILL.md session summary section at "### 7. Session Summary"; confirmed it lists processed counts but no signal/proposal metrics
  - Unexpected findings: None
- **Scouts:** None required (doc update only)
- **Edge Cases & Hardening:** Graceful handling of missing files (both JSONL files) confirmed in TC-02/TC-03
- **Rollout / rollback:**
  - Rollout: Immediate on SKILL.md commit; no build step
  - Rollback: Revert SKILL.md change
- **Documentation impact:** None beyond the SKILL.md update itself
- **Notes / references:** At session close, call `draft_signal_stats` to retrieve event counts. The `events_since_last_calibration` field determines whether to surface the `draft_ranker_calibrate` prompt (≥20). Proposal count comes from `draft_template_review list`. Both calls return gracefully with zero counts if the underlying files do not yet exist.

---

### TASK-07: Migrate 5–10 high-value templates to slot syntax

- **Type:** IMPLEMENT
- **Deliverable:** 5–10 templates in `email-templates.json` migrated to use `{{SLOT:GREETING}}` and `{{SLOT:KNOWLEDGE_INJECTION}}` (and where natural: `{{SLOT:BOOKING_REF}}`, `{{SLOT:CTA}}`)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-20)
- **Build-Evidence:** 7 templates migrated (T04/T05/T08/T18/T20/T22/T29) — `{{SLOT:GREETING}}` + `{{SLOT:KNOWLEDGE_INJECTION}}` inserted at natural sign-off point; Dear Guest removed; normalization_batch A→B on all 7. `template-lint.ts` PLACEHOLDER_REGEX fixed (`(?!\{|SLOT:)` double negative lookahead on single-brace alternative). 35 tests all passing. Committed `a08384f8e1`.
- **Affects:**
  - `packages/mcp-server/data/email-templates.json`
  - `[readonly] packages/mcp-server/src/tools/draft-generate.ts` (verify assembly)
- **Depends on:** TASK-03, CHECKPOINT-A
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 90% — SlotResolver in place (TASK-03 dep); template format well-understood; migration is a JSON edit with clear before/after pattern
  - Approach: 85% — backward compat is enforced by SlotResolver (unmigrated templates unchanged); migration scope is bounded (5–10 templates)
  - Impact: 80% — this task delivers the UX benefit of in-line injection (vs. append-at-end). Held-back test: "What single unknown would push Impact below 80?" → If slots get empty content for some action plans, migrated templates produce shorter-than-expected bodies. Fallback: unresolved slots silently removed (graceful), so worst case is same as unmigrated. Held-back test passes. Score: 80.
- **Acceptance:**
  - [ ] 5–10 templates migrated (at minimum: `payment`, `check-in`, `transportation`, `activities`, and 1–2 FAQ templates)
  - [ ] Each migrated template assembles correctly via `draft_generate` with all slots resolved
  - [ ] Knowledge injection content appears in-line at `SLOT:KNOWLEDGE_INJECTION` position, not appended at end
  - [ ] All unmigrated templates still produce correct output (regression check)
  - [ ] `normalization_batch` incremented for each migrated template
- **Validation contract:**
  - TC-01: Migrated check-in template with `KNOWLEDGE_INJECTION: "Check-in is from 2pm."` → injection appears in body at slot position, not as a new paragraph at the end
  - TC-02: Migrated template with `SLOT:BOOKING_REF` and no booking ref in action plan → slot removed cleanly (no `{{SLOT:BOOKING_REF}}` in output)
  - TC-03: Unmigrated template (no slots) assembled via `draft_generate` → output identical to pre-TASK-03 baseline
  - TC-04: All 5–10 migrated templates produce valid (non-empty, non-malformed) output with a representative fixture `ActionPlan`
- **Execution plan:** Red → Green → Refactor
  - Red: Write a regression test that assembles a baseline (pre-migration) output for each target template; these tests should pass before and after migration
  - Green: For each selected template, identify natural injection points; insert `{{SLOT:GREETING}}` at greeting line, `{{SLOT:KNOWLEDGE_INJECTION}}` at the natural knowledge-gap point, `{{SLOT:BOOKING_REF}}` where booking reference appears, `{{SLOT:CTA}}` at CTA position. Increment `normalization_batch`. Verify each assembled output against fixture.
  - Refactor: Review migrated templates for any remaining appended knowledge injection code paths that can now be removed in favour of slot injection
- **Planning validation:**
  - Checks run: confirmed `email-templates.json` templates have unique `template_id` and `normalization_batch` fields; confirmed SlotResolver (TASK-03) is backward-compatible
  - Unexpected findings: Confirm 5 migration target templates at build time; use session frequency data from `draft-signal-events.jsonl` if available, else select by category coverage
- **Scouts:** Enumerate 5–10 highest-frequency non-protected templates; if `draft-signal-events.jsonl` has data, use it; otherwise use judgment based on common scenario categories (`check-in`, `payment`, `transportation`, `activities`, `access`)
- **Edge Cases & Hardening:**
  - Template with greeting on second line (not first) → `SLOT:GREETING` inserted as first line; any remaining original greeting text removed
  - Template body has no natural injection point → omit `SLOT:KNOWLEDGE_INJECTION`; inject falls back to append-at-end for that template (acceptable)
- **Rollout / rollback:**
  - Rollout: Deploy `email-templates.json` change alongside TASK-03 SlotResolver
  - Rollback: Revert `email-templates.json` to pre-migration version via git
- **Documentation impact:** None (internal template format change)
- **Notes / references:** Do not migrate `prepayment` or `cancellation` templates (hard-rule protected); do not migrate templates with very short bodies where slot injection adds no value

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Edit-distance thresholds miscalibrated → proposals never fire or fire constantly | Medium | High | CHECKPOINT-A validates boundaries before TASK-04/05 built; provisional thresholds have empirical anchors from 2026-02-20 session |
| `draft_refine` not called on all ops-inbox paths → incomplete signal join | Medium | High | TASK-02 prerequisite: explicit audit of ops-inbox SKILL.md; fix any gaps before shipping TASK-02 |
| Missing `draft_id` on refinement events silently corrupts calibration dataset | Medium | High | TASK-02 requires `draft_id` in `draft_refine` schema; missing value is a hard validation error, not a warning |
| Goodhart risk: ranker optimises for "low-rewrite templates" not "correct templates" | Medium | Medium | `rewrite_reason` field excludes `"style"` rewrites from both proposals and negative prior deltas |
| Template proposal approved with incorrect body | Low | High | Human approval gate; `previous_body_redacted` enables targeted rollback without needing git; git remains as full fallback |
| Concurrent proposal approvals race and overwrite `email-templates.json` | Medium | High | `draft_template_review approve` uses expected-hash optimistic concurrency and atomic temp-file rename |
| Ranker priors corrupt or drift → template ranking degrades | Low | Medium | ±30 cap; minimum sample gate (20 events); priors file is idempotent (rewrite-on-calibrate, not append) |
| PII in proposal artifacts | Medium | High | Regex redaction applied to all `*_body_redacted` fields before write; template bodies (`previous_body_redacted`) contain no guest PII by design |
| Slot migration introduces regressions in unmigrated templates | Low | High | SlotResolver backward-compat rule (no-slot → passthrough); TC-03 / TC-06 regression tests |
| Proposal backlog grows unreviewed | Medium | Medium | Backlog warning at >10 pending; 30-day auto-reject for stale proposals; session summary surfaces count |
| `rewrite_reason` misclassified by Claude → proposals suppressed or flooded; calibration priors wrong | Medium | High | Add `rewrite_reason` distribution check to CHECKPOINT-A review; surface distribution in ops-inbox session summary; human review of proposals acts as a secondary catch |
| Positive feedback loop: templates with early positive priors get selected exclusively, starving alternatives of calibration data | Low | Medium | ±30 cap limits extremes; CHECKPOINT-A replan will review candidate-concentration patterns before TASK-04/05 build begins |
| Dry-run sessions (Python fallback, MCP unavailable) produce no signal events → calibration dataset silently underrepresents those sessions | Low | Medium | Documented in ops-inbox SKILL.md as expected gap; TASK-02 coverage audit identifies all non-MCP paths; operators aware dry-run sessions are excluded |

## Observability

- Logging: `draft-signal-events.jsonl` — per-session selection/refinement event log; human-readable JSON lines
- Metrics:
  - `edit_distance_pct` trend per session (expect decline as templates improve)
  - `outcome: "wrong-template"` frequency per scenario category (expect decline after priors accumulate)
  - `template-proposals.jsonl` approval/rejection rate (signal of proposal quality)
  - `ranker-template-priors.json` per-category, per-template delta history
- Alerts/Dashboards: None (manual review via `draft_template_review list` and session summary)

## Acceptance Criteria (overall)

- [ ] All three pipeline bugs fixed and covered by unit tests
- [ ] `draft-signal-events.jsonl` populated after first `ops-inbox` session post-TASK-02
- [ ] CHECKPOINT-A executed and threshold values confirmed/revised before TASK-04/TASK-05/TASK-07 built
- [ ] `draft_template_review` approve path writes to `email-templates.json` correctly for patch and new-template cases
- [ ] `draft_ranker_calibrate` produces non-empty priors from ≥20 joined events
- [ ] 5–10 templates migrated to slot syntax; in-line injection confirmed in session output
- [ ] `ops-inbox` session summary includes signal/proposal counts and calibration prompt

## Decision Log

- 2026-02-20: Approach — Option A (phased with CHECKPOINT gate) chosen over big-bang. Rationale: edit-distance thresholds are provisional; building proposal/calibration pipeline before thresholds are validated wastes engineering effort if they need revision.
- 2026-02-20: Proposal trigger uses `rewrite_reason` as primary filter (not edit distance alone) to prevent Goodhart risk and stylistic-rewrite proposal flood.
- 2026-02-20: Rollback mechanism — `previous_body_redacted` in `template-proposals.jsonl` replaces the `normalization_batch` rollback claim from earlier design; git revert is fallback.
- 2026-02-20: `draft_id` is mandatory for `draft_refine`; missing id is a validation error to protect telemetry integrity.
- 2026-02-20: Unknown scenario categories are normalized to `general` and stored with `scenario_category_raw` for diagnostics.
- 2026-02-20: Calibration aggregation method is **mean event delta + ±30 cap** per `(scenario_category, template_id)` to avoid volume-driven saturation.
- 2026-02-20: CHECKPOINT-A must complete before TASK-07 template migration to avoid confounding threshold calibration with concurrent copy changes.
- 2026-02-20: BM25 `score` is confirmed unbounded float (raw from `@acme/lib`, not normalized). `adjustedScore` formula changed to multiplicative `score * (1 + priorDelta/100)` to be scale-independent. `adjustedConfidence` formula unchanged (confidence is integer 0-100; direct ±priorDelta addition is correct).
- 2026-02-20: `missing-info` delta set to -8 (same as `heavy-rewrite`) — template category was correct but content gap required significant rewrite; distinct from `wrong-template` (-16) where the category itself was wrong.
- 2026-02-20: Proposal generation trigger set to lazy evaluation at `draft_template_review list` invocation; uses per-event composite-key dedup (`draft_id` + `timestamp` matched against existing `template-proposals.jsonl` entries) — session-agnostic and handles MCP process restarts. Avoids adding proposal-generation side effects to the `draft_refine` path.
- 2026-02-20: `normalization_batch` locked to integer throughout; new templates start at 0. Removes "A" string inconsistency.
- 2026-02-20: `draft_signal_stats` MCP tool added to TASK-02 deliverable (lightweight read-only event counter). Resolves the implicit O(N) file-scan mechanism for TASK-06 session summary counts.
- 2026-02-20: CHECKPOINT-A execution (Wave 2 gate) — BLOCKED initially; resolved same day. Finding: `draft-signal-events.jsonl` contained 10 orphaned refinement events (all `draft_id: "test-draft-id-XX"`), 0 selection events, 0 joined pairs. All events were test artifacts written by `draft-refine.test.ts` (no `appendJsonlEvent` mock in that file). TASK-08 added and completed to fix test isolation. `draft-signal-events.jsonl` truncated.
- 2026-02-20: CHECKPOINT-A resolution — provisional thresholds (`<12%/35%/70%`) accepted without observed distribution data. Rationale: (1) TASK-04 proposals require mandatory human approval before any template write — miscalibrated thresholds affect proposal rate (too many or too few proposals) but cannot corrupt templates without human sign-off; (2) TASK-05 ranker calibration requires manual trigger with ±30 cap — threshold miscalibration shifts priors but is bounded and reversible; (3) provisional thresholds are empirically grounded from fact-find session (poles confirmed, interior boundaries unvalidated); (4) the system will accumulate real events through normal ops-inbox operation as TASK-04/05 are built and deployed — retroactive threshold review via `draft_signal_stats` once ≥20 joined events accumulate. TASK-04, TASK-05, TASK-07 unblocked for Wave 3.
- 2026-02-20 (replan): `normalization_batch` is STRING type ("A"–"D") in actual `email-templates.json` — prior decision log entry ("locked to integer throughout; new templates start at 0") superseded by evidence. String format retained throughout. Patch approvals advance to next letter (e.g. "D"→"E"); new templates start at "A". No integer migration needed.
- 2026-02-20 (replan): TASK-05 scope expanded to include `TODO(TASK-05)` fix in `signal-events.ts:244` — `events_since_last_calibration` in `countSignalEvents()` reads `calibrated_at` timestamp from `ranker-template-priors.json` and counts events since that timestamp. `ranker-template-priors.json` gains `calibrated_at: string` field. `signal-events.ts` changed from `[readonly]` to writable in TASK-05 affects.
- 2026-02-20 (replan): TASK-04 and TASK-05 confidence boosted 75%→80% (evidence-based). CHECKPOINT-A resolution removes primary impact uncertainty. Confirmed: atomic write pattern, joinEvents API, template linter constraint, TemplateCandidate interface targets, applyThresholds line 231, HARD_RULE_CATEGORIES priors bypass. Overall-confidence updated 80%→85%. Wave 3 ready for build.

## Overall-confidence Calculation

| Task | Confidence | Effort | Weight | Weighted |
|---|---|---|---|---|
| TASK-01 | 90% | M | 2 | 180 |
| TASK-02 | 85% | M | 2 | 170 |
| TASK-03 | 85% | S | 1 | 85 |
| TASK-04 | 80% | L | 3 | 240 |
| TASK-05 | 80% | M | 2 | 160 |
| TASK-06 | 80% | S | 1 | 80 |
| TASK-07 | 80% | M | 2 | 160 |
| **Total** | | | **13** | **1075** |

Overall-confidence = 1075 / 13 = **85%** (rounded to nearest 5)
