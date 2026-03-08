---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-02
Last-updated: 2026-03-02
Feature-Slug: brikette-locale-missing-files-backfill
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas, lp-do-fact-find
Related-Plan: docs/plans/brikette-locale-missing-files-backfill/plan.md
Trigger-Why: Locale coverage report shows 51 missing files (3 files absent in 17 locales), causing recurring i18n integrity debt.
Trigger-Intended-Outcome: "type: measurable | statement: missing locale files reduced to 0 and guarded from regression in scheduled watchdog checks | source: operator"
---

# Brikette Locale Missing Files Backfill — Fact-Find Brief

## Scope
### Summary
Backfill three missing locale JSON files across all non-EN locales and enforce no-regression checks in scheduled watchdog automation.

### Goals
- Eliminate missing locale files.
- Keep watchdog strict on missing files (`0` threshold).

### Non-goals
- Full translation of newly backfilled files in this cycle.

## Outcome Contract
- **Why:** Close recurring locale-file integrity gap.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Missing locale files drop to zero and weekly watchdog prevents recurrence.
- **Source:** operator

## Evidence Audit (Current State)
- Missing file paths identified from `check-i18n-coverage`:
  - `hospitalityPreview.json`
  - `languageGateway.json`
  - `how-to-get-here/routes/briketteToFerryDock.json`
- These were missing in all 17 non-EN locales.

## Confidence Inputs
- Implementation: 95%
- Approach: 93%
- Impact: 90%
- Delivery-Readiness: 95%
- Testability: 92%

