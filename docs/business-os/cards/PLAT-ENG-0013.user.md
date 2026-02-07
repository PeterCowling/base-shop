---
Type: Card
Lane: Planned
Priority: P1
Owner: Pete
ID: PLAT-ENG-0013
Title: No-Hardcoded-Copy Non-UI Exemptions Plan
Business: PLAT
Tags:
  - plan-migration
  - platform
Created: 2026-01-16T00:00:00.000Z
Updated: 2026-01-20T00:00:00.000Z
Status: Active
Last-updated: 2026-02-05
---
# No-Hardcoded-Copy Non-UI Exemptions Plan

**Source:** Migrated from `no-hardcoded-copy-non-ui-exemptions-plan.md`


# No-Hardcoded-Copy Non-UI Exemptions Plan

## Problem
The `ds/no-hardcoded-copy` rule is flagging strings that are not customer-facing copy, which forces repeated inline disables. This adds noise and masks real copy issues in UI surfaces that should be localized.

## Patterns Observed
- SEO/JSON-LD helpers and components (schema identifiers, `application/ld+json`, structured data constants).
- CLI scripts and diagnostics output under `scripts/` and `apps/*/scripts/`.
- Locale stub fixtures under `**/locales/**/*.stub/**` used for tests/dev fallbacks.
- Utility class lists and data/test attributes used for editor-only UI or automation hooks.

## Goals
- Reduce unnecessary `ds/no-hardcoded-copy` disables in non-UI areas.
- Keep enforcement intact for user-facing copy.
- Encode exemptions in lint settings or rule heuristics rather than per-file comments.

## Current State (audited 2026-01-20, updated after COPY-01)

**Implemented exemptions in eslint.config.mjs:**

[... see full plan in docs/plans/no-hardcoded-copy-non-ui-exemptions-plan.md]
