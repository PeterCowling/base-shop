---
Type: Results-Review
Status: Draft
Feature-Slug: hostel-email-template-expansion
Review-date: 2026-02-25
artifact: results-review
---

# Results Review

## Observed Outcomes

- The email template library in `packages/mcp-server/data/email-templates.json` grew from 53 to 178 templates (T54–T178), a 3.4x increase in coverage.
- All 125 new templates passed the lint gate at every checkpoint — final result: 178 templates, 0 warnings.
- Three operator-confirmed facts are now encoded consistently across the library: visitor hours 20:30, cancellation fee 15% of booking price excluding third-party commissions, hot water 24/7.
- The SITA price conflict was resolved by designating `chiesaNuovaDepartures.json` as the canonical source (€2.50 single ticket) — prior ambiguity eliminated.
- T174–T178 (Gmail mining pass) grounded templates in actual sent-mail thread content, closing a gap between the library and real guest communication patterns.

## Standing Updates

- `packages/mcp-server/data/email-templates.json`: now the authoritative template store at 178 entries; run `mcp__brikette__draft_signal_stats` after 4 weeks to assess selection rates for the new templates.
- Operator policy record (visitor hours, cancellation fee, hot water): these facts are now encoded in the template library — if any policy changes, templates T54–T178 must be audited for affected values before the next deploy.
- T178 (Google review link): uses a Google Maps CID URL as a placeholder — update to a direct write-review URL from Google Business Profile before activating the post-stay review workflow.

## New Idea Candidates

- Post-stay review workflow using T178 as the trigger template | Trigger observation: T178 built and lint-passing but review-link URL still a placeholder; workflow not yet activated | Suggested next action: create card
- Template selection rate monitoring dashboard or weekly report | Trigger observation: build-record recommends running draft_signal_stats after 4 weeks; no scheduled monitoring exists | Suggested next action: create card
- Automated policy-fact consistency check across templates | Trigger observation: three policy facts manually verified across 125 templates; any future policy change has no automated catch | Suggested next action: spike

## Standing Expansion

No standing expansion: the expanded template library is the standing artifact. No new artifact type is needed.

## Intended Outcome Check

- **Intended:** Expand the Hostel Brikette email template library from 53 to at least 150 templates covering arrival, accommodation, transport, beaches, dining, policy edge cases, and Gmail-mined patterns — all passing the lint gate with consistent schema and source-grounded facts.
- **Observed:** 178 templates delivered (T54–T178, 125 new), covering all 11 category areas listed in the plan. Final lint: 178 templates, 0 warnings. Operator-confirmed policy facts applied throughout. Gmail mining pass completed as T174–T178.
- **Verdict:** Met
- **Notes:** T178 Google review link is a placeholder pending a direct write-review URL — this is a known open item captured in the build record and does not affect the library's usability for all other template categories.
