---
Type: Baseline-Report
Status: In Progress
Domain: Automation
Created: 2026-02-02
Last-updated: 2026-02-02
Feature-Slug: email-autodraft-consolidation
Card-ID: BRIK-ENG-0020
Plan-Link: docs/plans/email-autodraft-consolidation-plan.md
---

# Email Autodraft Consolidation — Baseline Metrics

## Summary
Baseline collection has started but data has not been captured yet. This report documents the measurement method and the remaining steps required to collect the 50-thread sample.

## Measurement Plan

### Sample Definition
- **Sample size:** 50 threads
- **Time range:** last 3 months
- **Source:** Gmail via MCP tools (`gmail_list_pending`, `gmail_get_email`)
- **Selection:** random sample across labels and categories, ensuring coverage across FAQ, policy, payment, cancellation, complaint, and multi-question.

### Metrics to Capture
- Category classification per thread
- Estimated editing time per category (if trackable)
- Top 10 failure modes causing edits
- Template coverage gaps (scenarios without templates)

### Recording Format
Each sampled thread should include:
- Thread ID
- Subject
- Category
- Key questions asked
- Draft edits required (time estimate or notes)
- Failure mode (if any)
- Template match (yes/no + template ID)

## Pending Audit Work
- **Data collection:** run Gmail MCP tools to fetch 50 threads from the last 3 months.
- **Classification:** categorize each thread against plan categories.
- **Editing time estimation:** capture per-category edits (time or qualitative proxy).
- **Failure modes:** record top 10 causes of edits.
- **Template gaps:** identify scenarios with no matching template.

## Blockers
- Gmail MCP tooling access is required to collect real thread samples.

## Next Steps
1. Use `gmail_list_pending` to gather candidate threads.
2. Use `gmail_get_email` for each selected thread to capture body + context.
3. Populate the metrics table and failure mode summary.
4. Update this report status to **Complete** and link findings back into the plan.
