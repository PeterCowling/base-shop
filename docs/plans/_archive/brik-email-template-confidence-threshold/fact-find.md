---
Type: Fact-Find
Outcome: planning
Status: Ready-for-analysis
Domain: BOS
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: brik-email-template-confidence-threshold
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Dispatch-ID: IDEA-DISPATCH-20260306090000-0002
Delivery-Readiness: 88
---

# Fact-Find: Brikette — AI confident reply when it doesn't know the answer

## Scope

### Summary

Two related bugs in the Brikette email pipeline allow confident-looking draft replies when the AI does not have a relevant template, and trigger false quality failures on plain FAQ drafts that casually mention a booking.

1. **Confident selection of mismatched templates (single-question path)** — when a guest asks about something not covered by any template (e.g. "Do you have a rooftop pool?"), the BM25 ranker may still return a "suggest"-level candidate (score 25–79) whose template body is unrelated. The single-question code path uses that template as the reply body with no further gate. Staff see a fluent response that answers the wrong question.

2. **False reference-link quality failures on FAQ drafts** — the scenario classifier fires `booking-issues` at confidence 0.74 when text contains "booking inquiry" or "capacity clarification". `booking-issues` is in `STRICT_REFERENCE_CATEGORIES`, so the quality check demands a reference URL even when no booking action was requested. A plain FAQ reply with no URL fails `missing_required_reference`.

### Goals

- Gate single-question template acceptance with a category-compatibility check and a per-question confidence floor matching the floor already in place for multi-question emails.
- When no template clears the gate, emit `follow_up_required` (the escalation fallback sentence) rather than silently using a mismatched template.
- Remove `booking-issues` from `STRICT_REFERENCE_CATEGORIES` (or narrow its pattern) so informational mentions of "booking" do not trigger reference-link enforcement.

### Non-goals

- Changing the BM25 algorithm, synonym table, or phrase expansions.
- Altering the multi-question (composite) path — it already gates correctly via `PER_QUESTION_FLOOR` and `UNHINTED_TEMPLATE_CONFIDENCE_FLOOR`.
- Changing the `booking_action_required` trigger — it is already correctly scoped to explicit operational actions.
- Adding new email templates.

### Constraints and Assumptions

- Tests run in CI only per `docs/testing-policy.md`. No local Jest runs.
- All changes are confined to `packages/mcp-server/src/`. No schema migrations, data files, or environment variables required.
- The fix must preserve the existing multi-question composite path behaviour unchanged.
- `booking_action_required` gates the booking CTA button and `missing_required_link` check — both already correct. Do not conflate with `booking_context`.

## Outcome Contract

- **Why:** When a guest asks about something the hostel has no template for, the system selects the closest BM25 match and sends it as if it were correct. Staff should only see genuinely tricky cases — not false alarms from a missing threshold gate or spurious reference-link failures on routine FAQ emails.
- **Intended Outcome:** Per-question confidence floor and category-compatibility check gate template block acceptance in `draft-generate`; below-threshold single-question emails emit `follow_up_required` with the escalation fallback sentence and no template text. `booking-issues` removed from `STRICT_REFERENCE_CATEGORIES` (or its scenario-classifier pattern narrowed) to eliminate false reference-link quality failures on FAQ drafts.
- **Source:** operator

## Access Declarations

Local code only — no external API calls, no network dependencies. All relevant files are in `packages/mcp-server/`.

## Current Process Map

### Step 1 — Email enters via `draft_interpret`

File: `packages/mcp-server/src/tools/draft-interpret.ts`

- Thread normalised, language detected, intents extracted.
- `classifyAllScenarios` (line 781) runs keyword rules producing a `ScenarioClassification[]` ordered by confidence. Falls back to `[{ category: "general", confidence: 0.6 }]` when nothing matches (line 897–899).
- `detectWorkflowTriggers` (line 764) sets:
  - `booking_action_required` — narrow regex requiring explicit action verbs paired with a booking noun: `/(cancel|modify|change|...) (my )?(booking|reservation)/` or `/(i would like to book|please reserve|.../`. Does NOT fire on casual mentions.
  - `booking_context` — wide regex `/(reservation|booking)/` — fires on ANY mention of either word including informational context ("I have a booking — do you serve breakfast?").
- Returns `EmailActionPlan` JSON.

### Step 2 — Draft composed by `draft_generate`

File: `packages/mcp-server/src/tools/draft-generate.ts`

- Primary scenario category resolved from `actionPlan.scenarios[0]` (v1.1.0) or `actionPlan.scenario` (v1.0.0) (line 1612–1616).
- `rankTemplates` called with combined `subject + body` query and `categoryHint = primaryScenarioCategory` (line 1627–1633).

**`rankTemplates` (template-ranker.ts line 368):**
- Hard-rules shortcut for `prepayment` / `cancellation` (line 375–376) — correct and unchanged.
- Otherwise: BM25 over all templates, synonym expansion, `applyThresholds` (line 285–316).
- `applyThresholds` constants: `AUTO_THRESHOLD = 80`, `SUGGEST_THRESHOLD = 25` (line 147–148).
- Returns `selection: "auto" | "suggest" | "none"` based on top candidate's adjusted/raw confidence.
- **No per-category compatibility check. No per-question floor. Any candidate above 25 can win.**

**Single-question path (line 1648–1650):**
- `selectedTemplate = rankResult.selection !== "none" ? policyCandidates[0]?.template : undefined`
- "suggest"-level candidates (confidence 25–79) are used identically to "auto"-level candidates.
- `usedTemplateFallback = !selectedTemplate` — is `false` for "suggest" level. Telemetry event `email_fallback_detected` not emitted. Learning ledger not written.

**Multi-question path (line 1351–1366) — correctly gated:**
- `buildCompositeQuestionBlocks` → `rankTemplatesPerQuestion` per question.
- `rankTemplatesPerQuestion` filters candidates below `PER_QUESTION_FLOOR = 25` (template-ranker.ts line 449–453).
- `selectQuestionTemplateCandidate` (line 1307–1329) checks category-hint compatibility first; falls back to top candidate only if above `UNHINTED_TEMPLATE_CONFIDENCE_FLOOR = 70`.
- When candidates empty or no candidate qualifies: `answer: ""`, `followUpRequired: true`, escalation fallback sentence injected.

**`includeBookingLink` (line 1759–1760):**
- `actionPlan.workflow_triggers.booking_action_required && !agreementTemplate`
- Correctly uses `booking_action_required`, not `booking_context`.

### Step 3 — Quality validated by `draft_quality_check`

File: `packages/mcp-server/src/tools/draft-quality-check.ts`

- `missing_required_link` check (line 517–519): fires if `booking_action_required && !containsAnyLink`. Correctly gated.
- `requiresReferenceForActionPlan` (line 330–367):
  - Skips `faq` and `general` categories (line 344–346).
  - For all other categories: enforces a reference link if `bookingActionRequired` OR if the category is in `STRICT_REFERENCE_CATEGORIES = {"cancellation", "prepayment", "payment", "policies", "booking-changes", "booking-issues"}` (line 347–349).
  - `booking-issues` membership causes reference enforcement for any email that receives the `booking-issues` scenario tag — regardless of whether a booking action was requested.
- Scenario classifier fires `booking-issues` at confidence 0.74 for `/(booking issue|reservation issue|why cancelled|booking inquiry|capacity clarification)/` (draft-interpret.ts line 875–879) and at 0.86 for availability-check patterns (line 805–808). Both patterns appear in FAQ emails.
- Result: a plain FAQ draft with no URL fails `missing_required_reference` or `reference_not_applicable` when scenario resolves to `booking-issues`.

## Evidence Audit (Current State)

### Entry Points and Key Evidence

| File | Location | Finding |
|---|---|---|
| `packages/mcp-server/src/utils/template-ranker.ts` | Line 147–149 | `AUTO_THRESHOLD = 80`, `SUGGEST_THRESHOLD = 25`, `PER_QUESTION_FLOOR = 25`. No category-compatibility check in `applyThresholds`. |
| `packages/mcp-server/src/utils/template-ranker.ts` | Line 427–457 | `rankTemplatesPerQuestion` filters below `PER_QUESTION_FLOOR` — protection exists only for multi-question path. |
| `packages/mcp-server/src/tools/draft-generate.ts` | Line 1283–1284 | `UNHINTED_TEMPLATE_CONFIDENCE_FLOOR = 70` — applied only in the composite path. |
| `packages/mcp-server/src/tools/draft-generate.ts` | Line 1648–1650 | Template selected if `selection !== "none"` — includes "suggest"-level candidates without category-compatibility check. |
| `packages/mcp-server/src/tools/draft-generate.ts` | Line 1355 | `buildCompositeQuestionBlocks` returns `[]` when `questions.length < 2` — single-question emails bypass per-question floor and category-hint check entirely. |
| `packages/mcp-server/src/tools/draft-generate.ts` | Line 1526–1531 | `usedTemplateFallback = !selectedTemplate` — false for "suggest" selection; telemetry not fired; learning ledger not written. |
| `packages/mcp-server/src/tools/draft-interpret.ts` | Line 774 | `booking_context: /(reservation|booking)/.test(lower)` — fires on any informational mention. |
| `packages/mcp-server/src/tools/draft-interpret.ts` | Line 875–879 | Scenario classifier: `booking-issues` at 0.74 on `/(booking issue|reservation issue|why cancelled|booking inquiry|capacity clarification)/`. |
| `packages/mcp-server/src/tools/draft-interpret.ts` | Line 805–808 | Scenario classifier: `booking-issues` at 0.86 for availability-check patterns — also common in FAQ emails. |
| `packages/mcp-server/src/tools/draft-quality-check.ts` | Line 86–93 | `STRICT_REFERENCE_CATEGORIES` includes `booking-issues`. |
| `packages/mcp-server/src/tools/draft-quality-check.ts` | Line 344–349 | `requiresReferenceForActionPlan` enforces strict reference for `booking-issues` even when `booking_action_required` is `false`. |

### Patterns and Conventions Observed

- Multi-question path correctly applies `PER_QUESTION_FLOOR = 25` and `UNHINTED_TEMPLATE_CONFIDENCE_FLOOR = 70`. Single-question path has no equivalent.
- `usedTemplateFallback` is the existing mechanism for signalling "AI didn't know the answer" — it must be extended or supplemented to cover the "suggest-but-wrong" case.
- Hard-rule categories (`prepayment`, `cancellation`) are unaffected — their selection bypasses BM25 entirely.

### Synonym Amplification

`SYNONYMS` in template-ranker.ts (line 179–181):
- `pool → ["swimming", "swim", "rooftop", "facility", "amenity"]`
- `facility → ["facilities", "amenity", "amenities", "pool", "gym", "sauna", "services"]`

These expansions inject terms that appear in unrelated templates, pushing BM25 scores above `SUGGEST_THRESHOLD` for semantically unrelated questions. This is why "rooftop pool" can produce a "suggest"-level result even though no template covers it.

### Data and Contracts

- `TemplateRankResult` interface (template-ranker.ts line 134–139): `selection`, `confidence`, `candidates`, `reason`. No `categoryCompatible` field.
- `TemplateCandidate` interface (template-ranker.ts line 123–132): `template`, `score`, `confidence`, `evidence`, `matches`, optional `adjustedScore`/`adjustedConfidence`.
- `QuestionAnswerBlock` type (draft-generate.ts line 262–271): `followUpRequired: boolean`. This field already signals unknown-answer in the composite path.

### Test Landscape

| Area | Test Type | File | Coverage Notes |
|---|---|---|---|
| `rankTemplatesPerQuestion` rooftop pool (multi-Q) | Unit | `template-ranker.test.ts` TC-06-03 | Confirms `candidates: []` below floor — multi-Q path only |
| `draft_generate` rooftop pool (single-Q) | Unit | `draft-generate-telemetry.test.ts` TC-03-01 | Tests only the `selection === "none"` case (fixture has 0-score template); "suggest-but-wrong" case untested |
| `booking-issues` reference enforcement | Unit | `draft-quality-check.test.ts` (to be checked) | Gap suspected — no test for FAQ + `booking-issues` scenario → false reference failure |

### Dependency and Impact Map

- Upstream: `rankTemplates` (template-ranker.ts) → `handleDraftGenerateTool` (draft-generate.ts) → `runChecks` (draft-quality-check.ts).
- Downstream: output field `template_used.selection` in draft-generate response; `failed_checks` array in quality result.
- Blast radius: confined to `template-ranker.ts`, `draft-generate.ts`, `draft-quality-check.ts`, and their corresponding test files. No cross-package dependencies.

## Engineering Coverage Matrix

| Layer | Required | Notes |
|---|---|---|
| UI / visual | N/A | No UI changes; this is a backend MCP tool change |
| UX / states | Required | The `follow_up_required` state must surface correctly in the draft output for below-threshold single-question emails |
| Security / privacy | N/A | No authentication, data exposure, or PII handling changes |
| Logging / observability / audit | Required | `usedTemplateFallback` telemetry should fire for "suggest-but-wrong" as well as "none" cases; consider new flag or extend existing mechanism |
| Testing / validation | Required | New unit tests for single-question floor gating, category-compatibility rejection, and `booking-issues` false reference failure |
| Data / contracts | Required | `TemplateRankResult` may need a `categoryCompatible` boolean field; `TemplateCandidate` unchanged |
| Performance / reliability | N/A | BM25 already runs; adding a category-compatibility filter is a trivial array filter with no latency impact |
| Rollout / rollback | Required | All changes are backwards-compatible; no deploy flag required; rollback is a revert of three files |

## Key Findings

1. **Single-question path has no per-question confidence floor.** `rankTemplates` returns `selection: "suggest"` for any BM25 confidence ≥ 25. `draft_generate` treats "suggest" identically to "auto" when selecting the template — no gate rejects a mismatched template.

2. **No category compatibility check in the single-question path.** `selectQuestionTemplateCandidate` (which checks category hints) is only invoked from `buildCompositeQuestionBlocks`. The single-question path uses `rankResult.candidates[0]?.template` directly. A `check-in` template can "win" for a rooftop-pool question.

3. **"Suggest" level produces no fallback signal.** `usedTemplateFallback` is `false` when `selection === "suggest"`. Telemetry event `email_fallback_detected` is not emitted; the learning ledger is not written. Staff reviewers get no flag that the draft may be answering the wrong question.

4. **Synonym expansion causes spurious matches.** `pool → facility → amenity` expansion injects terms that appear in unrelated templates, pushing BM25 scores above `SUGGEST_THRESHOLD` for semantically unrelated questions.

5. **`booking-issues` in `STRICT_REFERENCE_CATEGORIES` causes false reference failures.** The scenario classifier fires `booking-issues` at confidence 0.74–0.86 for patterns common in FAQ emails (availability questions, "booking inquiry" phrasing). When `booking-issues` is in the resolved scenario list, `requiresReferenceForActionPlan` demands a reference URL — failing the quality check on a plain FAQ draft.

6. **The composite path correctly gates unknown questions.** `rankTemplatesPerQuestion` + `selectQuestionTemplateCandidate` + `UNHINTED_TEMPLATE_CONFIDENCE_FLOOR = 70` collectively produce `followUpRequired: true` for multi-question emails with an unknown sub-question. The single-question path has no equivalent protection.

7. **TC-06-03 confirms per-question floor works** — uses "rooftop pool" and verifies `candidates: []` in the composite path. The gap is the single-question code path.

8. **`booking_action_required` is already well-scoped.** The regex (line 766–769) requires explicit action verbs paired with a booking noun. Plain informational mentions do not fire it. This trigger is correct and should not be changed.

9. **No category-compatibility type or output field exists.** `TemplateRankResult` has no `categoryCompatible` boolean, so callers cannot inspect whether the winning template's category matched the scenario hint.

10. **"Suggest-but-wrong" scenario is untested.** TC-03-01 in `draft-generate-telemetry.test.ts` uses a fixture where `selection === "none"`. The case where a template scores 25–79 and is selected despite category mismatch has no test coverage.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Category-compatibility gate may reject templates staff currently rely on for borderline FAQ questions | Medium | Low | Set the gate to match the existing composite-path behaviour: category hint match OR confidence ≥ 70 |
| Removing `booking-issues` from `STRICT_REFERENCE_CATEGORIES` may miss drafts that genuinely need a reference | Low | Low | `booking_action_required` still gates the `missing_required_link` check; booking actions remain enforced |
| Synonym expansion amplification is not fixed by this change — adjacent-topic questions may still get spurious "suggest" results | Medium | Low | Mitigated by the new confidence floor gate; spurious candidates above floor will be caught by category-compatibility check |
| `usedTemplateFallback` extension may require updating downstream consumers that check this flag | Low | Low | Audit callers before changing the flag semantics; prefer adding a new flag over changing existing one |
| Single-question floor may create a visible step-change in draft quality for some question types | Medium | Medium | Run against test corpus before deploying; monitor `delivery_status` in production for first week |

## Open Questions

None — all questions self-resolvable from the code.

## Scope Signal

- **Signal:** right-sized
- **Rationale:** Two bounded code changes: (1) add a category-compatibility gate and confidence floor to the single-question template selection path in `draft_generate`, mirroring the existing composite-path logic; (2) remove `booking-issues` from `STRICT_REFERENCE_CATEGORIES` in `draft-quality-check.ts`. Both have clear entry points, existing tests to extend, and no data or infrastructure dependencies. Combined effort is S + XS.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `detectWorkflowTriggers` — `booking_context` wide trigger | Yes | Wide regex captures informational mentions; does not directly cause quality failures today (insulated by `booking_action_required`) | No |
| `booking-issues` in `STRICT_REFERENCE_CATEGORIES` | Yes | Causes false `missing_required_reference` failures on FAQ drafts that mention booking | Yes |
| Single-question template selection — confidence floor | Yes | No per-question floor or category-compatibility check; "suggest"-level mismatched templates used silently | Yes |
| Composite path template selection | Yes | Correctly gated by `PER_QUESTION_FLOOR` + category-hint check + `UNHINTED_TEMPLATE_CONFIDENCE_FLOOR` | No |
| Telemetry and learning ledger on "suggest" mismatch | Yes | `usedTemplateFallback` is `false` for "suggest"; unknown-answer events not recorded | Yes |
| Synonym expansion spurious match amplification | Yes | `pool → facility → amenity` chain inflates BM25 scores for unrelated templates | Noted (mitigated by gating, no separate fix needed) |
| `booking_action_required` trigger | Yes | Already well-scoped — no false positives | No |
| Test coverage for "suggest-but-wrong" single-Q case | Yes | TC-03-01 only tests `selection === "none"`; "suggest-but-wrong" case untested | Yes |

## Confidence Inputs

- Implementation: 90% — both fixes have clear entry points; the single-question gate mirrors existing composite-path logic exactly
- Approach: 88% — category-compatibility gate follows `selectQuestionTemplateCandidate` pattern; `STRICT_REFERENCE_CATEGORIES` edit is a one-line removal
- Impact: 85% — eliminates the known failure modes; residual risk is edge cases in borderline FAQ questions
- Delivery-Readiness: 88%
- Testability: 90% — both fixes are fully unit-testable using the existing `template-ranker.test.ts` and `draft-generate.test.ts` patterns

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items: None
- Recommended next step: `/lp-do-plan brik-email-template-confidence-threshold --auto`

## Evidence Gap Review

### Gaps Addressed

- TC-06-03 covers multi-question floor for rooftop pool. Gap is confirmed single-question path only.
- `draft-generate-telemetry.test.ts` TC-03-01 uses a fixture where `selection === "none"`. The "suggest-but-wrong" case is untested.
- `requiresReferenceForActionPlan` logic is fully readable. `booking-issues` `STRICT_REFERENCE_CATEGORIES` membership confirmed in source (line 86–93).
- Scenario classifier `booking-issues` patterns confirmed at lines 875–879 and 805–808.

### Confidence Adjustments

- Confidence in root cause analysis: **High**. All three gap paths (single-question floor, category compatibility, reference-link false fail) are directly observable in code.
- Confidence in fix boundary: **High**. All changes are confined to `template-ranker.ts`, `draft-generate.ts`, and `draft-quality-check.ts`. No schema migration, no API changes.

### Remaining Assumptions

- Template data in `data/email-templates.json` contains `reference_scope: "reference_required"` entries for the `booking-issues` category — assumed from the policy loading code but not directly verified from the data file itself.
- The "fluent but unrelated policy template" reported in the operator audit resulted from a "suggest"-level selection rather than a "none" result — consistent with the code analysis but the specific email has not been replayed.
