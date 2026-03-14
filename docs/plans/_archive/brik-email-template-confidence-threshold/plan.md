---
Type: Plan
Status: Archived
Domain: BOS
Workstream: Engineering
Created: 2026-03-12
Last-reviewed: 2026-03-12
Last-updated: 2026-03-12
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brik-email-template-confidence-threshold
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/brik-email-template-confidence-threshold/analysis.md
---

# Email Template Confidence Threshold Plan

## Summary

Two independent code gaps allow the Brikette draft pipeline to produce misleading outputs. The single-question template selection path lacks the category-compatibility gate and confidence floor that the composite (multi-question) path already applies. Separately, `booking-issues` membership in `STRICT_REFERENCE_CATEGORIES` causes false reference-link quality failures on plain FAQ drafts. This plan closes both gaps in two small, independent tasks. TASK-01 mirrors `selectQuestionTemplateCandidate` semantics into the single-question path of `handleDraftGenerateTool`. TASK-02 removes `booking-issues` from `STRICT_REFERENCE_CATEGORIES` in `draft-quality-check.ts`. Both tasks are CI-only test track (per `docs/testing-policy.md`), confined to `packages/mcp-server/src/`, and require no schema migrations.

## Active tasks

- [x] TASK-01: Add category-compatibility gate + confidence floor to single-question path
- [x] TASK-02: Remove `booking-issues` from `STRICT_REFERENCE_CATEGORIES`

## Goals

- Gate single-question template acceptance: category-compatibility check first, then `UNHINTED_TEMPLATE_CONFIDENCE_FLOOR = 70` as fallback, mirroring `selectQuestionTemplateCandidate` semantics exactly.
- Emit `follow_up_required` with escalation fallback sentence for below-threshold single-question emails; no template text in draft body.
- Remove false reference-link quality failures for FAQ drafts that incidentally mention a booking.

## Non-goals

- Changing the BM25 algorithm, synonym table, or phrase expansions.
- Altering the multi-question composite path — it already gates correctly.
- Changing the `booking_action_required` trigger.
- Adding new email templates.

## Constraints & Assumptions

- Constraints:
  - Tests run in CI only per `docs/testing-policy.md`. No local Jest runs.
  - All changes confined to `packages/mcp-server/src/`. No schema migrations, environment variables, or data files required.
  - The composite path (`buildCompositeQuestionBlocks` / `selectQuestionTemplateCandidate`) must remain behaviourally unchanged.
- Assumptions:
  - `booking_action_required` correctly covers all cases where a booking reference URL is genuinely required (confirmed: explicit action-verb regex at draft-interpret.ts:766–769).
  - `policyCandidates[0]` is the correct variable to gate against (post-policy-constraint array, same type as `rankResult.candidates`, confirmed at draft-generate.ts:1636–1639).

## Inherited Outcome Contract

- **Why:** When a guest asks about something the hostel has no template for, the system selects the closest BM25 match and sends it as if it were correct. Staff should only see genuinely tricky cases — not false alarms from a missing threshold gate or spurious reference-link failures on routine FAQ emails.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Per-question confidence floor and category-compatibility check gate template block acceptance in `draft-generate`; below-threshold single-question emails emit `follow_up_required` with the escalation fallback sentence and no template text. `booking-issues` removed from `STRICT_REFERENCE_CATEGORIES` to eliminate false reference-link quality failures on FAQ drafts.
- **Source:** operator

## Analysis Reference

- Related analysis: `docs/plans/brik-email-template-confidence-threshold/analysis.md`
- Selected approach inherited:
  - Decision 1 — mirror composite-path logic inline in `handleDraftGenerateTool` (Option A): gate inserted after `policyCandidates` is computed; uses `resolveScenarioCategoryHints(actionPlan)` + `UNHINTED_TEMPLATE_CONFIDENCE_FLOOR`; `usedTemplateFallback = !selectedTemplate` naturally fires telemetry.
  - Decision 2 — remove `booking-issues` from `STRICT_REFERENCE_CATEGORIES` (Option A): one-line deletion; `booking_action_required` enforcement unchanged.
- Key reasoning used:
  - Option B (extend ranker) rejected: adds category-awareness coupling to a category-agnostic layer; risk of composite-path side effects.
  - Option C (raise `SUGGEST_THRESHOLD`) rejected: changes multi-question path behaviour; inconsistency with `PER_QUESTION_FLOOR`.
  - Option B for Decision 2 (narrow classifier regex) rejected: wider blast radius; root cause is constant membership, not classifier.

## Selected Approach Summary

- What was chosen:
  - TASK-01: inline gate in `handleDraftGenerateTool` mirroring `selectQuestionTemplateCandidate` (lines 1307–1329) using `resolveScenarioCategoryHints` and `candidateConfidence` helpers already in scope.
  - TASK-02: remove `"booking-issues"` from `STRICT_REFERENCE_CATEGORIES` Set (draft-quality-check.ts:92).
- Why planning is not reopening option selection:
  - Analysis confirmed both options with code evidence; no operator-only forks remain.

## Fact-Find Support

- Supporting brief: `docs/plans/brik-email-template-confidence-threshold/fact-find.md`
- Evidence carried forward:
  - Single-question path line 1648–1650: `selection !== "none"` includes "suggest"-level candidates without category check.
  - `selectQuestionTemplateCandidate` semantics (lines 1307–1329): hinted candidates first; unhinted candidates pass only if `candidateConfidence >= 70`.
  - `booking-issues` in `STRICT_REFERENCE_CATEGORIES` at draft-quality-check.ts:92 confirmed by direct read.
  - `usedTemplateFallback = !selectedTemplate` (line 1529): fires `email_fallback_detected` telemetry at line 1675.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add category-compatibility gate + confidence floor to single-question path | 85% | S | Complete (2026-03-13) | - | - |
| TASK-02 | IMPLEMENT | Remove `booking-issues` from `STRICT_REFERENCE_CATEGORIES` | 90% | S | Complete (2026-03-13) | - | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A | - | No UI changes; backend MCP tools only |
| UX / states | `follow_up_required = true` in draft output for below-threshold single-Q emails; quality check no longer fails FAQ + `booking-issues` drafts | TASK-01, TASK-02 | Staff-visible: escalation sentence instead of wrong template |
| Security / privacy | N/A | - | No auth, PII, or exposure changes |
| Logging / observability / audit | `usedTemplateFallback = true` fires `email_fallback_detected` telemetry and writes learning ledger for below-threshold single-Q emails | TASK-01 | Telemetry gap closed for "suggest-but-wrong" case |
| Testing / validation | New unit tests: TC-01-01–TC-01-05 (single-Q gate rejection, category mismatch, confidence floor, hinted-best-pick, unhinted-floor-pass), TC-02-01–TC-02-03 (booking-issues false reference regression, booking-action enforcement, other strict categories unchanged) | TASK-01, TASK-02 | CI-only per testing policy; 8 new test cases total |
| Data / contracts | `TemplateRankResult` unchanged; `usedTemplateFallback` semantics unchanged (`!selectedTemplate`); no schema changes | TASK-01, TASK-02 | No downstream consumer contract changes required |
| Performance / reliability | Gate is a single conditional on already-resolved `policyCandidates[0]` — negligible latency impact | TASK-01 | N/A |
| Rollout / rollback | Backwards-compatible; no deploy flag; rollback is revert of `draft-generate.ts` + `draft-quality-check.ts` | TASK-01, TASK-02 | Clean rollback |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Both independent; can run in same build cycle |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| Single-question draft generation | Guest asks about topic with no matching template (e.g. rooftop pool) | (1) `rankTemplates` returns `selection: "suggest"`, `policyCandidates[0]` with category `check-in`, confidence 45; (2) gate calls `resolveScenarioCategoryHints(actionPlan)` → `{"faq"}`; (3) `policyCandidates[0].template.category === "check-in"` not in hints; (4) `candidateConfidence(policyCandidates[0]) = 45 < 70`; (5) `selectedTemplate = undefined`; (6) `usedTemplateFallback = true`; (7) escalation fallback sentence in body; (8) `email_fallback_detected` telemetry emitted; (9) learning ledger written | TASK-01 | Gate must mirror `selectQuestionTemplateCandidate` exactly; unit tests are primary correctness signal |
| FAQ draft quality check | Guest FAQ email with "booking inquiry" phrasing | (1) classifier assigns `booking-issues` tag at 0.74; (2) `requiresReferenceForActionPlan` checks `STRICT_REFERENCE_CATEGORIES`; (3) `booking-issues` no longer present; (4) reference check skipped since `bookingActionRequired = false`; (5) quality check passes; (6) `booking_action_required` enforcement at line 517 unchanged | TASK-02 | None — `booking_action_required` confirmed to cover all booking-action cases |

## Tasks

---

### TASK-01: Add category-compatibility gate + confidence floor to single-question path

- **Type:** IMPLEMENT
- **Deliverable:** Code change to `packages/mcp-server/src/tools/draft-generate.ts` + new unit tests in `packages/mcp-server/src/__tests__/draft-generate.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `packages/mcp-server/src/tools/draft-generate.ts`, `packages/mcp-server/src/__tests__/draft-generate.test.ts`, `[readonly] packages/mcp-server/src/utils/template-ranker.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — entry point confirmed (lines 1636–1650); `selectQuestionTemplateCandidate` semantics fully read (lines 1307–1329); `candidateConfidence` helper at line 1303; `resolveScenarioCategoryHints` at line 1286; `UNHINTED_TEMPLATE_CONFIDENCE_FLOOR = 70` at line 1284; all in same function scope.
  - Approach: 90% — gate mirrors existing validated composite-path logic exactly; no new abstractions; `usedTemplateFallback = !selectedTemplate` fires telemetry automatically.
  - Impact: 80% — confirms single-Q emails with mismatched templates produce `follow_up_required`; held-back test: "What single unknown would drop impact below 80?" — `resolveScenarioCategoryHints` must return a non-empty set for FAQ emails; empty set would cause all non-hinted emails to fall through to the confidence-floor check, which is correct behaviour.
- **Acceptance:**
  - [ ] Below-threshold single-Q email (category mismatch, low confidence) → `follow_up_required = true` in draft output; escalation fallback sentence in body; no template text; `usedTemplateFallback = true`.
  - [ ] Below-threshold single-Q email (no category-hinted candidates, confidence < 70) → same outcome as above.
  - [ ] High-confidence category-matched single-Q email → template selected; unchanged behaviour.
  - [ ] Single-Q email with no hinted candidates, confidence ≥ 70 → template accepted (unhinted floor pass).
  - [ ] Multi-question composite path: TC-06-03 still passes (composite path unchanged).
  - [ ] `email_fallback_detected` telemetry event fired for below-threshold single-Q email.
- **Engineering Coverage:**
  - UI / visual: N/A — backend tool change only.
  - UX / states: Required — `follow_up_required = true` must surface in draft output; escalation sentence in body; no template text.
  - Security / privacy: N/A — no auth or data exposure changes.
  - Logging / observability / audit: Required — `usedTemplateFallback = true` fires `email_fallback_detected` telemetry; learning ledger written.
  - Testing / validation: Required — TC-01-01 through TC-01-05 (5 new cases); TC-06-03 regression.
  - Data / contracts: Required — confirm no new fields added to `TemplateRankResult`; `usedTemplateFallback` semantics unchanged (`!selectedTemplate`).
  - Performance / reliability: N/A — single conditional on already-resolved value.
  - Rollout / rollback: Required — backwards-compatible; rollback = revert `draft-generate.ts`.
- **Validation contract (TC-01):**
  - TC-01-01: Single-Q email, category hint `faq`, top `policyCandidates[0].template.category = "check-in"`, confidence 45 → gate rejects → draft body = escalation sentence, `follow_up_required = true`, `usedTemplateFallback = true`.
  - TC-01-02: Single-Q email, no category-hinted candidates, `policyCandidates[0].confidence = 45` (below 70) → gate rejects → same outcome as TC-01-01.
  - TC-01-03: Single-Q email, category-hinted candidate at index 1 (best hinted confidence > `policyCandidates[0]`) → gate picks the best hinted candidate via `reduce`, not `policyCandidates[0]`; `selectedTemplate` = best hinted template; `usedTemplateFallback = false`; draft body = hinted template content.
  - TC-01-04: Single-Q email, no hinted candidates, `policyCandidates[0].confidence = 80` (above floor) → `selectedTemplate` = top candidate; `usedTemplateFallback = false`.
  - TC-01-05 (regression): Multi-question email with unknown sub-question (TC-06-03 equivalent) → composite path still returns `followUpRequired: true` for unknown sub-question; `selectedTemplate` for other questions unchanged.
- **Execution plan:**
  - Red: Write failing unit test TC-01-01 — single-Q email with mismatched category, confidence 45 → assert `follow_up_required = true`. Test will fail because current code uses template regardless.
  - Green: After `policyCandidates` is computed (line 1639), compute `gatedTemplate` mirroring `selectQuestionTemplateCandidate` semantics exactly: (1) call `resolveScenarioCategoryHints(actionPlan)` to get `categoryHints`; (2) filter `policyCandidates` to `hintedCandidates` where `categoryHints.has(candidate.template.category)`; (3) if `hintedCandidates.length > 0`, pick best via `hintedCandidates.reduce((best, cur) => candidateConfidence(cur) > candidateConfidence(best) ? cur : best)?.template`; (4) else if `policyCandidates[0]` exists and `candidateConfidence(policyCandidates[0]) >= UNHINTED_TEMPLATE_CONFIDENCE_FLOOR`, use `policyCandidates[0].template`; (5) else `gatedTemplate = undefined`. Replace the `selectedTemplate` ternary at line 1648–1650: `const selectedTemplate = agreementTemplate ?? availabilityTemplate ?? (rankResult.selection !== "none" ? gatedTemplate : undefined)`. Run TC-01-01 through TC-01-05 + TC-06-03 regression.
  - Refactor: Confirm `candidateConfidence` helper is reused directly (not inlined); verify `resolveScenarioCategoryHints` is called once and result reused.
- **Planning validation:**
  - Checks run: read `selectQuestionTemplateCandidate` (lines 1307–1329), `candidateConfidence` (1303–1305), `resolveScenarioCategoryHints` (1286–1301), `UNHINTED_TEMPLATE_CONFIDENCE_FLOOR` (1284), `policyCandidates` assignment (1636–1639), `selectedTemplate` ternary (1648–1650), `buildInitialDraftBody` using `selectedTemplate` (1504–1531).
  - Validation artifacts: fact-find lines 90–93 (single-Q gap); analysis `Planning Handoff` TASK-01 bullet; `selectQuestionTemplateCandidate` source (1307–1329).
  - Unexpected findings: `resolveScenarioCategoryHints` exists and is already in scope — no new helper needed. `candidateConfidence` accounts for `adjustedConfidence ?? confidence` — must use this helper, not raw `.confidence`.
- **Scouts:**
  - Confirm `resolveScenarioCategoryHints(actionPlan)` handles both `actionPlanVersion: "1.1.0"` (scenarios array) and v1.0.0 (single scenario) correctly — confirmed at lines 1290–1294.
  - Confirm `policyCandidates` can be empty after `applyPolicyTemplateConstraints` — `policyCandidates[0]` would be `undefined`; gate must handle `undefined` gracefully (already handled by optional chaining).
- **Edge Cases & Hardening:**
  - `policyCandidates` is empty → `policyCandidates[0]` is `undefined`; gate returns "reject" (no template); `selectedTemplate = undefined`; escalation fires. Correct.
  - `agreementTemplate` or `availabilityTemplate` are set → those take priority before the BM25 path; gate does not affect them. Correct.
  - Category-hinted candidate exists but has confidence 0 → still accepted (matches `selectQuestionTemplateCandidate` semantics: hinted candidates are accepted regardless of confidence). Correct.
- **What would make this >=90%:**
  - Integration test replaying the "rooftop pool" operator audit email through the full pipeline to confirm `follow_up_required = true` in the actual draft output.
- **Rollout / rollback:**
  - Rollout: standard CI deploy; no feature flag; no migration.
  - Rollback: `git revert` of `draft-generate.ts`; composite path unaffected.
- **Documentation impact:**
  - None: no public API changes; internal MCP tool behaviour.
- **Notes / references:**
  - `selectQuestionTemplateCandidate` source: draft-generate.ts lines 1307–1329.
  - `candidateConfidence` helper: draft-generate.ts lines 1303–1305 — must use this, not `.confidence` directly.
  - `resolveScenarioCategoryHints`: draft-generate.ts lines 1286–1301.
  - `UNHINTED_TEMPLATE_CONFIDENCE_FLOOR = 70`: draft-generate.ts line 1284.
  - `policyCandidates` variable: draft-generate.ts lines 1636–1639 (post-policy-constraint array).
  - `usedTemplateFallback` cascade: `buildInitialDraftBody` line 1529 → telemetry line 1675.

---

### TASK-02: Remove `booking-issues` from `STRICT_REFERENCE_CATEGORIES`

- **Type:** IMPLEMENT
- **Deliverable:** Code change to `packages/mcp-server/src/tools/draft-quality-check.ts` + new unit test
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `packages/mcp-server/src/tools/draft-quality-check.ts`, `packages/mcp-server/src/__tests__/draft-quality-check.test.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — one-line removal of `"booking-issues"` from `STRICT_REFERENCE_CATEGORIES` Set at line 92; confirmed by direct read.
  - Approach: 90% — `booking_action_required` confirmed to enforce links for actual booking actions (line 517–519); removing `booking-issues` from strict set leaves the `bookingActionRequired` enforcement path intact.
  - Impact: 90% — `requiresReferenceForActionPlan` at line 347 confirmed: if `!bookingActionRequired && !STRICT_REFERENCE_CATEGORIES.has(category)` → skips reference enforcement. Removing `booking-issues` from the set achieves the desired outcome.
  - Held-back test for Impact 90%: "What single unknown would drop impact below 80?" — a `booking-issues` template with `reference_scope: reference_required` in data file could create a separate enforcement path. Read `policyByCategory.get("booking-issues")` result — if `policy.requiresReference` is also checked independently, the removal could still fail. This is addressed by TC-02-03 regression.
- **Acceptance:**
  - [ ] FAQ email with `booking-issues` scenario tag, no `booking_action_required` → quality check passes (no `missing_required_reference`, no `reference_not_applicable` failure).
  - [ ] Email with `booking_action_required = true` and `booking-issues` scenario → `missing_required_link` still fires when no link present (enforcement unchanged).
  - [ ] Email with `cancellation` scenario → `missing_required_reference` still fires (other strict categories unchanged).
  - [ ] Regression: no other scenario categories removed from `STRICT_REFERENCE_CATEGORIES`.
- **Engineering Coverage:**
  - UI / visual: N/A — backend tool change only.
  - UX / states: Required — quality check must no longer fail FAQ drafts with `booking-issues` tag when `booking_action_required = false`.
  - Security / privacy: N/A — no auth or data exposure changes.
  - Logging / observability / audit: N/A — no telemetry changes; quality check result already logged by caller.
  - Testing / validation: Required — TC-02-01 through TC-02-03 (see below).
  - Data / contracts: Required — confirm `STRICT_REFERENCE_CATEGORIES` change does not affect any other callers; confirm `loadCategoryReferencePolicy` path for `booking-issues` still returns a policy object (removal is from Set constant, not from policy data).
  - Performance / reliability: N/A — `Set.has()` on a smaller Set; negligible.
  - Rollout / rollback: Required — backwards-compatible; rollback = revert `draft-quality-check.ts`.
- **Validation contract (TC-02):**
  - TC-02-01: Draft with `booking-issues` resolved scenario, `booking_action_required = false`, no URL in draft body → `failed_checks` does not contain `missing_required_reference` or `reference_not_applicable`.
  - TC-02-02: Draft with `booking_action_required = true`, `booking-issues` scenario, no URL → `failed_checks` contains both `missing_required_link` (line 517 path) AND `missing_required_reference` (policy path via `requiresReferenceForActionPlan` — `!bookingActionRequired` is `false` so `continue` is NOT taken, policy IS checked). Both enforcement paths must remain active.
  - TC-02-03: Draft with `cancellation` scenario, `booking_action_required = false`, no URL → `failed_checks` still contains `missing_required_reference` (other strict categories unchanged).
- **Execution plan:**
  - Red: Write failing unit test TC-02-01 — FAQ draft with `booking-issues` scenario, no `booking_action_required`, no URL → assert `failed_checks` does NOT contain `missing_required_reference`. Test will fail because `booking-issues` is currently in the strict set.
  - Green: Remove `"booking-issues"` from `STRICT_REFERENCE_CATEGORIES` Set at line 92. Verify TC-02-01 passes.
  - Refactor: Run TC-02-02 and TC-02-03 to confirm regressions are clear.
- **Planning validation:**
  - Checks run: read `STRICT_REFERENCE_CATEGORIES` (lines 86–93); `requiresReferenceForActionPlan` (lines 330–367); `missing_required_link` check (lines 517–519); `loadCategoryReferencePolicy` path to confirm per-category policy data is separate from the Set constant.
  - Validation artifacts: fact-find lines 109–115 (false reference mechanism); draft-quality-check.ts:86–93 (STRICT_REFERENCE_CATEGORIES).
  - Unexpected findings: `booking-issues` appears in word-count logic at draft-quality-check.ts:183 (`{ min: 80, max: 140 }`) — this is the word-count guidance, separate from reference enforcement. The word-count check remains unchanged; TASK-02 only touches the `STRICT_REFERENCE_CATEGORIES` Set.
- **Scouts:**
  - Confirmed: `requiresReferenceForActionPlan` (lines 347–349) skips the `policyByCategory.get(category)` call entirely when `!bookingActionRequired && !STRICT_REFERENCE_CATEGORIES.has(category)`. Even if `data/email-templates.json` has `reference_scope: "reference_required"` on `booking-issues` templates, that policy is never reached for emails without `bookingActionRequired = true`. The Set-membership check gates the policy lookup. Removing from the Set is therefore sufficient for the FAQ case.
  - `booking-issues` appears in word-count logic at draft-quality-check.ts:183 (`{ min: 80, max: 140 }`) — this is the word-count guidance, separate from reference enforcement. Word-count check is unchanged.
- **Edge Cases & Hardening:**
  - `booking-issues` scenario with explicit URL already in draft → quality check already passes today; no regression.
  - Multiple scenarios including both `booking-issues` and `cancellation` → `cancellation` still in strict set; reference enforcement still fires for `cancellation`. Correct.
  - `booking_action_required = true` with `booking-issues` scenario → `!bookingActionRequired = false` → condition at line 347 is false → policy IS checked → if `policy.requiresReference = true`, reference IS required. Booking-action enforcement unchanged.
- **What would make this >=95%:**
  - No blocking unknowns remain. Scout confirmation above resolves the prior remaining assumption. Confidence limited by test-only verification path (CI).
- **Rollout / rollback:**
  - Rollout: standard CI deploy; no feature flag; no migration.
  - Rollback: `git revert` of `draft-quality-check.ts`.
- **Documentation impact:**
  - None: internal quality check logic; no public API changes.
- **Notes / references:**
  - `STRICT_REFERENCE_CATEGORIES` Set: draft-quality-check.ts lines 86–93.
  - `requiresReferenceForActionPlan`: draft-quality-check.ts lines 330–367.
  - `missing_required_link` (booking action enforcement): draft-quality-check.ts lines 517–519.
  - Word-count guidance for `booking-issues` (unchanged): draft-quality-check.ts line 183.

---

## Risks & Mitigations

- Gate rejects templates staff rely on for borderline FAQ questions: mitigated by mirroring composite-path semantics exactly (category-hinted candidates accepted regardless of confidence; unhinted accepted at ≥70); monitor `delivery_status` post-deploy.
- `policyCandidates[0]` undefined (empty after policy constraints): handled gracefully — gate treats undefined as "no candidate" → rejects → escalation fires.
- `booking-issues` templates have `reference_scope: "reference_required"` in data, but this is not a risk: `requiresReferenceForActionPlan` skips the policy lookup entirely via `continue` at line 347–349 when `!bookingActionRequired`. The policy data is only reached when `bookingActionRequired = true`, which is the desired enforcement path.

## Observability

- Logging: `email_fallback_detected` telemetry event (existing mechanism) now fires for "suggest-but-wrong" single-Q emails as well as "none" results.
- Metrics: Monitor `delivery_status` distribution in signal-events.jsonl after deploy for first week.
- Alerts/Dashboards: No new alerts required; existing fallback monitoring covers the new path.

## Acceptance Criteria (overall)

- [ ] TC-01-01 through TC-01-05 pass in CI.
- [ ] TC-02-01 through TC-02-03 pass in CI.
- [ ] Composite path test (TC-06-03) still passes.
- [ ] No regressions in `draft-generate.test.ts` or `draft-quality-check.test.ts` existing test suites.
- [ ] `email_fallback_detected` telemetry fires for below-threshold single-Q email (TC-01-01).

## Decision Log

- 2026-03-12: Decision 1 — mirror composite-path logic inline (Option A). Option B (extend ranker) rejected: adds category coupling. Option C (raise `SUGGEST_THRESHOLD`) rejected: changes composite-path behaviour.
- 2026-03-12: Decision 2 — remove `booking-issues` from `STRICT_REFERENCE_CATEGORIES` (Option A). Options B/C rejected: wider blast radius, over-engineering.
- 2026-03-12: `policyCandidates[0]` confirmed as correct variable (not `rankResult.candidates[0]`) — post-policy-constraint array at line 1636.
- 2026-03-12: `candidateConfidence(candidate)` helper must be used (not `.confidence` directly) to account for `adjustedConfidence ?? confidence`.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Category-compatibility gate | Yes — `resolveScenarioCategoryHints`, `candidateConfidence`, `UNHINTED_TEMPLATE_CONFIDENCE_FLOOR`, `policyCandidates` all confirmed in scope at line 1636+ | None | No |
| TASK-02: Remove `booking-issues` from STRICT set | Yes — Set constant at line 92 confirmed; `requiresReferenceForActionPlan` sole consumer confirmed; policy lookup gated by `STRICT_REFERENCE_CATEGORIES.has(category)` at line 347 — removing from Set sufficient even with `reference_scope: reference_required` in data | None | No |

## Overall-confidence Calculation

- TASK-01: 85%, Effort S=1
- TASK-02: 90%, Effort S=1
- Overall-confidence = (85 × 1 + 90 × 1) / (1 + 1) = 87.5 → **85%** (downward bias per scoring rules)
