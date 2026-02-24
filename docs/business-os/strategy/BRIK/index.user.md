---
Type: Strategy-Index
Business-Unit: BRIK
Last-updated: 2026-02-17
Status: Active
Owner: Pete
Review-trigger: After each completed build cycle touching this document.
---

# Brand & Strategy Index — BRIK

This index is the single gate-check lookup for brand artifact status.
Gates read `Status` from this table — not from individual file frontmatters.

## Brand Artifacts

| Artifact | Path | Status | Last-reviewed |
|----------|------|--------|---------------|
| Brand Dossier | `docs/business-os/strategy/BRIK/brand-identity.user.md` | Active | 2026-02-17 |
| Competitive Positioning | `docs/business-os/strategy/BRIK/competitive-positioning.user.md` | — | — |
| Messaging Hierarchy | `docs/business-os/strategy/BRIK/messaging-hierarchy.user.md` | — | — |
| Creative Voice Brief | `docs/business-os/strategy/BRIK/creative-voice-brief.user.md` | — | — |

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
grep "Brand Dossier" docs/business-os/strategy/BRIK/index.user.md | grep -E "Draft|Active"
```
