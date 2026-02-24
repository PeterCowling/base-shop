---
Type: Plan
Status: Complete
Domain: Growth
Workstream: Startup-Loop
Created: 2026-02-23
Last-reviewed: 2026-02-23
Last-updated: 2026-02-23
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: hbag-startup-loop-content-integration
Deliverable-Type: content-system
Execution-Track: mixed
Primary-Execution-Skill: lp-seo
Supporting-Skills: lp-site-upgrade
Overall-confidence: 90%
Confidence-Method: evidence-backed implementation + validation
Auto-Build-Intent: plan-and-build
Business-OS-Integration: on
Business-Unit: HBAG
Card-ID: none
---

# HBAG Startup-Loop Content Integration Plan

## Summary

HBAG/Caryina had image assets in place but website copy remained placeholder and disconnected
from startup-loop artifacts. This plan establishes a repeatable content system:

1. Produce a canonical startup-loop content packet.
2. Drive website copy from that packet.
3. Keep product naming/description and page copy aligned to evidence-safe claims.
4. Add launch-phase SEO orientation despite low content volume.

## Systematic Method (Loop Contract)

1. **Source inputs (startup-loop):**
- Offer (`HBAG-offer.md`)
- Channels (`HBAG-channels.md`)
- Product evidence (`2026-02-22-product-from-photo.user.md`)
- Product line map (`products-line-mapping.user.md`)
- Market intelligence (`2026-02-20-market-intelligence.user.md`)

2. **Compile packet:**
- Canonical artifact: `docs/business-os/startup-baselines/HBAG-content-packet.md`
- Include: keyword clusters, page-intent map, message hierarchy, product copy matrix, claim constraints.

3. **Runtime consumption:**
- Caryina app reads structured packet-derived copy module for home/shop/PDP/support/policies.
- Product titles/descriptions/slugs in `data/shops/caryina/products.json` must match packet matrix.

4. **Quality gate:**
- Placeholder scan returns clean for Caryina copy surfaces.
- SEO terms appear in metadata and visible copy.
- No claims conflict with product evidence constraints.

## Completed Tasks

- [x] Created startup-loop content packet template:
  `docs/business-os/startup-baselines/_templates/content-packet-template.md`
- [x] Created canonical HBAG content packet:
  `docs/business-os/startup-baselines/HBAG-content-packet.md`
- [x] Registered packet in HBAG strategy index and builder source map.
- [x] Implemented packet-driven app copy module for locale-aware content.
- [x] Updated homepage, PLP, PDP, support, policy pages, and metadata with startup-loop copy.
- [x] Replaced placeholder catalog names/descriptions and legacy SKU/inventory naming.

## Acceptance Criteria

- [x] Content packet exists and is linked in HBAG strategy index.
- [x] Caryina pages no longer render placeholder framework copy for primary content surfaces.
- [x] Product catalog data is startup-loop aligned and SEO-readable.
- [x] Family grouping can resolve from media tags (not arbitrary index fallback).
- [x] App validations (typecheck/lint/tests) pass for affected package.

## Residual Risks

1. German/Italian copy is launch-quality but not native editorial grade.
2. Legal pages are concise launch summaries, not final legal counsel-reviewed text.
3. SEO strategy is intentionally compact until content surface expands beyond launch catalog.
