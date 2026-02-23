---
Type: Strategy-Index
Business-Unit: HBAG
Last-updated: 2026-02-23
Business-Name: Caryina
Status: Active
Owner: Pete
Review-trigger: After each completed build cycle touching this document.
---

# Brand & Strategy Index — HBAG

This index is the single gate-check lookup for brand artifact status.
Gates read `Status` from this table — not from individual file frontmatters.

## Brand Artifacts

| Artifact | Path | Status | Last-reviewed |
|----------|------|--------|---------------|
| Brand Dossier | `docs/business-os/strategy/HBAG/brand-dossier.user.md` | Active | 2026-02-23 |
| Site V1 Builder Prompt | `docs/business-os/strategy/HBAG/site-v1-builder-prompt.user.md` | Active | 2026-02-23 |
| Competitive Positioning | `docs/business-os/strategy/HBAG/competitive-positioning.user.md` | — | — |
| Messaging Hierarchy | `docs/business-os/strategy/HBAG/messaging-hierarchy.user.md` | — | — |
| Creative Voice Brief | `docs/business-os/strategy/HBAG/creative-voice-brief.user.md` | — | — |

## Strategy Research Artifacts

| Artifact | Path | Status | Last-reviewed |
|----------|------|--------|---------------|
| Mini Handbag PMF Fact-Find | `docs/plans/mini-handbag-pmf/fact-find.md` | Active | 2026-02-17 |
| Mini Handbag PMF Plan | `docs/plans/mini-handbag-pmf/plan.md` | Draft | 2026-02-18 |
| CE Marking Investigation | `docs/plans/mini-handbag-pmf/ce-marking-investigation.md` | Active | 2026-02-18 |
| Photography Brief | `docs/plans/mini-handbag-pmf/task-06-photography-brief.md` | Active | 2026-02-17 |
| Naming Research | `docs/business-os/strategy/HBAG/candidate-names-prompt.md` | Active | 2026-02-20 |
| Naming Shortlist (latest) | `docs/business-os/strategy/HBAG/naming-shortlist-2026-02-21.user.md` | Active | 2026-02-21 |
| **Name Selected** | **Caryina** — Pete confirmed 2026-02-21 | **Selected** | **2026-02-21** |

## Startup-Loop Canonical Artifacts

| Stage | Artifact | Path | Status | Last-reviewed |
|-------|----------|------|--------|---------------|
| ASSESSMENT-06 | Operator evidence | `docs/business-os/strategy/HBAG/current-situation.user.md` | Active | 2026-02-20 |
| ASSESSMENT-09 | Intake packet | `docs/business-os/startup-baselines/HBAG-intake-packet.user.md` | Active | 2026-02-20 |
| ASSESSMENT-10 | Brand profiling | `docs/business-os/strategy/HBAG/brand-strategy.user.md` | Draft | 2026-02-21 |
| ASSESSMENT-11 | Brand identity | `docs/business-os/strategy/HBAG/brand-dossier.user.md` | Active | 2026-02-23 |
| S1 | Readiness verdict | `docs/business-os/strategy/HBAG/s1-readiness.user.md` | Active | 2026-02-20 |
| S2 | Market intelligence (latest) | `docs/business-os/market-research/HBAG/latest.user.md` | Active | 2026-02-20 |
| S2B | Offer | `docs/business-os/startup-baselines/HBAG-offer.md` | Active | 2026-02-20 |
| S3 | Forecast | `docs/business-os/startup-baselines/HBAG/S3-forecast/2026-02-20-lp-forecast.user.md` | Draft | 2026-02-20 |
| S3 | Forecast seed | `docs/business-os/startup-baselines/HBAG-forecast-seed.user.md` | Active | 2026-02-20 |
| S6B | Channels | `docs/business-os/startup-baselines/HBAG-channels.md` | Active | 2026-02-20 |
| S6B gate | Demand evidence pack | `docs/business-os/startup-baselines/HBAG/demand-evidence-pack.md` | Active | 2026-02-20 |
| WEBSITE-CONTENT-01 | Website content packet | `docs/business-os/startup-baselines/HBAG-content-packet.md` | Active | 2026-02-23 |
| S5A | Prioritization scorecard | — | — | — |
| PRODUCT-01 | Product from photo | `docs/business-os/strategy/HBAG/2026-02-22-product-from-photo.user.md` | Draft | 2026-02-22 |

> S2/S2B/S3/S6B backfill completed 2026-02-20 from `mini-handbag-pmf` fact-find and plan evidence.
> All stage artifacts are hypothesis-quality — not yet validated by first-party HBAG sales data.
> TASK-09 checkpoint (4-week demand probe) will provide first-party validation data for refresh.

**Status vocabulary:**
- `—` Not yet created
- `Draft` Created; not all required fields complete; minimum proof ledger may be absent
- `Active` All required frontmatter fields non-TBD; proof ledger has ≥1 entry; reviewed by Pete

## Gate Reference

| Gate ID | Artifact checked | Required status | Hard/Soft |
|---------|-----------------|-----------------|-----------
| GATE-BD-01 | Brand Dossier | Draft minimum | Hard |
| GATE-BD-02 | Competitive Positioning | Draft minimum | Soft (warning) |
| GATE-BD-03 | Messaging Hierarchy | Draft minimum | Hard (S2B Done gate) |
| GATE-BD-04 | Creative Voice Brief | — | Soft (warning after S6B) |
| GATE-BD-05 | Brand Dossier | Active | Hard (lp-launch-qa) |
| GATE-BD-06 | Messaging Hierarchy | Active | Hard (lp-launch-qa) |
| GATE-BD-07 | Brand Dossier | Active | Hard (lp-design-spec pre-flight) |
| GATE-BD-08 | Competitive Positioning | Active | Soft (lp-launch-qa) |

For full gate definitions, see `docs/plans/startup-loop-branding-design-module/fact-find.md` §Gate Policy Table.

## Usage

When a skill gate checks brand artifact status, it reads this index:

```bash
# Example: GATE-BD-01 check in startup-loop SKILL.md advance rules
# Gate passes if Brand Dossier Status = Draft or Active
grep "Brand Dossier" docs/business-os/strategy/HBAG/index.user.md | grep -E "Draft|Active"
```
