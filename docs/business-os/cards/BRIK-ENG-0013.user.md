---
Type: Card
Lane: Done
Priority: P3
Owner: Pete
ID: BRIK-ENG-0013
Title: i18n Missing Key Detection Plan
Business: BRIK
Tags:
  - plan-migration
  - ui-/-i18n-/-testing
Created: 2026-01-27T00:00:00.000Z
Updated: 2026-01-27T00:00:00.000Z
Status: Active
Last-updated: 2026-02-05
---
# i18n Missing Key Detection Plan

**Source:** Migrated from `i18n-missing-key-detection-plan.md`


# i18n Missing Key Detection Plan

## Summary

Add test-time detection and reporting for missing i18n keys that end up rendered as raw keys (because i18next returns the key when missing). Today, many component tests mock `useTranslation()` and don’t surface this class of regression. This plan adds a dedicated render-audit test suite plus improved coverage reporting, producing actionable reports (locale, namespace, key) without blocking CI by default.

## Success Signals (What “Good” Looks Like)

- A dedicated test suite can be run to produce an **actionable missing-key report** for rendered UI (locale + namespace + key + sample context).
- The report is stable enough to be useful (false positives are controlled via allowlists + prefix filtering).
- Translation coverage reporting (`check-i18n-coverage.ts`) can produce machine-readable JSON for CI artifacts.
- Default behaviour is **non-blocking** (warn/report), with an optional strict mode for future enforcement.

## Goals

- Detect and report **rendered** raw i18n keys and “translation in progress” placeholder phrases.
- Produce reports spanning **all 18 supported languages** (from `apps/brikette/src/i18n.config.ts`), with English as the baseline for coverage comparisons.
- Keep developer workflow fast: targeted tests only, no unfiltered full-suite runs.


[... see full plan in docs/plans/i18n-missing-key-detection-plan.md]
