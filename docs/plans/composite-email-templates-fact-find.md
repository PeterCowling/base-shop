---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Created: 2026-02-08
Last-updated: 2026-02-08
Feature-Slug: composite-email-templates
Related-Plan: docs/plans/composite-email-templates-plan.md
---

# Composite Email Templates Fact-Find Brief

## Scope

### Summary

Many guest emails ask about multiple topics (breakfast + luggage + WiFi, check-in + directions, etc.) and can only be answered by pulling together content from several single-topic templates. The current pipeline selects a single "best" template, which leaves questions unanswered. This fact-find investigates the feasibility of composing replies from multiple templates.

### Goals

- Understand how the current pipeline handles multi-topic emails and why 6/31 (19%) of integration test scenarios still fail the quality gate
- Design an approach for composite templates that combines content from multiple existing templates
- Ensure the approach preserves the existing quality gate pass rate (≥80%) while improving it further

### Non-goals

- Rewriting the BM25 ranker algorithm
- Adding LLM-based content generation (all content comes from approved templates)
- Changing the MCP tool schema (composite assembly is internal to `draft_generate`)

### Constraints & Assumptions

- Constraints:
  - All email content must come from approved templates (no freeform generation)
  - Signature deduplication is required when combining templates
  - Quality gate checks must continue to pass for previously-passing scenarios
  - Word count targets in quality check need to accommodate longer composite bodies
- Assumptions:
  - Multi-topic emails can be detected by having ≥2 questions extracted by `draft_interpret`
  - The BM25 ranker's top-3 candidates (already returned) contain useful secondary templates

## Repo Audit (Current State)

### Entry Points

- `packages/mcp-server/src/tools/draft-generate.ts` — Main generation handler; calls ranker, selects template, generates HTML, runs quality check
- `packages/mcp-server/src/tools/draft-interpret.ts` — Interprets email; extracts questions, requests, confirmations, detects language/agreement/scenario
- `packages/mcp-server/src/tools/draft-quality-check.ts` — Validates draft against action plan; checks unanswered_questions, signature, prohibited claims, etc.
- `packages/mcp-server/src/utils/template-ranker.ts` — BM25-based template ranking with synonym expansion and hard-rule categories

### Key Modules / Files

- `packages/mcp-server/data/email-templates.json` — 38 templates across 18 categories. All single-topic. Key multi-topic-relevant categories: breakfast (2), luggage (3), wifi (1), check-in (4), faq (1 — "Hostel Facilities and Services" covers WiFi+luggage+breakfast+bar)
- `packages/mcp-server/src/utils/email-template.ts` — HTML email generator. `textToHtmlParagraphs` splits on `\n\n+` and wraps in `<p>` tags. Handles multi-paragraph bodies without changes.
- `packages/mcp-server/src/utils/workflow-triggers.ts` — Prepayment workflow logic (hard-rule path, not affected by composite templates)

### Patterns & Conventions Observed

- **Single template selection:** `draft-generate.ts:187-188` — Only `candidates[0]` is used; ranker already returns top 3 via `DEFAULT_LIMIT = 3`
- **Quality check `questions.every()`:** `draft-quality-check.ts:169` — ALL questions must have at least one keyword match in the draft body. This is why multi-topic emails fail: a single-topic template can't contain keywords for all topics.
- **Signature at end of each template:** All 38 templates end with a signature variant. Combining templates naively would produce duplicate signatures.
- **Template body structure:** Templates start with "Dear Guest," greeting, contain topic-specific paragraphs, and end with a sign-off + signature. The greeting and signature are consistent patterns that can be stripped.

### Data & Contracts

- Types/schemas:
  - `EmailTemplate` (`template-ranker.ts:9-13`): `{ subject: string; body: string; category: string }`
  - `TemplateCandidate` (`template-ranker.ts:24-30`): `{ template: EmailTemplate; score: number; confidence: number; evidence: string[]; matches: Record<string, string[]> }`
  - `TemplateRankResult` (`template-ranker.ts:32-37`): `{ selection: "auto"|"suggest"|"none"; confidence: number; candidates: TemplateCandidate[]; reason: string }`
  - `EmailActionPlan` (`draft-interpret.ts:46-58`): Contains `intents.questions[]` — the key signal for multi-topic detection
- Persistence: None (stateless per-request)
- API/event contracts: MCP tool interface unchanged

### Dependency & Impact Map

- Upstream dependencies:
  - `@acme/lib` — `BM25Index`, `stemmedTokenizer` (used by ranker + quality check)
  - `email-templates.json` — Template data file
- Downstream dependents:
  - `pipeline-integration.test.ts` — Integration tests that assert ≥80% pass rate
  - MCP clients calling `draft_generate` tool
- Likely blast radius:
  - `draft-generate.ts` — Primary change target (~30-40 lines)
  - `draft-quality-check.ts` — Minor adjustment to word count bounds for composite bodies
  - `pipeline-integration.test.ts` — Pass rate threshold may increase
  - Template data file — No changes needed (existing templates are the building blocks)

### Test Landscape

#### Test Infrastructure

- **Frameworks:** Jest with `@jest-environment node`
- **Commands:** `npx jest --testPathPattern 'packages/mcp-server'` (no `test` script in package.json)
- **CI integration:** Runs as part of `pnpm test` in root
- **Coverage tools:** None configured for this package

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| Draft interpret | Unit | `draft-interpret.test.ts` | Good coverage of question extraction, language detection, agreement |
| Draft generate | Unit | `draft-generate.test.ts` | Template selection, HTML generation |
| Draft quality | Unit | `draft-quality-check.test.ts` | Individual check functions |
| Template ranker | Unit | `template-ranker.test.ts` | BM25 scoring, synonym expansion, hard rules |
| Pipeline | Integration | `pipeline-integration.test.ts` | 31 fixtures, 49 tests, ≥80% pass rate gate |
| Email template | Unit | `email-template.test.ts` | HTML generation, paragraph splitting |

#### Coverage Gaps (Planning Inputs)

- **No composite template tests** — Entire feature is new
- **No test for multi-candidate usage** — Current tests only verify `candidates[0]`
- **FAQ-05 multi-topic fixture exists** but currently fails — Will be primary test case

#### Testability Assessment

- **Easy to test:** Composite logic is pure functions (detect multi-topic, strip signatures, combine bodies). Can test in isolation.
- **Hard to test:** Integration with ranker confidence thresholds — needs real template data
- **Test seams needed:** None — existing function boundaries are sufficient

### Recent Git History (Targeted)

Recent commits in `packages/mcp-server/`:
- `1a9b9609c4` — feat(mcp-server): add pattern-based templates from historical email analysis (TASK-10, TASK-11)
- Previous session: Fixed quality gate pass rate from 3/31 (10%) to 25/31 (81%) by fixing `extractQuestions`, using "suggest" templates, adding stemming+synonym matching, lowering `SUGGEST_THRESHOLD` to 25

## Analysis of 6 Remaining Quality Gate Failures

### Failure Breakdown

| ID | Description | Root Cause | Composite Fix? |
|----|-------------|------------|----------------|
| FAQ-02 | Room capacity (no `?`) | No questions extracted (declarative text). Request captured by `extractRequests` but quality check only validates questions. | No — needs request-aware quality check |
| FAQ-05 | Breakfast + luggage + WiFi | 3 questions, single template can't cover all 3 topics | **Yes — canonical composite case** |
| PAY-03 | Bank transfer inquiry | "Change Credit Card Details" template selected; doesn't mention bank transfer | No — needs bank transfer template or synonym |
| POL-03 | Age restriction | "Age Restriction" template exists but ranker confidence too low or wrong template selected | Partial — better ranking may help |
| BRK-02 | OTA breakfast + "can I add it?" | "Not Included (OTA)" template says breakfast not available but doesn't address "can I add it?" | Partial — could composite with another template |
| LUG-02 | Late luggage + fee question | "After Checkout" template mentions €15 fee but keyword "fee"↔"cost" synonym missing | No — needs synonym addition |

### Composite Template Impact

- **Direct fix:** FAQ-05 (3 questions across 3 topics)
- **Potential fix:** BRK-02 (if "can I add it?" is treated as a second topic)
- **Not helped by composite:** FAQ-02, PAY-03, POL-03, LUG-02 (these need synonym additions, new templates, or request-aware quality checking)

### Realistic Pass Rate Improvement

- Current: 25/31 (81%)
- Composite templates fix: +1-2 scenarios → 26-27/31 (84-87%)
- Additional synonym/quality fixes: +2-3 more scenarios → 28-30/31 (90-97%)

## Design: Composite Template Approach

### Detection Logic

Multi-topic emails are detected when `actionPlan.intents.questions.length >= 2`. This is the trigger for composite assembly.

### Assembly Strategy

1. **Get ranker candidates** — Ranker already returns top 3 candidates
2. **Check if single template covers all questions** — Run `answersQuestions()` against `candidates[0]`
3. **If not, iterate candidates** — For each unanswered question, check if any candidate's template body contains relevant keywords
4. **If candidates insufficient** — Fall back to the "Hostel Facilities and Services" template (category: faq) which is a natural multi-topic template covering WiFi, luggage, breakfast, bar, and digital assistant
5. **Combine bodies** — Strip greetings and signatures from secondary templates, merge paragraph blocks
6. **Deduplicate signature** — Ensure exactly one signature at the end

### Body Combination

```
[Primary template greeting]
[Primary template body paragraphs]

[Secondary template body paragraphs (no greeting, no signature)]

[Single signature]
```

### Signature Stripping

Templates follow consistent patterns:
- Greeting: `/^Dear (Guest|Guests?[^,]*),/m` — first line
- Signature block: `/\n(Best regards|Regards|Warm regards),[\s\S]*$/m` — everything from sign-off to end
- "Thank you for your email/question" opener — strip from secondary templates to avoid repetition

### Quality Check Adjustment

Composite bodies will be longer than single templates. The `scenarioTarget` word count ranges in `draft-quality-check.ts` need a composite-aware path:
- When composite is used, allow 1.5x the upper bound of the primary category's range
- Or: Skip the length warning for composite responses (they're deliberately longer)

### Existing "Facilities" Template as Fallback

Template `"Hostel Facilities and Services"` (category: faq) already covers:
- WiFi
- Luggage storage
- Breakfast (for direct bookings)
- Bar and terrace
- Digital assistant

This is a natural composite fallback for multi-topic FAQ emails. The ranker may already select it if the query contains enough matching terms.

## Questions

### Resolved

- Q: Does the ranker already return multiple candidates?
  - A: Yes. `DEFAULT_LIMIT = 3` in `template-ranker.ts:39`. `rankTemplates()` returns up to 3 `TemplateCandidate` objects.
  - Evidence: `template-ranker.ts:244`

- Q: Can the HTML generator handle longer bodies?
  - A: Yes. `textToHtmlParagraphs` splits on `\n\n+` and wraps each paragraph in `<p>` tags. No length limits.
  - Evidence: `email-template.ts:240-255`

- Q: Will composite templates break the quality check?
  - A: No. Longer bodies mean MORE keyword matches, so `answersQuestions()` is more likely to pass. Only the word count warning (`length_out_of_range`) may trigger, but that's a warning, not a failure.
  - Evidence: `draft-quality-check.ts:246-250` (only adds to `warnings[]`, not `failed_checks[]`)

- Q: Are hard-rule categories (prepayment, cancellation) affected?
  - A: No. Hard-rule templates bypass the ranker entirely via `resolveHardRuleTemplates()` and would not be composited.
  - Evidence: `template-ranker.ts:237-239`

### Open (User Input Needed)

None — all design questions resolved via code evidence.

## Confidence Inputs (for /plan-feature)

- **Implementation:** 90%
  - High: Clear change points in `draft-generate.ts`, pure function logic, existing test infrastructure. Only ~30-40 lines of new code.
  - What's missing: Need to verify ranker actually returns relevant secondary candidates for FAQ-05

- **Approach:** 85%
  - High: Compositing from approved templates preserves content safety. Natural fallback to "Facilities" template.
  - Risk: If ranker candidates are all from the same category, compositing won't help. May need category diversity in candidate selection.

- **Impact:** 90%
  - High: Changes are isolated to `draft-generate.ts` body assembly. Quality check, interpret, and ranker are unchanged. Blast radius is minimal.
  - What's missing: Need to confirm no edge cases where compositing produces worse results than single template.

- **Testability:** 95%
  - High: FAQ-05 fixture already exists as a failing test. Pure function logic is trivially testable. Integration test infrastructure is mature.

## Planning Constraints & Notes

- Must-follow patterns:
  - Templates are the single source of truth for email content — no freeform text generation
  - Signature deduplication: exactly one signature per email
  - Quality gate pass rate must not regress below 80%
- Rollout/rollback expectations:
  - No feature flag needed — composite assembly is an internal improvement
  - Rollback: revert to `candidates[0]` only (single-line change)
- Observability expectations:
  - `draft_generate` response already includes `ranker.candidates[]` — add `composite: true/false` flag to output

## Suggested Task Seeds (Non-binding)

1. **TASK-01: Add composite assembly logic to `draft-generate.ts`**
   - Detect multi-topic emails (≥2 questions)
   - Strip greeting/signature from secondary templates
   - Combine bodies from top candidates
   - Add `composite` flag to response

2. **TASK-02: Add missing synonyms to improve single-template matching**
   - Add `fee`↔`cost`↔`charge`↔`price` synonym group
   - Add `add`↔`include`↔`purchase`↔`buy` synonym group
   - Add `bank transfer`↔`wire transfer`↔`IBAN` synonym group

3. **TASK-03: Add request-aware quality checking**
   - Currently only `intents.questions[]` is validated
   - `intents.requests[]` should also trigger keyword matching
   - Fixes FAQ-02 (declarative request without `?`)

4. **TASK-04: Integration tests for composite templates**
   - Verify FAQ-05 passes with composite assembly
   - Add composite-specific unit tests (strip signature, combine bodies)
   - Increase pass rate assertion if warranted

5. **TASK-05: Raise pass rate target**
   - After all fixes land, raise ≥80% gate to ≥90% if evidence supports it

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: Proceed to `/plan-feature composite-email-templates`
