---
Type: Baseline-Report
Status: Complete
Domain: Automation
Created: 2026-02-02
Last-updated: 2026-02-02
Feature-Slug: email-autodraft-consolidation
Card-ID: BRIK-ENG-0020
Plan-Link: docs/plans/email-autodraft-consolidation-plan.md
Sample-File: docs/plans/email-autodraft-consolidation-baseline-sample.txt
---

# Email Autodraft Consolidation — Baseline Metrics

## Summary
Collected a 50-thread sample from Inbox for 2025-11-02 → 2026-02-02 using the new `gmail_list_query` tool. The sample is heavily skewed toward system notifications and OTAs, with a smaller subset of customer inquiries requiring responses.

## Sample Overview

- **Total threads:** 50
- **Time window:** 2025-11-02 → 2026-02-02
- **Source:** Gmail Inbox (`in:inbox after:2025/11/02 before:2026/02/03`)
- **Raw sample file:** `docs/plans/email-autodraft-consolidation-baseline-sample.txt`

### Category Distribution (High-Level)

| Category | Count | Notes |
| --- | ---:| --- |
| System notifications | 30 | Dominated by OTA/channel manager notifications |
| Customer inquiries | 17 | Includes OTA guest messages + direct guests |
| Marketing/newsletters | 3 | Promotional/news emails |

### System/Notification Sources (non-response)

| Source | Count |
| --- | ---:|
| Octorate system notifications | 22 |
| Hostelworld notifications | 3 |
| Expedia notifications | 2 |
| Revolut notifications | 2 |
| Billing notifications | 1 |

### Customer Inquiry Categories (Heuristic, needs verification)

| Category | Count | Notes |
| --- | ---:| --- |
| FAQ / availability / pricing | 6 | Availability and add-guest pricing questions |
| Payment / card issues | 4 | Payment attempts, card details, payment follow-ups |
| Cancellation / refund | 3 | Cancellation-related questions |
| Policy / T&C | 0 | None observed in this sample |
| Other / unclear | 4 | Requires manual classification |

> **Note:** The customer categories above are computed heuristics from subject/body text and should be confirmed in manual review.

## Editing Time Baseline

- **Status:** Not directly trackable from sample data.
- **Recommendation:** Add manual logging for the next week (minutes per email by category) to establish the editing-time baseline.

## Failure Modes Causing Edits (Preliminary / needs verification)

1. **Payment-chase complexity** — multi-step threads with multiple failed attempts and card retries.
2. **Availability ambiguity** — private room or add-guest questions requiring real-time availability checks.
3. **OTA platform constraints** — booking.com/Hostelworld threads require platform-specific phrasing.
4. **Thread context length** — long threads with many prior messages risk contradictions.
5. **Pricing add-ons** — “add one more person” questions require rate + policy context.
6. **Mixed intents** — questions combined with confirmations in a single reply.
7. **Non-actionable system notifications** — must be ignored or auto-archived to avoid noise.
8. **Language variance** — multi-language communications in same thread.
9. **Missing template match** — some direct guest questions are not exact matches to existing templates.
10. **Policy edge cases** — non-refundable/terms confirmations need explicit handling.

## Template Coverage Gaps (Preliminary)

Existing templates cover categories: access, activities, booking-issues, cancellation, check-in, payment, policies, prepayment, transportation. Observed gaps in the sample include:
- **System notifications:** should be filtered (no response needed).
- **OTA guest add-ons:** add-guest pricing or modifications require booking-issues templates or new variants.
- **Long payment threads:** prepayment chase templates exist but require better state handling.

## Recommendations

- **Short-term:** Use the new `gmail_list_query` to focus on customer inquiries only (filter out system/marketing) for a cleaner baseline sample.
- **Medium-term:** Add manual time tracking for response edits for one week.
- **Long-term:** Expand templates for OTA guest modifications and pricing add-ons.
