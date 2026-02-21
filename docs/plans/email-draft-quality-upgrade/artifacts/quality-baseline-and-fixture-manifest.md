---
Type: Reference
Status: Active
---
# Email Draft Quality — Baseline and Fixture Manifest

**Plan:** `docs/plans/email-draft-quality-upgrade/plan.md`
**Task:** TASK-01 (INVESTIGATE)
**Produced:** 2026-02-18
**Status:** Complete

---

## 1. Purpose

This artifact establishes the baseline quality state of the Brikette email draft pipeline
(`draft_interpret → draft_generate → draft_quality_check`) before any TASK-02..TASK-09 changes.
It defines the fixture set, gap taxonomy, metric definitions, and reproducible command protocol
required by TASK-09 (regression harness) and TASK-00 (scope decision context).

---

## 2. Fixture Manifest

### 2.1 Pipeline-Integration Fixtures (authoritative gate set)

Source: `packages/mcp-server/src/__tests__/pipeline-integration.test.ts`

| Count | Type | Used in regression gate |
|-------|------|------------------------|
| 57 total | inline `fixtures[]` | 47 customer-facing (passRate ≥ 0.90) |
| 47 | `requiresResponse=true`, non-system | **yes** — 90% gate |
| 5 | system (`SYS-01..SYS-05`) | excluded from quality gate |
| 5 | IT/multilingual (`IT-01..IT-02`, AGR subset) | included in 47 |

**The `passRate >= 0.90` assertion over the 47 customer-facing fixtures is the existing first-class regression gate.**

#### Multi-question fixtures in pipeline-integration

| Fixture ID | Questions/Requests | Categories | Dedicated named test? |
|---|---|---|---|
| FAQ-05 | 3 questions (breakfast + luggage + wifi) | faq/multi | ✅ "should extract questions from multi-question emails" |
| FAQ-04 | 2 questions + 2-message thread | faq (room + availability) | ✅ thread_summary test |
| AGR-02 | agreement + follow-up question | agreement + faq | ✅ "AGR-02 should flag additional_content" |
| AGR-03 | 2 distinct intents (meta-agreement + next-step) | policy/agreement | part of bulk loop only |
| CAN-05 | cancel + refund (composite escalation HIGH) | cancellation | part of bulk loop only |
| PAY-05 | card charge + policy question + chargeback threat (HIGH) | payment | part of bulk loop only |

#### Category coverage in pipeline-integration

| Category | Multi-Q test? | Single-Q fixtures |
|---|---|---|
| faq | ✅ (FAQ-04, FAQ-05) | FAQ-01..FAQ-03, FAQ-06 |
| cancellation | ✅ (CAN-05 — escalating only) | CAN-01..CAN-04 |
| payment | ✅ (PAY-05 — escalating only) | PAY-01..PAY-04 |
| agreement | ✅ (AGR-02, AGR-03) | AGR-01, AGR-04, AGR-05 |
| breakfast | ✅ (via FAQ-05 composite) | BRK-01, BRK-02 |
| luggage | ✅ (via FAQ-05 composite) | LUG-01, LUG-02 |
| wifi | ✅ (via FAQ-05 composite) | WIFI-01 |
| check-in | ✅ (quality-check TC only; no pipeline fixture) | PRE-01..PRE-04 (via prepayment) |
| prepayment | ❌ single-only | PRE-01..PRE-04 |
| checkout | ❌ single-only | CO-01 |
| booking-changes | ❌ single-only | CHG-01 |
| house-rules | ❌ single-only | HR-01 |
| modification | ❌ single-only | MOD-01 |
| policy | ❌ single-only | POL-01..POL-03 |
| transportation | ❌ single-only | (quality-check TC only) |
| access | ❌ **no test at all** | — |
| complaint | ❌ **no test at all** | — |
| Italian/multilingual multi-Q | ❌ **no multi-Q test** | IT-01 (single), IT-02 (agreement) |

### 2.2 Unit-Test Fixture Seeds

| File | Fixture count | Stage |
|---|---|---|
| `packages/mcp-server/src/__tests__/draft-generate.test.ts` | 14 inline action-plan inputs | generate |
| `packages/mcp-server/src/__tests__/draft-quality-check.test.ts` | 16 `(actionPlan, draft)` pairs | quality |
| `packages/mcp-server/src/__tests__/draft-interpret.test.ts` | ~20 inline body inputs | interpret |
| `packages/mcp-server/data/email-examples.json` | 57 labeled classification examples | interpret (classification) |
| `packages/mcp-server/src/__tests__/template-ranker.test.ts` | 12 inline template stubs | ranker |

### 2.3 Template Inventory

Source: `packages/mcp-server/data/email-templates.json`

| Category | Template count | Note |
|---|---|---|
| prepayment | 5 | |
| check-in | 4 | |
| cancellation | 4 | |
| booking-issues | 4 | |
| luggage | 3 | |
| booking-changes | 3 | |
| policies | 2 | ⚠️ key is `policies`, draft-guide uses `policy` |
| payment | 2 | |
| breakfast | 2 | |
| checkout | 2 | |
| house-rules | 2 | |
| access | 2 | no pipeline-integration fixture |
| transportation | 1 | |
| general | 1 | |
| activities | 1 | no pipeline-integration fixture |
| wifi | 1 | |
| faq | 1 | |
| promotions | 1 | |
| employment | 1 | |
| lost-found | 1 | |
| **policy** | **0** | ❌ key mismatch vs templates |
| **complaint** | **0** | ❌ no outbound template |
| **Total** | **43** | |

---

## 3. Gap Taxonomy

### GAP-A: Missing multi-question integration fixtures (high-priority)

Categories that have templates but no multi-question pipeline fixture:

| Category | Risk | Proposed fixture pattern |
|---|---|---|
| prepayment | HIGH — hard-rule category; multi-Q not tested | "Payment failed — can I pay via bank transfer? Also confirm my dates." |
| cancellation (non-escalating) | MED — only escalating multi-Q exists | "Can you cancel AND confirm my other room is still booked?" |
| payment (non-escalating) | MED — only escalating multi-Q exists | "Card failed — can I use bank transfer? Also update the name." |
| checkout | LOW | "Can I check out at noon? Also can we leave luggage?" |
| booking-changes | LOW | "Can I change dates + add an extra person?" |
| house-rules | LOW | "Are visitors allowed? Also what are the noise rules?" |

### GAP-B: Categories with zero pipeline-integration coverage

| Category | Has templates? | Follow-up action |
|---|---|---|
| access | ✅ 2 templates | Add at least 1 fixture (e.g., "How do I access the building?") |
| complaint | ❌ 0 templates | Excluded from first regression gate; add template + fixture in future wave |
| activities | ✅ 1 template | Low priority; add fixture if activities queries increase |

### GAP-C: Data model mismatches

| Issue | Location | Impact |
|---|---|---|
| `policies` template category ≠ `policy` draft-guide key | `email-templates.json` vs `draft-guide.json` | Length calibration target lookup fails silently for "policies" emails |
| `word_count` computed in `runChecks()` but not in `QualityResult` | `draft-quality-check.ts` | Cannot directly measure draft length without re-computing from `bodyPlain` |

### GAP-D: Multilingual multi-question

No test exercises multi-question extraction in non-English emails (Italian/Spanish). The interpret stage
must simultaneously detect language AND extract questions — a compound failure mode not covered by
existing fixtures (IT-01 is single-question; IT-02 is agreement-only).

---

## 4. Baseline Metric Definitions

All metrics are **fully deterministic** — derived from regex, BM25, stemmer, and count operations.
No LLM calls are made by any of the three pipeline tools.

### 4.1 Primary Quality Metrics (draft_quality_check)

| Metric name | Formula | Range | Output field |
|---|---|---|---|
| `overall_pass_rate` | `count(quality.passed == true) / N` | 0.0 – 1.0 | `quality.passed` |
| `mean_confidence` | `mean(quality.confidence)` across N drafts | 0.0 – 1.0 | `quality.confidence` |
| `question_coverage_rate` | `count(status == 'covered') / total_entries` | 0.0 – 1.0 | `quality.question_coverage[*].status` |
| `mean_coverage_score` | `mean(quality.question_coverage[*].coverage_score)` | 0.0 – 1.0 | `quality.question_coverage[*].coverage_score` |
| `missing_questions_count` | `count(status == 'missing')` per run | 0 – N | derived from `question_coverage` |
| `partial_questions_count` | `count(status == 'partial')` per run | 0 – N | derived from `question_coverage` |
| `check_failure_frequency[X]` | `count(failed_checks contains X) / N` | 0.0 – 1.0 | `quality.failed_checks` |
| `length_compliance_rate` | `count('length_out_of_range' ∉ warnings) / N` | 0.0 – 1.0 | `quality.warnings` |

**Confidence formula (from source):**
```
confidence = max(0, min(1, (totalChecks - failed_checks.length) / totalChecks))
totalChecks = 6 (core) + 2 if policy checks apply, else 6
```

**Coverage status thresholds:**
```
matched_count >= required_matches  → 'covered'
0 < matched_count < required_matches → 'partial'
matched_count == 0 → 'missing'
required_matches = 2 if keyword_count >= 2, else 1
```

**Possible `failed_checks` values:**
`unanswered_questions` | `prohibited_claims` | `missing_plaintext` | `missing_html` |
`missing_signature` | `missing_required_link` | `contradicts_thread` |
`missing_policy_mandatory_content` | `policy_prohibited_content`

### 4.2 Generation Metrics (draft_generate)

| Metric name | Formula | Range | Output field |
|---|---|---|---|
| `composite_draft_rate` | `count(composite == true) / N` | 0.0 – 1.0 | `composite` |
| `template_auto_selection_rate` | `count(selection == 'auto') / N` | 0.0 – 1.0 | `template_used.selection` |
| `mean_template_confidence` | `mean(template_used.confidence)` | 0 – 100 | `template_used.confidence` |

**Template selection thresholds:**
```
confidence >= 80 → 'auto'
confidence >= 25 → 'suggest'
otherwise → 'none'
```

### 4.3 Interpretation Metrics (draft_interpret)

| Metric name | Formula | Range | Output field |
|---|---|---|---|
| `mean_question_count` | `mean(intents.questions.length)` | 0 – N | `intents.questions.length` |
| `escalation_rate` | `count(tier != 'NONE') / N` | 0.0 – 1.0 | `escalation.tier` |
| `critical_escalation_rate` | `count(tier == 'CRITICAL') / N` | 0.0 – 1.0 | `escalation.tier` |
| `human_review_rate` | `count(requires_human_confirmation) / N` | 0.0 – 1.0 | `agreement.requires_human_confirmation` |
| `scenario_distribution` | histogram of `scenario.category` | 20 categories | `scenario.category` |

---

## 5. Baseline Values (current state)

These are the known baseline values from existing test assertions before any TASK-02..TASK-08 changes.

### 5.1 Pipeline-integration gate (existing)

| Gate | Value | Source |
|---|---|---|
| Pass rate over 47 customer-facing fixtures | **≥ 0.90** (asserted) | `pipeline-integration.test.ts` Stage 3 |
| Total fixtures in suite | **57** | `pipeline-integration.test.ts` fixtures[] |
| Customer-facing fixtures | **47** | `requiresResponse=true`, non-system |

> **Note**: The actual current pass rate is asserted at ≥ 0.90 but the precise value (e.g., 0.91 vs 0.97) is
> not captured in the test artifact. Running `pnpm --filter @acme/mcp-server exec jest --config packages/mcp-server/jest.config.cjs --verbose --testPathPattern='pipeline-integration'`
> and capturing the console output would yield the exact baseline value.

### 5.2 Known quality gaps (from existing test assertions)

| Scenario | Stage failing | Check code | Source test |
|---|---|---|---|
| Multi-question email — one question unanswered | quality | `unanswered_questions` | TASK-05 TC-02 (quality-check.test.ts) |
| Composite draft — duplicate signature in plaintext | generate (assembly) | structure | TC-07 (draft-generate.test.ts) |
| Composite draft — only category-first (not question-first) | generate (ranking) | coverage | TC-06 (draft-generate.test.ts) |

---

## 6. Recommended First Regression Gate

### 6.1 Existing gate (Wave 1 baseline)

The pipeline-integration suite's 90% pass-rate assertion over 47 fixtures is the first-class
regression gate. **This gate must not regress after any TASK-02..TASK-08 change.**

### 6.2 Minimum feasible targeted fixture set

For TASK-09's new evaluation harness, the minimum credible fixture set is **20 fixtures**:

| Count | Rationale |
|---|---|
| 2 × cancellation | Validates dominant/exclusive semantics (hard-rule category) |
| 2 × prepayment | Validates dominant/exclusive semantics (hard-rule category) |
| 2 × check-in | High-volume category with known check-in time gap |
| 2 × payment | Validates benign payment path (non-escalating) |
| 2 × breakfast | Template-backed, multi-Q capable via FAQ-05 |
| 2 × luggage | Template-backed, multi-Q capable via FAQ-05 |
| 2 × booking-changes | Covers date/room modification gap |
| 2 × faq | Cross-category multi-question baseline |
| 1 × checkout | Single fixture sufficient for first gate |
| 1 × house-rules | Single fixture sufficient for first gate |

- All 20 are **constructable from existing labeled inputs** (pipeline-integration fixtures + email-examples.json).
- No new templates required for these 20.
- Excludes `policy`/`complaint` (template gap) and `access`/`activities` (no existing fixture material).

### 6.3 Metric thresholds for first gate (proposed)

| Metric | First-gate threshold | Notes |
|---|---|---|
| `overall_pass_rate` | ≥ 0.90 | Matches existing pipeline-integration gate |
| `question_coverage_rate` | ≥ 0.80 | Baseline pre-TASK-06 (expected to improve) |
| `check_failure_frequency['unanswered_questions']` | ≤ 0.20 | Pre-TASK-06/07 baseline |
| Dominant/exclusive hard-rule regression | 0.00 | Cancellation/prepayment must never dilute |

> Thresholds marked as **"pre-improvement baseline"** will be recalibrated upward in TASK-09
> after TASK-03..TASK-08 changes are complete.

---

## 7. Reproducible Command Protocol

### 7.1 Full package test run

```bash
pnpm --filter @acme/mcp-server exec jest --config packages/mcp-server/jest.config.cjs
```

### 7.2 Targeted test commands (per TC contract)

```bash
# Pipeline integration (the primary regression gate)
pnpm --filter @acme/mcp-server exec jest --config packages/mcp-server/jest.config.cjs \
  --testPathPattern='pipeline-integration' --verbose

# Draft quality-check unit tests
pnpm --filter @acme/mcp-server exec jest --config packages/mcp-server/jest.config.cjs \
  --testPathPattern='draft-quality-check'

# Draft generate unit tests
pnpm --filter @acme/mcp-server exec jest --config packages/mcp-server/jest.config.cjs \
  --testPathPattern='draft-generate'

# Draft interpret unit tests
pnpm --filter @acme/mcp-server exec jest --config packages/mcp-server/jest.config.cjs \
  --testPathPattern='draft-interpret'

# Template ranker unit tests
pnpm --filter @acme/mcp-server exec jest --config packages/mcp-server/jest.config.cjs \
  --testPathPattern='template-ranker'
```

### 7.3 Baseline capture command (run once before TASK-02 changes)

To capture the exact current pass rate before any changes:

```bash
pnpm --filter @acme/mcp-server exec jest --config packages/mcp-server/jest.config.cjs \
  --testPathPattern='pipeline-integration' --verbose 2>&1 | grep -E '(PASS|FAIL|Tests:|passRate)'
```

---

## 8. Blocked / Unknown Areas

| Area | Status | Follow-up action |
|---|---|---|
| Exact current `passRate` value over 47 fixtures | **Unknown** — asserted ≥ 0.90 but precise value not captured | Run baseline capture command (§7.3) before TASK-02 changes begin |
| `complaint` category regression fixture | **Blocked** — no outbound template exists | Must add template in TASK-03 or future wave before fixture can be built |
| `policy` vs `policies` key mismatch | **Blocked** — scope decision needed | TASK-00 should decide whether to rename template category to `policy` |
| Italian/multilingual multi-Q failure mode | **Blocked** — no labeled multi-Q Italian fixtures exist | TASK-08 (thread-context extraction) may surface; add fixture in TASK-09 |
| Anonymous production fixture set | **Blocked** — anonymization workflow not documented | Noted in TASK-09 scout: define anonymization process before committing any production-derived examples |
| `word_count` as a standalone metric | **Low priority** — re-computable from `bodyPlain` but not exposed in output | Trivial one-field addition to `QualityResult`; defer to TASK-09 if needed |

---

## 9. Validation Against Task Acceptance Criteria

| Acceptance criterion | Met? | Notes |
|---|---|---|
| Baseline artifact defines fixture set, labels, and gap taxonomy | ✅ | Sections 2 and 3 |
| Artifact includes metric definitions and exact command list for repeatable collection | ✅ | Sections 4 and 7 |
| Artifact lists blocked/unknown areas with concrete follow-up actions | ✅ | Section 8 |
| Investigation closes with explicit sample size, metric formulas, and reproducible command protocol | ✅ | Sections 5, 6.2, 6.3, 7 |
