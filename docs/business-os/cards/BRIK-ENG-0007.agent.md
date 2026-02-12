---
Type: Card
Lane: Planned
Priority: P1
Owner: Pete
ID: BRIK-ENG-0007
Title: Guide Cross-Referencing & Route Links Plan
Business: BRIK
Tags:
  - plan-migration
  - guides-/-content-/-seo
Created: 2026-01-29T00:00:00.000Z
Updated: 2026-01-29T00:00:00.000Z
Status: Active
Last-updated: 2026-02-05
---
# Guide Cross-Referencing & Route Links Plan

**Source:** Migrated from `guide-cross-referencing-plan.md`


# Guide Cross-Referencing & Route Links Plan

## Summary

Improve guide discoverability by making related guides blocks render by default when configured in the manifest, adding validation and coverage reporting for cross-references, and establishing editorial patterns for inline links and Google Maps route URLs. This work builds on existing infrastructure (link tokens, RelatedGuides component, manifest structure) and focuses on making cross-referencing easy, consistent, and complete across 167 English guides.

## Goals

- Related guides render automatically when `manifest.relatedGuides` is non-empty (remove need for explicit `relatedGuides` block declaration)
- Validation enforces correctness (valid keys, no duplicates, no self-reference, no draftOnly on live routes)
- Coverage reporting identifies guides missing related guides (report minimum thresholds for `live` status; enforcement is a follow-up decision)
- Editorial guidance for inline `%LINK:` tokens and Google Maps `%URL:` patterns
- Reciprocity warnings (A links B → B should link A, warn-only)

## Non-goals

- Automatic tag-based cross-referencing (tag system remains supplemental)
- JSON-based storage for related guides (staying with manifest)
- Dedicated `%MAPS:` token (using `%URL:` with standardized patterns)

[... see full plan in docs/plans/guide-cross-referencing-plan.md]
