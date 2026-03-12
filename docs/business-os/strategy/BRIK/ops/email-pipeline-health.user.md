---
Type: Standing-Intelligence
Status: Active
Domain: BOS
Business: BRIK
Artifact-ID: BRIK-BOS-EMAIL-PIPELINE-HEALTH
Created: 2026-03-12
Last-updated: 2026-03-12
---

# BRIK Email Pipeline Health

Standing intelligence artifact tracking the health of the Brikette guest email processing pipeline. Changes to this document signal operational issues that may need investigation or fixes.

## Current Health Status

**Overall: Needs attention — high template fallback rate, low recent activity**

First snapshot: 2026-03-12. Data from `email-audit-log.jsonl` (688 events, 2026-02-19 to 2026-03-11) and MCP `draft_signal_stats` / `gmail_telemetry_daily_rollup`.

## Volume & Throughput

<!-- Update weekly. Source: reception D1 analytics (computeAnalytics) + email-audit-log.jsonl -->

| Metric | Value | Trend | Notes |
|---|---|---|---|
| Total audit log events | 688 | — | Since 2026-02-19 |
| Drafts generated (all time) | 10 | — | `action: drafted` events |
| Lock cycles (all time) | 39 acquired / 40 released | — | Normal processing cycles |
| Outcomes recorded | 37 | — | Includes prepayment chases, agreements, deferrals |
| Recent events (7d) | 4 | Low | 1 fallback + 3 lock-acquired (2026-03-09–11) |
| Admission acceptance rate | — | — | Requires D1 query (RECEPTION_AUTH_TOKEN not set) |

## Draft Quality

<!-- Update weekly. Source: email-audit-log.jsonl + MCP draft_signal_stats -->

| Metric | Value | Target | Notes |
|---|---|---|---|
| Quality pass rate | Insufficient data | ≥95% | 0 deterministic refinement events recorded |
| Template fallback rate | 77% (533/688) | <35% | **Critical: `template-selection-none` dominates the log** |
| Deterministic refinement health | insufficient_data | healthy | Need ≥10 events for stable signal |
| Draft signal selections | 0 | — | No selection/refinement signal events |

**Finding:** 533 of 688 events (77%) are `template-selection-none` fallbacks. This means the draft template matching is not covering most email scenarios. This is the single biggest quality issue.

## Draft Acceptance

<!-- Update weekly. Source: MCP draft_acceptance_rate tool (requires RECEPTION_AUTH_TOKEN) -->

| Metric | Value | Notes |
|---|---|---|
| Sent as generated | — | Requires RECEPTION_AUTH_TOKEN |
| Sent after edit | — | Requires RECEPTION_AUTH_TOKEN |
| Regenerated | — | Requires RECEPTION_AUTH_TOKEN |
| Dismissed | — | Requires RECEPTION_AUTH_TOKEN |

**Blocker:** `draft_acceptance_rate` MCP tool requires `RECEPTION_AUTH_TOKEN` (Firebase ID token). Set this in MCP server env to enable this section.

## Recovery Pipeline

<!-- Update weekly. Source: email-audit-log.jsonl -->

| Metric | Value | Target | Notes |
|---|---|---|---|
| Recovery events (all time) | 8 | — | `result: startup-recovery` in audit log |
| Requeued emails | 6 | — | Re-entered processing queue |
| Deferred emails | 3 | — | Deferred for later processing |
| Spam filtered | 1 | — | Correctly identified spam |

## Outcome Distribution

<!-- Source: email-audit-log.jsonl result field -->

| Outcome | Count | Notes |
|---|---|---|
| drafted | 10 | Successful draft generation |
| startup-recovery | 8 | Recovery process triggered |
| requeued | 6 | Returned to processing queue |
| agreement_received | 6 | Guest agreement confirmed (3 via outcome + 3 via action) |
| prepayment_chase_1 | 3 | First prepayment follow-up |
| prepayment_chase_2 | 3 | Second prepayment follow-up |
| awaiting_agreement | 3 | Waiting for guest agreement |
| deferred | 3 | Processing deferred |
| acknowledged | 2 | Manual acknowledgement |
| spam | 1 | Filtered as spam |

## Latency

<!-- Update weekly. Source: reception D1 resolution metrics (requires RECEPTION_AUTH_TOKEN) -->

| Metric | Value | Target | Notes |
|---|---|---|---|
| Avg admitted → drafted (hours) | — | <2h | Requires D1 query |
| Avg admitted → sent (hours) | — | <4h | Requires D1 query |
| Avg admitted → resolved (hours) | — | <24h | Requires D1 query |

## Recent Issues

<!-- Log notable incidents. Clear resolved items monthly. -->

- 2026-03-12: First snapshot. **77% template fallback rate** — most emails get no template match. Needs template coverage expansion.
- 2026-03-12: Draft acceptance metrics blocked by missing RECEPTION_AUTH_TOKEN env var.
- 2026-03-12: Only 4 events in past 7 days — very low pipeline activity.

## Data Sources

| Source | Location | Access |
|---|---|---|
| Reception D1 analytics | `apps/reception/src/lib/inbox/analytics.server.ts` | `computeAnalytics()` |
| Stale thread detection | `apps/reception/src/lib/inbox/repositories.server.ts` | `findStaleAdmittedThreads()` |
| Recovery orchestration | `apps/reception/src/lib/inbox/recovery.server.ts` | `recoverStaleThreads()` |
| Draft signal stats | MCP tool `draft_signal_stats` | On-demand |
| Draft acceptance rate | MCP tool `draft_acceptance_rate` | On-demand |
| Daily telemetry rollup | MCP tool `gmail_telemetry_daily_rollup` | On-demand |
| Email audit log | `data/email-audit-log.jsonl` | File read |
