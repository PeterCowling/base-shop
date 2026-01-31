---
Type: Card
Lane: Planned
Priority: P1
Owner: Pete
ID: BRIK-ENG-0010
Title: Guides Hydration Error Fix Plan
Business: BRIK
Tags:
  - plan-migration
  - ui
Created: 2026-01-28T00:00:00.000Z
Updated: 2026-01-29T00:00:00.000Z
---
# Guides Hydration Error Fix Plan

**Source:** Migrated from `guides-hydration-fix-plan.md`


# Guides Hydration Error Fix Plan

## Summary

Fix React hydration errors in the guides system by eliminating server/client divergence that causes **structural mismatches** during hydration. Two issues are now verified:
- **Dev/preview:** `PreviewBanner` eligibility can differ between SSR and the first client render (search params and/or client-only status overrides), shifting the JSON-LD script subtree.
- **Published pages too:** `FaqStructuredDataBlock` can render different element types between SSR and the first client render (`<script>` FAQ JSON-LD vs a placeholder node) when `hasLocalizedContent` diverges due to i18n/content-detection readiness.

This plan establishes hydration regression tests and hardens the affected components so eligibility can differ without producing structural hydration failures.

## Goals

- Eliminate all hydration mismatches in guide pages (dev/preview and published)
- Establish hydration regression testing to prevent future issues
- Maintain SEO structured data functionality
- Keep dev-mode features (GuideEditorialPanel, DevStatusPill, PreviewBanner) working correctly

## Non-goals


[... see full plan in docs/plans/guides-hydration-fix-plan.md]
