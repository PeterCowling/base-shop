---
Type: Plan
Status: Complete
Domain: Platform
Created: 2026-02-08
Last-updated: 2026-02-08
Completed: 2026-02-08
Feature-Slug: composite-email-templates
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
---

# Composite Email Templates Plan

## Summary

The email autodraft pipeline currently selects a single template to answer guest emails. Multi-topic emails (e.g., breakfast + luggage + WiFi) fail the quality gate because no single template covers all topics. This plan adds composite template assembly — combining content from multiple ranked templates — plus synonym additions and request-aware quality checking to raise the pass rate from 25/31 (81%) to ≥28/31 (90%+).

## Goals

- Fix the 6 remaining quality gate failures (all `unanswered_questions`)
- Add composite template assembly for multi-topic emails
- Add missing synonyms to improve single-template matching
- Add request-aware quality checking for emails without explicit questions
- Raise the quality gate pass rate target to ≥90%

## Non-goals

- Rewriting the BM25 ranker algorithm
- Adding LLM-based content generation
- Changing the MCP tool schema (composite assembly is internal)
- Modifying the email HTML template generator

## Constraints & Assumptions

- Constraints:
  - All email content must come from approved templates (no freeform text)
  - Signature deduplication when combining templates
  - Quality gate pass rate must not regress below 80%
  - Word count warnings (not failures) may trigger for longer composite bodies
- Assumptions:
  - Multi-topic emails can be detected by having ≥2 questions
  - The BM25 ranker's top-3 candidates contain useful secondary templates

## Fact-Find Reference

- Related brief: `docs/plans/composite-email-templates-fact-find.md`
- Key findings:
  - Ranker already returns top 3 candidates — only `candidates[0]` is used
  - "Hostel Facilities and Services" template covers WiFi + luggage + breakfast (natural composite fallback)
  - "Arriving before check-in time" template also covers all 3 FAQ-05 topics
  - All 6 failures are `unanswered_questions` — 4 distinct root causes
  - Composite fix directly addresses FAQ-05; synonym/request fixes address the rest
  - Quality check word count is a warning, not a failure — no composite-specific adjustment needed

## Existing System Notes

- Key modules/files:
  - `packages/mcp-server/src/tools/draft-generate.ts` — Template selection + body assembly (lines 187-193)
  - `packages/mcp-server/src/tools/draft-quality-check.ts` — `answersQuestions()` validates all questions have keyword matches (line 169)
  - `packages/mcp-server/src/utils/template-ranker.ts` — BM25 ranking, SYNONYMS map, SUGGEST_THRESHOLD=25
  - `packages/mcp-server/data/email-templates.json` — 38 templates, 18 categories
- Patterns to follow:
  - Pure function approach (no side effects in assembly logic)
  - `answersQuestions()` uses stemmedTokenizer + SYNONYMS for keyword matching
  - `ensureSignature()` / `ensureLength()` as post-processing steps

## Proposed Approach

**Single approach — Template Composition via Body Merging:**

1. After selecting `candidates[0]`, check if the body covers all extracted questions using `answersQuestions()` logic
2. If not, iterate `candidates[1..N]` and include body paragraphs from templates that cover unanswered questions
3. Strip greeting ("Dear Guest,") and signature block from secondary templates before merging
4. Strip repeated "Thank you" openers from secondary templates
5. Produce a single body with one greeting and one signature

This approach requires changes to only `draft-generate.ts` (~40 lines). The ranker, quality check, and HTML generator work unchanged. The quality check benefits from composite bodies because more keywords are present.

**Parallel fixes** (independent of composite logic):
- Synonym additions to fix LUG-02 and PAY-03 via better single-template matching
- Request-aware quality checking to fix FAQ-02 (declarative text without `?`)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add missing synonyms to template ranker | 95% | S | Pending | - | TASK-04 |
| TASK-02 | IMPLEMENT | Add request-aware quality checking | 90% | S | Pending | - | TASK-04 |
| TASK-03 | IMPLEMENT | Add composite template assembly to draft-generate | 88% | M | Pending | - | TASK-04 |
| TASK-04 | IMPLEMENT | Raise pass rate target and validate | 90% | S | Pending | TASK-01, TASK-02, TASK-03 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-01, TASK-02, TASK-03 | - | All three are independent; can run in parallel |
| 2 | TASK-04 | TASK-01, TASK-02, TASK-03 | Final validation after all fixes land |

**Max parallelism:** 3 | **Critical path:** 2 waves | **Total tasks:** 4

## Tasks

### TASK-01: Add missing synonyms to template ranker

- **Type:** IMPLEMENT
- **Affects:** `packages/mcp-server/src/utils/template-ranker.ts`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 95%
  - Implementation: 95% — Simple additions to existing `SYNONYMS` map, clear pattern at line 43-60
  - Approach: 95% — Follows established synonym pattern; existing tests verify synonym expansion works
  - Impact: 95% — Additive only; cannot break existing matches, only improve them
- **Acceptance:**
  - `fee` maps to `cost`, `charge`, `price`, `expense` (and vice versa)
  - `add` maps to `include`, `purchase`, `buy` (and vice versa)
  - `transfer` maps to `bank transfer`, `wire`, `IBAN` (and vice versa)
  - `age` maps to `restriction`, `policy`, `limit`, `years old` (and vice versa)
  - LUG-02 fixture passes quality gate (fee↔cost synonym enables "After Checkout" template match)
  - PAY-03 fixture passes quality gate (transfer synonym enables better template match)
  - POL-03 fixture passes quality gate (age↔restriction synonym helps ranker find "Age Restriction" template)
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: `fee` keyword in question matches template body containing `cost` → `answersQuestions` returns true
    - TC-02: `bank transfer` in email body improves ranking of payment templates → ranker returns relevant template
    - TC-03: `age` keyword matches template with `restriction` → ranker selects "Age Restriction" template
    - TC-04: Existing synonym tests still pass (no regression)
  - **Acceptance coverage:** TC-01 covers fee↔cost, TC-02 covers transfer synonyms, TC-03 covers age synonyms, TC-04 covers regression
  - **Test type:** Unit (template-ranker.test.ts) + Integration (pipeline-integration.test.ts)
  - **Test location:** `packages/mcp-server/src/__tests__/template-ranker.test.ts` (existing), `packages/mcp-server/src/__tests__/pipeline-integration.test.ts` (existing fixtures)
  - **Run:** `npx jest --testPathPattern 'packages/mcp-server'`
- **TDD execution plan:**
  - **Red:** Add test in template-ranker.test.ts for `fee` query matching template with `cost`; expect it to fail with no synonym link
  - **Green:** Add fee/cost/charge/price, add/include/purchase/buy, transfer/bank-transfer/wire/IBAN, age/restriction/limit synonym groups to SYNONYMS
  - **Refactor:** Ensure bidirectional synonym coverage (if A→B, then B→A)
- **Planning validation:**
  - Tests run: `npx jest --testPathPattern 'packages/mcp-server'` — 14 suites, 105 tests, all PASS
  - Confirmed SYNONYMS map at template-ranker.ts:43-60 missing fee/cost, add/include, transfer, age groups
- **Rollout / rollback:**
  - Rollout: Direct deploy; additive change cannot break existing matches
  - Rollback: Remove added synonym entries
- **Documentation impact:** None
- **Notes / references:**
  - Existing SYNONYMS pattern: `template-ranker.ts:43-60`
  - LUG-02 fixture: "Is there an extra fee?" — template says "€15 per bag" (cost, not fee)
  - PAY-03 fixture: "bank transfer instead of credit card" — no bank transfer template, but synonym can help ranking

### TASK-02: Add request-aware quality checking

- **Type:** IMPLEMENT
- **Affects:** `packages/mcp-server/src/tools/draft-quality-check.ts`, `packages/mcp-server/src/tools/draft-generate.ts`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 90%
  - Implementation: 92% — Clear change points: quality check schema needs `requests[]`, `runChecks` needs to validate requests similarly to questions
  - Approach: 88% — Requests use the same keyword matching as questions; `extractQuestionKeywords` works for request text too
  - Impact: 90% — `draft-generate.ts` already passes `actionPlan` with `intents`; needs to include `requests[]` alongside `questions[]`
- **Acceptance:**
  - Quality check schema accepts `intents.requests[]` alongside `intents.questions[]`
  - `runChecks` validates requests have keyword matches in draft body (same as questions)
  - FAQ-02 fixture passes quality gate (declarative request "Please let us know if this is allowed" has keyword match)
  - Existing passing scenarios don't regress
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Draft with request keyword present → `unanswered_questions` not in `failed_checks`
    - TC-02: Draft missing request keyword → `unanswered_questions` in `failed_checks`
    - TC-03: Empty requests array → no impact (same as today)
    - TC-04: FAQ-02 integration test passes quality gate
  - **Acceptance coverage:** TC-01/02 cover request validation, TC-03 covers backward compat, TC-04 covers FAQ-02
  - **Test type:** Unit (draft-quality-check.test.ts) + Integration (pipeline-integration.test.ts)
  - **Test location:** `packages/mcp-server/src/__tests__/draft-quality-check.test.ts` (existing), `packages/mcp-server/src/__tests__/pipeline-integration.test.ts` (existing)
  - **Run:** `npx jest --testPathPattern 'packages/mcp-server'`
- **TDD execution plan:**
  - **Red:** Add unit test: action plan with request "Please let us know about room capacity" + draft body mentioning "room" and "capacity" → expect pass; currently fails because requests aren't checked
  - **Green:** (1) Add `requests` to `EmailActionPlanInput` type and zod schema, (2) combine questions + requests in `runChecks` before calling `answersQuestions`, (3) update `draft-generate.ts` to pass `requests[]` to quality check
  - **Refactor:** Rename internal variable if needed for clarity (e.g., `allIntents` vs `questions`)
- **Planning validation:**
  - Tests run: `npx jest --testPathPattern 'packages/mcp-server'` — 14 suites, 105 tests, all PASS
  - Confirmed FAQ-02 body: "I am wanting to book the superior double bed private ensuite..." — no `?`, so `extractQuestions` returns `[]`. `extractRequests` captures "Please let us know if this is allowed."
  - Quality check schema at `draft-quality-check.ts:39-61` only includes `questions`, not `requests`
  - `draft-generate.ts:209-214` only passes `questions` to quality check, not `requests`
- **Rollout / rollback:**
  - Rollout: Direct deploy; backward compatible (requests array defaults to `[]`)
  - Rollback: Remove requests from quality check; revert to questions-only validation
- **Documentation impact:** None
- **Notes / references:**
  - `draft-quality-check.ts:39-61` — schema to extend
  - `draft-generate.ts:208-214` — quality check call to update
  - `draft-interpret.ts:269-280` — `extractRequests()` already extracts request intents

### TASK-03: Add composite template assembly to draft-generate

- **Type:** IMPLEMENT
- **Affects:** `packages/mcp-server/src/tools/draft-generate.ts`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 88%
  - Implementation: 90% — Clear change point at lines 187-193; pure function logic; fact-find confirmed "Hostel Facilities and Services" template covers FAQ-05 topics
  - Approach: 85% — Compositing from approved templates preserves content safety; risk is ranker not returning diverse enough candidates
  - Impact: 88% — Changes isolated to body assembly in draft-generate.ts; quality check benefits from larger body; HTML generator handles multi-paragraph
- **Acceptance:**
  - When ≥2 questions are extracted and primary template doesn't cover all, secondary templates are merged
  - Greeting appears once (from primary template)
  - Signature appears once (deduplication)
  - "Thank you for your email/question" openers stripped from secondary templates
  - FAQ-05 (breakfast + luggage + WiFi) passes quality gate
  - BRK-02 (OTA breakfast + "can I add it?") passes quality gate
  - Response includes `composite: true/false` flag in output
  - All 25 previously-passing scenarios continue to pass
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Multi-topic email (≥2 questions) + primary template covers all → no composite (single template used)
    - TC-02: Multi-topic email (≥2 questions) + primary template misses topics → composite body from multiple templates
    - TC-03: Single-question email → no composite (skip logic)
    - TC-04: Composite body has exactly one greeting and one signature
    - TC-05: Secondary template "Thank you" openers are stripped
    - TC-06: FAQ-05 integration test passes quality gate with composite
    - TC-07: Output includes `composite: true` when composition occurred
    - TC-08: All 25 previously-passing scenarios still pass (no regression)
  - **Acceptance coverage:** TC-01/03 cover detection, TC-02/06 cover assembly, TC-04/05 cover formatting, TC-07 covers observability, TC-08 covers regression
  - **Test type:** Unit (new tests in draft-generate.test.ts) + Integration (pipeline-integration.test.ts)
  - **Test location:** `packages/mcp-server/src/__tests__/draft-generate.test.ts` (existing, add composite tests), `packages/mcp-server/src/__tests__/pipeline-integration.test.ts` (existing fixtures)
  - **Run:** `npx jest --testPathPattern 'packages/mcp-server'`
  - **Cross-boundary coverage:** N/A — all changes within draft-generate.ts
  - **End-to-end coverage:** TC-06 (FAQ-05) and TC-08 (full regression) serve as e2e scenarios through the 3-stage pipeline
- **TDD execution plan:**
  - **Red:** Add unit tests: (1) `stripGreeting()` removes "Dear Guest," prefix, (2) `stripSignature()` removes signature block, (3) `shouldComposite()` returns true for ≥2 questions when primary template misses keywords, (4) `combineTemplates()` merges bodies with single greeting+signature. All fail because functions don't exist yet.
  - **Green:** (1) Add `stripGreeting(body)`, `stripSignature(body)`, `stripThankYouOpener(body)` utility functions. (2) Add `shouldComposite(questions, primaryBody)` detection using keyword matching from quality check. (3) Add `combineTemplates(primary, secondaries)` that strips greeting/sig/opener from secondaries and merges. (4) Update `handleDraftGenerateTool` to use composite assembly when `shouldComposite()` returns true. (5) Add `composite` flag to response.
  - **Refactor:** Extract composite logic into separate helper functions for testability
- **Scouts:**
  - Ranker returns diverse candidates for FAQ-05 → Validated: "Hostel Facilities and Services" (faq) covers breakfast+luggage+WiFi and would appear in candidates → confirmed via keyword analysis
  - Template greeting patterns are consistent → Validated: all 38 templates start with "Dear Guest," or "Dear <Name>," → confirmed via grep
  - Template signature patterns are consistent → Validated: all end with "Regards,\n\n<Name>\n<Title>" variant → confirmed via grep
- **Planning validation:**
  - Tests run: `npx jest --testPathPattern 'packages/mcp-server'` — 14 suites, 105 tests, all PASS
  - FAQ-05 currently fails quality gate with `unanswered_questions` (confirmed in pass rate: faq 5/7 = 71%)
  - Ranker scout: "Hostel Facilities and Services" template contains breakfast, luggage, WiFi keywords — confirmed
  - "Arriving before check-in time" template also covers all 3 topics — confirmed
- **What would make this ≥90%:**
  - Probe test confirming ranker actually returns diverse-category candidates for FAQ-05 body text (vs same-category)
  - Unit tests for strip functions confirming all 38 template formats are handled
- **Rollout / rollback:**
  - Rollout: Direct deploy; no feature flag needed (internal improvement)
  - Rollback: Revert composite logic; single-line change back to `candidates[0]` only
- **Documentation impact:** None
- **Notes / references:**
  - `draft-generate.ts:187-193` — current single-template selection
  - `draft-quality-check.ts:165-188` — `answersQuestions()` logic to reuse for coverage detection
  - `email-templates.json` — "Hostel Facilities and Services" template at end of file
  - Fact-find design: `docs/plans/composite-email-templates-fact-find.md` § "Design: Composite Template Approach"

### TASK-04: Raise pass rate target and validate

- **Type:** IMPLEMENT
- **Affects:** `packages/mcp-server/src/__tests__/pipeline-integration.test.ts`
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — Single line change: `0.8` → `0.9` in the pass rate assertion
  - Approach: 85% — Depends on TASK-01/02/03 actually fixing the 6 failures; if only 4-5 are fixed, threshold may need to be 0.87 instead
  - Impact: 90% — Only modifies test assertion; no production code impact
- **Acceptance:**
  - Pass rate threshold raised from ≥80% to ≥90% (or highest achievable)
  - All previously-passing 25 scenarios still pass
  - At least 3 of the 6 previously-failing scenarios now pass (FAQ-05, LUG-02, FAQ-02)
  - Full test suite passes: 14 suites, all green
  - Template linter passes: `pnpm exec tsx packages/mcp-server/scripts/lint-templates.ts`
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: Pass rate ≥ new threshold → afterAll assertion passes
    - TC-02: All 14 test suites pass → full regression
    - TC-03: Template linter passes → no template issues
  - **Acceptance coverage:** TC-01 covers threshold, TC-02/03 cover regression
  - **Test type:** Integration (pipeline-integration.test.ts) + template lint
  - **Test location:** `packages/mcp-server/src/__tests__/pipeline-integration.test.ts` (existing)
  - **Run:** `npx jest --testPathPattern 'packages/mcp-server' && pnpm exec tsx packages/mcp-server/scripts/lint-templates.ts`
- **TDD execution plan:**
  - **Red:** Change `0.8` to `0.9` in pass rate assertion; run tests; if <90% achieved, assertion fails
  - **Green:** All 3 prior tasks must have landed; verify pass rate meets threshold
  - **Refactor:** Adjust threshold to actual achieved rate if 90% not reached (e.g., 0.87 for 27/31)
- **Planning validation:**
  - Tests run: `npx jest --testPathPattern 'packages/mcp-server'` — all pass at current 25/31 (81%)
  - Expected post-fix: ≥28/31 (90%) based on fact-find analysis
- **Rollout / rollback:**
  - Rollout: Test-only change
  - Rollback: Revert threshold back to `0.8`
- **Documentation impact:** None
- **Notes / references:**
  - `pipeline-integration.test.ts:733-734` — current `expect(passRate).toBeGreaterThanOrEqual(0.8)`

## Risks & Mitigations

- **Ranker doesn't return diverse candidates for multi-topic emails:** Mitigated by the "Hostel Facilities and Services" fallback template which covers WiFi+luggage+breakfast in a single template. Even without composite, ranker may select this template for FAQ-05.
- **Composite bodies are too long:** Mitigated by word count check being a warning, not a failure. Length_out_of_range only adds to `warnings[]`.
- **Synonym additions cause unexpected template matches:** Mitigated by BM25 scoring — synonyms boost relevance but don't override strong matches. Existing tests verify no regressions.
- **Request-aware checking creates false positives:** Mitigated by requests using same keyword matching as questions — only requests with keyword matches in the body pass.

## Observability

- Logging: `composite: true/false` flag added to `draft_generate` response output
- Metrics: Pass rate logged in integration test console output (by scenario type)
- Alerts/Dashboards: N/A (internal MCP tool)

## Acceptance Criteria (overall)

- [ ] Quality gate pass rate ≥90% (up from 81%)
- [ ] FAQ-05 (multi-topic) passes with composite template assembly
- [ ] FAQ-02 (declarative request) passes with request-aware quality checking
- [ ] LUG-02, PAY-03, POL-03 pass with improved synonyms
- [ ] All 25 previously-passing scenarios still pass (no regression)
- [ ] All 14 test suites pass (105+ tests)
- [ ] Template linter passes

## Decision Log

- 2026-02-08: Chose body-merging composite approach over multi-template selection because it requires changes to only `draft-generate.ts` and preserves the existing quality check and ranker unchanged.
- 2026-02-08: Decided not to modify ranker to enforce category diversity — the "Hostel Facilities and Services" fallback template and composite assembly handle multi-topic cases sufficiently.
