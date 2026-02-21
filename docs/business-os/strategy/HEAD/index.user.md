---
Type: Strategy-Index
Business-Unit: HEAD
Last-updated: 2026-02-20
Status: Active
---

# Brand & Strategy Index — HEAD

This index is the single gate-check lookup for brand artifact status.
Gates read `Status` from this table — not from individual file frontmatters.

## Brand Artifacts

| Artifact | Path | Status | Last-reviewed |
|----------|------|--------|---------------|
| Brand Dossier | `docs/business-os/strategy/HEAD/brand-dossier.user.md` | Draft | 2026-02-20 |
| Competitive Positioning | `docs/business-os/strategy/HEAD/competitive-positioning.user.md` | — | — |
| Messaging Hierarchy | `docs/business-os/strategy/HEAD/messaging-hierarchy.user.md` | Draft | 2026-02-20 |
| Creative Voice Brief | `docs/business-os/strategy/HEAD/creative-voice-brief.user.md` | — | — |

## Strategy Research Artifacts

| Artifact | Path | Status | Last-reviewed |
|----------|------|--------|---------------|
| Product Range Research (prompt) | `docs/business-os/strategy/HEAD/adjacent-product-research-prompt.md` | Active | 2026-02-20 |
| Product Range Research (results) | `docs/business-os/strategy/HEAD/lp-other-products-results.user.md` | Active | 2026-02-20 |
| Naming Research (prompt) | `docs/business-os/strategy/HEAD/naming-research-prompt.md` | Active | 2026-02-19 |
| Naming Research (shortlist) | `docs/business-os/strategy/HEAD/2026-02-20-naming-shortlist.user.md` | Draft | 2026-02-20 |
| Naming Research (latest pointer) | `docs/business-os/strategy/HEAD/latest-naming-shortlist.user.md` | Draft | 2026-02-20 |

## Startup-Loop Canonical Artifacts

| Stage | Artifact | Path | Status | Last-reviewed |
|----------|------|--------|--------|---------------|
| S2 | Market intelligence (latest) | `docs/business-os/market-research/HEAD/latest.user.md` | Active | 2026-02-20 |
| S2B | Offer | `docs/business-os/startup-baselines/HEAD-offer.md` | Active | 2026-02-20 |
| S3 | Forecast | `docs/business-os/startup-baselines/HEAD/S3-forecast/2026-02-20-lp-forecast.user.md` | Active | 2026-02-20 |
| S6B | Channels | `docs/business-os/startup-baselines/HEAD-channels.md` | Active | 2026-02-20 |
| S3B | Adjacent product + naming research | `docs/business-os/strategy/HEAD/lp-other-products-results.user.md` | Active | 2026-02-20 |
| S5A | Prioritization | `docs/business-os/strategy/HEAD/2026-02-12-prioritization-scorecard.user.md` | Active | 2026-02-20 |

> S3B refresh completed on 20 Feb 2026 and replayed into canonical S2B/S3/S6B/S5A artifacts. Top-3 build candidates: Activity organiser pouch, School-ready multi-pack headbands, Clip-on identity badges.

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
grep "Brand Dossier" docs/business-os/strategy/HEAD/index.user.md | grep -E "Draft|Active"
```
