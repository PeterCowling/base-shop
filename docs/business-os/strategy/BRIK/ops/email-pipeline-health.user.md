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

**Overall: Baseline — first snapshot pending**

This artifact was created on 2026-03-12. The sections below define what will be tracked. Populate by running the MCP analytics tools and reviewing the audit log.

## Volume & Throughput

<!-- Update weekly. Source: reception D1 analytics (computeAnalytics) -->

| Metric | Value | Trend | Notes |
|---|---|---|---|
| Threads admitted (7d) | — | — | First snapshot pending |
| Drafts generated (7d) | — | — | |
| Drafts sent (7d) | — | — | |
| Threads resolved (7d) | — | — | |
| Admission acceptance rate | — | — | % of emails passing initial filter |

## Draft Quality

<!-- Update weekly. Source: reception D1 quality metrics -->

| Metric | Value | Target | Notes |
|---|---|---|---|
| Quality pass rate | — | ≥95% | % of generated drafts passing QA checks |
| Top failure reason #1 | — | — | |
| Top failure reason #2 | — | — | |
| Top failure reason #3 | — | — | |
| Template fallback rate | — | <35% | Drafts using generic template (no match) |

## Draft Acceptance

<!-- Update weekly. Source: MCP draft_acceptance_rate tool -->

| Metric | Value | Notes |
|---|---|---|
| Sent as generated | — | Drafts sent without staff editing |
| Sent after edit | — | Staff improved the draft before sending |
| Regenerated | — | Staff discarded AI draft entirely |
| Dismissed | — | Draft ignored |

## Recovery Pipeline

<!-- Update weekly. Source: reception recovery metrics -->

| Metric | Value | Target | Notes |
|---|---|---|---|
| Stale threads pending | — | 0 | Threads stuck without a draft |
| Recovery success rate | — | ≥90% | Recovered / total stale |
| Manual flagging rate | — | <10% | Escalated to staff vs. auto-recovered |
| Guest match rate | — | ≥80% | Sender matched to booking reference |

## Latency

<!-- Update weekly. Source: reception D1 resolution metrics -->

| Metric | Value | Target | Notes |
|---|---|---|---|
| Avg admitted → drafted (hours) | — | <2h | Time to generate first draft |
| Avg admitted → sent (hours) | — | <4h | Time to send reply |
| Avg admitted → resolved (hours) | — | <24h | Full resolution time |

## Recent Issues

<!-- Log notable incidents. Clear resolved items monthly. -->

- 2026-03-12: Artifact created. No baseline data yet.

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
