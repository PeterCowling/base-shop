---
Type: Analysis
Status: Ready-for-planning
Domain: BOS
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: brik-email-template-confidence-threshold
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/brik-email-template-confidence-threshold/fact-find.md
Related-Plan: docs/plans/brik-email-template-confidence-threshold/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Email Template Confidence Threshold Analysis

## Decision Frame

### Summary

Two independent code gaps allow the email draft pipeline to produce misleading outputs. This analysis decides how to close each gap — the choices are independent and can be implemented in sequence.

**Decision 1:** How to gate single-question template selection so only confidently-matched templates are used (mirroring the composite path's existing protection).

**Decision 2:** How to eliminate false `missing_required_reference` quality failures on FAQ drafts that incidentally mention a booking.

Both decisions are structurally simple: the composite path already solves Decision 1 correctly, and `booking_action_required` already solves Decision 2 — the fixes apply the existing correct logic to the paths that currently lack it.

### Goals

- Gate single-question template acceptance with a category-compatibility check and confidence floor matching the composite path.
- Emit `follow_up_required` with the escalation fallback sentence for below-threshold single-question emails (no template text in draft).
- Remove `booking-issues` from `STRICT_REFERENCE_CATEGORIES` so informational booking mentions do not trigger reference-link enforcement.

### Non-goals

- Changing the BM25 algorithm, synonym table, or phrase expansions.
- Altering the multi-question composite path — it already gates correctly.
- Changing the `booking_action_required` trigger.
- Adding new email templates.

### Constraints & Assumptions

- Constraints:
  - Tests run in CI only per `docs/testing-policy.md`.
  - All changes confined to `packages/mcp-server/src/`. No schema migrations, environment variables, or data files required.
  - The composite path must remain behaviourally unchanged.
- Assumptions:
  - The "suggest-but-wrong" production cases observed in the operator audit resulted from single-question path processing (consistent with code analysis).
  - `booking_action_required` correctly covers all cases where a booking reference URL is genuinely required; no booking-action case will lose enforcement.

## Inherited Outcome Contract

- **Why:** When a guest asks about something the hostel has no template for, the system selects the closest BM25 match and sends it as if it were correct. Staff should only see genuinely tricky cases — not false alarms from a missing threshold gate or spurious reference-link failures on routine FAQ emails.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Per-question confidence floor and category-compatibility check gate template block acceptance in `draft-generate`; below-threshold single-question emails emit `follow_up_required` with the escalation fallback sentence and no template text. `booking-issues` removed from `STRICT_REFERENCE_CATEGORIES` to eliminate false reference-link quality failures on FAQ drafts.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/brik-email-template-confidence-threshold/fact-find.md`
- Key findings used:
  - Single-question path line 1648–1650: `rankResult.selection !== "none"` includes "suggest"-level candidates without category-compatibility check.
  - Composite path correctly uses `PER_QUESTION_FLOOR = 25`, `UNHINTED_TEMPLATE_CONFIDENCE_FLOOR = 70`, and `selectQuestionTemplateCandidate` category-hint check — exact logic to mirror.
  - `booking-issues` in `STRICT_REFERENCE_CATEGORIES` (line 86–93); `booking_action_required` already correctly enforces links for booking actions.
  - `usedTemplateFallback` flag is `false` for "suggest" selections — telemetry gap.
  - TC-06-03 tests multi-question floor; TC-03-01 tests `selection === "none"` only; "suggest-but-wrong" is untested.

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Correctness — matches composite path semantics | The fix should produce identical gating logic as the already-correct path | High |
| Blast radius — minimal surface change | Other paths, the ranker internals, and multi-question behaviour must be unaffected | High |
| Testability — verifiable by unit test | The new gate must be directly unit-testable without integration setup | High |
| Telemetry completeness | Staff reviewers need a signal when the AI couldn't answer | Medium |
| Implementation simplicity | Fewer new abstractions are better; reuse existing constants and helper patterns | Medium |

## Options Considered

### Decision 1: Single-question confidence floor and category-compatibility gate

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Mirror composite-path logic inline in `handleDraftGenerateTool` | Add a local gate after `rankTemplates` returns: check `rankResult.candidates[0]` category-hint compatibility first; if incompatible or below `UNHINTED_TEMPLATE_CONFIDENCE_FLOOR = 70`, clear `selectedTemplate` and set `followUpRequired = true`. Reuse existing constants. | No new helper required; logic mirrors composite path exactly; composite path unchanged; `usedTemplateFallback = true` naturally covers the new path | Slightly more code in `handleDraftGenerateTool` | Existing hint-check logic must be faithfully copied — a unit test enforces this | Yes |
| B — Extend `rankTemplates` / `applyThresholds` to accept `categoryHint` | Push category-awareness down into `template-ranker.ts` so `rankTemplates` returns `categoryCompatible` and a higher threshold for unmatched hints | Ranker becomes self-sufficient; callers get structured signal | Template-ranker currently has no concept of scenario categories; adds cross-cutting coupling; ranker is shared by multi-question path — must not break it | Risk of unintended side effects on composite path; harder to test in isolation | No |
| C — Raise `SUGGEST_THRESHOLD` globally from 25 to 70 | Single constant change eliminates "suggest"-level results entirely | Zero new logic | Changes multi-question path behaviour; eliminates "suggest"-level results that currently work well for borderline matches | Multi-question path uses `PER_QUESTION_FLOOR = 25` separately — raising `SUGGEST_THRESHOLD` would create inconsistency | No |

**Chosen: Option A.**

### Decision 2: Eliminate false reference-link failures for `booking-issues`

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Remove `booking-issues` from `STRICT_REFERENCE_CATEGORIES` | One-line deletion from the string set constant | Zero new logic; `booking_action_required` continues to enforce links for actual booking actions; consistent with how `faq` and `general` are exempted | None | Assumes all cases needing reference enforcement are already covered by `booking_action_required` (verified: yes) | Yes |
| B — Narrow `booking-issues` classifier regex to exclude informational patterns | Edit `draft-interpret.ts` to tighten the patterns at lines 875–879 and 805–808 | Classifier becomes more precise | Classifier changes carry wider blast radius (all consumers); harder to test exhaustively; doesn't fix the root coupling between scenario tag and reference enforcement | Classifier changes could introduce new false negatives in scenarios that do require action | No |
| C — Add a `reference_required` sub-flag to `booking-issues` scenario classification | Add context-sensitive reference requirement at classification time | Most semantically precise | Requires new contract field, downstream changes in `draft-quality-check.ts`, and significant test surface expansion | Over-engineers a simple misconfiguration; the simpler fix (Option A) is fully correct given `booking_action_required` coverage | No |

**Chosen: Option A.**

## Engineering Coverage Comparison

| Coverage Area | Option A (mirror composite logic, remove booking-issues) | Option B/C (rejected) | Chosen implication |
|---|---|---|---|
| UI / visual | N/A — backend MCP tools only | N/A | N/A — no UI changes |
| UX / states | `follow_up_required = true` surfaces in draft output for below-threshold single-Q emails; staff see escalation sentence instead of wrong template | Options B/C: classifier changes could produce different `follow_up_required` patterns across both paths | `follow_up_required` on below-threshold single-Q emails; quality check no longer fails FAQ drafts with `booking-issues` tag |
| Security / privacy | N/A | N/A | N/A — no auth, PII, or exposure changes |
| Logging / observability / audit | `usedTemplateFallback = true` fires for below-threshold single-Q emails; `email_fallback_detected` telemetry emitted; learning ledger written | Option B/C: no telemetry improvement | Telemetry gap closed: "suggest-but-wrong" events now recorded alongside "none" events |
| Testing / validation | New unit tests: single-Q floor gate, category-compatibility rejection, `booking-issues` false reference failure regression | Option B/C would require broader classifier test coverage | Three new test cases; extends existing `draft-generate.test.ts` and `draft-quality-check.test.ts` patterns |
| Data / contracts | `TemplateRankResult` does not need a new field — category-compatibility check runs in caller using existing `candidates[0].template.category`; `usedTemplateFallback` semantics unchanged (still `!selectedTemplate`) | Option B would add `categoryCompatible` field | No schema changes; existing telemetry field reused |
| Performance / reliability | Category-compatibility check is a single conditional on already-resolved `candidates[0]` — negligible | N/A | No performance impact |
| Rollout / rollback | Backwards-compatible; no deploy flag; rollback is revert of two files (`draft-generate.ts`, `draft-quality-check.ts`) | N/A | Clean rollback path |

## Chosen Approach

- **Recommendation:** Apply both Option A decisions as a single bounded change: (1) add a post-`rankTemplates` category-compatibility and confidence-floor gate in `handleDraftGenerateTool`'s single-question path, mirroring `selectQuestionTemplateCandidate` semantics; (2) remove `booking-issues` from `STRICT_REFERENCE_CATEGORIES` in `draft-quality-check.ts`.
- **Why this wins:**
  - Decision 1: mirrors the already-validated composite-path logic exactly — same constants, same semantics, no new abstractions. `usedTemplateFallback` naturally handles the telemetry gap.
  - Decision 2: the root cause is a misconfigured constant (`booking-issues` in the strict set), not a classifier flaw. `booking_action_required` already provides the correct enforcement path. The fix is one-line with zero blast radius.
  - Combined, the two changes require no contract changes, no schema migrations, and no deploy coordination.
- **What it depends on:**
  - `booking_action_required` covers all cases where a booking reference URL is genuinely required — confirmed in fact-find (explicit action-verb regex at draft-interpret.ts line 766–769).
  - `policyCandidates[0]?.template.category` is accessible after `applyPolicyTemplateConstraints` (line 1636) — confirmed via `EmailTemplate.category: ScenarioCategory` at template-ranker.ts:111. `policyCandidates` is the post-policy-constraint version of `rankResult.candidates` and must be used (not `rankResult.candidates[0]`) to stay consistent with existing code.

### Rejected Approaches

- Option B (extend ranker) — adds category-awareness to a layer that is correctly category-agnostic; carries risk of side effects on the composite path.
- Option C (raise `SUGGEST_THRESHOLD`) — changes multi-question behaviour and creates inconsistency with `PER_QUESTION_FLOOR`.
- Option B for Decision 2 (narrow classifier regex) — wider blast radius than the problem requires; the coupling is in `STRICT_REFERENCE_CATEGORIES`, not in the classifier.
- Option C for Decision 2 (sub-flag on booking-issues) — over-engineers a simple misconfiguration.

### Open Questions (Operator Input Required)

None — all questions self-resolvable from the code.

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| Single-question draft generation | `rankTemplates` returns "suggest"-level candidate; `handleDraftGenerateTool` uses it as template body regardless of category match | Guest asks about topic with no template (e.g. rooftop pool) | (1) `rankTemplates` returns `selection: "suggest"`, `candidates[0]`; (2) new gate checks category-hint compatibility; (3) if incompatible or `confidence < UNHINTED_TEMPLATE_CONFIDENCE_FLOOR`, `selectedTemplate = undefined`, `usedTemplateFallback = true`; (4) escalation fallback sentence injected; (5) `email_fallback_detected` telemetry emitted; (6) learning ledger written | Multi-question composite path — unchanged; hard-rule categories (`prepayment`, `cancellation`) — unchanged; `selection === "none"` path — unchanged (already falls through to fallback) | Category-compatibility check must exactly mirror `selectQuestionTemplateCandidate` semantics — unit test must cover both `category-match + low-confidence` and `no-category-match + high-confidence` cases |
| FAQ draft quality check | FAQ draft with "booking inquiry" phrasing gets `booking-issues` scenario tag; `requiresReferenceForActionPlan` enforces reference URL; draft fails `missing_required_reference` | Guest sends FAQ email with incidental booking mention | (1) `booking-issues` scenario tag still assigned by classifier; (2) `requiresReferenceForActionPlan` checks `STRICT_REFERENCE_CATEGORIES` — `booking-issues` no longer present; (3) reference check skipped for `booking-issues` unless `bookingActionRequired === true`; (4) quality check passes for plain FAQ draft | `booking_action_required` enforcement via `missing_required_link` check — unchanged; `cancellation`, `prepayment`, `payment`, `policies`, `booking-changes` in `STRICT_REFERENCE_CATEGORIES` — unchanged | None — the only dependency is that `booking_action_required` correctly covers all booking-action cases, which is confirmed |

## Planning Handoff

- Planning focus:
  - TASK-01: Add a local gate after `policyCandidates` is computed (line 1636 of `draft-generate.ts`): check `policyCandidates[0]?.template.category` for category-hint compatibility and `policyCandidates[0]?.confidence` against `UNHINTED_TEMPLATE_CONFIDENCE_FLOOR`. If the gate fails, clear `selectedTemplate` to `undefined` (setting `usedTemplateFallback = true` naturally); add 2 unit tests (category mismatch rejection, confidence floor rejection).
  - TASK-02: Remove `booking-issues` from `STRICT_REFERENCE_CATEGORIES` in `draft-quality-check.ts`; add 1 regression unit test (FAQ + `booking-issues` scenario → no reference failure).
  - Both tasks are IMPLEMENT, code track, high confidence.
- Validation implications:
  - TASK-01 must verify: (a) below-threshold single-Q email → `follow_up_required = true`, no template text; (b) high-confidence category-matched single-Q email → unchanged behaviour; (c) `usedTemplateFallback = true` fires; (d) composite path test (TC-06-03) still passes.
  - TASK-02 must verify: (a) FAQ email with `booking-issues` tag + no booking action → quality check passes; (b) email with `booking_action_required = true` → `missing_required_link` check still fires correctly.
- Sequencing constraints:
  - TASK-01 and TASK-02 are independent — can be implemented in either order or in parallel.
  - No CHECKPOINT required — both tasks are small, risk-bounded, and unit-testable.
- Risks to carry into planning:
  - Category-compatibility gate logic must mirror `selectQuestionTemplateCandidate` semantics exactly — the unit test for TASK-01 is the primary correctness signal.
  - The `usedTemplateFallback` flag semantics must not change for existing callers (`!selectedTemplate` is still the expression — no downstream consumer changes required).

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Gate rejects templates staff rely on for borderline FAQ questions | Medium | Low | No production corpus replay available in analysis | Set gate to match composite-path semantics exactly: category hint match OR `confidence ≥ 70`; monitor `delivery_status` in production |
| `usedTemplateFallback` extension breaks downstream consumers | Low | Low | Caller audit deferred to build phase | Build task must confirm no downstream consumer uses `usedTemplateFallback = false` as an assertion before changing flag value |

## Planning Readiness

- Status: Go
- Rationale: Both decisions are fully bounded with clear entry points, confirmed evidence, and no open questions. The composite-path gate to mirror exists and is validated. The `STRICT_REFERENCE_CATEGORIES` removal is a one-line change with confirmed safe fallback. Combined effort is S + XS; CI-only test policy applies.
