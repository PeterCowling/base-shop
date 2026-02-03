# TASK-18 Integration Test Results

**Test Date:** 2026-02-02
**Query:** `in:inbox after:2025/11/02 before:2026/02/03`
**Pipeline:** draft_interpret → draft_generate → draft_quality_check

## Summary

- **Total Emails Tested:** 50
- **Quality Gate Passed:** 5 (10%)
- **Quality Gate Failed:** 45 (90%)
- **Pipeline Errors:** 0
- **Critical Errors:** 0

## Category Breakdown

| Category | Total | Passed | Failed | Errors | Acceptance Rate | Target |
|----------|-------|--------|--------|--------|-----------------|--------|
| payment | 29 | 3 | 26 | 0 | 10% | ≥70% |
| faq | 9 | 0 | 9 | 0 | 0% | ≥85% |
| general | 6 | 1 | 5 | 0 | 17% | - |
| cancellation | 4 | 0 | 4 | 0 | 0% | ≥70% |
| policy | 2 | 1 | 1 | 0 | 50% | ≥75% |

## Agreement Detection

- **Total with agreement signals:** 0
- **Confirmed:** 0
- **Likely:** 0
- **Unclear:** 0

## Quality Gate Failures

| Email ID | Category | Failed Checks |
|----------|----------|---------------|
| 19c200797e81... | payment | unanswered_questions |
| 19c1f5b015aa... | payment | unanswered_questions |
| 19c1ead5c277... | payment | unanswered_questions |
| 19c1da6f0826... | cancellation | unanswered_questions |
| 19c1d605d60d... | general | unanswered_questions |
| 19c1d2a25316... | payment | unanswered_questions |
| 19c1b4e0b070... | payment | unanswered_questions |
| 19c1a1f40ec6... | payment | unanswered_questions |
| 19c19f86e2d8... | faq | unanswered_questions |
| 19c191e36e94... | payment | unanswered_questions |
| 19c1900ffd10... | policy | unanswered_questions |
| 19c18ec04f8f... | cancellation | unanswered_questions |
| 19c18ac42771... | payment | unanswered_questions |
| 19c17fb8de29... | payment | unanswered_questions |
| 19c17c717c9f... | payment | unanswered_questions |
| 19c14975f529... | cancellation | unanswered_questions |
| 19c149379708... | payment | unanswered_questions |
| 19c147faf3f9... | payment | unanswered_questions |
| 19c139b7f171... | payment | unanswered_questions |
| 19c10668b8dc... | payment | unanswered_questions |
| ... | ... | (25 more) |

## Per-Email Results

| # | Email ID | Date | Category | Agreement | Q/R | Quality | Template |
|---|----------|------|----------|-----------|-----|---------|----------|
| 1 | 19c200797e... | 2 Feb 2026  | payment | none | 1/0 | FAIL | - |
| 2 | 19c1fbb4cb... | 02 Feb 2026 | payment | none | 1/1 | PASS | - |
| 3 | 19c1f5b015... | 2 Feb 2026  | payment | none | 1/0 | FAIL | - |
| 4 | 19c1ead5c2... | 02 Feb 2026 | payment | none | 7/0 | FAIL | - |
| 5 | 19c1da6f08... | 2 Feb 2026  | cancellation | none | 9/0 | FAIL | - |
| 6 | 19c1d605d6... | 02 Feb 2026 | general | none | 35/0 | FAIL | - |
| 7 | 19c1d2a253... | 2 Feb 2026  | payment | none | 6/2 | FAIL | - |
| 8 | 19c1b4e0b0... | 1 Feb 2026  | payment | none | 1/0 | FAIL | - |
| 9 | 19c1a1f40e... | 1 Feb 2026  | payment | none | 1/0 | FAIL | - |
| 10 | 19c19f86e2... | 1 Feb 2026  | faq | none | 4/1 | FAIL | - |
| 11 | 19c191e36e... | 1 Feb 2026  | payment | none | 1/0 | FAIL | - |
| 12 | 19c1900ffd... | 1 Feb 2026  | policy | none | 2/0 | FAIL | - |
| 13 | 19c18ec04f... | 1 Feb 2026  | cancellation | none | 6/0 | FAIL | - |
| 14 | 19c18ac427... | 1 Feb 2026  | payment | none | 1/0 | FAIL | - |
| 15 | 19c17fb8de... | 1 Feb 2026  | payment | none | 1/0 | FAIL | - |
| 16 | 19c17c717c... | 1 Feb 2026  | payment | none | 1/0 | FAIL | - |
| 17 | 19c14975f5... | 31 Jan 2026 | cancellation | none | 4/2 | FAIL | - |
| 18 | 19c1493797... | 31 Jan 2026 | payment | none | 1/0 | FAIL | - |
| 19 | 19c147faf3... | 31 Jan 2026 | payment | none | 1/0 | FAIL | - |
| 20 | 19c139b7f1... | 31 Jan 2026 | payment | none | 1/0 | FAIL | - |
| 21 | 19c10668b8... | 31 Jan 2026 | payment | none | 6/2 | FAIL | - |
| 22 | 19c0f38c9e... | 30 Jan 2026 | general | none | 2/0 | FAIL | - |
| 23 | 19c0ee08e3... | 30 Jan 2026 | cancellation | none | 4/0 | FAIL | - |
| 24 | 19c0e9f2f7... | 30 Jan 2026 | general | none | 17/0 | FAIL | - |
| 25 | 19c0e52a1e... | 30 Jan 2026 | faq | none | 3/0 | FAIL | - |
| 26 | 19c0e408e4... | 30 Jan 2026 | payment | none | 1/0 | FAIL | - |
| 27 | 19c0e0d9c9... | 30 Jan 2026 | faq | none | 2/0 | FAIL | - |
| 28 | 19c0dfe45f... | 30 Jan 2026 | faq | none | 1/1 | FAIL | - |
| 29 | 19c0df61d4... | 30 Jan 2026 | payment | none | 1/1 | FAIL | - |
| 30 | 19c0deeed1... | 30 Jan 2026 | faq | none | 40/0 | FAIL | - |
| 31 | 19c0dafd5e... | 30 Jan 2026 | payment | none | 1/0 | FAIL | - |
| 32 | 19c0dad692... | 30 Jan 2026 | payment | none | 1/1 | PASS | - |
| 33 | 19c0d349e4... | 30 Jan 2026 | payment | none | 6/2 | FAIL | - |
| 34 | 19c0bb6310... | 30 Jan 2026 | payment | none | 5/1 | FAIL | - |
| 35 | 19c09750a4... | 29 Jan 2026 | general | none | 2/0 | FAIL | - |
| 36 | 19c055b6de... | 28 Jan 2026 | payment | none | 1/0 | FAIL | - |
| 37 | 19c050bed0... | 28 Jan 2026 | payment | none | 1/0 | FAIL | - |
| 38 | 19c0509ce9... | 28 Jan 2026 | payment | none | 1/1 | PASS | - |
| 39 | 19c049ac54... | 28 Jan 2026 | faq | none | 3/0 | FAIL | - |
| 40 | 19c047827f... | 28 Jan 2026 | faq | none | 4/1 | FAIL | - |
| 41 | 19c044687f... | 28 Jan 2026 | policy | none | 1/0 | PASS | - |
| 42 | 19c0445a83... | 28 Jan 2026 | payment | none | 1/0 | FAIL | - |
| 43 | 19c0442865... | 28 Jan 2026 | payment | none | 1/0 | FAIL | - |
| 44 | 19c02bb326... | 28 Jan 2026 | general | none | 1/0 | FAIL | - |
| 45 | 19c01f6c28... | 28 Jan 2026 | faq | none | 5/1 | FAIL | - |
| 46 | 19c016b0f4... | 27 Jan 2026 | general | none | 1/0 | PASS | - |
| 47 | 19c015ad62... | 27 Jan 2026 | payment | none | 1/0 | FAIL | - |
| 48 | 19c0130b76... | 27 Jan 2026 | payment | none | 1/0 | FAIL | - |
| 49 | 19c011e4c2... | 27 Jan 2026 | payment | none | 1/0 | FAIL | - |
| 50 | 19c00c7cb1... | 27 Jan 2026 | faq | none | 4/0 | FAIL | - |

## Analysis

### Key Findings

1. **Pipeline Stability**: 0/50 pipeline errors - the three-stage pipeline (interpret → generate → quality) is functionally stable
2. **Quality Gate**: 10% pass rate (5/50) - far below targets, but expected given current template coverage
3. **Primary Failure Mode**: 100% of failures are "unanswered_questions" - drafts don't address detected questions
4. **Template Matching**: 0% template matches - BM25 ranker returns "suggest" (manual) for all emails
5. **No Critical Errors**: No prohibited claims or contradictions detected

### Category Distribution

- **Payment (58%)**: 29 emails, dominated by OTA payment notifications and prepayment inquiries
- **FAQ (18%)**: 9 emails, availability and amenity questions
- **General (12%)**: 6 emails, mixed inquiries
- **Cancellation (8%)**: 4 emails, cancellation requests/confirmations
- **Policy (4%)**: 2 emails, policy clarifications

### Root Cause

The low pass rate is explained by:

1. **Template Gaps**: `email-templates.json` lacks coverage for common payment/OTA scenarios
2. **Generic Fallback**: When no template matches, draft_generate returns a generic acknowledgment that doesn't answer any questions
3. **Question Detection Working**: The interpret stage correctly identifies questions (Q column shows 1-40 questions per email), but generate stage cannot address them without appropriate templates

### Recommendations for Future Tasks

1. **TASK-16 (Template Expansion)**: Add 15-20 templates for payment, prepayment, and OTA scenarios
2. **TASK-17 (LLM Integration)**: Use LLM to generate custom responses when no template matches
3. **Template Improvement**: Current BM25 ranker needs better subject/body matching or hybrid approach

### Pass/Fail by Date

| Date | Total | Passed | Rate |
|------|-------|--------|------|
| Feb 2 | 6 | 1 | 17% |
| Feb 1 | 10 | 0 | 0% |
| Jan 31 | 4 | 0 | 0% |
| Jan 30 | 14 | 2 | 14% |
| Jan 29 | 1 | 0 | 0% |
| Jan 28 | 11 | 2 | 18% |
| Jan 27 | 4 | 1 | 25% |

---

*Generated by TASK-18 Integration Testing Script*
